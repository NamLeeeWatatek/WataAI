/**
 * Node Mapper Utilities
 * Map between Backend and Frontend (ReactFlow) node structures
 */

import type { Node } from 'reactflow'
import type { NodeType } from '@/lib/types/node'

/**
 * Backend Node Structure:
 * {
 *   id: string
 *   type: string  // NodeType.id (e.g., 'webhook', 'ai-chat')
 *   position: { x: number; y: number }
 *   data: Record<string, any>  // User input/config
 * }
 */
export interface BackendNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}

/**
 * Map Backend node to ReactFlow node
 */
export function mapBackendNodeToReactFlow(
  backendNode: BackendNode,
  nodeType?: NodeType
): Node {
  return {
    id: backendNode.id,
    type: 'custom', // ReactFlow node type
    position: backendNode.position,
    data: {
      type: backendNode.type, // NodeType.id
      nodeType: backendNode.type, // Backup reference
      label: nodeType?.label || backendNode.type,
      config: backendNode.data, // User input
      color: nodeType?.color,
      description: nodeType?.description,
      properties: nodeType?.properties,
    },
  }
}

/**
 * Map ReactFlow node to Backend node
 */
export function mapReactFlowNodeToBackend(reactFlowNode: Node): BackendNode {
  const data = reactFlowNode.data || {}

  // Extract nodeType from various possible locations
  const nodeTypeId = data.type || data.nodeType || reactFlowNode.type

  // Extract user config
  const userConfig = data.config || {}

  return {
    id: reactFlowNode.id,
    type: nodeTypeId,
    position: reactFlowNode.position,
    data: userConfig,
  }
}

/**
 * Map array of Backend nodes to ReactFlow nodes
 */
export function mapBackendNodesToReactFlow(
  backendNodes: BackendNode[],
  nodeTypes: NodeType[]
): Node[] {
  const nodeTypeMap = new Map(nodeTypes.map(nt => [nt.id, nt]))

  return backendNodes.map(node =>
    mapBackendNodeToReactFlow(node, nodeTypeMap.get(node.type))
  )
}

/**
 * Map array of ReactFlow nodes to Backend nodes
 */
export function mapReactFlowNodesToBackend(reactFlowNodes: Node[]): BackendNode[] {
  return reactFlowNodes.map(mapReactFlowNodeToBackend)
}

/**
 * Category mapping helper
 * Maps backend categories to frontend display categories if needed
 */
export const CATEGORY_MAP: Record<string, string> = {
  'trigger': 'trigger',
  'messaging': 'action',
  'ai': 'ai',
  'integration': 'action',
  'data': 'action',
  'logic': 'logic',
  'transform': 'action',
  'response': 'response',
}

/**
 * Get display category for frontend
 */
export function getDisplayCategory(backendCategory: string): string {
  return CATEGORY_MAP[backendCategory] || backendCategory
}

/**
 * Validate node structure
 */
export function validateBackendNode(node: any): node is BackendNode {
  return (
    typeof node === 'object' &&
    typeof node.id === 'string' &&
    typeof node.type === 'string' &&
    typeof node.position === 'object' &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    typeof node.data === 'object'
  )
}

/**
 * Validate ReactFlow node structure
 */
export function validateReactFlowNode(node: any): node is Node {
  return (
    typeof node === 'object' &&
    typeof node.id === 'string' &&
    typeof node.position === 'object' &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    typeof node.data === 'object'
  )
}
