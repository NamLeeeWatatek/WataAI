import { MessageRole } from './conversations'

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic' | 'google' | 'local'
  maxTokens: number
  temperature: number
  isDefault: boolean
}

export interface ProviderModels {
  provider: string
  models: ModelConfig[]
}

export interface Message {
  id?: string | number
  role: MessageRole
  content: string
  timestamp?: string | Date
  conversation_id?: number
  metadata?: Record<string, any>
}

export interface Conversation {
  id: number
  title: string
  model: string
  message_count: number
  created_at: string
  updated_at: string
  messages?: Message[]
  lastMessageAt?: string
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  tools: string[]
  isActive: boolean
}

export interface AgentConfigPanelProps {
  config: AgentConfig
  onChange: (config: AgentConfig) => void
  onSave: () => void
  onCancel: () => void
}

export interface AISuggestProps {
  onSuggest: (suggestion: string) => void
  context?: string
}

export interface AISuggestButtonProps {
  onClick: () => void
  loading?: boolean
}

export interface AIFloatingButtonProps {
  onOpen: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

