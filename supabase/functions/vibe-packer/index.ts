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

const SYSTEM_PROMPT = `You are a technical writer creating a Product Requirements Document (PRD).

CRITICAL RULES:
1. START with Table of Contents (numbered list with anchor links)
2. INCLUDE ALL 11 sections - never skip any
3. END with exactly: "---\\n\\n✅ **PRD COMPLETE**"
4. BE EXTREMELY CONCISE - max 3-5 bullet points per section
5. NO code blocks for API/Data Models - use simple tables instead
6. Each section max 10-15 lines

SECTIONS (all required):
1. Executive Summary - 3-4 sentences max
2. Problem Statement - 3-5 bullet points
3. Goals & Success Metrics - simple table with 5 KPIs
4. User Stories - max 8 user stories total, one line each
5. Technical Architecture - list components, no diagrams
6. API Specifications - simple table: Endpoint | Method | Purpose
7. Data Models - simple table: Entity | Key Fields | Purpose
8. Security Considerations - 5 bullet points
9. Open Questions / Gaps - list from provided gaps
10. Implementation Phases - 3-4 phases, 3 bullets each
11. Appendix - just list references

Write in German if conversation is in German.
FINISH THE DOCUMENT COMPLETELY - do not stop early!`

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
