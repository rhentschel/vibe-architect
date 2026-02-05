import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { useSettingsStore } from '@/lib/store/useSettingsStore'
import { getLayoutedElements } from '@/lib/utils/graphLayout'
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
    updateNodePosition,
    setIsSending,
    setError,
  } = useProjectStore()

  const { aiModel } = useSettingsStore()

  const sendMessage = useCallback(
    async (content: string, fileContent?: string) => {
      // Combine message with file content if provided
      const fullContent = fileContent ? `${content}${fileContent}` : content
      if (!currentProject) {
        setError('Kein Projekt ausgewählt')
        return
      }

      setIsSending(true)
      setError(null)

      // Display message shows only user text, not the full file content
      const userMessage: Message = {
        id: crypto.randomUUID(),
        project_id: currentProject.id,
        role: 'user',
        content: fileContent ? `${content}\n\n📎 Datei angehängt` : content,
        created_at: new Date().toISOString(),
      }

      addMessage(userMessage)

      try {
        // Save the full content including file data to database
        const { error: saveError } = await supabase
          .from('messages')
          .insert({
            project_id: currentProject.id,
            role: 'user' as const,
            content: fullContent,
          } as never)

        if (saveError) {
          throw new Error(`Nachricht konnte nicht gespeichert werden: ${saveError.message}`)
        }

        // Build chat history - use fullContent for the current message to include file data
        const chatHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        chatHistory.push({
          role: 'user',
          content: fullContent,
        })

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
            model: aiModel,
          },
        })

        if (fnError) {
          throw new Error(`AI-Fehler: ${fnError.message}`)
        }

        const aiResponse = {
          message: data.message || '',
          nodes: Array.isArray(data.nodes) ? data.nodes : [],
          edges: Array.isArray(data.edges) ? data.edges : [],
          gaps: Array.isArray(data.gaps) ? data.gaps : [],
          removedNodeIds: Array.isArray(data.removedNodeIds) ? data.removedNodeIds : [],
          removedEdgeIds: Array.isArray(data.removedEdgeIds) ? data.removedEdgeIds : [],
          resolvedGapIds: Array.isArray(data.resolvedGapIds) ? data.resolvedGapIds : [],
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

        // Auto-layout when new nodes are added
        if (aiResponse.nodes.length > 0) {
          // Get fresh state after applyAIResponse
          const freshState = useProjectStore.getState()
          const { nodes: layoutedNodes } = getLayoutedElements(
            freshState.nodes,
            freshState.edges,
            'TB'
          )
          // Update positions
          for (const node of layoutedNodes) {
            updateNodePosition(node.id, node.position)
          }
        }

        // Auto-save handles snapshot persistence via useGraphSync hook

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
    [currentProject, messages, nodes, edges, gaps, addMessage, applyAIResponse, updateNodePosition, setIsSending, setError, aiModel]
  )

  return { sendMessage }
}
