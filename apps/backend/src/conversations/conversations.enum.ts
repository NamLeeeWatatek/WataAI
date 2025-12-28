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

export enum MessageFeedback {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
}
