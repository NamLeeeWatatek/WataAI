/**
 * Bot Type Definitions
 * Strongly typed interfaces for bot management
 */

export type BotStatus = 'draft' | 'active' | 'paused' | 'archived'
export type BotWidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
export type BotWidgetButtonSize = 'small' | 'medium' | 'large'

/** Configuration for bot functions */
export interface BotFunctionConfig {
  enabled?: boolean
  timeout?: number
  retryCount?: number
  parameters?: Record<string, string | number | boolean>
  [key: string]: unknown
}

/** Configuration for bot functions */
export interface BotFunction {
  id: string
  botId: string
  name: string
  description?: string | null
  functionType: 'document_access' | 'auto_fill' | 'ai_suggest' | 'custom'
  isEnabled: boolean
  config?: Record<string, any> | null
  createdAt: string
  updatedAt: string
}

export interface BotFunctionCardProps {
  botFunction: BotFunction
  onEdit: () => void
  onDelete: () => void
}

/** 
 * Strongly typed Bot interface 
 * Aligned with backend Bot domain entity
 */
export interface Bot {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  avatarUrl?: string | null
  defaultLanguage: string
  timezone: string
  status: BotStatus
  createdBy: string | null

  // AI Settings
  aiProviderId?: string | null
  aiConfigId?: string | null
  aiModelName?: string | null
  aiParameters?: Record<string, any> | null
  systemPrompt?: string | null

  // Knowledge Base
  knowledgeBaseIds?: string[] | null
  enableAutoLearn?: boolean

  // Widget Config (Flat structure as per backend)
  widgetEnabled?: boolean
  welcomeMessage?: string | null
  placeholderText?: string | null
  primaryColor?: string | null
  widgetPosition?: BotWidgetPosition
  widgetButtonSize?: BotWidgetButtonSize
  showAvatar?: boolean
  showTimestamp?: boolean
  borderRadius?: number
  glassmorphism?: boolean
  headerStyle?: 'solid' | 'minimal' | 'gradient'

  // Origins
  allowedOrigins?: string[] | null

  // Flow
  flowId?: string | null

  // Tags
  tags?: string[] | null

  // Functions
  functions?: string[] | null
  functionConfig?: Record<string, any> | null

  // Legacy/UI helper fields
  icon?: string // deprecated in backend but might be used in UI
  isActive?: boolean // deprecated in backend (mapped to status)

  createdAt: string
  updatedAt: string
}

export interface CreateBotDto {
  name: string
  workspaceId?: string
  description?: string
  avatarUrl?: string
  defaultLanguage?: string
  status?: BotStatus

  aiProviderId?: string
  aiModelName?: string
  aiParameters?: Record<string, any>
  systemPrompt?: string
  tags?: string[]
  knowledgeBaseIds?: string[]

  widgetEnabled?: boolean
  welcomeMessage?: string
  placeholderText?: string
  primaryColor?: string
  widgetPosition?: BotWidgetPosition
  widgetButtonSize?: BotWidgetButtonSize
  borderRadius?: number
  glassmorphism?: boolean
  headerStyle?: 'solid' | 'minimal' | 'gradient'
}

export type UpdateBotDto = Partial<CreateBotDto>

export interface GetBotsResponse {
  data: Bot[]
  success: boolean
}

export interface GetBotResponse {
  data: Bot
  success: boolean
}

// ... Flow Related ...

/** Flow node data structure */
export interface FlowNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

/** Flow edge data structure */
export interface FlowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

/** Flow definition structure */
export interface FlowDefinition {
  nodes: FlowNode[]
  edges: FlowEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

export interface FlowVersion {
  id: string
  botId: string
  version: number
  flow: FlowDefinition
  status: 'draft' | 'published' | 'archived'
  publishedAt?: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

/** 
 * BotWidgetConfig (UI specific - used by the widget bundle)
 * This structure is used for the public config API response
 */
export interface BotWidgetTheme {
  primaryColor: string
  backgroundColor?: string
  botMessageColor?: string
  botMessageTextColor?: string
  userMessageTextColor?: string
  inputBackgroundColor?: string
  inputTextColor?: string
  position: BotWidgetPosition
  buttonSize: BotWidgetButtonSize
  showAvatar: boolean
  showTimestamp: boolean
  borderRadius?: number
  glassmorphism?: boolean
  headerStyle?: 'solid' | 'minimal' | 'gradient'
}

export interface BotWidgetConfig {
  botId: string
  name: string
  description?: string
  avatarUrl?: string
  welcomeMessage: string
  placeholderText: string
  theme: BotWidgetTheme
}
