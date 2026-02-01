import { useCallback, useRef, useState, useEffect } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type OnSelectionChangeParams,
  type Connection,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toPng } from 'html-to-image'
import { nodeTypes } from './nodes'
import { GraphToolbar } from './GraphToolbar'
import { NodeEditDialog } from './NodeEditDialog'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { useArchitectureReview } from '@/hooks/useArchitectureReview'
import { getLayoutedElements } from '@/lib/utils/graphLayout'
import type { ReactFlowNode } from '@/types/graph.types'

export function GraphCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { nodes, edges, updateNodePosition, addNode, addEdge, deleteNode, deleteEdge, updateNode } = useProjectStore()
  const { runReview, isReviewing } = useArchitectureReview()
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<ReactFlowNode | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          updateNodePosition(change.id, change.position)
        }
      }
    },
    [updateNodePosition]
  )

  const onEdgesChange: OnEdgesChange = useCallback(() => {
    // Edges are managed by the store
  }, [])

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addEdge(connection.source, connection.target, '')
      }
    },
    [addEdge]
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
    setSelectedNodeId(selectedNodes.length > 0 ? selectedNodes[0].id : null)
    setSelectedEdgeId(selectedEdges.length > 0 ? selectedEdges[0].id : null)
  }, [])

  const handleDelete = useCallback(() => {
    if (selectedNodeId) {
      deleteNode(selectedNodeId)
      setSelectedNodeId(null)
    } else if (selectedEdgeId) {
      deleteEdge(selectedEdgeId)
      setSelectedEdgeId(null)
    }
  }, [selectedNodeId, selectedEdgeId, deleteNode, deleteEdge])

  // Keyboard delete handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedNodeId || selectedEdgeId)) {
        // Don't delete if user is typing in an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return
        }
        e.preventDefault()
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeId, selectedEdgeId, handleDelete])

  const handleAddNode = useCallback(
    (type: 'entity' | 'process') => {
      addNode(type)
    },
    [addNode]
  )

  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const fullNode = nodes.find((n) => n.id === node.id)
      if (fullNode) {
        setEditingNode(fullNode)
        setIsEditDialogOpen(true)
      }
    },
    [nodes]
  )

  const handleNodeSave = useCallback(
    (nodeId: string, label: string, description: string) => {
      updateNode(nodeId, label, description)
    },
    [updateNode]
  )

  const handleReview = useCallback(async () => {
    await runReview()
  }, [runReview])

  const handleAutoLayout = useCallback(() => {
    const { nodes: layoutedNodes } = getLayoutedElements(
      nodes,
      edges,
      'TB'
    )

    for (const node of layoutedNodes) {
      updateNodePosition(node.id, node.position)
    }

    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [nodes, edges, updateNodePosition, fitView])

  const handleExportPng = useCallback(async () => {
    if (!reactFlowWrapper.current) return

    try {
      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: '#ffffff',
        quality: 1,
      })

      const link = document.createElement('a')
      link.download = 'architecture-diagram.png'
      link.href = dataUrl
      link.click()
    } catch (error) {
      // Export failed silently
    }
  }, [])

  const flowEdges = edges.map((edge) => ({
    ...edge,
    animated: true,
    style: { stroke: '#94a3b8' },
  }))

  return (
    <div ref={reactFlowWrapper} className="h-full w-full bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        connectOnClick={false}
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
        }}
      >
        <Background color="#e2e8f0" gap={16} />
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          className="!bg-background !border !rounded-lg"
        />
        <Controls className="!border !rounded-lg !shadow-sm" />
      </ReactFlow>

      <GraphToolbar
        onZoomIn={() => zoomIn()}
        onZoomOut={() => zoomOut()}
        onFitView={() => fitView({ padding: 0.2 })}
        onAutoLayout={handleAutoLayout}
        onExportPng={handleExportPng}
        onAddNode={handleAddNode}
        onDelete={handleDelete}
        onReview={handleReview}
        hasSelection={!!(selectedNodeId || selectedEdgeId)}
        hasNodes={nodes.length > 0}
        isReviewing={isReviewing}
      />

      <NodeEditDialog
        node={editingNode}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleNodeSave}
      />

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">Noch keine Architektur</p>
            <p className="text-sm">Beschreibe dein System im Chat, um zu beginnen.</p>
          </div>
        </div>
      )}
    </div>
  )
}
