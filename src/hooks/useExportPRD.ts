import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'

export function useExportPRD() {
  const [isGenerating, setIsGenerating] = useState(false)
  const { currentProject, messages, nodes, edges, gaps } = useProjectStore()

  const generatePRD = useCallback(async (): Promise<string | null> => {
    if (!currentProject) {
      return null
    }

    setIsGenerating(true)

    try {
      const graphData = {
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
        gaps: gaps.map((g) => ({
          id: g.id,
          description: g.description,
          severity: g.severity,
          resolved: g.resolved,
        })),
      }

      const chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const { data, error } = await supabase.functions.invoke('vibe-packer', {
        body: {
          projectName: currentProject.name,
          projectDescription: currentProject.description,
          graph: graphData,
          messages: chatMessages,
        },
      })

      if (error) {
        throw new Error(`PRD-Generierung fehlgeschlagen: ${error.message}`)
      }

      return data.prd || null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      return `# Fehler bei der PRD-Generierung\n\n${errorMessage}`
    } finally {
      setIsGenerating(false)
    }
  }, [currentProject, messages, nodes, edges, gaps])

  return { generatePRD, isGenerating }
}
