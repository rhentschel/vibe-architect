import { EntityNode } from './EntityNode'
import { ProcessNode } from './ProcessNode'
import { GapNode } from './GapNode'

export const nodeTypes = {
  entity: EntityNode,
  process: ProcessNode,
  gap: GapNode,
}

export { EntityNode, ProcessNode, GapNode }
