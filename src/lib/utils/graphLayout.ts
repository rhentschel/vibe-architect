import dagre from 'dagre'
import type { ReactFlowNode, ReactFlowEdge } from '@/types/graph.types'

const NODE_WIDTH = 180
const NODE_HEIGHT = 80

export function getLayoutedElements(
  nodes: ReactFlowNode[],
  edges: ReactFlowEdge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

  for (const node of nodes) {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const edge of edges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })

  const layoutedEdges = edges.map((edge) => ({
    ...edge,
    type: isHorizontal ? 'smoothstep' : 'smoothstep',
  }))

  return { nodes: layoutedNodes, edges: layoutedEdges }
}
