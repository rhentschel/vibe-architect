import { LogOut, Menu, Plus, FolderOpen, Settings, FileText, Sparkles } from 'lucide-react'
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
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 sticky top-0 z-50">
      <div className="flex items-center gap-5">
        <Button variant="ghost" size="icon" onClick={onMenuToggle} className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="hidden sm:block">
            <span className="font-display font-medium text-base tracking-tight">VibeArchitect</span>
          </div>
        </div>
        {currentProject && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground/80 font-medium truncate max-w-[200px]">
              {currentProject.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="default"
          size="sm"
          onClick={onNewProject}
          className="rounded-lg px-4 shadow-sm"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Neues Projekt</span>
        </Button>
        {nodes.length > 0 && onExportPRD && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportPRD}
            className="rounded-lg px-4"
          >
            <FileText className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
        <div className="w-px h-6 bg-border/50 mx-1 hidden sm:block" />
        <Button variant="ghost" size="sm" onClick={onOpenProjects} className="rounded-lg">
          <FolderOpen className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Projekte</span>
        </Button>
        <Button variant="ghost" size="icon" onClick={onSettings} title="Einstellungen" className="rounded-lg">
          <Settings className="h-4 w-4" />
        </Button>
        <div className="w-px h-6 bg-border/50 mx-1 hidden md:block" />
        {userName && (
          <span className="text-xs text-muted-foreground hidden md:inline px-2 truncate max-w-[150px]">
            {userName}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-lg text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
