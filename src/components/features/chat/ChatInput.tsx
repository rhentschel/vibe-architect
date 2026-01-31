import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ChangeEvent } from 'react'
import { Send, Loader2, Paperclip, X, FileText, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
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
  const [message, setMessage] = useState('')
  const [attachedFile, setAttachedFile] = useState<ParsedFile | null>(null)
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

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    if (file.size > MAX_FILE_SIZE) {
      setFileError(`Datei zu groß. Maximum: ${formatFileSize(MAX_FILE_SIZE)}`)
      return
    }

    setIsParsingFile(true)
    try {
      const parsed = await parseFile(file)
      setAttachedFile(parsed)
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Fehler beim Lesen der Datei')
    } finally {
      setIsParsingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = () => {
    setAttachedFile(null)
    setFileError(null)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if ((message.trim() || attachedFile) && !isLoading) {
      const fileContent = attachedFile
        ? `\n\n--- Angehängte Datei: ${attachedFile.name} ---\n${attachedFile.content}\n--- Ende der Datei ---`
        : undefined
      onSend(message.trim() || 'Analysiere die angehängte Datei und erstelle eine passende Architektur.', fileContent)
      setMessage('')
      setAttachedFile(null)
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

  return (
    <form onSubmit={handleSubmit} className="border-t border-border/50 bg-card/50 p-4">
      {/* Attached File Preview */}
      {attachedFile && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/50 bg-muted/30 px-3 py-2">
          {getFileIcon(attachedFile.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{attachedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachedFile.size)} • {attachedFile.content.length.toLocaleString()} Zeichen
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemoveFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* File Error */}
      {fileError && (
        <div className="mb-3 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 flex-shrink-0 rounded-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isParsingFile}
          title="Datei anhängen (PDF, Word, Text)"
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
            placeholder={attachedFile ? 'Anweisungen zur Datei (optional)...' : placeholder}
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
          disabled={(!message.trim() && !attachedFile) || isLoading}
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
        PDF, Word, Text-Dateien werden unterstützt
      </p>
    </form>
  )
}
