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

export interface BotConversation {
  id: string;
  botId: string;
  channelId?: string | null;
  externalId: string;
  status: ConversationStatus;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  messages?: BotMessage[];
}

export interface BotMessage {
  id: string;
  conversationId: string;
  content: string;
  sender: string;
  metadata: Record<string, any>;
  createdAt: string;
}

export interface CreateConversationDto {
  botId: string;
  channelId?: string;
  externalId: string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface CreateMessageDto {
  content: string;
  sender: string;
  metadata?: Record<string, any>;
}

export interface AiConversation {
  id: string;
  userId: string;
  title: string;
  botId?: string | null;
  useKnowledgeBase: boolean;
  messages: AiMessage[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  id?: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: any;
}

export interface CreateAiConversationDto {
  title: string;
  botId?: string;
  useKnowledgeBase?: boolean;
  metadata?: Record<string, any>;
}

export interface UpdateAiConversationDto {
  title?: string;
  botId?: string;
  useKnowledgeBase?: boolean;
  metadata?: Record<string, any>;
  messages?: AiMessage[];
}

export interface AddAiMessageDto {
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: any;
}

export type GetConversationsResponse = BotConversation[];
export type GetConversationResponse = BotConversation;
export type CreateConversationResponse = BotConversation;
export type GetMessagesResponse = BotMessage[];
export type AddMessageResponse = BotMessage;

export type GetAiConversationsResponse = AiConversation[];
export type GetAiConversationResponse = AiConversation;
export type CreateAiConversationResponse = AiConversation;
export type UpdateAiConversationResponse = AiConversation;
export type DeleteAiConversationResponse = { success: boolean };
export type AddAiMessageResponse = AiConversation;

