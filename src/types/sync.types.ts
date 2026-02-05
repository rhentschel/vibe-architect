import type { ReactFlowNode, ReactFlowEdge, LogicGap } from './graph.types'

/**
 * Represents the current synchronization status
 */
export type SyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict'

/**
 * Data structure for version conflict information
 */
export interface ConflictData {
  localVersion: number
  remoteVersion: number
  localGraph: {
    nodes: ReactFlowNode[]
    edges: ReactFlowEdge[]
    gaps: LogicGap[]
  }
  remoteGraph: {
    nodes: ReactFlowNode[]
    edges: ReactFlowEdge[]
    gaps: LogicGap[]
  }
}

/**
 * Options for resolving a version conflict
 */
export type ConflictResolution = 'keep_local' | 'load_remote' | 'merge'

/**
 * Payload for Supabase realtime updates
 */
export interface RealtimeSnapshotPayload {
  new: {
    id: string
    project_id: string
    version: number
    graph_data: {
      nodes: Array<{
        id: string
        type: string
        label: string
        description?: string
        position?: { x: number; y: number }
        data?: Record<string, unknown>
      }>
      edges: Array<{
        id: string
        source: string
        target: string
        label?: string
        type?: string
      }>
      gaps: LogicGap[]
    }
    created_at: string
  }
  old: {
    id: string
  } | null
}
