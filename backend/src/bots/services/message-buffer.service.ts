import { Injectable, Logger } from '@nestjs/common';

interface BufferedMessage {
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

interface ConversationBuffer {
  conversationId: string;
  botId: string;
  channelType: string;
  senderId: string;
  messages: BufferedMessage[];
  timer: NodeJS.Timeout | null;
  lastMessageTime: Date;
}

@Injectable()
export class MessageBufferService {
  private readonly logger = new Logger(MessageBufferService.name);
  private buffers = new Map<string, ConversationBuffer>();

  private readonly BUFFER_DELAY = 4000;

  private readonly MAX_BUFFER_TIME = 15000;

  addMessage(
    conversationId: string,
    content: string,
    botId: string,
    channelType: string,
    senderId: string,
    metadata?: Record<string, any>,
    onFlush?: (messages: BufferedMessage[], context: any) => Promise<void>,
  ): boolean {
    const key = `${conversationId}-${botId}`;
    const now = new Date();

    let buffer = this.buffers.get(key);

    if (!buffer) {
      // Táº¡o buffer má»›i
      buffer = {
        conversationId,
        botId,
        channelType,
        senderId,
        messages: [],
        timer: null,
        lastMessageTime: now,
      };
      this.buffers.set(key, buffer);

      this.logger.debug(
        `ðŸ“¦ Created new buffer for conversation ${conversationId}`,
      );
    }

    // ThÃªm tin nháº¯n vÃ o buffer
    buffer.messages.push({
      content,
      timestamp: now,
      metadata,
    });

    buffer.lastMessageTime = now;

    this.logger.log(
      `ðŸ“¨ Buffered message ${buffer.messages.length} for conversation ${conversationId}`,
    );

    // Há»§y timer cÅ© náº¿u cÃ³
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }

    // Kiá»ƒm tra xem Ä‘Ã£ quÃ¡ thá»i gian tá»‘i Ä‘a chÆ°a
    const firstMessageTime = buffer.messages[0].timestamp;
    const timeSinceFirst = now.getTime() - firstMessageTime.getTime();

    if (timeSinceFirst >= this.MAX_BUFFER_TIME) {
      // ÄÃ£ chá» quÃ¡ lÃ¢u, xá»­ lÃ½ ngay
      this.logger.log(
        `â° Max buffer time reached for conversation ${conversationId}, flushing now`,
      );
      this.flushBuffer(key, onFlush);
      return true;
    }

    // Äáº·t timer má»›i Ä‘á»ƒ xá»­ lÃ½ sau BUFFER_DELAY
    buffer.timer = setTimeout(() => {
      this.logger.log(
        `â±ï¸ Buffer delay completed for conversation ${conversationId}, flushing messages`,
      );
      this.flushBuffer(key, onFlush);
    }, this.BUFFER_DELAY);

    return false; // Äang buffer, chÆ°a xá»­ lÃ½
  }

  /**
   * Xá»­ lÃ½ táº¥t cáº£ tin nháº¯n trong buffer
   */
  private flushBuffer(
    key: string,
    onFlush?: (messages: BufferedMessage[], context: any) => Promise<void>,
  ): void {
    const buffer = this.buffers.get(key);

    if (!buffer || buffer.messages.length === 0) {
      return;
    }

    const { conversationId, botId, channelType, senderId, messages } = buffer;

    this.logger.log(
      `ðŸš€ Flushing ${messages.length} buffered messages for conversation ${conversationId}`,
    );

    // XÃ³a buffer
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }
    this.buffers.delete(key);

    // Gá»i callback Ä‘á»ƒ xá»­ lÃ½
    if (onFlush) {
      const context = {
        conversationId,
        botId,
        channelType,
        senderId,
      };

      onFlush(messages, context).catch((error) => {
        this.logger.error(
          `Error flushing buffer for conversation ${conversationId}: ${error.message}`,
          error.stack,
        );
      });
    }
  }

  /**
   * Láº¥y sá»‘ lÆ°á»£ng tin nháº¯n Ä‘ang buffer cho má»™t conversation
   */
  getBufferSize(conversationId: string, botId: string): number {
    const key = `${conversationId}-${botId}`;
    const buffer = this.buffers.get(key);
    return buffer ? buffer.messages.length : 0;
  }

  /**
   * XÃ³a buffer cho má»™t conversation (vÃ­ dá»¥ khi human takeover)
   */
  clearBuffer(conversationId: string, botId: string): void {
    const key = `${conversationId}-${botId}`;
    const buffer = this.buffers.get(key);

    if (buffer) {
      if (buffer.timer) {
        clearTimeout(buffer.timer);
      }
      this.buffers.delete(key);
      this.logger.log(
        `ðŸ—‘ï¸ Cleared buffer for conversation ${conversationId}`,
      );
    }
  }

  /**
   * Láº¥y thÃ´ng tin vá» táº¥t cáº£ buffers (Ä‘á»ƒ debug)
   */
  getBufferStats(): any[] {
    const stats: any[] = [];

    this.buffers.forEach((buffer, key) => {
      stats.push({
        key,
        conversationId: buffer.conversationId,
        botId: buffer.botId,
        messageCount: buffer.messages.length,
        lastMessageTime: buffer.lastMessageTime,
        hasTimer: buffer.timer !== null,
      });
    });

    return stats;
  }
}
