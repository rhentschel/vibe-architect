import { useCallback, useRef } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type OnNodesChange,
  type OnEdgesChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toPng } from 'html-to-image'
import { nodeTypes } from './nodes'
import { GraphToolbar } from './GraphToolbar'
import { useProjectStore } from '@/lib/store/useProjectStore'
import { getLayoutedElements } from '@/lib/utils/graphLayout'

export function GraphCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const { nodes, edges, updateNodePosition } = useProjectStore()

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
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
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
