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

The PRD should include:
1. **Executive Summary** - Brief overview of the project
2. **Problem Statement** - What problem this solves
3. **Goals & Success Metrics** - Clear objectives and KPIs
4. **User Stories** - Key user journeys
5. **Technical Architecture**
   - System components (based on graph nodes)
   - Data flow (based on graph edges)
   - Technology recommendations
6. **API Specifications** - If applicable, endpoint definitions
7. **Data Models** - Key entities and their relationships
8. **Security Considerations** - Authentication, authorization, data protection
9. **Open Questions / Gaps** - Unresolved items from the discussion
10. **Implementation Phases** - Suggested roadmap
11. **Appendix** - Additional diagrams or references

Format the output as clean, professional Markdown.
Use the conversation context to fill in details where the graph alone is insufficient.
Be specific and actionable in recommendations.
Write in German (Deutsch) if the conversation is in German.`

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
    const { projectName, projectDescription, graph, messages } = (await req.json()) as RequestBody

    const conversationSummary = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n')

    const userPrompt = `Project Name: ${projectName}
Project Description: ${projectDescription || 'Not provided'}

Architecture Graph:
Nodes (Components):
${graph.nodes.map((n) => `- ${n.label} (${n.type}): ${n.description || 'No description'}`).join('\n')}

Edges (Relationships):
${graph.edges.map((e) => `- ${e.source} -> ${e.target}: ${e.label || 'connected'}`).join('\n')}

Unresolved Gaps:
${graph.gaps.filter((g) => !g.resolved).map((g) => `- [${g.severity.toUpperCase()}] ${g.description}`).join('\n') || 'None'}

Conversation History:
${conversationSummary}

Generate the PRD now:`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const prdContent = data.content?.[0]?.text || ''

    return new Response(
      JSON.stringify({ prd: prdContent }),
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
