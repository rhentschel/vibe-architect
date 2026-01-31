import { useState } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { SplitViewLayout } from '@/components/layout/SplitViewLayout'
import { GraphCanvas } from '@/components/features/graph/GraphCanvas'
import { ChatInterface } from '@/components/features/chat/ChatInterface'
import { PrdExportDialog } from '@/components/features/export/PrdExportDialog'
import { SettingsDialog } from '@/components/features/settings/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/components/providers/AuthProvider'
import { useProjects, useCreateProject, useLoadProject, useDeleteProject } from '@/hooks/useProjectData'
import { useProjectStore } from '@/lib/store/useProjectStore'

export default function App() {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
  const [showProjectsDialog, setShowProjectsDialog] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')

  const { currentProject } = useProjectStore()
  const { data: projects = [], isLoading: projectsLoading } = useProjects(user?.id)
  const createProject = useCreateProject()
  const loadProject = useLoadProject()
  const deleteProject = useDeleteProject()

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return

    await createProject.mutateAsync({
      name: newProjectName.trim(),
      description: newProjectDescription.trim() || undefined,
      userId: user.id,
    })

    setNewProjectName('')
    setNewProjectDescription('')
    setShowNewProjectDialog(false)
  }

  const handleLoadProject = async (projectId: string) => {
    await loadProject.mutateAsync(projectId)
    setShowProjectsDialog(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Möchtest du dieses Projekt wirklich löschen?')) {
      await deleteProject.mutateAsync(projectId)
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <Header
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewProject={() => setShowNewProjectDialog(true)}
        onOpenProjects={() => setShowProjectsDialog(true)}
        onSettings={() => setShowSettingsDialog(true)}
        onExportPRD={() => setShowExportDialog(true)}
        onLogout={signOut}
        userName={user?.email}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-hidden">
          {currentProject ? (
            <ReactFlowProvider>
              <SplitViewLayout
                leftPanel={<GraphCanvas />}
                rightPanel={
                  <ChatInterface />
                }
              />
            </ReactFlowProvider>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">Willkommen bei VibeArchitect</h2>
                <p className="mt-2 text-muted-foreground">
                  Erstelle ein neues Projekt oder wähle ein existierendes aus.
                </p>
                <div className="mt-6 flex justify-center gap-4">
                  <Button onClick={() => setShowNewProjectDialog(true)}>
                    Neues Projekt
                  </Button>
                  <Button variant="outline" onClick={() => setShowProjectsDialog(true)}>
                    Projekte öffnen
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Projekt erstellen</DialogTitle>
            <DialogDescription>
              Gib deinem Projekt einen Namen und optional eine Beschreibung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Projektname
              </label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Mein Architektur-Projekt"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Beschreibung (optional)
              </label>
              <Input
                id="description"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                placeholder="Eine kurze Beschreibung..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProjectDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || createProject.isPending}
            >
              {createProject.isPending ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Meine Projekte</DialogTitle>
            <DialogDescription>
              Wähle ein Projekt aus oder erstelle ein neues.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {projectsLoading ? (
              <div className="py-8 text-center text-muted-foreground">Lade...</div>
            ) : projects.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Noch keine Projekte vorhanden.
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer"
                    onClick={() => handleLoadProject(project.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(project.updated_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowProjectsDialog(false)
                setShowNewProjectDialog(true)
              }}
            >
              Neues Projekt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PrdExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
    </div>
  )
}
