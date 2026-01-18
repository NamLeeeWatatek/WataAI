import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';
import { ConversationEntity } from '../conversations/infrastructure/persistence/relational/entities/conversation.entity';
import {
  ConversationStatus,
  MessageRole,
} from '../conversations/conversations.enum';
import { BotStatus } from './bots.enum';

@Injectable()
export class BotInteractionService {
  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    @InjectRepository(ConversationEntity)
    private conversationRepository: Repository<ConversationEntity>,
  ) {}

  async getBotForInteraction(botId: string) {
    const bot = await this.botRepository.findOne({
      where: { id: botId, status: BotStatus.ACTIVE },
      relations: ['workspace', 'knowledgeBases'],
    });

    if (!bot) {
      throw new NotFoundException('Active bot not found');
    }

    const publishedFlow = null;
    /*
    const publishedFlow = bot.flowVersions?.find(
      (v) => v.status === 'published',
    );
    */

    const activeKBs = bot.knowledgeBases?.filter((kb) => kb.isActive) || [];

    return {
      bot,
      publishedFlow,
      knowledgeBases: activeKBs,
    };
  }

  async processMessage(
    botId: string,
    conversationId: string,
    message: string,
    metadata?: Record<string, any>,
  ) {
    const { bot, publishedFlow, knowledgeBases } =
      await this.getBotForInteraction(botId);

    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId, botId },
      relations: ['messages'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const context = {
      bot: {
        id: bot.id,
        name: bot.name,
        systemPrompt: bot.systemPrompt,
        aiProviderId: bot.aiProviderId,
        aiModelName: bot.aiModelName,
        aiParameters: bot.aiParameters,
      },
      conversation: {
        id: conversation.id,
        externalId: conversation.externalId,
        metadata: conversation.metadata,
        messageHistory: conversation.messages?.slice(-10) || [],
      },
      flow: null,
      knowledgeBases: knowledgeBases.map((kb) => ({
        id: kb.knowledgeBaseId,
        priority: kb.priority,
        ragSettings: kb.ragSettings,
      })),
      message: {
        content: message,
        metadata,
      },
    };

    return context;
  }

  async getBotStats(botId: string) {
    const bot = await this.botRepository.findOne({
      where: { id: botId },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    const conversationCount = await this.conversationRepository.count({
      where: { botId },
    });

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const activeConversations = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.botId = :botId', { botId })
      .andWhere('conversation.updatedAt > :oneDayAgo', { oneDayAgo })
      .getCount();

    return {
      botId: bot.id,
      botName: bot.name,
      status: bot.status,
      totalConversations: conversationCount,
      activeConversations,
      createdAt: bot.createdAt,
    };
  }

  async validateBotInteraction(botId: string): Promise<boolean> {
    const bot = await this.botRepository.findOne({
      where: { id: botId },
    });

    if (!bot) {
      return false;
    }

    if (bot.status !== BotStatus.ACTIVE) {
      return false;
    }

    return true;
  }
}
