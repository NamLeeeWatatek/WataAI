/**
 * Shared interface for incoming messages from any channel
 */
export interface IncomingMessage {
  from: string;
  content: string;
  timestamp: Date;
  channelType: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Shared interface for outgoing messages to any channel
 */
export interface OutgoingMessage {
  to: string;
  content: string;
  channelType: string;
  conversationId?: string;
  metadata?: Record<string, any>;
}

/**
 * Shared interface for channel message response
 */
export interface ChannelMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}
