/**
 * Conversation Type Definitions
 * Strongly typed interfaces for conversations and messages
 */

export enum ConversationStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
  HANDOVER = 'handover',
  ARCHIVED = 'archived',
}

export enum ConversationSource {
  WEB = 'web',
  WIDGET = 'widget',
  PLAYGROUND = 'playground',
  WHATSAPP = 'whatsapp',
  FACEBOOK = 'facebook',
  API = 'api',
}

export enum ConversationType {
  SUPPORT = 'support',
  AI_PLAYGROUND = 'ai-playground',
  DISCOVERY = 'discovery',
  AUDIT = 'audit',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

/** Metadata for conversations */
export interface ConversationMetadata {
  source?: ConversationSource
  userAgent?: string
  ipAddress?: string
  location?: string
  referrer?: string
  tags?: string[]
  customFields?: Record<string, unknown>
  humanTakeover?: boolean
  takenOverBy?: string
  takenOverAt?: string
  discoveryEnabled?: boolean
  [key: string]: unknown
}

/** Metadata for messages */
export interface MessageMetadata {
  attachments?: Array<{
    type: 'image' | 'file' | 'audio' | 'video'
    url: string
    name?: string
    size?: number
  }>
  reactions?: Array<{
    type: string
    userId: string
  }>
  isEdited?: boolean
  replyTo?: string
  // AI-specific fields
  bot?: string
  model?: string
  [key: string]: unknown
}

/** Common Source interface for RAG */
export interface AiSource {
  documentId: string
  title: string
  content: string
  score: number
  metadata?: Record<string, unknown>
}

/** Common tool call interface */
export interface AiToolCall {
  id: string
  name: string
  arguments: Record<string, any>
  result?: any
}

/** 
 * Strongly typed Message interface 
 * Aligned with backend Message domain entity
 */
export interface AiMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  sentAt: string // ISO date string from backend
  metadata: MessageMetadata
  sources?: AiSource[] | null
  toolCalls?: AiToolCall[] | null
  feedback?: 'positive' | 'negative' | null
  feedbackComment?: string | null
  // UI helper fields
  timestamp?: string // Fallback or computed timestamp
  isError?: boolean
}

/** Alias for backward compatibility if needed */
export type BotMessage = AiMessage;

/** Aligned with backend Conversation domain entity */
export interface BotConversation {
  id: string
  botId: string
  channelId?: string | null
  channelType: string
  contactName?: string | null
  contactAvatar?: string | null
  metadata: ConversationMetadata
  status: ConversationStatus
  lastMessageAt?: string | null
  handoverTicketId?: string | null
  createdAt: string
  updatedAt: string
  // Enriched fields from API formattedItems
  channelName?: string
  channelMetadata?: Record<string, any>
  lastMessage?: string
  messages?: AiMessage[]
}

/** For Personal/AI Chat feature */
export interface AiConversation {
  id: string
  userId: string
  title: string
  botId?: string | null
  useKnowledgeBase: boolean
  messages: AiMessage[]
  metadata?: ConversationMetadata
  createdAt: string
  updatedAt: string
}

// --- DTOs ---

export interface CreateConversationDto {
  botId: string
  channelId?: string
  channelType?: string
  externalId: string
  metadata?: ConversationMetadata
}

export interface CreateMessageDto {
  role: MessageRole
  content: string
  sender?: string
  metadata?: MessageMetadata
  sources?: AiSource[]
}

export interface CreateAiConversationDto {
  title: string
  botId?: string
  useKnowledgeBase?: boolean
  metadata?: ConversationMetadata
}

export interface UpdateAiConversationDto {
  title?: string
  botId?: string | null
  useKnowledgeBase?: boolean
  metadata?: ConversationMetadata
  messages?: AiMessage[]
}

export interface AddAiMessageDto {
  role: MessageRole
  content: string
  timestamp: string
  metadata?: MessageMetadata
}

// --- Response Types ---

export interface ConversationPaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GetConversationsResponse = ConversationPaginatedResponse<BotConversation>
export type GetConversationResponse = BotConversation
export type CreateConversationResponse = BotConversation
export type GetMessagesResponse = {
  messages: AiMessage[]
  hasMore: boolean
  count: number
}
export type AddMessageResponse = AiMessage

export type GetAiConversationsResponse = AiConversation[]
export type GetAiConversationResponse = AiConversation
export type CreateAiConversationResponse = AiConversation
export type UpdateAiConversationResponse = AiConversation
export type DeleteAiConversationResponse = { success: boolean }
export type AddAiMessageResponse = AiConversation
