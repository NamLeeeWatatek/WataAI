
/**
 * Generate execution reference string
 * @example "WF-123-EX-456"
 */
export function getExecutionReference(flowId: number, executionId: number): string {
  return `WF-${flowId}-EX-${executionId}`
}

/**
 * Generate short execution reference
 * @example "EX-456"
 */
export function getShortExecutionReference(executionId: number): string {
  return `EX-${executionId}`
}

/**
 * Format execution duration in human-readable format
 */
export function formatExecutionDuration(durationMs?: number | null): string {
  if (!durationMs) return 'N/A'
  
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }
  
  const seconds = Math.floor(durationMs / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Get Tailwind classes for execution status badge
 */
export function getExecutionStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'running':
    case 'pending':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'failed':
    case 'error':
      return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'cancelled':
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    default:
      return 'text-muted-foreground bg-muted/10 border-border/20'
  }
}

/**
 * Get icon component name for execution status
 * Returns the React Icon component name to use
 */
export function getExecutionStatusIcon(status: string): 'FiCheckCircle' | 'FiLoader' | 'FiXCircle' | 'FiSlash' | 'FiCircle' {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'FiCheckCircle'
    case 'running':
    case 'pending':
      return 'FiLoader'
    case 'failed':
    case 'error':
      return 'FiXCircle'
    case 'cancelled':
      return 'FiSlash'
    default:
      return 'FiCircle'
  }
}

/**
 * Calculate success rate percentage
 */
export function calculateSuccessRate(completedNodes: number, totalNodes: number): number {
  if (totalNodes === 0) return 0
  return Math.round((completedNodes / totalNodes) * 100)
}

/**
 * Format execution date in relative time
 */
export function formatExecutionDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString()
}

/**
 * Get execution progress percentage
 */
export function getExecutionProgress(completedNodes: number, totalNodes: number): number {
  if (totalNodes === 0) return 0
  return Math.round((completedNodes / totalNodes) * 100)
}

