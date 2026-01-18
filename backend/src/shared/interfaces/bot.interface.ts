/**
 * Shared interface for bot execution context
 */
export interface BotExecutionContext {
  botId: string;
  conversationId: string;
  messageContent: string;
  senderId: string;
  channelType: string;
  metadata?: Record<string, any>;
}

/**
 * Shared interface for bot execution result
 */
export interface BotExecutionResult {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Shared interface for bot configuration
 */
export interface BotConfig {
  id: string;
  name: string;
  flowId?: string;
  aiProviderId?: string;
  knowledgeBaseIds?: string[];
  systemPrompt?: string;
  metadata?: Record<string, any>;
}
