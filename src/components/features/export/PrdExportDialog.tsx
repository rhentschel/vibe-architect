import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Download, Copy, Loader2, FileText, Check, X, ChevronDown } from 'lucide-react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useExportPRD,
  type ExportFormat,
  exportFormatLabels,
  exportFormatDescriptions,
} from '@/hooks/useExportPRD'
import { useProjectStore } from '@/lib/store/useProjectStore'

interface PrdExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PrdExportDialog({ open, onOpenChange }: PrdExportDialogProps) {
  const [prdContent, setPrdContent] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('standard')
  const { currentProject } = useProjectStore()
  const { generatePRD, isGenerating, streamedContent, currentPart, cancelGeneration } = useExportPRD()

  const handleGenerate = async () => {
    const content = await generatePRD({
      format: selectedFormat,
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
      const fileExtensions: Record<ExportFormat, string> = {
        'standard': 'prd.md',
        'lovable': 'lovable-knowledge.md',
        'claude-code': 'CLAUDE.md',
        'firebase-studio': 'firebase-studio-prompt.md',
        'navigation': 'navigation.md',
        'user-stories': 'user-stories.md',
      }
      const blob = new Blob([contentToDownload], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${currentProject.name.toLowerCase().replace(/\s+/g, '-')}-${fileExtensions[selectedFormat]}`
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
    setSelectedFormat('standard')
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
                Wähle ein Export-Format und generiere ein Dokument basierend auf deiner
                Architektur und Konversation.
              </p>

              <div className="mt-6 w-full max-w-md space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Export Format</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {exportFormatLabels[selectedFormat]}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[400px]">
                      {(Object.keys(exportFormatLabels) as ExportFormat[]).map((format) => (
                        <DropdownMenuItem
                          key={format}
                          onClick={() => setSelectedFormat(format)}
                          className="flex flex-col items-start py-3"
                        >
                          <span className="font-medium">{exportFormatLabels[format]}</span>
                          <span className="text-xs text-muted-foreground mt-1">
                            {exportFormatDescriptions[format]}
                          </span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button onClick={handleGenerate} className="w-full">
                  {exportFormatLabels[selectedFormat]} Generieren
                </Button>
              </div>
            </div>
          ) : (
            <>
              {isGenerating && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {selectedFormat === 'navigation' ? 'Navigationsstruktur' : selectedFormat === 'user-stories' ? 'User Stories' : 'PRD'} wird generiert... {currentPart && `(Teil ${currentPart}/${selectedFormat === 'standard' ? 6 : (selectedFormat === 'navigation' || selectedFormat === 'user-stories') ? 1 : 2})`}
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
