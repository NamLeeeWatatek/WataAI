import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversationEntity } from './infrastructure/persistence/relational/entities/ai-conversation.entity';
import {
  CreateAiConversationDto,
  UpdateAiConversationDto,
} from './dto/ai-conversation.dto';

@Injectable()
export class AiConversationsService {
  constructor(
    @InjectRepository(AiConversationEntity)
    private readonly conversationRepository: Repository<AiConversationEntity>,
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

  async addMessage(
    id: string,
    userId: string,
    message: {
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
      metadata?: any;
    },
  ) {
    const conversation = await this.findOne(id, userId);
    conversation.messages.push(message);
    return this.conversationRepository.save(conversation);
  }
}
