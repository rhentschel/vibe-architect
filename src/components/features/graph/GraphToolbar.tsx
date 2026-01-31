import { useState, useRef, useCallback, useEffect } from 'react'
import { ZoomIn, ZoomOut, Maximize2, LayoutGrid, Download, Database, Cog, Plus, Trash2 } from 'lucide-react'
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
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; posX: number; posY: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag if clicking on a button or interactive element
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('[role="menuitem"]')) {
      return
    }

    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      posX: position.x,
      posY: position.y,
    }
  }, [position])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !toolbarRef.current) return

      const parent = toolbarRef.current.parentElement
      if (!parent) return

      const deltaX = e.clientX - dragStartRef.current.mouseX
      const deltaY = e.clientY - dragStartRef.current.mouseY

      // Invert because we're using right/bottom positioning
      const newX = dragStartRef.current.posX - deltaX
      const newY = dragStartRef.current.posY - deltaY

      const parentRect = parent.getBoundingClientRect()
      const toolbarRect = toolbarRef.current.getBoundingClientRect()

      const maxX = parentRect.width - toolbarRect.width - 8
      const maxY = parentRect.height - toolbarRect.height - 8

      setPosition({
        x: Math.max(8, Math.min(newX, maxX)),
        y: Math.max(8, Math.min(newY, maxY)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      dragStartRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={toolbarRef}
      className="absolute z-10 flex gap-0.5 rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm p-1.5 shadow-md select-none cursor-move"
      style={{ bottom: position.y, right: position.x }}
      onMouseDown={handleMouseDown}
    >
      {onAddNode && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Node hinzufügen" className="cursor-pointer">
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
      <Button variant="ghost" size="icon" onClick={onZoomIn} title="Zoom in" className="cursor-pointer">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onZoomOut} title="Zoom out" className="cursor-pointer">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onFitView} title="Fit view" className="cursor-pointer">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <div className="w-px bg-border" />
      <Button variant="ghost" size="icon" onClick={onAutoLayout} title="Auto layout" className="cursor-pointer">
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onExportPng} title="Export PNG" className="cursor-pointer">
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
            className={hasSelection ? "cursor-pointer text-destructive hover:text-destructive hover:bg-destructive/10" : "cursor-pointer text-muted-foreground"}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  )
}
