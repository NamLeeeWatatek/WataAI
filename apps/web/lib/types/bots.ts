
export type BotStatus = 'draft' | 'active' | 'paused' | 'archived'
export type BotWidgetPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
export type BotWidgetButtonSize = 'small' | 'medium' | 'large'

export interface Bot {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  status: BotStatus
  icon?: string
  isActive: boolean
  flowId?: string | null
  systemPrompt?: string | null
  functions?: string[]
  functionConfig?: Record<string, any>
  aiModel?: string | null
  aiConfig?: Record<string, any>
  knowledgeBaseIds?: string[]
  enableAutoLearn?: boolean
  widgetPosition: BotWidgetPosition
  widgetButtonSize: BotWidgetButtonSize
  createdAt: string
  updatedAt: string
}

export interface CreateBotDto {
  workspaceId?: string
  name: string
  description?: string
  icon?: string
  isActive?: boolean
  flowId?: string
  systemPrompt?: string
  functions?: string[]
  functionConfig?: Record<string, any>
  aiModel?: string
  aiConfig?: Record<string, any>
  knowledgeBaseIds?: string[]
  enableAutoLearn?: boolean
}

export interface UpdateBotDto {
  workspaceId?: string
  name?: string
  description?: string
  icon?: string
  isActive?: boolean
  flowId?: string
  systemPrompt?: string
  functions?: string[]
  functionConfig?: Record<string, any>
  aiModel?: string
  aiConfig?: Record<string, any>
  knowledgeBaseIds?: string[]
  enableAutoLearn?: boolean
}

export interface GetBotsResponse {
  data: Bot[]
  success: boolean
}

export interface GetBotResponse {
  data: Bot
  success: boolean
}

export interface CreateBotResponse {
  data: Bot
  success: boolean
}

export interface UpdateBotResponse {
  data: Bot
  success: boolean
}

export interface DeleteBotResponse {
  success: boolean
}

export interface FlowVersion {
  id: string
  botId: string
  version: number
  flow: Record<string, any>
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFlowVersionDto {
  flow: Record<string, any>
}

export interface CreateFlowVersionResponse {
  data: FlowVersion
  success: boolean
}

export interface PublishFlowVersionResponse {
  data: FlowVersion
  success: boolean
}

export interface GetFlowVersionsResponse {
  data: FlowVersion[]
  success: boolean
}

export enum BotFunctionType {
  DOCUMENT_ACCESS = 'document_access',
  AUTO_FILL = 'auto_fill',
  AI_SUGGEST = 'ai_suggest',
  CUSTOM = 'custom',
}

export interface BotFunction {
  id: string
  botId: string
  functionType: BotFunctionType
  name: string
  description?: string
  isEnabled: boolean
  config?: Record<string, any>
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface CreateBotFunctionDto {
  botId: string
  functionType: BotFunctionType
  name: string
  description?: string
  isEnabled?: boolean
  config?: Record<string, any>
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
}

export interface UpdateBotFunctionDto {
  botId?: string
  functionType?: BotFunctionType
  name?: string
  description?: string
  isEnabled?: boolean
  config?: Record<string, any>
  inputSchema?: Record<string, any>
  outputSchema?: Record<string, any>
}

export interface ExecuteBotFunctionDto {
  functionId: string
  input: Record<string, any>
  context?: Record<string, any>
}

export interface GetBotFunctionsResponse {
  data: BotFunction[]
  success: boolean
}

export interface GetBotFunctionResponse {
  data: BotFunction
  success: boolean
}

export interface CreateBotFunctionResponse {
  data: BotFunction
  success: boolean
}

export interface UpdateBotFunctionResponse {
  data: BotFunction
  success: boolean
}

export interface DeleteBotFunctionResponse {
  success: boolean
}

export interface ExecuteBotFunctionResponse {
  success: boolean
  result: any
  executionTime?: number
}

export interface BotFunctionModalProps {
  open: boolean
  onClose: () => void
  botId: string
  botFunction?: BotFunction | null
  onSuccess: () => void
}

export interface BotFunctionCardProps {
  botFunction: BotFunction
  onEdit: () => void
  onDelete: () => void
}

export interface AutoFillInputProps {
  functionId: string
  field: string
  context: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export interface AiSuggestWidgetProps {
  functionId: string
  task: string
  context: Record<string, any>
  onApply?: (suggestion: string) => void
  className?: string
}

