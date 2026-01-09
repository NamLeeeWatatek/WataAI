/**
 * WebSocket Type Definitions
 * Strongly typed interfaces for WebSocket communication
 */

import type { Socket } from 'socket.io-client'
import type { ExecutionData } from './execution'

/** WebSocket message data payload */
export interface WebSocketMessageData {
  type?: string
  payload?: unknown
  [key: string]: unknown
}

/** WebSocket error payload */
export interface WebSocketError {
  code?: string
  message: string
  details?: unknown
}

export type MessageHandler = (data: WebSocketMessageData) => void
export type ErrorHandler = (error: WebSocketError) => void
export type CloseHandler = () => void

export interface WebSocketConnection {
  id: string
  socket: Socket
  handlers: Map<string, MessageHandler[]>
  isConnected: boolean
}

/** Execution update event data */
export interface ExecutionUpdateData {
  executionId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress?: number
  currentNode?: string
  output?: ExecutionData
}

/** Execution complete event data */
export interface ExecutionCompleteData {
  executionId: string
  status: 'completed' | 'failed'
  result?: ExecutionData
  error?: string
  duration?: number
}

export interface UseExecutionSocketOptions {
  flowId?: string
  executionId?: string
  onUpdate?: (data: ExecutionUpdateData) => void
  onComplete?: (data: ExecutionCompleteData) => void
  onError?: (error: WebSocketError) => void
}

export interface UseExecutionWebSocketReturn {
  execute: (flowId: number, inputData?: ExecutionData) => Promise<void>
  isExecuting: boolean
  executionId: string | null
  error: string | null
}

export interface UseExecutionStreamReturn {
  execute: (flowId: number, inputData?: ExecutionData) => Promise<void>
  isExecuting: boolean
  executionId: string | null
  nodeStatuses: Record<string, 'pending' | 'running' | 'success' | 'failed'>
  error: string | null
}

/** Execution event data types */
export interface ExecutionStartedData {
  executionId: string
  flowId: string
  timestamp: string
}

export interface NodeExecutionData {
  executionId: string
  nodeId: string
  nodeName: string
  status: 'running' | 'success' | 'failed'
  input?: ExecutionData
  output?: ExecutionData
  error?: string
}

export interface ExecutionFinishedData {
  executionId: string
  status: 'completed' | 'failed'
  output?: ExecutionData
  error?: string
  duration?: number
}

export type ExecutionEventData =
  | ExecutionStartedData
  | NodeExecutionData
  | ExecutionFinishedData

export interface ExecutionEvent {
  type: 'executionStarted' | 'nodeExecutionBefore' | 'nodeExecutionAfter' | 'executionFinished' | 'executionError'
  data: ExecutionEventData
}
