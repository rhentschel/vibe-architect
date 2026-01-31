export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  project_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ArchitectureSnapshot {
  id: string
  project_id: string
  version: number
  graph_data: GraphData
  created_at: string
}

export interface GraphData {
  nodes: GraphNodeData[]
  edges: GraphEdgeData[]
  gaps: LogicGapData[]
}

export interface GraphNodeData {
  id: string
  type: 'entity' | 'process' | 'gap'
  label: string
  description?: string
  position?: { x: number; y: number }
  data?: Record<string, unknown>
}

export interface GraphEdgeData {
  id: string
  source: string
  target: string
  label?: string
  type?: 'default' | 'smoothstep' | 'step'
}

export interface LogicGapData {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high'
  relatedNodeIds: string[]
  resolved: boolean
}

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      architecture_snapshots: {
        Row: ArchitectureSnapshot
        Insert: Omit<ArchitectureSnapshot, 'id' | 'created_at' | 'version'>
        Update: Partial<Omit<ArchitectureSnapshot, 'id' | 'created_at' | 'version'>>
      }
    }
  }
}
