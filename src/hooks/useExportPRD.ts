import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'

export type ExportFormat = 'standard' | 'lovable' | 'claude-code' | 'firebase-studio' | 'navigation' | 'user-stories'

export const exportFormatLabels: Record<ExportFormat, string> = {
  'standard': 'Standard PRD',
  'lovable': 'Lovable Knowledge-File',
  'claude-code': 'Claude Code (CLAUDE.md)',
  'firebase-studio': 'Firebase Studio / Antigravity',
  'navigation': 'Navigationsstruktur',
  'user-stories': 'User Stories (Kunden-Version)',
}

export const exportFormatDescriptions: Record<ExportFormat, string> = {
  'standard': 'Vollständiges Product Requirements Document mit allen technischen Details',
  'lovable': 'Optimiert für lovable.dev - Knowledge-File mit Design-Philosophie und User Journeys',
  'claude-code': 'Kompaktes CLAUDE.md Memory-File für Claude Code CLI (<300 Zeilen)',
  'firebase-studio': 'Elevator-Pitch Format für Firebase Studio App Prototyping',
  'navigation': 'Hierarchische Sitemap mit Mermaid-Diagramm - zeigt Screens, Unterpunkte und Verknüpfungen',
  'user-stories': 'Einfache User Stories für Kundenbesprechungen - ohne technische Details',
}

interface StreamCallbacks {
  onChunk?: (text: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: string) => void
  onPartComplete?: (part: 1 | 2 | 3 | 4 | 5 | 6) => void
}

interface GeneratePRDOptions extends StreamCallbacks {
  format?: ExportFormat
}

