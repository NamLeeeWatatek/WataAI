/**
 * Execution Type Definitions
 * Strongly typed interfaces for flow executions
 */

/** Generic data payload for execution I/O */
export interface ExecutionData {
  [key: string]: unknown
}

export interface Execution {
  id: string | number
  flowId?: number
  flow_version_id?: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt?: string
  started_at?: string
  completedAt?: string
  completed_at?: string
  duration?: number
  duration_ms?: number
  error?: string
  error_message?: string
  input?: ExecutionData
  output?: ExecutionData
  nodeExecutions?: NodeExecution[]
  total_nodes?: number
  completed_nodes?: number
  success_rate?: number
}

export interface NodeExecution {
  id: string
  nodeId: string
  nodeName: string
  nodeType: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  duration?: number
  input?: ExecutionData
  output?: ExecutionData
  error?: string
}

export interface ExecutionUpdate {
  executionId: string
  flowId: string
  status: 'running' | 'completed' | 'failed'
  nodeId?: string
  nodeStatus?: 'running' | 'success' | 'failed'
  output?: ExecutionData
  error?: string
}

export interface TimelineEvent {
  id: string
  status: 'completed' | 'failed' | 'running' | 'pending'
  timestamp: string
  nodeName: string
  duration?: number
}

export interface ExecutionStatusBadgeProps {
  status: 'running' | 'completed' | 'failed' | 'cancelled'
}

export interface ExecutionTimelineProps {
  events: TimelineEvent[]
}

export interface NodeExecutionCardProps {
  execution: {
    id: string
    nodeName: string
    status: 'success' | 'failed' | 'running'
    duration: number
    input?: ExecutionData
    output?: ExecutionData
    error?: string
  }
}
