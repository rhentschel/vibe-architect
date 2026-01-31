import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Copy, Loader2, FileText, Check } from 'lucide-react'
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
  const { generatePRD, isGenerating } = useExportPRD()

  const handleGenerate = async () => {
    const content = await generatePRD()
    if (content) {
      setPrdContent(content)
    }
  }

  const handleCopy = async () => {
    if (prdContent) {
      await navigator.clipboard.writeText(prdContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (prdContent && currentProject) {
      const blob = new Blob([prdContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}-prd.md`
      link.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setPrdContent(null)
  }

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
          {!prdContent ? (
            <div className="flex flex-col items-center justify-center py-12">
              {isGenerating ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">
                    PRD wird generiert...
                  </p>
                </>
              ) : (
                <>
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-sm text-muted-foreground text-center max-w-sm">
                    Klicke auf "Generieren", um ein vollständiges PRD basierend auf deiner
                    Architektur und Konversation zu erstellen.
                  </p>
                  <Button onClick={handleGenerate} className="mt-6">
                    PRD Generieren
                  </Button>
                </>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[60vh] rounded-lg border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {prdContent}
                </ReactMarkdown>
              </div>
            </ScrollArea>
          )}
        </div>

        {prdContent && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCopy}>
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
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Als Markdown herunterladen
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