export function useExportPRD() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [streamedContent, setStreamedContent] = useState('')
  const [currentPart, setCurrentPart] = useState<1 | 2 | 3 | 4 | 5 | 6 | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { currentProject, messages, nodes, edges, gaps } = useProjectStore()

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsGenerating(false)
    setCurrentPart(null)
  }, [])

  const generatePRD = useCallback(async (options?: GeneratePRDOptions): Promise<string | null> => {
    if (!currentProject) {
      return null
    }

    const format = options?.format || 'standard'

    setIsGenerating(true)
    setStreamedContent('')
    setCurrentPart(1)
    abortControllerRef.current = new AbortController()

    try {
      const graphData = {
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.data.label,
          description: n.data.description,
          ...Object.fromEntries(
            Object.entries(n.data).filter(([key]) => !['label', 'description'].includes(key))
          ),
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

      const { data: { session } } = await supabase.auth.getSession()
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const functionUrl = `${supabaseUrl}/functions/v1/vibe-packer`

      const baseBody = {
        projectName: currentProject.name,
        projectDescription: currentProject.description,
        graph: graphData,
        messages: chatMessages,
        format,
      }

      let fullText = ''

      // Generate Part 1
      const response1 = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...baseBody, part: 1 }),
        signal: abortControllerRef.current.signal,
      })

      if (!response1.ok) {
        const errorData = await response1.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response1.status}`)
      }

      fullText = await processStream(response1, fullText, setStreamedContent, options)
      options?.onPartComplete?.(1)

      // Navigation and user-stories formats only need 1 part
      if (format === 'navigation' || format === 'user-stories') {
        // Clean up and return
        setStreamedContent(fullText)
        options?.onComplete?.(fullText)
        return fullText
      }

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return null
      }

      // Generate Part 2
      setCurrentPart(2)
      fullText += '\n\n'
      setStreamedContent(fullText)

      const response2 = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ ...baseBody, part: 2 }),
        signal: abortControllerRef.current.signal,
      })

      if (!response2.ok) {
        const errorData = await response2.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `HTTP ${response2.status}`)
      }

      fullText = await processStream(response2, fullText, setStreamedContent, options)
      options?.onPartComplete?.(2)

      // Check if aborted
      if (abortControllerRef.current?.signal.aborted) {
        return null
      }

      // For standard (6 parts) and lovable (4 parts), generate additional parts
      if (format === 'standard' || format === 'lovable') {
        // Part 3
        setCurrentPart(3)
        fullText += '\n\n'
        setStreamedContent(fullText)

        const response3 = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ...baseBody, part: 3 }),
          signal: abortControllerRef.current.signal,
        })

        if (!response3.ok) {
          const errorData = await response3.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response3.status}`)
        }

        fullText = await processStream(response3, fullText, setStreamedContent, options)
        options?.onPartComplete?.(3)

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return null
        }

        // Part 4
        setCurrentPart(4)
        fullText += '\n\n'
        setStreamedContent(fullText)

        const response4 = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ...baseBody, part: 4 }),
          signal: abortControllerRef.current.signal,
        })

        if (!response4.ok) {
          const errorData = await response4.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response4.status}`)
        }

        fullText = await processStream(response4, fullText, setStreamedContent, options)
        options?.onPartComplete?.(4)

        // Lovable format ends here (4 parts)
        if (format === 'lovable') {
          // Skip to cleanup
        } else {
          // Standard format continues with parts 5 and 6

          // Check if aborted
          if (abortControllerRef.current?.signal.aborted) {
            return null
          }

          // Part 5
          setCurrentPart(5)
        fullText += '\n\n'
        setStreamedContent(fullText)

        const response5 = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ...baseBody, part: 5 }),
          signal: abortControllerRef.current.signal,
        })

        if (!response5.ok) {
          const errorData = await response5.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response5.status}`)
        }

        fullText = await processStream(response5, fullText, setStreamedContent, options)
        options?.onPartComplete?.(5)

        // Check if aborted
        if (abortControllerRef.current?.signal.aborted) {
          return null
        }

        // Part 6
        setCurrentPart(6)
        fullText += '\n\n'
        setStreamedContent(fullText)

        const response6 = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ ...baseBody, part: 6 }),
          signal: abortControllerRef.current.signal,
        })

        if (!response6.ok) {
          const errorData = await response6.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(errorData.error || `HTTP ${response6.status}`)
        }

        fullText = await processStream(response6, fullText, setStreamedContent, options)
        options?.onPartComplete?.(6)
        }
      }

      // Clean up markers
      fullText = fullText
        .replace(/\*\*\[FORTSETZUNG IN TEIL \d\]\*\*/g, '')
        .replace(/\*\*\[TEIL 1 ENDE - FORTSETZUNG IN TEIL 2\]\*\*/g, '')
        .replace(/---\s*\n\s*\n\s*##\s*4\./g, '---\n\n## 4.')
        .replace(/---\s*\n\s*\n\s*##\s*5\./g, '---\n\n## 5.')
        .replace(/---\s*\n\s*\n\s*##\s*6\./g, '---\n\n## 6.')
        .replace(/---\s*\n\s*\n\s*##\s*9\./g, '---\n\n## 9.')
        .replace(/---\s*\n\s*\n\s*##\s*Backend/g, '---\n\n## Backend')
        .replace(/---\s*\n\s*\n\s*##\s*Commands/g, '---\n\n## Commands')
        .replace(/---\s*\n\s*\n\s*##\s*Technical Requirements/g, '---\n\n## Technical Requirements')

      setStreamedContent(fullText)
      options?.onComplete?.(fullText)
      return fullText

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null
      }
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      options?.onError?.(errorMessage)
      return `# Fehler bei der PRD-Generierung\n\n${errorMessage}`
    } finally {
      setIsGenerating(false)
      setCurrentPart(null)
      abortControllerRef.current = null
    }
  }, [currentProject, messages, nodes, edges, gaps])

  return {
    generatePRD,
    isGenerating,
    streamedContent,
    currentPart,
    cancelGeneration,
  }
}

async function processStream(
  response: Response,
  currentContent: string,
  setContent: (content: string) => void,
  callbacks?: StreamCallbacks
): Promise<string> {
  const contentType = response.headers.get('content-type') || ''
  let fullText = currentContent

  if (contentType.includes('text/event-stream')) {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
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
              setContent(fullText)
              callbacks?.onChunk?.(parsed.text)
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } else {
    const data = await response.json()
    if (data.error) {
      throw new Error(data.error)
    }
    fullText = data.prd || ''
    setContent(fullText)
  }

  return fullText
}
