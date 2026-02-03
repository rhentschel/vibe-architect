import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'

interface StreamCallbacks {
  onChunk?: (text: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: string) => void
}

export function useExportPRD() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const { currentProject, messages, nodes, edges, gaps } = useProjectStore()

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
  }, [])

  const generatePRD = useCallback(async (callbacks?: StreamCallbacks): Promise<string | null> => {
    if (!currentProject) {
      return null
    }

    setIsGenerating(true)
    setStreamedContent('')
    abortControllerRef.current = new AbortController()

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

      // Get Supabase session for auth
      const { data: { session } } = await supabase.auth.getSession()

      // Build the function URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/vibe-packer`

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          projectName: currentProject.name,
          projectDescription: currentProject.description,
          graph: graphData,
          messages: chatMessages,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // Check if we're getting a stream or JSON
      const contentType = response.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream')) {
        // Handle streaming response
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('No response body')
        }

        const decoder = new TextDecoder()
        let fullText = ''
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                continue
              }
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  fullText += parsed.text
                  setStreamedContent(fullText)
                  callbacks?.onChunk?.(parsed.text)
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }

        callbacks?.onComplete?.(fullText)
        return fullText || null
      } else {
        // Handle non-streaming JSON response (fallback)
        const data = await response.json()
        if (data.error) {
          throw new Error(data.error)
        }
        const prd = data.prd || ''
        setStreamedContent(prd)
        callbacks?.onComplete?.(prd)
        return prd
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      callbacks?.onError?.(errorMessage)
      return `# Fehler bei der PRD-Generierung\n\n${errorMessage}`
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [currentProject, messages, nodes, edges, gaps])

  return {
    generatePRD,
    isGenerating,
    streamedContent,
    cancelGeneration,
  }
}
