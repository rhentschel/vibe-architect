import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'
import type { Message } from '@/types/database.types'

export function useChatLogic() {
  const {
    currentProject,
    messages,
    nodes,
    edges,
    gaps,
    addMessage,
    applyAIResponse,
    setIsSending,
    setError,
  } = useProjectStore()

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentProject) {
        setError('Kein Projekt ausgewählt')
        return
      }

      setIsSending(true)
      setError(null)

      const userMessage: Message = {
        id: crypto.randomUUID(),
        project_id: currentProject.id,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }

      addMessage(userMessage)

      try {
        const { error: saveError } = await supabase
          .from('messages')
          .insert({
            project_id: currentProject.id,
            role: 'user' as const,
            content,
          } as never)

        if (saveError) {
          throw new Error(`Nachricht konnte nicht gespeichert werden: ${saveError.message}`)
        }

        const chatHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }))

        const currentGraph = {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.data.label,
            description: n.data.description,
          })),
          edges: edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
          })),
          gaps: gaps.filter((g) => !g.resolved),
        }

        const { data, error: fnError } = await supabase.functions.invoke('architect-brain', {
          body: {
            messages: chatHistory,
            currentGraph,
          },
        })

        if (fnError) {
          throw new Error(`AI-Fehler: ${fnError.message}`)
        }

        // Use data directly, with fallbacks for missing fields
        const aiResponse = {
          message: data.message || '',
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
          gaps: Array.isArray(data.gaps) ? data.gaps : [],
          removedNodeIds: Array.isArray(data.removedNodeIds) ? data.removedNodeIds : [],
          removedEdgeIds: Array.isArray(data.removedEdgeIds) ? data.removedEdgeIds : [],
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          project_id: currentProject.id,
          role: 'assistant',
          content: aiResponse.message,
          created_at: new Date().toISOString(),
        }

        addMessage(assistantMessage)

        await supabase.from('messages').insert({
          project_id: currentProject.id,
          role: 'assistant' as const,
          content: aiResponse.message,
        } as never)

        applyAIResponse(aiResponse)

        const graphData = {
          nodes: [...nodes, ...(aiResponse.nodes || [])].map((n) => ({
            id: n.id,
            type: n.type,
            label: 'data' in n ? (n.data as { label: string }).label : n.label,
            description: 'data' in n ? (n.data as { description?: string }).description : n.description,
            position: 'position' in n ? n.position : undefined,
          })),
          edges: [...edges, ...(aiResponse.edges || [])],
          gaps: [...gaps, ...(aiResponse.gaps || [])],
        }

        await supabase.from('architecture_snapshots').insert({
          project_id: currentProject.id,
          graph_data: graphData,
        } as never)

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten'
        setError(errorMessage)

        const errorAssistantMessage: Message = {
          id: crypto.randomUUID(),
          project_id: currentProject.id,
          role: 'assistant',
          content: `Entschuldigung, es ist ein Fehler aufgetreten: ${errorMessage}. Bitte versuche es erneut.`,
          created_at: new Date().toISOString(),
        }
        addMessage(errorAssistantMessage)
      } finally {
        setIsSending(false)
      }
    },
    [currentProject, messages, nodes, edges, gaps, addMessage, applyAIResponse, setIsSending, setError]
  )

  return { sendMessage }
}
