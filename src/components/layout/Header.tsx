import { LogOut, Menu, Plus, FolderOpen, Settings, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@/lib/store/useProjectStore'

interface HeaderProps {
  onMenuToggle: () => void
  onNewProject: () => void
  onOpenProjects: () => void
  onSettings: () => void
  onExportPRD?: () => void
  onLogout: () => void
  userName?: string
}

export function Header({ onMenuToggle, onNewProject, onOpenProjects, onSettings, onExportPRD, onLogout, userName }: HeaderProps) {
  const { currentProject, nodes } = useProjectStore()

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            VA
          </div>
          <span className="font-semibold hidden sm:inline">VibeArchitect</span>
        </div>
        {currentProject && (
          <span className="text-sm text-muted-foreground">
            / {currentProject.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onNewProject}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Neues Projekt</span>
        </Button>
        {nodes.length > 0 && onExportPRD && (
          <Button variant="outline" size="sm" onClick={onExportPRD}>
            <FileText className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">PRD Export</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onOpenProjects}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Projekte</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings} title="Einstellungen">
          <Settings className="h-4 w-4" />
        </Button>
        {userName && (
          <span className="text-sm text-muted-foreground hidden md:inline">{userName}</span>
        )}
        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
