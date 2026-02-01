import { z } from 'zod'

export const GraphNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  label: z.string(),
  description: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  data: z.record(z.string(), z.unknown()).optional(),
})

export const GraphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
  type: z.enum(['default', 'smoothstep', 'step']).optional(),
})

export const LogicGapSchema = z.object({
  id: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  relatedNodeIds: z.array(z.string()),
  resolved: z.boolean().default(false),
})

export const AIArchitectResponseSchema = z.object({
  message: z.string(),
  nodes: z.array(GraphNodeSchema).optional(),
  edges: z.array(GraphEdgeSchema).optional(),
  gaps: z.array(LogicGapSchema).optional(),
  removedNodeIds: z.array(z.string()).optional(),
  removedEdgeIds: z.array(z.string()).optional(),
  resolvedGapIds: z.array(z.string()).optional(),
  suggestions: z.array(z.string()).optional(),
})

export type GraphNode = z.infer<typeof GraphNodeSchema>
export type GraphEdge = z.infer<typeof GraphEdgeSchema>
export type LogicGap = z.infer<typeof LogicGapSchema>
export type AIArchitectResponse = z.infer<typeof AIArchitectResponseSchema>

export interface ReactFlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    description?: string
    severity?: 'low' | 'medium' | 'high'
    resolved?: boolean
    [key: string]: unknown
  }
}

export interface ReactFlowEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
  animated?: boolean
  style?: React.CSSProperties
}
