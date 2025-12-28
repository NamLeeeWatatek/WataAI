/**
 * Message payload for sending messages through a channel
 */
export interface ChannelMessage {
  to: string;
  content: string;
  mediaUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Response from sending a message
 */
export interface ChannelMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Incoming message from a channel
 */
export interface IncomingMessage {
  from: string;
  content: string;
  timestamp: Date;
  channelType: string;
  metadata?: Record<string, any>;
}

/**
 * Interface that all channel providers must implement
 */
export interface ChannelProvider {
  readonly channelType: string;

  sendMessage(message: ChannelMessage): Promise<ChannelMessageResponse>;

  verifyWebhook(payload: any, signature: string): boolean;

  parseIncomingMessage(payload: any): IncomingMessage;
}
