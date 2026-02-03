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
  part?: 1 | 2  // Which part to generate
}

function getSystemPrompt(part: 1 | 2): string {
  if (part === 1) {
    return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 1 des PRD (Sections 1-5).

STRUKTUR FÜR TEIL 1:

# Product Requirements Document (PRD)
## [Projektname]

---

## Inhaltsverzeichnis
(Vollständige Liste aller 11 Sections mit Anchor-Links)

---

## 1. Executive Summary
Projektüberblick, Kernfeatures, Technologie-Stack (2-3 Absätze)

## 2. Problem Statement
Aktuelle Herausforderungen, Business Impact (detailliert)

## 3. Goals & Success Metrics
Geschäftsziele und technische Ziele als Tabellen, messbare KPIs

## 4. User Stories
Gruppiert nach Benutzerrolle, ALLE relevanten User Stories auflisten

## 5. Technical Architecture
DETAILLIERT für JEDEN Node im Graph:
- Architektur-Übersicht mit Mermaid-Diagramm
- Für jeden Node: Name, Typ, Verantwortlichkeiten, Schnittstellen, Technologie
- Datenflüsse basierend auf Edges

---
**[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2]**

WICHTIG:
- Schreibe alle Details aus den Node-Beschreibungen
- Nutze die zusätzlichen Node-Daten für technische Spezifikationen
- Beende mit dem Marker "[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2]"`
  }

  return `Du bist ein erfahrener Technical Writer, der detaillierte Product Requirements Documents (PRD) für Software-Projekte erstellt.

Du schreibst TEIL 2 des PRD (Sections 6-11). Teil 1 wurde bereits erstellt.

STRUKTUR FÜR TEIL 2 (beginne direkt mit Section 6):

## 6. API Specifications
Für jeden relevanten Service: Endpoints, Methods, Request/Response-Beispiele
Nutze Code-Blöcke für API-Definitionen

## 7. Data Models
Entitäten mit Feldern, Beziehungen
SQL oder TypeScript-Interface-Beispiele für die wichtigsten Entitäten

## 8. Security Considerations
Auth, Autorisierung, Datenschutz, DSGVO-Anforderungen (detailliert)

## 9. Open Questions / Gaps
Liste aller ungelösten Gaps aus dem Graph mit Severity

## 10. Implementation Phases
Roadmap mit Phasen, Meilensteinen, Abhängigkeiten, Timeline

## 11. Appendix
Referenzen, Glossar, technische Details, Diagramm-Legende

---
✅ **PRD VOLLSTÄNDIG**

WICHTIG:
- Schreibe alle Sections vollständig aus
- Beende IMMER mit "✅ **PRD VOLLSTÄNDIG**"
- Nutze die Node-Informationen für API und Data Models`
}

function buildUserPrompt(body: RequestBody, part: 1 | 2): string {
  const { projectName, projectDescription, graph, messages } = body

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

  const conversationSummary = messages
    .slice(-40)
    .map((m) => `${m.role}: ${m.content.slice(0, 1200)}`)
    .join('\n\n')

  const partInfo = part === 1
    ? 'Erstelle TEIL 1 des PRD (Inhaltsverzeichnis + Sections 1-5):'
    : 'Erstelle TEIL 2 des PRD (Sections 6-11):'

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

${partInfo}`
}

async function generatePart(body: RequestBody, part: 1 | 2): Promise<ReadableStream> {
  const userPrompt = buildUserPrompt(body, part)
  const systemPrompt = getSystemPrompt(part)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16000,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  return response.body!
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
    const requestedPart = body.part || 1

    const streamHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    // If requesting a specific part, generate just that part
    if (body.part) {
      const stream = await generatePart(body, requestedPart)

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
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
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

      const readable = stream.pipeThrough(transformStream)
      return new Response(readable, { headers: streamHeaders })
    }

    // Default: Generate both parts sequentially
    let fullContent = ''

    // Generate Part 1
    const stream1 = await generatePart(body, 1)
    const reader1 = stream1.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader1.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text
            }
          } catch {}
        }
      }
    }

    // Add separator between parts
    fullContent += '\n\n'

    // Generate Part 2
    const stream2 = await generatePart(body, 2)
    const reader2 = stream2.getReader()

    while (true) {
      const { done, value } = await reader2.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ') && line.slice(6) !== '[DONE]') {
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              fullContent += parsed.delta.text
            }
          } catch {}
        }
      }
    }

    // Clean up the content - remove part markers
    fullContent = fullContent
      .replace(/\*\*\[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2\]\*\*/g, '')
      .replace(/---\s*\n\s*\n\s*##\s*6\./g, '---\n\n## 6.')

    return new Response(
      JSON.stringify({ prd: fullContent }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
