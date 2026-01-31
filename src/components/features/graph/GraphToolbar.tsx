import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GraphToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAutoLayout: () => void
  onExportPng: () => void
}

export function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onAutoLayout,
  onExportPng,
}: GraphToolbarProps) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex gap-1 rounded-lg border bg-background p-1 shadow-sm">
      <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onFitView} title="Fit view">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <div className="w-px bg-border" />
      <Button variant="ghost" size="icon" onClick={onAutoLayout} title="Auto layout">
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onExportPng} title="Export PNG">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  )
}
