import { useState, useEffect } from 'react'
import { Maximize2, Minimize2, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ReactFlowNode } from '@/types/graph.types'

interface NodeEditDialogProps {
  node: ReactFlowNode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (nodeId: string, label: string, description: string) => void
}

export function NodeEditDialog({ node, open, onOpenChange, onSave }: NodeEditDialogProps) {
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || '')
      setDescription(node.data.description || '')
    }
  }, [node])

  const handleSave = () => {
    if (node) {
      onSave(node.id, label, description)
      onOpenChange(false)
    }
  }

  const getNodeTypeLabel = (type: string) => {
    switch (type) {
      case 'entity':
        return 'Entität'
      case 'process':
        return 'Prozess'
      case 'gap':
        return 'Lücke'
      default:
        return 'Node'
    }
  }

  if (!node) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={isExpanded ? 'max-w-2xl' : 'max-w-lg'}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getNodeTypeLabel(node.type || 'entity')} bearbeiten</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
              title={isExpanded ? 'Verkleinern' : 'Vergrößern'}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="node-label" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="node-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node-Name eingeben..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="node-description" className="text-sm font-medium">
              Beschreibung
            </label>
            <textarea
              id="node-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eingeben..."
              className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none ${
                isExpanded ? 'min-h-[200px]' : 'min-h-[100px]'
              }`}
            />
          </div>

          {node.type === 'gap' && node.data.severity && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Schweregrad:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  node.data.severity === 'high'
                    ? 'bg-red-100 text-red-700'
                    : node.data.severity === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {node.data.severity === 'high'
                  ? 'Hoch'
                  : node.data.severity === 'medium'
                  ? 'Mittel'
                  : 'Niedrig'}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
