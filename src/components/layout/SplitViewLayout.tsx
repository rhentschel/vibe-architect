import { useState, type ReactNode } from 'react'
import { GripVertical, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

interface SplitViewLayoutProps {
  leftPanel: ReactNode
  rightPanel: ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
}

export function SplitViewLayout({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 65,
  minLeftWidth = 40,
  maxLeftWidth = 85,
}: SplitViewLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)

  const handleMouseDown = () => {
    if (leftCollapsed || rightCollapsed) return
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return

    const container = e.currentTarget
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100

    const clampedPercentage = Math.min(Math.max(percentage, minLeftWidth), maxLeftWidth)
    setLeftWidth(clampedPercentage)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const toggleRight = () => {
    setRightCollapsed(!rightCollapsed)
    setLeftCollapsed(false)
  }

  const toggleLeft = () => {
    setLeftCollapsed(!leftCollapsed)
    setRightCollapsed(false)
  }

  return (
    <div
      className="flex h-full relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Panel (Graph) */}
      <div
        className={cn(
          "h-full overflow-hidden transition-all duration-300 relative",
          leftCollapsed ? "w-0" : rightCollapsed ? "w-full" : ""
        )}
        style={!leftCollapsed && !rightCollapsed ? { width: `${leftWidth}%` } : undefined}
      >
        {leftPanel}

        {/* Toggle button for right panel - positioned in graph area */}
        {!leftCollapsed && (
          <Button
            variant="outline"
            size="icon"
            className="absolute top-4 right-4 z-20 h-8 w-8 bg-card/90 backdrop-blur-sm shadow-sm"
            onClick={toggleRight}
            title={rightCollapsed ? "Chat öffnen" : "Chat schließen"}
          >
            {rightCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Resize Handle */}
      {!leftCollapsed && !rightCollapsed && (
        <div
          className={cn(
            'relative flex w-1 cursor-col-resize items-center justify-center bg-border hover:bg-primary/20 transition-colors',
            isDragging && 'bg-primary/30'
          )}
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Right Panel (Chat) */}
      <div
        className={cn(
          "h-full overflow-hidden transition-all duration-300 relative",
          rightCollapsed ? "w-0" : leftCollapsed ? "w-full" : "flex-1"
        )}
        style={!leftCollapsed && !rightCollapsed ? { width: `${100 - leftWidth}%` } : undefined}
      >
        {/* Toggle button for left panel - positioned below chat header */}
        {!rightCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-16 left-2 z-20 h-7 w-7 opacity-60 hover:opacity-100"
            onClick={toggleLeft}
            title={leftCollapsed ? "Graph öffnen" : "Graph schließen"}
          >
            {leftCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}

        {rightPanel}
      </div>
    </div>
  )
}
