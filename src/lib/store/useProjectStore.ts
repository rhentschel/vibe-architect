import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Project, Message, GraphData } from '@/types/database.types'
import type { AIArchitectResponse, ReactFlowNode, ReactFlowEdge, LogicGap } from '@/types/graph.types'
import type { SyncStatus, ConflictData } from '@/types/sync.types'

interface ProjectState {
  currentProject: Project | null
  messages: Message[]
  nodes: ReactFlowNode[]
  edges: ReactFlowEdge[]
  gaps: LogicGap[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  pendingChatMessage: string | null
  // Sync state
  localVersion: number
  lastModifiedAt: number | null
  syncStatus: SyncStatus
  conflictData: ConflictData | null
}

interface ProjectActions {
  setCurrentProject: (project: Project | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setGraph: (data: GraphData) => void
  applyAIResponse: (response: AIArchitectResponse) => void
  addNode: (type: 'entity' | 'process', label?: string, description?: string) => void
  updateNode: (nodeId: string, label: string, description?: string) => void
  deleteNode: (nodeId: string) => void
  addEdge: (source: string, target: string, label?: string) => void
  deleteEdge: (edgeId: string) => void
  resolveGap: (gapId: string) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  setIsLoading: (loading: boolean) => void
  setIsSending: (sending: boolean) => void
  setError: (error: string | null) => void
  setPendingChatMessage: (message: string | null) => void
  reset: () => void
  // Sync actions
  setLocalVersion: (version: number) => void
  setSyncStatus: (status: SyncStatus) => void
  setConflictData: (data: ConflictData | null) => void
  setGraphFromRemote: (data: GraphData, version: number) => void
}

const initialState: ProjectState = {
  currentProject: null,
  messages: [],
  nodes: [],
  edges: [],
  gaps: [],
  isLoading: false,
  isSending: false,
  error: null,
  pendingChatMessage: null,
  // Sync state
  localVersion: 0,
  lastModifiedAt: null,
  syncStatus: 'idle',
  conflictData: null,
}

export const useProjectStore = create<ProjectState & ProjectActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentProject: (project) => set({ currentProject: project }),

      setMessages: (messages) => set({ messages }),

      addMessage: (message) => set((state) => ({
        messages: [...state.messages, message],
      })),

