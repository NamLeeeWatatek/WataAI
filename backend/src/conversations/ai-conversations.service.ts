import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversationEntity } from './infrastructure/persistence/relational/entities/ai-conversation.entity';
import {
  CreateAiConversationDto,
  UpdateAiConversationDto,
  AddAiMessageDto,
} from './dto/ai-conversation.dto';
import { BotExecutionService } from '../bots/bot-execution.service';
import { MessageRole } from './conversations.enum';

@Injectable()
export class AiConversationsService {
  constructor(
    @InjectRepository(AiConversationEntity)
    private readonly conversationRepository: Repository<AiConversationEntity>,
    private readonly botExecutionService: BotExecutionService,
  ) {}

  async create(userId: string, createDto: CreateAiConversationDto) {
    const conversation = this.conversationRepository.create({
      userId,
      title: createDto.title,
      botId: createDto.botId,
      useKnowledgeBase: createDto.useKnowledgeBase || false,
      messages: [],
    });

    return this.conversationRepository.save(conversation);
  }

  async findAll(userId: string) {
    return this.conversationRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id, userId },
    });

    if (!conversation) {
      throw new NotFoundException('AI Conversation not found');
    }

    return conversation;
  }

  async update(id: string, userId: string, updateDto: UpdateAiConversationDto) {
    const conversation = await this.findOne(id, userId);

    if (updateDto.title !== undefined) {
      conversation.title = updateDto.title;
    }

    if (updateDto.botId !== undefined) {
      conversation.botId = updateDto.botId;
    }

    if (updateDto.useKnowledgeBase !== undefined) {
      conversation.useKnowledgeBase = updateDto.useKnowledgeBase;
    }

    if (updateDto.metadata !== undefined) {
      conversation.metadata = updateDto.metadata;
    }

    if (updateDto.messages !== undefined) {
      conversation.messages = updateDto.messages;
    }

    return this.conversationRepository.save(conversation);
  }

  async remove(id: string, userId: string) {
    const conversation = await this.findOne(id, userId);
    await this.conversationRepository.remove(conversation);
    return { success: true };
  }

  async addMessage(id: string, userId: string, messageDto: AddAiMessageDto) {
    const conversation = await this.findOne(id, userId);

    // 1. Add User Message
    conversation.messages.push(messageDto);

    // 2. Generate Bot Response
    if (conversation.botId) {
      try {
        // Convert history to format expected by execution service
        const history = conversation.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

        const chatResult = await this.botExecutionService.generateBotResponse(
          conversation.botId,
          messageDto.content,
          history,
          { conversationId: conversation.id },
        );

        // 3. Add Assistant Message
        conversation.messages.push({
          role: MessageRole.ASSISTANT,
          content: chatResult.answer,
          timestamp: new Date().toISOString(),
          metadata: {
            sources: chatResult.sources,
          } as any,
        });
      } catch (_) {
        // Fallback error message
        conversation.messages.push({
          role: MessageRole.ASSISTANT,
          content: "Sorry, I'm having trouble thinking right now.",
          timestamp: new Date().toISOString(),
        });
      }
    }

    return this.conversationRepository.save(conversation);
  }
}
