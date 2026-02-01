import { corsHeaders, handleCors } from '../_shared/cors.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface RequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  currentGraph: {
    nodes: unknown[]
    edges: unknown[]
    gaps: unknown[]
  }
  model?: string
}

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929'
const ALLOWED_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20251101',
]

const SYSTEM_PROMPT = `You are an expert software architect AI assistant called VibeArchitect.
Your role is to help users design and visualize software architectures through conversation.

When the user describes their system or asks questions, you should:
1. Understand their requirements and constraints
2. Propose architectural components (entities, processes)
3. Identify relationships between components
4. Point out potential logic gaps or missing pieces
5. Provide clear explanations

CRITICAL: You MUST ALWAYS respond with valid JSON in this exact format - no markdown, no code blocks, just raw JSON:
{
  "message": "Your conversational response to the user explaining your analysis and suggestions",
  "nodes": [
    {
      "id": "unique-id",
      "type": "entity" | "process",
      "label": "Component Name",
      "description": "What this component does"
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "label": "relationship description"
    }
  ],
  "gaps": [
    {
      "id": "gap-id",
      "description": "Description of what's missing or unclear",
      "severity": "low" | "medium" | "high",
      "relatedNodeIds": ["node-id-1"],
      "resolved": false
    }
  ],
  "removedNodeIds": ["ids of nodes to remove if refactoring"],
  "removedEdgeIds": ["ids of edges to remove if refactoring"],
  "resolvedGapIds": ["ids of gaps that user has now clarified"],
  "suggestions": ["Optional follow-up questions or suggestions"]
}

Node types:
- "entity": Data stores, databases, external services, APIs, users
- "process": Business logic, services, functions, handlers

Edge labels should describe the data flow or relationship (e.g., "sends data to", "authenticates via", "stores in").

Gaps represent missing information, unclear requirements, or potential architectural issues.

IMPORTANT RULES:
1. When user provides NEW information (especially answering questions about gaps), you MUST create NEW nodes and edges to represent that information. Generate unique IDs like "node-payment-service" or "edge-user-to-auth".
2. When a gap is addressed by user's new information, include its ID in "resolvedGapIds" AND add the corresponding new nodes/edges.
3. Only include nodes, edges, gaps that are NEW or CHANGED. Don't repeat existing unchanged elements.
4. If removing elements, specify their IDs in removedNodeIds/removedEdgeIds.
5. ALWAYS add nodes when user clarifies architecture details - never just respond with text only.

Always respond in the same language the user uses.`

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
    const { messages, currentGraph, model: requestedModel } = (await req.json()) as RequestBody

    // Validate and use requested model, fallback to default
    const model = requestedModel && ALLOWED_MODELS.includes(requestedModel)
      ? requestedModel
      : DEFAULT_MODEL

    const contextMessage = currentGraph.nodes.length > 0
      ? `\n\nCurrent architecture state:\n${JSON.stringify(currentGraph, null, 2)}`
      : ''

    const anthropicMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.role === 'user' && msg === messages[messages.length - 1]
        ? msg.content + contextMessage
        : msg.content,
    }))

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    let content = data.content[0]?.text || ''

    // Strip markdown code blocks if AI wrapped the response
    if (content.includes('```json')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    } else if (content.includes('```')) {
      content = content.replace(/```\n?/g, '').trim()
    }

    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch {
      // Try to extract JSON object from the response if there's text before it
      const jsonMatch = content.match(/\{[\s\S]*"message"[\s\S]*\}$/)
      if (jsonMatch) {
        try {
          parsedResponse = JSON.parse(jsonMatch[0])
        } catch {
          parsedResponse = {
            message: content,
            nodes: [],
            edges: [],
            gaps: [],
            resolvedGapIds: [],
            suggestions: [],
          }
        }
      } else {
        parsedResponse = {
          message: content,
          nodes: [],
          edges: [],
          gaps: [],
          resolvedGapIds: [],
          suggestions: [],
        }
      }
    }

    return new Response(
      JSON.stringify(parsedResponse),
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
