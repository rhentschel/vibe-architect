import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Cog, Zap, RefreshCw, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ProcessNodeData {
  label: string
  description?: string
  subtype?: 'service' | 'function' | 'workflow' | 'handler'
}

export const ProcessNode = memo(({ data, selected }: NodeProps<ProcessNodeData>) => {
  const getIcon = () => {
    switch (data.subtype) {
      case 'function':
        return <Zap className="h-3.5 w-3.5" />
      case 'workflow':
        return <RefreshCw className="h-3.5 w-3.5" />
      case 'handler':
        return <ArrowRight className="h-3.5 w-3.5" />
      default:
        return <Cog className="h-3.5 w-3.5" />
    }
  }

  return (
    <div
      className={cn(
        'group rounded-xl border bg-card px-4 py-3 min-w-[160px] max-w-[220px]',
        'shadow-sm hover:shadow-md transition-all duration-200',
        selected
          ? 'border-primary/50 shadow-md ring-2 ring-primary/20'
          : 'border-border/60 hover:border-primary/30'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-primary !border-2 !border-card !w-3 !h-3 !-top-1.5"
      />

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="font-display font-medium text-sm leading-tight truncate">{data.label}</div>
          {data.description && (
            <div className="text-xs text-muted-foreground leading-snug mt-1 line-clamp-2">{data.description}</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-primary !border-2 !border-card !w-3 !h-3 !-bottom-1.5"
      />
    </div>
  )
})

ProcessNode.displayName = 'ProcessNode'
