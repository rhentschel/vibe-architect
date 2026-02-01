import { AlertTriangle, CheckCircle, Circle, MessageSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { cn } from '@/lib/utils/cn'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { gaps, resolveGap, setPendingChatMessage } = useProjectStore()

  const handleDiscussGap = (gapDescription: string) => {
    const message = `Lass uns über diese Lücke sprechen:\n\n"${gapDescription}"\n\nWie können wir das lösen?`
    setPendingChatMessage(message)
    onClose()
  }

  const unresolvedGaps = gaps.filter((g) => !g.resolved)
  const resolvedGaps = gaps.filter((g) => g.resolved)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-500'
      case 'medium':
        return 'text-yellow-500'
      default:
        return 'text-blue-500'
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] w-72 border-r bg-background transition-transform md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Logic Gaps
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {unresolvedGaps.length} offen, {resolvedGaps.length} erledigt
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {unresolvedGaps.length === 0 && resolvedGaps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Keine Gaps gefunden. Starte eine Konversation, um deine Architektur zu analysieren.
              </p>
            ) : (
              <div className="space-y-4">
                {unresolvedGaps.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Offen
                    </h3>
                    <div className="space-y-2">
                      {unresolvedGaps.map((gap) => (
                        <div
                          key={gap.id}
                          className="rounded-lg border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <Circle className={cn('h-4 w-4 mt-0.5 flex-shrink-0', getSeverityColor(gap.severity))} />
                            <p className="text-sm flex-1">{gap.description}</p>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <Badge variant={getSeverityBadge(gap.severity) as 'default' | 'secondary' | 'destructive' | 'outline'}>
                              {gap.severity}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDiscussGap(gap.description)}
                                title="Im Chat besprechen"
                                className="h-7 px-2"
                              >
                                <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                Besprechen
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => resolveGap(gap.id)}
                                className="h-7 px-2"
                              >
                                Erledigt
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resolvedGaps.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Erledigt
                    </h3>
                    <div className="space-y-2">
                      {resolvedGaps.map((gap) => (
                        <div
                          key={gap.id}
                          className="rounded-lg border border-dashed p-3 opacity-60"
                        >
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                            <p className="text-sm line-through">{gap.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}
