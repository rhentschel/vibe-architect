import { AlertTriangle, Download, Upload, GitMerge } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { ConflictData, ConflictResolution } from '@/types/sync.types'

interface ConflictDialogProps {
  conflictData: ConflictData | null
  onResolve: (resolution: ConflictResolution) => Promise<void>
}

export function ConflictDialog({ conflictData, onResolve }: ConflictDialogProps) {
  if (!conflictData) return null

  const localStats = {
    nodes: conflictData.localGraph.nodes.length,
    edges: conflictData.localGraph.edges.length,
    gaps: conflictData.localGraph.gaps.filter((g) => !g.resolved).length,
  }

  const remoteStats = {
    nodes: conflictData.remoteGraph.nodes.length,
    edges: conflictData.remoteGraph.edges.length,
    gaps: conflictData.remoteGraph.gaps.filter((g) => !g.resolved).length,
  }

  return (
    <Dialog open={!!conflictData} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Versionskonflikt
          </DialogTitle>
          <DialogDescription>
            Ein anderer Benutzer hat Änderungen vorgenommen. Wie möchtest du fortfahren?
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-sm font-medium mb-2">Deine Version (v{conflictData.localVersion})</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>{localStats.nodes} Nodes</li>
              <li>{localStats.edges} Verbindungen</li>
              <li>{localStats.gaps} offene Gaps</li>
            </ul>
          </div>
          <div className="rounded-lg border p-3 bg-muted/30">
            <p className="text-sm font-medium mb-2">Serverversion (v{conflictData.remoteVersion})</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>{remoteStats.nodes} Nodes</li>
              <li>{remoteStats.edges} Verbindungen</li>
              <li>{remoteStats.gaps} offene Gaps</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onResolve('keep_local')}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-2 h-4 w-4" />
            Meine behalten
          </Button>
          <Button
            variant="outline"
            onClick={() => onResolve('load_remote')}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2 h-4 w-4" />
            Server laden
          </Button>
          <Button
            onClick={() => onResolve('merge')}
            className="w-full sm:w-auto"
          >
            <GitMerge className="mr-2 h-4 w-4" />
            Zusammenführen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
