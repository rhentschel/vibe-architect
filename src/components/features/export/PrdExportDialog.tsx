import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Copy, Loader2, FileText, Check, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useExportPRD } from '@/hooks/useExportPRD'
import { useProjectStore } from '@/lib/store/useProjectStore'

interface PrdExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrdExportDialog({ open, onOpenChange }: PrdExportDialogProps) {
  const [prdContent, setPrdContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { currentProject } = useProjectStore()
  const { generatePRD, isGenerating, streamedContent, currentPart, cancelGeneration } = useExportPRD()

  const handleGenerate = async () => {
    const content = await generatePRD({
      onComplete: (fullText) => {
        setPrdContent(fullText)
      },
    })
    if (content) {
      setPrdContent(content)
    }
  }

  const handleCancel = () => {
    cancelGeneration()
  }

  const handleCopy = async () => {
    const contentToCopy = prdContent || streamedContent
    if (contentToCopy) {
      await navigator.clipboard.writeText(contentToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const contentToDownload = prdContent || streamedContent
    if (contentToDownload && currentProject) {
      const blob = new Blob([contentToDownload], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}-prd.md`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleClose = () => {
    if (isGenerating) {
      cancelGeneration()
    }
    onOpenChange(false)
    setPrdContent(null)
  }

  // Show streamed content while generating, or final content when done
  const displayContent = prdContent || (isGenerating ? streamedContent : null)
  const hasContent = displayContent && displayContent.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PRD Export
          </DialogTitle>
          <DialogDescription>
            Generiere ein Product Requirements Document basierend auf deiner Architektur.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {!hasContent && !isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground text-center max-w-sm">
                Klicke auf "Generieren", um ein vollständiges PRD basierend auf deiner
                Architektur und Konversation zu erstellen.
              </p>
              <Button onClick={handleGenerate} className="mt-6">
                PRD Generieren
              </Button>
            </div>
          ) : (
            <>
              {isGenerating && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    PRD wird generiert... {currentPart && `(Teil ${currentPart}/2)`}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    className="ml-auto h-7 px-2"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Abbrechen
                  </Button>
                </div>
              )}
              <ScrollArea className="h-[60vh] rounded-lg border p-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {displayContent || ''}
                  </ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {hasContent && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCopy} disabled={isGenerating}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Kopieren
                </>
              )}
            </Button>
            <Button onClick={handleDownload} disabled={isGenerating}>
              <Download className="mr-2 h-4 w-4" />
              Als Markdown herunterladen
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