      setGraph: (data) => {
        const nodes: ReactFlowNode[] = data.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: {
            label: node.label,
            description: node.description,
            ...node.data,
          },
        }))

        const edges: ReactFlowEdge[] = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: edge.type || 'smoothstep',
        }))

        const gaps: LogicGap[] = data.gaps.map((gap) => ({
          id: gap.id,
          description: gap.description,
          severity: gap.severity,
          relatedNodeIds: gap.relatedNodeIds,
          resolved: gap.resolved,
        }))

        set({ nodes, edges, gaps })
      },

      applyAIResponse: (response) => {
        const state = get()

        let newNodes = [...state.nodes]
        let newEdges = [...state.edges]
        let newGaps = [...state.gaps]

        if (response.removedNodeIds?.length) {
          newNodes = newNodes.filter((n) => !response.removedNodeIds!.includes(n.id))
        }

        if (response.removedEdgeIds?.length) {
          newEdges = newEdges.filter((e) => !response.removedEdgeIds!.includes(e.id))
        }

        // Mark resolved gaps
        if (response.resolvedGapIds?.length) {
          newGaps = newGaps.map((gap) =>
            response.resolvedGapIds!.includes(gap.id)
              ? { ...gap, resolved: true }
              : gap
          )
        }

        if (response.nodes?.length) {
          for (const node of response.nodes) {
            const existingIndex = newNodes.findIndex((n) => n.id === node.id)
            const newNode: ReactFlowNode = {
              id: node.id,
              type: node.type,
              position: node.position || { x: Math.random() * 400, y: Math.random() * 400 },
              data: {
                label: node.label,
                description: node.description,
                ...node.data,
              },
            }

            if (existingIndex >= 0) {
              newNodes = [
                ...newNodes.slice(0, existingIndex),
                { ...newNodes[existingIndex], ...newNode, position: newNodes[existingIndex].position },
                ...newNodes.slice(existingIndex + 1),
              ]
            } else {
              newNodes = [...newNodes, newNode]
            }
          }
        }

        if (response.edges?.length) {
          for (const edge of response.edges) {
            const existingIndex = newEdges.findIndex((e) => e.id === edge.id)
            const newEdge: ReactFlowEdge = {
              id: edge.id,
              source: edge.source,
              target: edge.target,
              label: edge.label,
              type: edge.type || 'smoothstep',
            }

            if (existingIndex >= 0) {
              newEdges = [
                ...newEdges.slice(0, existingIndex),
                newEdge,
                ...newEdges.slice(existingIndex + 1),
              ]
            } else {
              newEdges = [...newEdges, newEdge]
            }
          }
        }

        if (response.gaps?.length) {
          for (const gap of response.gaps) {
            const existingIndex = newGaps.findIndex((g) => g.id === gap.id)
            if (existingIndex >= 0) {
              newGaps = [
                ...newGaps.slice(0, existingIndex),
                gap,
                ...newGaps.slice(existingIndex + 1),
              ]
            } else {
              newGaps = [...newGaps, gap]
            }
          }
        }

        set({ nodes: newNodes, edges: newEdges, gaps: newGaps, lastModifiedAt: Date.now() })
      },

      addNode: (type, label = 'Neuer Node', description = '') => set((state) => {
        const newNode: ReactFlowNode = {
          id: crypto.randomUUID(),
          type,
          position: { x: Math.random() * 300 + 100, y: Math.random() * 300 + 100 },
          data: { label, description },
        }
        return { nodes: [...state.nodes, newNode], lastModifiedAt: Date.now() }
      }),

      updateNode: (nodeId, label, description) => set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label, description: description ?? node.data.description } }
            : node
        ),
        lastModifiedAt: Date.now(),
      })),

      deleteNode: (nodeId) => set((state) => ({
        nodes: state.nodes.filter((node) => node.id !== nodeId),
        edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
        lastModifiedAt: Date.now(),
      })),

      addEdge: (source, target, label = '') => set((state) => {
        const newEdge: ReactFlowEdge = {
          id: `${source}-${target}-${crypto.randomUUID().slice(0, 8)}`,
          source,
          target,
          label,
          type: 'smoothstep',
        }
        return { edges: [...state.edges, newEdge], lastModifiedAt: Date.now() }
      }),

      deleteEdge: (edgeId) => set((state) => ({
        edges: state.edges.filter((edge) => edge.id !== edgeId),
        lastModifiedAt: Date.now(),
      })),

      resolveGap: (gapId) => set((state) => ({
        gaps: state.gaps.map((gap) =>
          gap.id === gapId ? { ...gap, resolved: true } : gap
        ),
        lastModifiedAt: Date.now(),
      })),

      updateNodePosition: (nodeId, position) => set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === nodeId ? { ...node, position } : node
        ),
        lastModifiedAt: Date.now(),
      })),

      setIsLoading: (isLoading) => set({ isLoading }),

      setIsSending: (isSending) => set({ isSending }),

      setError: (error) => set({ error }),

      setPendingChatMessage: (pendingChatMessage) => set({ pendingChatMessage }),

      // Sync actions
      setLocalVersion: (localVersion) => set({ localVersion }),

      setSyncStatus: (syncStatus) => set({ syncStatus }),

      setConflictData: (conflictData) => set({ conflictData }),

      setGraphFromRemote: (data, version) => {
        const nodes: ReactFlowNode[] = data.nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position || { x: 0, y: 0 },
          data: {
            label: node.label,
            description: node.description,
            ...node.data,
          },
        }))

        const edges: ReactFlowEdge[] = data.edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          type: edge.type || 'smoothstep',
        }))

        const gaps: LogicGap[] = data.gaps.map((gap) => ({
          id: gap.id,
          description: gap.description,
          severity: gap.severity,
          relatedNodeIds: gap.relatedNodeIds,
          resolved: gap.resolved,
        }))

        // Set graph without updating lastModifiedAt (remote update)
        set({ nodes, edges, gaps, localVersion: version })
      },

      reset: () => set(initialState),
    }),
    {
      name: 'vibe-architect-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        currentProject: state.currentProject,
        messages: state.messages,
        nodes: state.nodes,
        edges: state.edges,
        gaps: state.gaps,
      }),
    }
  )
)
