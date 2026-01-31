import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Database, Cloud, Users, Server } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface EntityNodeData {
  label: string
  description?: string
  subtype?: 'database' | 'api' | 'user' | 'service'
}

export const EntityNode = memo(({ data, selected }: NodeProps<EntityNodeData>) => {
  const getIcon = () => {
    switch (data.subtype) {
      case 'database':
        return <Database className="h-4 w-4" />
      case 'api':
        return <Cloud className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 bg-background px-4 py-3 shadow-sm min-w-[140px]',
        'transition-all duration-200',
        selected ? 'border-primary shadow-md' : 'border-blue-400'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-400 !w-2 !h-2"
      />

      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-blue-600">
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
        className="!bg-blue-400 !w-2 !h-2"
      />
    </div>
  )
})

EntityNode.displayName = 'EntityNode'
