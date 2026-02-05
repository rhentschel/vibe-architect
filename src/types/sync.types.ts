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
