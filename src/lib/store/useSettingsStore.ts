import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AIModel = 'claude-sonnet-4-20250514' | 'claude-sonnet-4-5-20250929' | 'claude-opus-4-5-20251101'

export const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Schnell & effizient',
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Ausgewogen - empfohlen',
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    description: 'Maximale Qualität',
  },
]

interface SettingsState {
  aiModel: AIModel
  setAIModel: (model: AIModel) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      aiModel: 'claude-sonnet-4-5-20250929',
      setAIModel: (aiModel) => set({ aiModel }),
    }),
    {
      name: 'vibe-architect-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
