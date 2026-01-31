import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { AlertTriangle, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface GapNodeData {
  label: string
  description?: string
  severity?: 'low' | 'medium' | 'high'
  resolved?: boolean
}

export const GapNode = memo(({ data, selected }: NodeProps<GapNodeData>) => {
  const getSeverityStyles = () => {
    if (data.resolved) {
      return {
        border: 'border-gray-300 border-dashed',
        bg: 'bg-gray-50',
        icon: 'text-gray-400',
      }
    }

    switch (data.severity) {
      case 'high':
        return {
          border: 'border-red-400',
          bg: 'bg-red-50',
          icon: 'text-red-500',
        }
      case 'medium':
        return {
          border: 'border-yellow-400',
          bg: 'bg-yellow-50',
          icon: 'text-yellow-500',
        }
      default:
        return {
          border: 'border-orange-300',
          bg: 'bg-orange-50',
          icon: 'text-orange-400',
        }
    }
  }

  const styles = getSeverityStyles()

  return (
    <div
      className={cn(
        'rounded-lg border-2 px-4 py-3 shadow-sm min-w-[140px]',
        'transition-all duration-200',
        styles.border,
        styles.bg,
        selected && 'shadow-md ring-2 ring-primary ring-offset-2',
        data.resolved && 'opacity-60'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-orange-400 !w-2 !h-2"
      />

      <div className="flex items-center gap-2">
        <div className={cn('flex-shrink-0', styles.icon)}>
          {data.severity === 'high' ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <HelpCircle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium text-sm truncate', data.resolved && 'line-through')}>
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate">{data.description}</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-orange-400 !w-2 !h-2"
      />
    </div>
  )
})

GapNode.displayName = 'GapNode'
