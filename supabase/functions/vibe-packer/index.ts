import { corsHeaders, handleCors } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface RequestBody {
  projectName: string
  projectDescription: string
  graph: {
    nodes: Array<{ id: string; type: string; label: string; description?: string }>
    edges: Array<{ id: string; source: string; target: string; label?: string }>
    gaps: Array<{ id: string; description: string; severity: string; resolved: boolean }>
  }
  messages: Array<{ role: string; content: string }>
}

const SYSTEM_PROMPT = `You are a technical writer creating a comprehensive Product Requirements Document (PRD) based on a software architecture discussion.

Given the project information, architecture graph, and conversation history, generate a professional PRD in Markdown format.

IMPORTANT STRUCTURE REQUIREMENTS:
1. Start with a Table of Contents (Inhaltsverzeichnis) at the very beginning
2. Include ALL sections listed below - do not skip any
3. End with "---\\n\\n✅ **PRD COMPLETE**" to indicate the document is finished

The PRD MUST include these sections in order:

## Inhaltsverzeichnis (Table of Contents)
List all sections with markdown links

## 1. Executive Summary
Brief overview of the project

## 2. Problem Statement
What problem this solves

## 3. Goals & Success Metrics
Clear objectives and KPIs

## 4. User Stories
Key user journeys

## 5. Technical Architecture
- System components (based on graph nodes)
- Data flow (based on graph edges)
- Technology recommendations

## 6. API Specifications
If applicable, endpoint definitions (keep concise)

## 7. Data Models
Key entities and their relationships (keep concise, show 2-3 main entities)

## 8. Security Considerations
Authentication, authorization, data protection

## 9. Open Questions / Gaps
Unresolved items from the discussion

## 10. Implementation Phases
Suggested roadmap with phases

## 11. Appendix
Additional references

---
✅ **PRD COMPLETE**

IMPORTANT: Be concise! Focus on essential information. Keep code examples minimal.
Format the output as clean, professional Markdown.
Write in German (Deutsch) if the conversation is in German.`

function buildUserPrompt(body: RequestBody): string {
  const { projectName, projectDescription, graph, messages } = body

  const nodesText = graph.nodes
    .map((n) => `- ${n.label} (${n.type}): ${n.description || 'No description'}`)
    .join('\n')

  const edgesText = graph.edges
    .map((e) => `- ${e.source} -> ${e.target}: ${e.label || 'connected'}`)
    .join('\n')

  const gapsText = graph.gaps
    .filter((g) => !g.resolved)
    .map((g) => `- [${g.severity.toUpperCase()}] ${g.description}`)
    .join('\n') || 'None'

  const conversationSummary = messages
    .slice(-30) // Keep last 30 messages for context
    .map((m) => `${m.role}: ${m.content.slice(0, 1000)}`)
    .join('\n\n')

  return `Project Name: ${projectName}
Project Description: ${projectDescription || 'Not provided'}

Architecture Graph:
Nodes (Components):
${nodesText}

Edges (Relationships):
${edgesText}

Unresolved Gaps:
${gapsText}

Conversation History (last 30 messages):
${conversationSummary}

Generate the PRD now:`
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

    // Use streaming for long responses
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16000,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    // Stream the response directly to the client
    const streamHeaders = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }

    // Transform the Anthropic SSE stream to extract just the text
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
              // Extract text from content_block_delta events
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                const textChunk = parsed.delta.text
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: textChunk })}\n\n`))
              }
              // Handle message_stop event
              if (parsed.type === 'message_stop') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
              }
            } catch {
              // Ignore parse errors for non-JSON lines
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
