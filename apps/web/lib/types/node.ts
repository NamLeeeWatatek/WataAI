
export interface NodeProperty {
  name: string
  label: string
  type: 'text' | 'url' | 'textarea' | 'json' | 'select' | 'boolean' | 'number' | 'file' | 'image' | 'key-value' | 'multi-select' | 'dynamic-form' | 'channel-select'
  required?: boolean
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string } | string>
  default?: any
  showWhen?: Record<string, any>
  accept?: string
  multiple?: boolean
  min?: number
  max?: number
  properties?: any[]
}

export interface NodeType {
  id: string
  label: string
  category: 'trigger' | 'messaging' | 'ai' | 'integration' | 'data' | 'logic' | 'transform' | 'action' | 'response'
  color: string
  bgColor?: string
  borderColor?: string
  description: string
  isPremium?: boolean
  isActive?: boolean
  properties?: NodeProperty[]
  executionConfig?: {
    timeout?: number
    retries?: number
    retryDelay?: number
  }
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export interface NodeCategory {
  id: string
  label: string
  color: string
  description?: string
}

export interface CreateNodeTypeDto {
  label: string
  category: 'trigger' | 'messaging' | 'ai' | 'integration' | 'data' | 'logic' | 'transform' | 'action' | 'response'
  color: string
  description: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

export interface UpdateNodeTypeDto {
  label?: string
  category?: 'trigger' | 'messaging' | 'ai' | 'integration' | 'data' | 'logic' | 'transform' | 'action' | 'response'
  color?: string
  description?: string
  isPremium?: boolean
  properties?: NodeProperty[]
}

