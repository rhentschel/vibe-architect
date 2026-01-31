import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react'
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
        border: 'border-muted border-dashed',
        bg: 'bg-muted/30',
        iconBg: 'bg-muted',
        icon: 'text-muted-foreground',
      }
    }

    switch (data.severity) {
      case 'high':
        return {
          border: 'border-destructive/40',
          bg: 'bg-destructive/5',
          iconBg: 'bg-destructive/10',
          icon: 'text-destructive',
        }
      case 'medium':
        return {
          border: 'border-amber-400/50',
          bg: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          icon: 'text-amber-600',
        }
      default:
        return {
          border: 'border-orange-300/50',
          bg: 'bg-orange-50',
          iconBg: 'bg-orange-100',
          icon: 'text-orange-500',
        }
    }
  }

  const styles = getSeverityStyles()

  return (
    <div
      className={cn(
        'group rounded-xl border px-4 py-3 min-w-[160px] max-w-[220px]',
        'shadow-sm hover:shadow-md transition-all duration-200',
        styles.border,
        styles.bg,
        selected && 'shadow-md ring-2 ring-primary/20',
        data.resolved && 'opacity-70'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-400 !border-2 !border-card !w-3 !h-3 !-top-1.5"
      />

      <div className="flex items-start gap-3">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', styles.iconBg)}>
          {data.resolved ? (
            <CheckCircle2 className={cn('h-4 w-4', styles.icon)} />
          ) : data.severity === 'high' ? (
            <AlertTriangle className={cn('h-4 w-4', styles.icon)} />
          ) : (
            <HelpCircle className={cn('h-4 w-4', styles.icon)} />
          )}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className={cn('font-display font-medium text-sm leading-tight truncate', data.resolved && 'line-through opacity-60')}>
            {data.label}
          </div>
          {data.description && (
            <div className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">{data.description}</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-amber-400 !border-2 !border-card !w-3 !h-3 !-bottom-1.5"
      />
    </div>
  )
})

GapNode.displayName = 'GapNode'
