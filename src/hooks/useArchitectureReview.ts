import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'
import type { Message } from '@/types/database.types'

interface ReviewResult {
  message: string
  issues: Array<{
    nodeId?: string
    type: 'consistency' | 'missing' | 'redundant' | 'unclear'
    severity: 'low' | 'medium' | 'high'
    description: string
    suggestion?: string
  }>
  overallScore: number
  summary: string
}

export function useArchitectureReview() {
  const [isReviewing, setIsReviewing] = useState(false)
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    currentProject,
    nodes,
    edges,
    gaps,
    addMessage,
  } = useProjectStore()

  const runReview = useCallback(async () => {
    if (!currentProject) {
      setError('Kein Projekt ausgewählt')
      return null
    }

    if (nodes.length === 0) {
      setError('Keine Nodes zum Überprüfen vorhanden')
      return null
    }

    setIsReviewing(true)
    setError(null)
    setReviewResult(null)

    try {
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

      const reviewPrompt = `Bitte führe eine umfassende Architektur-Review durch. Analysiere alle Nodes und deren Verbindungen auf:

1. **Konsistenz**: Passen die Komponenten logisch zusammen?
2. **Vollständigkeit**: Fehlen wichtige Komponenten oder Verbindungen?
3. **Redundanz**: Gibt es doppelte oder überflüssige Komponenten?
4. **Klarheit**: Sind alle Beschreibungen verständlich und ausreichend?

Antworte im JSON-Format:
{
  "message": "Zusammenfassende Erklärung der Review",
  "issues": [
    {
      "nodeId": "id des betroffenen nodes (optional)",
      "type": "consistency|missing|redundant|unclear",
      "severity": "low|medium|high",
      "description": "Beschreibung des Problems",
      "suggestion": "Verbesserungsvorschlag"
    }
  ],
  "overallScore": 85,
  "summary": "Kurze Zusammenfassung in 1-2 Sätzen"
}`

      const { data, error: fnError } = await supabase.functions.invoke('architect-brain', {
        body: {
          messages: [{ role: 'user', content: reviewPrompt }],
          currentGraph,
          model: 'claude-opus-4-5-20251101', // Always use Opus for review
        },
      })

      if (fnError) {
        throw new Error(`Review-Fehler: ${fnError.message}`)
      }

      // Parse the review result
      let result: ReviewResult
      if (data.issues && typeof data.overallScore === 'number') {
        result = {
          message: data.message || '',
          issues: data.issues || [],
          overallScore: data.overallScore,
          summary: data.summary || data.message || '',
        }
      } else {
        // If the response doesn't match expected format, create a basic result
        result = {
          message: data.message || 'Review abgeschlossen',
          issues: [],
          overallScore: 100,
          summary: data.message || 'Keine Probleme gefunden',
        }
      }

      setReviewResult(result)

      // Add review as assistant message
      const reviewMessage: Message = {
        id: crypto.randomUUID(),
        project_id: currentProject.id,
        role: 'assistant',
        content: `🔍 **Architektur-Review (Opus 4.5)**\n\n${result.summary}\n\n**Score: ${result.overallScore}/100**\n\n${
          result.issues.length > 0
            ? `**Gefundene Probleme (${result.issues.length}):**\n${result.issues
                .map(
                  (issue, i) =>
                    `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.description}${
                      issue.suggestion ? `\n   → ${issue.suggestion}` : ''
                    }`
                )
                .join('\n')}`
            : '✅ Keine Probleme gefunden!'
        }`,
        created_at: new Date().toISOString(),
      }

      addMessage(reviewMessage)

      // Save to database
      await supabase.from('messages').insert({
        project_id: currentProject.id,
        role: 'assistant' as const,
        content: reviewMessage.content,
      } as never)

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten'
      setError(errorMessage)
      return null
    } finally {
      setIsReviewing(false)
    }
  }, [currentProject, nodes, edges, gaps, addMessage])

  return {
    runReview,
    isReviewing,
    reviewResult,
    error,
    clearError: () => setError(null),
    clearResult: () => setReviewResult(null),
  }
}
