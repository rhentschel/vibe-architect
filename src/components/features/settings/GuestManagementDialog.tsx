import { useState } from 'react'
import { Trash2, Users, Loader2, Copy, Check, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useProjectMembers, useRemoveGuest } from '@/hooks/useProjectMembers'

interface GuestManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  projectName: string
}

export function GuestManagementDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
}: GuestManagementDialogProps) {
  const [copied, setCopied] = useState(false)

  const { data: members = [], isLoading } = useProjectMembers(projectId)
  const removeGuest = useRemoveGuest()

  // Generate a shareable link (in production, this would be a proper invite link)
  const shareLink = `${window.location.origin}?project=${projectId}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (confirm('Möchtest du diesen Gast wirklich entfernen?')) {
      await removeGuest.mutateAsync({ memberId, projectId })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gäste verwalten
          </DialogTitle>
          <DialogDescription>
            Teile den Link, um Gäste zu "{projectName}" einzuladen.
            Gäste können alles sehen und bearbeiten, aber keine Einstellungen ändern.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link className="h-4 w-4" />
              Einladungslink
            </label>
            <div className="flex gap-2">
              <Input
                value={shareLink}
                readOnly
                className="text-xs"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Teile diesen Link mit Personen, die Zugriff auf das Projekt haben sollen.
              Sie müssen sich zuerst registrieren.
            </p>
          </div>

          {/* Members List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Aktuelle Gäste ({members.filter(m => m.role === 'guest').length})
            </label>
            <ScrollArea className="max-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : members.filter(m => m.role === 'guest').length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Noch keine Gäste eingeladen.
                </p>
              ) : (
                <div className="space-y-2">
                  {members
                    .filter(m => m.role === 'guest')
                    .map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border p-2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            {member.email?.charAt(0).toUpperCase() || 'G'}
                          </div>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[180px]">
                              {member.email || `Gast ${member.user_id.slice(0, 8)}`}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Gast
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(member.id)}
                          disabled={removeGuest.isPending}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
