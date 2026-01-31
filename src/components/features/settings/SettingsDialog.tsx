import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSettingsStore, AI_MODELS, type AIModel } from '@/lib/store/useSettingsStore'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { aiModel, setAIModel } = useSettingsStore()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Einstellungen</DialogTitle>
          <DialogDescription>
            Konfiguriere die globalen App-Einstellungen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">KI-Modell</label>
            <p className="text-xs text-muted-foreground mb-3">
              Wähle das Claude-Modell für die Architektur-Analyse.
            </p>
            <div className="space-y-2">
              {AI_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    aiModel === model.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <input
                    type="radio"
                    name="aiModel"
                    value={model.id}
                    checked={aiModel === model.id}
                    onChange={(e) => setAIModel(e.target.value as AIModel)}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
