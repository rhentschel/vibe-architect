import { Cloud, Loader2, Check, CloudOff, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SyncStatus } from '@/types/sync.types'

interface SyncStatusIndicatorProps {
  status: SyncStatus
  className?: string
}

const statusConfig: Record<SyncStatus, {
  icon: typeof Cloud
  label: string
  className: string
}> = {
  idle: {
    icon: Cloud,
    label: 'Synchronisiert',
    className: 'text-muted-foreground',
  },
  saving: {
    icon: Loader2,
    label: 'Speichern...',
    className: 'text-blue-500',
  },
  saved: {
    icon: Check,
    label: 'Gespeichert',
    className: 'text-green-500',
  },
  error: {
    icon: CloudOff,
    label: 'Fehler',
    className: 'text-destructive',
  },
  conflict: {
    icon: AlertCircle,
    label: 'Konflikt',
    className: 'text-amber-500',
  },
}

export function SyncStatusIndicator({ status, className }: SyncStatusIndicatorProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        config.className,
        className
      )}
      title={config.label}
    >
      <Icon
        className={cn(
          'h-3.5 w-3.5',
          status === 'saving' && 'animate-spin'
        )}
      />
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  )
}
