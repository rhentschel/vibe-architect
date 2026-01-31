import { useState, useRef, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, Download, Database, Cog, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GraphToolbarProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onFitView: () => void
  onAutoLayout: () => void
  onExportPng: () => void
  onAddNode?: (type: 'entity' | 'process') => void
  onDelete?: () => void
  hasSelection?: boolean
}

export function GraphToolbar({
  onZoomIn,
  onZoomOut,
  onFitView,
  onAutoLayout,
  onExportPng,
  onAddNode,
  onDelete,
  hasSelection,
}: GraphToolbarProps) {
  const [position, setPosition] = useState({ x: 16, y: 16 })
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    }
  }, [position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current || !toolbarRef.current) return

    const parent = toolbarRef.current.parentElement
    if (!parent) return

    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY

    const newX = dragRef.current.initialX - deltaX
    const newY = dragRef.current.initialY - deltaY

    const parentRect = parent.getBoundingClientRect()
    const toolbarRect = toolbarRef.current.getBoundingClientRect()

    const maxX = parentRect.width - toolbarRect.width - 8
    const maxY = parentRect.height - toolbarRect.height - 8

    setPosition({
      x: Math.max(8, Math.min(newX, maxX)),
      y: Math.max(8, Math.min(newY, maxY)),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  return (
    <div
      ref={toolbarRef}
      className="absolute z-10 flex gap-0.5 rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm p-1.5 shadow-md select-none"
      style={{ bottom: position.y, right: position.x }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="flex items-center justify-center w-6 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="w-px bg-border" />
      {onAddNode && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Node hinzufügen">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddNode('entity')}>
                <Database className="mr-2 h-4 w-4" />
                Entität (Daten/Service)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddNode('process')}>
                <Cog className="mr-2 h-4 w-4" />
                Prozess (Logik)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="w-px bg-border" />
        </>
      )}
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
      {onDelete && (
        <>
          <div className="w-px bg-border" />
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={!hasSelection}
            title={hasSelection ? "Löschen (Delete/Backspace)" : "Node auswählen zum Löschen"}
            className={hasSelection ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
