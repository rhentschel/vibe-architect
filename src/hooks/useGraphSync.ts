import { useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { debounce } from '@/lib/utils/debounce'
import type { SyncStatus, ConflictData, ConflictResolution, RealtimeSnapshotPayload } from '@/types/sync.types'
import type { ReactFlowNode, ReactFlowEdge, LogicGap } from '@/types/graph.types'
import type { GraphData } from '@/types/database.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

const DEBOUNCE_DELAY = 1500

interface UseGraphSyncOptions {
  enabled?: boolean
}

interface UseGraphSyncReturn {
  syncStatus: SyncStatus
  conflictData: ConflictData | null
  resolveConflict: (resolution: ConflictResolution) => Promise<void>
}

export function useGraphSync({ enabled = true }: UseGraphSyncOptions = {}): UseGraphSyncReturn {
  const {
    currentProject,
    nodes,
    edges,
    gaps,
    localVersion,
    lastModifiedAt,
    syncStatus,
    conflictData,
    setLocalVersion,
    setSyncStatus,
    setConflictData,
    setGraphFromRemote,
  } = useProjectStore()

  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSavingRef = useRef(false)
  const lastSavedAtRef = useRef<number | null>(null)

  // Build current graph data for saving
  const buildGraphData = useCallback((): GraphData => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type as 'entity' | 'process' | 'gap',
        label: n.data.label,
        description: n.data.description,
        position: n.position,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        type: (e.type as 'default' | 'smoothstep' | 'step') || 'smoothstep',
      })),
      gaps: gaps.map((g) => ({
        id: g.id,
        description: g.description,
        severity: g.severity,
        relatedNodeIds: g.relatedNodeIds,
        resolved: g.resolved,
      })),
    }
  }, [nodes, edges, gaps])

  // Save snapshot to database
  const saveSnapshot = useCallback(async () => {
    if (!currentProject || isSavingRef.current) return

    isSavingRef.current = true
    setSyncStatus('saving')

    try {
      // Check current version before saving
      const { data: currentSnapshot } = await supabase
        .from('architecture_snapshots')
        .select('version, graph_data')
        .eq('project_id', currentProject.id)
        .order('version', { ascending: false })
        .limit(1)
        .single()

      const remoteVersion = currentSnapshot?.version ?? 0

      // Conflict detection
      if (remoteVersion > localVersion) {
        const remoteGraphData = currentSnapshot?.graph_data as GraphData

        // Parse remote graph data into ReactFlow format
        const remoteNodes: ReactFlowNode[] = remoteGraphData.nodes.map((n) => ({
          id: n.id,
          type: n.type,
          position: n.position || { x: 0, y: 0 },
          data: {
            label: n.label,
            description: n.description,
          },
        }))

        const remoteEdges: ReactFlowEdge[] = remoteGraphData.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: e.type || 'smoothstep',
        }))

        const remoteGaps: LogicGap[] = remoteGraphData.gaps.map((g) => ({
          id: g.id,
          description: g.description,
          severity: g.severity,
          relatedNodeIds: g.relatedNodeIds,
          resolved: g.resolved,
        }))

        setConflictData({
          localVersion,
          remoteVersion,
          localGraph: { nodes, edges, gaps },
          remoteGraph: { nodes: remoteNodes, edges: remoteEdges, gaps: remoteGaps },
        })
        setSyncStatus('conflict')
        isSavingRef.current = false
        return
      }

      // Save new snapshot
      const graphData = buildGraphData()
      const { data: newSnapshot, error } = await supabase
        .from('architecture_snapshots')
        .insert({
          project_id: currentProject.id,
          graph_data: graphData,
        } as never)
        .select('version')
        .single()

      if (error) {
        throw error
      }

      setLocalVersion(newSnapshot.version)
      lastSavedAtRef.current = Date.now()
      setSyncStatus('saved')

      // Reset to idle after 2 seconds
      setTimeout(() => {
        const currentStatus = useProjectStore.getState().syncStatus
        if (currentStatus === 'saved') {
          setSyncStatus('idle')
        }
      }, 2000)
    } catch (error) {
      setSyncStatus('error')
    } finally {
      isSavingRef.current = false
    }
  }, [currentProject, localVersion, nodes, edges, gaps, buildGraphData, setLocalVersion, setSyncStatus, setConflictData])

  // Debounced save function
  const debouncedSave = useMemo(
    () => debounce(saveSnapshot, DEBOUNCE_DELAY),
    [saveSnapshot]
  )

  // Watch for local changes and trigger auto-save
  useEffect(() => {
    if (!enabled || !currentProject || lastModifiedAt === null) return

    // Skip if this modification was already saved
    if (lastSavedAtRef.current !== null && lastModifiedAt <= lastSavedAtRef.current) return

    debouncedSave()

    return () => {
      debouncedSave.cancel()
    }
  }, [enabled, currentProject, lastModifiedAt, debouncedSave])

  // Realtime subscription
  useEffect(() => {
    if (!enabled || !currentProject) return

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase
      .channel(`snapshots:${currentProject.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'architecture_snapshots',
          filter: `project_id=eq.${currentProject.id}`,
        },
        (payload: RealtimeSnapshotPayload) => {
          const newVersion = payload.new.version
          const currentLocalVersion = useProjectStore.getState().localVersion
          const currentSyncStatus = useProjectStore.getState().syncStatus

          // Ignore our own saves
          if (newVersion <= currentLocalVersion) return

          // If we're in the middle of saving or have a conflict, don't auto-update
          if (currentSyncStatus === 'saving' || currentSyncStatus === 'conflict') return

          // Apply remote changes
          const graphData = payload.new.graph_data
          setGraphFromRemote(
            {
              nodes: graphData.nodes.map((n) => ({
                id: n.id,
                type: n.type as 'entity' | 'process' | 'gap',
                label: n.label,
                description: n.description,
                position: n.position,
              })),
              edges: graphData.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                type: (e.type as 'default' | 'smoothstep' | 'step') || 'smoothstep',
              })),
              gaps: graphData.gaps,
            },
            newVersion
          )
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, currentProject, setGraphFromRemote])

  // Merge function for conflict resolution
  const mergeGraphs = useCallback((local: ConflictData['localGraph'], remote: ConflictData['remoteGraph']) => {
    // Nodes: Union, prefer remote for duplicates
    const nodeMap = new Map<string, ReactFlowNode>()
    for (const node of local.nodes) {
      nodeMap.set(node.id, node)
    }
    for (const node of remote.nodes) {
      nodeMap.set(node.id, node)
    }
    const mergedNodes = Array.from(nodeMap.values())

    // Get valid node IDs for edge filtering
    const validNodeIds = new Set(mergedNodes.map((n) => n.id))

    // Edges: Union, only keep if both nodes exist
    const edgeMap = new Map<string, ReactFlowEdge>()
    for (const edge of local.edges) {
      if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target)) {
        edgeMap.set(edge.id, edge)
      }
    }
    for (const edge of remote.edges) {
      if (validNodeIds.has(edge.source) && validNodeIds.has(edge.target)) {
        edgeMap.set(edge.id, edge)
      }
    }
    const mergedEdges = Array.from(edgeMap.values())

    // Gaps: Union, prefer remote resolution status
    const gapMap = new Map<string, LogicGap>()
    for (const gap of local.gaps) {
      gapMap.set(gap.id, gap)
    }
    for (const gap of remote.gaps) {
      gapMap.set(gap.id, gap)
    }
    const mergedGaps = Array.from(gapMap.values())

    return { nodes: mergedNodes, edges: mergedEdges, gaps: mergedGaps }
  }, [])

  // Resolve conflict
  const resolveConflict = useCallback(async (resolution: ConflictResolution) => {
    if (!conflictData || !currentProject) return

    setSyncStatus('saving')

    try {
      let graphToSave: GraphData

      switch (resolution) {
        case 'keep_local':
          graphToSave = buildGraphData()
          break

        case 'load_remote':
          setGraphFromRemote(
            {
              nodes: conflictData.remoteGraph.nodes.map((n) => ({
                id: n.id,
                type: n.type as 'entity' | 'process' | 'gap',
                label: n.data.label,
                description: n.data.description,
                position: n.position,
              })),
              edges: conflictData.remoteGraph.edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                type: (e.type as 'default' | 'smoothstep' | 'step') || 'smoothstep',
              })),
              gaps: conflictData.remoteGraph.gaps,
            },
            conflictData.remoteVersion
          )
          setConflictData(null)
          setSyncStatus('saved')
          setTimeout(() => setSyncStatus('idle'), 2000)
          return

        case 'merge': {
          const merged = mergeGraphs(conflictData.localGraph, conflictData.remoteGraph)
          graphToSave = {
            nodes: merged.nodes.map((n) => ({
              id: n.id,
              type: n.type as 'entity' | 'process' | 'gap',
              label: n.data.label,
              description: n.data.description,
              position: n.position,
            })),
            edges: merged.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
              type: (e.type as 'default' | 'smoothstep' | 'step') || 'smoothstep',
            })),
            gaps: merged.gaps,
          }
          break
        }
      }

      // Save the resolved graph
      const { data: newSnapshot, error } = await supabase
        .from('architecture_snapshots')
        .insert({
          project_id: currentProject.id,
          graph_data: graphToSave,
        } as never)
        .select('version')
        .single()

      if (error) throw error

      // Update local state with merged/kept data
      if (resolution === 'merge') {
        const merged = mergeGraphs(conflictData.localGraph, conflictData.remoteGraph)
        setGraphFromRemote(
          {
            nodes: merged.nodes.map((n) => ({
              id: n.id,
              type: n.type as 'entity' | 'process' | 'gap',
              label: n.data.label,
              description: n.data.description,
              position: n.position,
            })),
            edges: merged.edges.map((e) => ({
              id: e.id,
              source: e.source,
              target: e.target,
              label: e.label,
              type: (e.type as 'default' | 'smoothstep' | 'step') || 'smoothstep',
            })),
            gaps: merged.gaps,
          },
          newSnapshot.version
        )
      } else {
        setLocalVersion(newSnapshot.version)
      }

      setConflictData(null)
      setSyncStatus('saved')
      setTimeout(() => setSyncStatus('idle'), 2000)
    } catch (error) {
      setSyncStatus('error')
    }
  }, [conflictData, currentProject, buildGraphData, mergeGraphs, setGraphFromRemote, setLocalVersion, setConflictData, setSyncStatus])

  return {
    syncStatus,
    conflictData,
    resolveConflict,
  }
}
