import { useState } from 'react'
import { Trash2, Users, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react'
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
import { useProjectMembers, useRemoveGuest, useCreateGuestUser } from '@/hooks/useProjectMembers'

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { data: members = [], isLoading } = useProjectMembers(projectId)
  const removeGuest = useRemoveGuest()
  const createGuestUser = useCreateGuestUser()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    if (!email.trim() || !password.trim()) {
      setError('E-Mail und Passwort sind erforderlich')
      return
    }

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben')
      return
    }

    try {
      const result = await createGuestUser.mutateAsync({
        email: email.trim(),
        password,
        projectId,
        invitedBy: projectId, // The owner's session handles auth
      })

      setSuccessMessage(result.message)
      setEmail('')
      setPassword('')

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Benutzers')
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
            Erstelle Benutzerkonten und füge sie als Gäste zu "{projectName}" hinzu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Create User Form */}
          <form onSubmit={handleCreateUser} className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Neuen Gast einladen
            </label>
            <div className="space-y-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-Mail-Adresse"
                disabled={createGuestUser.isPending}
              />
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort (min. 6 Zeichen)"
                  disabled={createGuestUser.isPending}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createGuestUser.isPending || !email.trim() || !password.trim()}
              >
                {createGuestUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Benutzer erstellen & einladen
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {successMessage && (
              <p className="text-sm text-green-600">{successMessage}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Der Benutzer kann sich direkt mit diesen Zugangsdaten anmelden.
            </p>
          </form>

          {/* Members List */}
          <div className="space-y-2 pt-2 border-t">
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
