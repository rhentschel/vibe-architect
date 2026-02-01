import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Loader2, Paperclip, X, FileText, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { useProjectStore } from '@/lib/store/useProjectStore'
import {
  parseFile,
  formatFileSize,
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE,
  type ParsedFile,
} from '@/lib/utils/fileParser'

interface ChatInputProps {
  onSend: (message: string, fileContent?: string) => void
  isLoading: boolean
  placeholder?: string
}

export function ChatInput({ onSend, isLoading, placeholder = 'Beschreibe deine Software-Architektur...' }: ChatInputProps) {
  const { pendingChatMessage, setPendingChatMessage } = useProjectStore()
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<ParsedFile[]>([])
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  // Handle pending chat message from sidebar (e.g., discussing a gap)
  useEffect(() => {
    if (pendingChatMessage) {
      setMessage(pendingChatMessage)
      setPendingChatMessage(null)
      // Focus the textarea
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [pendingChatMessage, setPendingChatMessage])

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setFileError(null)
    setIsParsingFile(true)

    const newFiles: ParsedFile[] = []
    const errors: string[] = []

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: zu groß (max ${formatFileSize(MAX_FILE_SIZE)})`)
        continue
      }

      try {
        const parsed = await parseFile(file)
        newFiles.push(parsed)
      } catch (error) {
        errors.push(`${file.name}: ${error instanceof Error ? error.message : 'Fehler'}`)
      }
    }

    if (newFiles.length > 0) {
      setAttachedFiles(prev => [...prev, ...newFiles])
    }

    if (errors.length > 0) {
      setFileError(errors.join('\n'))
    }

    setIsParsingFile(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
    setFileError(null)
  }

  const handleRemoveAllFiles = () => {
    setAttachedFiles([])
    setFileError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if ((message.trim() || attachedFiles.length > 0) && !isLoading) {
      const fileContent = attachedFiles.length > 0
        ? attachedFiles.map(f => `\n\n--- Angehängte Datei: ${f.name} ---\n${f.content}\n--- Ende der Datei ---`).join('')
        : undefined
      onSend(
        message.trim() || `Analysiere die ${attachedFiles.length} angehängte${attachedFiles.length > 1 ? 'n' : ''} Datei${attachedFiles.length > 1 ? 'en' : ''} und erstelle eine passende Architektur.`,
        fileContent
      )
      setMessage('')
      setAttachedFiles([])
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />
    if (type.includes('word') || type.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />
    return <File className="h-4 w-4 text-muted-foreground" />
  }

  const totalCharacters = attachedFiles.reduce((sum, f) => sum + f.content.length, 0)

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/50 bg-card/50 p-4">
      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {attachedFiles.length} Datei{attachedFiles.length > 1 ? 'en' : ''} • {totalCharacters.toLocaleString()} Zeichen
            </span>
            {attachedFiles.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handleRemoveAllFiles}
              >
                Alle entfernen
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-2 py-1"
              >
                {getFileIcon(file.type)}
                <span className="text-xs font-medium truncate max-w-[150px]">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 shrink-0"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Error */}
      {fileError && (
        <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive whitespace-pre-line">
          {fileError}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File Upload Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          multiple
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isParsingFile}
          title="Dateien anhängen (PDF, Word, Text) - mehrere möglich"
        >
          {isParsingFile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedFiles.length > 0 ? 'Anweisungen zu den Dateien (optional)...' : placeholder}
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none rounded-xl border border-border/50 bg-background px-4 py-3 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[200px] overflow-y-auto transition-all duration-200'
            )}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={(!message.trim() && attachedFiles.length === 0) || isLoading}
          className="h-10 w-10 flex-shrink-0 rounded-lg shadow-sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">Drücke Enter zum Senden, Shift+Enter für neue Zeile • </span>
        Mehrere PDF, Word, Text-Dateien möglich
      </p>
    </form>
  )
}
