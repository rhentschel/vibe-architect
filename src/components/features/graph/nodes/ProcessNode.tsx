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
        return <Zap className="h-4 w-4" />
      case 'workflow':
        return <RefreshCw className="h-4 w-4" />
      case 'handler':
        return <ArrowRight className="h-4 w-4" />
      default:
        return <Cog className="h-4 w-4" />
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-background px-4 py-3 shadow-sm min-w-[140px]',
        'transition-all duration-200',
        selected ? 'border-primary shadow-md' : 'border-green-400'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-green-400 !w-2 !h-2"
      />

      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-600">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{data.label}</div>
          {data.description && (
            <div className="text-xs text-muted-foreground truncate">{data.description}</div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-400 !w-2 !h-2"
      />
    </div>
  )
})

ProcessNode.displayName = 'ProcessNode'
