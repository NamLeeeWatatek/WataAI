
import type { Socket } from 'socket.io-client'

export type MessageHandler = (data: any) => void
export type ErrorHandler = (_error: any) => void
export type CloseHandler = () => void

export interface WebSocketConnection {
  id: string
  socket: Socket
  handlers: Map<string, MessageHandler[]>
  isConnected: boolean
}

export interface UseExecutionSocketOptions {
  flowId?: string
  executionId?: string
  onUpdate?: (data: any) => void
  onComplete?: (data: any) => void
  onError?: (_error: any) => void
}

export interface UseExecutionWebSocketReturn {
  execute: (flowId: number, inputData?: any) => Promise<void>
  isExecuting: boolean
  executionId: string | null
  error: string | null
}

export interface UseExecutionStreamReturn {
  execute: (flowId: number, inputData?: any) => Promise<void>
  isExecuting: boolean
  executionId: string | null
  nodeStatuses: Record<string, 'pending' | 'running' | 'success' | 'failed'>
  error: string | null
}

export interface ExecutionEvent {
  type: 'executionStarted' | 'nodeExecutionBefore' | 'nodeExecutionAfter' | 'executionFinished' | 'executionError'
  data: any
}

