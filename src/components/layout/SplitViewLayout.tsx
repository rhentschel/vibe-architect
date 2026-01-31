import { useState, type ReactNode } from 'react'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

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
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
}: SplitViewLayoutProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)

  const handleMouseDown = () => {
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

  return (
    <div
      className="flex h-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="h-full overflow-hidden"
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      <div
        className={cn(
          'relative flex w-1 cursor-col-resize items-center justify-center bg-border hover:bg-primary/20 transition-colors',
          isDragging && 'bg-primary/30'
        )}
        onMouseDown={handleMouseDown}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      <div
        className="h-full overflow-hidden flex-1"
        style={{ width: `${100 - leftWidth}%` }}
      >
        {rightPanel}
      </div>
    </div>
  )
}
