import { LogOut, Plus, FolderOpen, Settings, FileText, Users, AlertTriangle, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { SyncStatusIndicator } from '@/components/features/sync/SyncStatusIndicator'
import type { SyncStatus } from '@/types/sync.types'
import type { Project } from '@/types/database.types'

interface HeaderProps {
  onMenuToggle: () => void
  onNewProject: () => void
  onOpenProjects: () => void
  onSettings: () => void
  onGuestManagement?: () => void
  onExportPRD?: () => void
  onLogout: () => void
  userName?: string
  isOwner?: boolean
  isGlobalGuest?: boolean
  guestProjects?: Project[]
  onSwitchProject?: (projectId: string) => void
  sidebarOpen?: boolean
  syncStatus?: SyncStatus
}

export function Header({ onMenuToggle, onNewProject, onOpenProjects, onSettings, onGuestManagement, onExportPRD, onLogout, userName, isOwner = true, isGlobalGuest = false, guestProjects = [], onSwitchProject, sidebarOpen = false, syncStatus }: HeaderProps) {
  const { currentProject, nodes } = useProjectStore()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-6 sticky top-0 z-50">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Softwareplanung" className="h-9 w-9 rounded-xl shadow-sm" />
          <div className="hidden sm:block">
            <span className="font-display font-medium text-base tracking-tight">Softwareplanung</span>
          </div>
        </div>
        {currentProject && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground/50">/</span>
            <span className="text-foreground/80 font-medium truncate max-w-[200px]">
              {currentProject.name}
            </span>
            {syncStatus && <SyncStatusIndicator status={syncStatus} />}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {!isGlobalGuest && (
          <Button
            variant="default"
            size="sm"
            onClick={onNewProject}
            className="rounded-lg px-4 shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Neues Projekt</span>
          </Button>
        )}
        {!isGlobalGuest && nodes.length > 0 && onExportPRD && (
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
        {isGlobalGuest && guestProjects.length > 1 && onSwitchProject ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-lg">
                <FolderOpen className="mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Projekte</span>
                <ChevronDown className="ml-1 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {guestProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => onSwitchProject(project.id)}
                  className={currentProject?.id === project.id ? 'bg-accent' : ''}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : !isGlobalGuest ? (
          <Button variant="ghost" size="sm" onClick={onOpenProjects} className="rounded-lg">
            <FolderOpen className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Projekte</span>
          </Button>
        ) : null}
        <Button
          variant={sidebarOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={onMenuToggle}
          className="rounded-lg"
          title="Logic Gaps"
        >
          <AlertTriangle className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Gaps</span>
        </Button>
        {isOwner && currentProject && onGuestManagement && (
          <Button variant="ghost" size="icon" onClick={onGuestManagement} title="Gäste verwalten" className="rounded-lg">
            <Users className="h-4 w-4" />
          </Button>
        )}
        {isOwner && (
          <Button variant="ghost" size="icon" onClick={onSettings} title="Einstellungen" className="rounded-lg">
            <Settings className="h-4 w-4" />
          </Button>
        )}
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
