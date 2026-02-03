import { corsHeaders, handleCors } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface NodeData {
  id: string
  type: string
  label: string
  description?: string
  [key: string]: unknown
}

interface RequestBody {
  projectName: string
  projectDescription: string
  graph: {
    nodes: NodeData[]
    edges: Array<{ id: string; source: string; target: string; label?: string }>
    gaps: Array<{ id: string; description: string; severity: string; resolved: boolean }>
  }
  messages: Array<{ role: string; content: string }>
}

const SYSTEM_PROMPT = `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

STRUKTUR-ANFORDERUNGEN:
1. Beginne mit einem Inhaltsverzeichnis (nummerierte Liste mit Anchor-Links)
2. Schreibe ALLE 11 Abschnitte vollständig aus
3. Beende das Dokument mit: "---\n\n✅ **PRD VOLLSTÄNDIG**"

WICHTIG FÜR VIBE-CODING:
- Jeder Node im Graph repräsentiert eine Komponente/Service - beschreibe ALLE im Detail
- Nutze die Node-Beschreibungen und zusätzlichen Daten für technische Details
- Die Edges zeigen Abhängigkeiten und Datenflüsse - dokumentiere diese präzise
- Gaps sind offene Fragen - liste sie unter "Open Questions" auf

ABSCHNITTE:

## Inhaltsverzeichnis
Mit Anchor-Links zu allen Abschnitten

## 1. Executive Summary
Projektüberblick, Kernfeatures, Technologie-Stack (1-2 Absätze)

## 2. Problem Statement
Welches Problem wird gelöst, aktuelle Herausforderungen, Business Impact

## 3. Goals & Success Metrics
Geschäftsziele, technische Ziele, messbare KPIs als Tabelle

## 4. User Stories
Gruppiert nach Benutzerrolle, im Format "Als [Rolle] möchte ich [Aktion], um [Nutzen]"

## 5. Technical Architecture
DETAILLIERT für jeden Node:
- Komponenten-Name und Typ
- Verantwortlichkeiten
- Schnittstellen zu anderen Komponenten (basierend auf Edges)
- Technologie-Empfehlungen
Inkludiere ein ASCII- oder Mermaid-Diagramm für den Datenfluss

## 6. API Specifications
Für jeden relevanten Service: Endpoints, Methods, Request/Response-Beispiele

## 7. Data Models
Entitäten mit Feldern, Beziehungen, Beispiel-SQL oder TypeScript-Interfaces

## 8. Security Considerations
Auth, Autorisierung, Datenschutz, DSGVO-Anforderungen

## 9. Open Questions / Gaps
Liste aller ungelösten Gaps aus dem Graph

## 10. Implementation Phases
Roadmap mit Phasen, Meilensteinen, Abhängigkeiten

## 11. Appendix
Referenzen, Glossar, technische Details

---
✅ **PRD VOLLSTÄNDIG**

WICHTIG: Schreibe das Dokument VOLLSTÄNDIG zu Ende! Kürze nicht ab!`

function buildUserPrompt(body: RequestBody): string {
  const { projectName, projectDescription, graph, messages } = body

  // Format nodes with all their data
  const nodesText = graph.nodes
    .map((n) => {
      const extraData = Object.entries(n)
        .filter(([key]) => !['id', 'type', 'label', 'description'].includes(key))
        .map(([key, value]) => `    - ${key}: ${JSON.stringify(value)}`)
        .join('\n')

      return `### ${n.label} (${n.type})
- ID: ${n.id}
- Beschreibung: ${n.description || 'Keine Beschreibung'}
${extraData ? `- Zusätzliche Daten:\n${extraData}` : ''}`
    })
    .join('\n\n')

  // Format edges with source/target labels
  const nodeLabels = new Map(graph.nodes.map(n => [n.id, n.label]))
  const edgesText = graph.edges
    .map((e) => {
      const sourceLabel = nodeLabels.get(e.source) || e.source
      const targetLabel = nodeLabels.get(e.target) || e.target
      return `- ${sourceLabel} → ${targetLabel}${e.label ? `: ${e.label}` : ''}`
    })
    .join('\n')

  const gapsText = graph.gaps
    .filter((g) => !g.resolved)
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.description}`)
    .join('\n') || 'Keine offenen Gaps'

  // Keep more conversation context
  const conversationSummary = messages
    .slice(-50)
    .map((m) => `${m.role}: ${m.content.slice(0, 1500)}`)
    .join('\n\n')

  return `# Projekt: ${projectName}

## Projektbeschreibung
${projectDescription || 'Nicht angegeben'}

---

## Architektur-Komponenten (Nodes)

${nodesText}

---

## Verbindungen / Datenflüsse (Edges)

${edgesText}

---

## Offene Fragen / Gaps

${gapsText}

---

## Konversationsverlauf

${conversationSummary}

---

Erstelle jetzt das vollständige PRD basierend auf diesen Informationen:`
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse

  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = (await req.json()) as RequestBody
    const userPrompt = buildUserPrompt(body)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 64000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const streamHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              return
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const textChunk = parsed.delta.text
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`))
              }
              if (parsed.type === 'message_stop') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      },
    })

    const readable = response.body?.pipeThrough(transformStream)
    return new Response(readable, { headers: streamHeaders })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
