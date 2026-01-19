import {
  Injectable,
  Logger,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from '../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KbAiConfig } from '../config/kb-ai.config';
import { isUUID } from '../../utils/is-uuid';
import { KBSearchService, ChunkSource } from './kb-search.service';

export interface RAGResult {
  answer: string;
  sources: ChunkSource[];
}

@Injectable()
export class KBRagService {
  private readonly logger = new Logger(KBRagService.name);

  constructor(
    private readonly searchService: KBSearchService,
    private readonly aiProvidersService: AiProvidersService,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private readonly botKbRepository: Repository<BotKnowledgeBaseEntity>,
    private readonly i18n: I18nService,
  ) { }

  async query(
    query: string,
    workspaceId: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
    useHybrid: boolean = true,
  ): Promise<ChunkSource[]> {
    return this.searchService.query(
      query,
      workspaceId,
      knowledgeBaseId,
      limit,
      similarityThreshold,
      useHybrid,
    );
  }

  async hybridQuery(
    query: string,
    workspaceId: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
  ): Promise<ChunkSource[]> {
    return this.searchService.hybridQuery(
      query,
      workspaceId,
      knowledgeBaseId,
      limit,
      similarityThreshold,
    );
  }

  async generateAnswerStream(
    question: string,
    knowledgeBaseId?: string,
    model?: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
      fallbackToGeneralKnowledge?: boolean;
    },
  ): Promise<
    AsyncGenerator<{ type: 'source' | 'token' | 'error'; data: any }>
  > {
    return this._generateAnswerStream(
      question,
      knowledgeBaseId,
      model,
      options,
    );
  }

  private async *_generateAnswerStream(
    question: string,
    knowledgeBaseId?: string,
    model?: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
      fallbackToGeneralKnowledge?: boolean;
    },
  ): AsyncGenerator<{ type: 'source' | 'token' | 'error'; data: any }> {
    try {
      const limit = options?.limit || 5;
      const threshold = options?.similarityThreshold || 0.5;
      const fallback = options?.fallbackToGeneralKnowledge || false;

      // 1. Initial Retrieval (Fetch more candidates for re-ranking)
      const candidateLimit = limit * 3;
      let relevantChunks = await this.query(
        question,
        'default',
        knowledgeBaseId,
        candidateLimit,
        threshold,
      );

      if (relevantChunks.length === 0) {
        if (!fallback) {
          const lang = I18nContext.current()?.lang;
          yield { type: 'token', data: this.i18n.t('ai.ragNoInfo', { lang }) };
          return;
        }
        this.logger.log(
          `No chunks found, falling back to general knowledge for: "${question}"`,
        );
      } else {
        // 2. Context Expansion (Standard RAG)
        relevantChunks = await this.expandContext(relevantChunks);
      }

      // Yield sources immediately
      yield { type: 'source', data: relevantChunks };

      const context = relevantChunks
        .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
        .join('\n\n');

      const lang = I18nContext.current()?.lang;
      let prompt: string;

      if (relevantChunks.length > 0) {
        const key = fallback ? 'ai.ragPromptFlexible' : 'ai.ragPromptPrefix';
        prompt = `${this.i18n.t(key, { lang })}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
      } else {
        prompt = `Question: ${question}\n\nAnswer:`;
      }

      let stream: AsyncGenerator<string>;

      if (knowledgeBaseId) {
        stream = await this.generateAnswerFromKbStream(
          prompt,
          knowledgeBaseId,
          model,
        );
      } else {
        stream = await this.aiProvidersService.chatStream(
          prompt,
          model || KbAiConfig.defaults.model,
        );
      }

      for await (const token of stream) {
        yield { type: 'token', data: token };
      }
    } catch (error) {
      this.logger.error(`Error generating answer stream: ${error.message}`);
      yield { type: 'error', data: error.message };
    }
  }

  async generateAnswer(
    question: string,
    knowledgeBaseId?: string,
    model?: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
      fallbackToGeneralKnowledge?: boolean;
    },
  ): Promise<RAGResult> {
    try {
      const limit = options?.limit || 5;
      const threshold = options?.similarityThreshold || 0.5;
      const fallback = options?.fallbackToGeneralKnowledge || false;

      // 1. Initial Retrieval
      const candidateLimit = limit * 3;
      let relevantChunks = await this.query(
        question,
        'default',
        knowledgeBaseId,
        candidateLimit,
        threshold,
      );

      if (relevantChunks.length === 0) {
        if (!fallback) {
          this.logger.warn(
            `No relevant chunks found for question: "${question}"`,
          );
          const lang = I18nContext.current()?.lang;
          return {
            answer: this.i18n.t('ai.ragNoInfo', { lang }),
            sources: [],
          };
        }
        this.logger.log(
          `No chunks found, falling back to general knowledge for: "${question}"`,
        );
      } else {
        // 2. Context Expansion (Standard RAG)
        relevantChunks = await this.expandContext(relevantChunks);
      }

      this.logger.log(
        `Using ${relevantChunks.length} chunks for answer generation`,
      );

      const context = relevantChunks
        .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
        .join('\n\n');

      const lang = I18nContext.current()?.lang;
      let prompt: string;

      if (relevantChunks.length > 0) {
        const key = fallback ? 'ai.ragPromptFlexible' : 'ai.ragPromptPrefix';
        prompt = `${this.i18n.t(key, { lang })}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;
      } else {
        // General knowledge fallback
        prompt = `Question: ${question}\n\nAnswer:`;
      }

      let answer: string;
      if (knowledgeBaseId) {
        answer = await this.generateAnswerFromKb(
          prompt,
          knowledgeBaseId,
          model,
        );
      } else {
        answer = await this.aiProvidersService.chat(
          prompt,
          model || KbAiConfig.defaults.model,
        );
      }

      return {
        answer,
        sources: relevantChunks,
      };
    } catch (error) {
      this.logger.error(`Error generating answer: ${error.message}`);
      throw error;
    }
  }

  private async expandContext(chunks: ChunkSource[]): Promise<ChunkSource[]> {
    // Placeholder for context expansion logic if it was used in original
    return chunks;
  }

  private async generateAnswerFromKb(
    prompt: string,
    knowledgeBaseId: string,
    model?: string,
  ): Promise<string> {
    try {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      const providerConfig = await this.resolveAIProvider(
        null,
        knowledgeBaseId,
      );

      if (providerConfig) {
        const finalModel =
          model || providerConfig.modelName || KbAiConfig.defaults.model;
        this.logger.log(
          `🔎 [RAG] Using resolved provider: ${providerConfig.providerId} (${providerConfig.scope}) for KB ${knowledgeBaseId} with model: ${finalModel}`,
        );
        return await this.aiProvidersService.chatWithHistoryUsingProvider(
          [{ role: 'user', content: prompt }],
          finalModel,
          providerConfig.providerId,
          providerConfig.scope,
          providerConfig.scopeId,
          kb?.aiParameters as Record<string, any>,
        );
      }

      const fallbackModel = kb?.ragModel || model || KbAiConfig.defaults.model;
      this.logger.log(
        `⚠️ [RAG] No specific provider found for KB ${knowledgeBaseId}, falling back to default chat for model: ${fallbackModel}`,
      );
      return await this.aiProvidersService.chat(
        prompt,
        fallbackModel,
        undefined,
        undefined,
        kb?.workspaceId,
      );
    } catch (error) {
      this.logger.error(
        `❌ [RAG] Error in generateAnswerFromKb: ${error.message}`,
      );
      const fallbackModel = model || KbAiConfig.defaults.model;
      return await this.aiProvidersService.chat(prompt, fallbackModel);
    }
  }

  private async generateAnswerFromKbStream(
    prompt: string,
    knowledgeBaseId: string,
    model?: string,
  ): Promise<AsyncGenerator<string>> {
    try {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      const providerConfig = await this.resolveAIProvider(
        null,
        knowledgeBaseId,
      );

      if (providerConfig) {
        const finalModel =
          model || providerConfig.modelName || KbAiConfig.defaults.model;
        this.logger.log(
          `🔎 [RAG Stream] Using resolved provider: ${providerConfig.providerId} (${providerConfig.scope}) for KB ${knowledgeBaseId} with model: ${finalModel}`,
        );
        return await this.aiProvidersService.chatWithHistoryUsingProviderStream(
          [{ role: 'user', content: prompt }],
          finalModel,
          providerConfig.providerId,
          providerConfig.scope,
          providerConfig.scopeId,
          kb?.aiParameters as Record<string, any>,
        );
      }

      const fallbackModel = kb?.ragModel || model || KbAiConfig.defaults.model;
      this.logger.log(
        `⚠️ [RAG Stream] No specific provider found for KB ${knowledgeBaseId}, falling back to default stream for model: ${fallbackModel}`,
      );
      return await this.aiProvidersService.chatStream(
        prompt,
        fallbackModel,
        undefined,
        undefined,
        kb?.workspaceId,
      );
    } catch (error) {
      this.logger.error(
        `❌ [RAG Stream] Error in generateAnswerFromKbStream: ${error.message}`,
      );
      const fallbackModel = model || KbAiConfig.defaults.model;
      return await this.aiProvidersService.chatStream(prompt, fallbackModel);
    }
  }
  async generateAnswerForAgent(
    question: string,
    agentId: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
    botSystemPrompt?: string,
  ): Promise<RAGResult> {
    try {
      const bot = await this.botRepository.findOne({
        where: { id: agentId },
        select: [
          'id',
          'name',
          'workspaceId',
          'aiConfigId',
          'aiModelName',
          'createdBy',
        ],
      });

      if (!bot) {
        throw new NotFoundException(`Bot ${agentId} not found`);
      }

      const workspaceId = bot.workspaceId ?? undefined;
      const aiConfigId = bot.aiConfigId ?? undefined;
      const modelName = model || bot.aiModelName || KbAiConfig.defaults.model;

      let relevantChunks: ChunkSource[] = [];

      const linkedKBs = await this.botKbRepository.find({
        where: {
          botId: agentId,
          isActive: true,
        },
        select: ['knowledgeBaseId'],
        order: { priority: 'ASC' },
      });

      const knowledgeBaseIds = linkedKBs.map((lkb) => lkb.knowledgeBaseId);

      if (knowledgeBaseIds.length > 0) {
        try {
          relevantChunks = await this.gatherRAGContext(
            question,
            workspaceId || 'default',
            knowledgeBaseIds,
          );
          relevantChunks = relevantChunks.slice(0, 5); // Ensure top 5
        } catch (kbError) {
          this.logger.warn(
            `⚠️ Knowledge base query failed: ${kbError.message}. Continuing without KB context.`,
          );
        }
      }

      let systemPrompt = botSystemPrompt || 'You are a helpful assistant.';
      systemPrompt +=
        "\n\nIMPORTANT: Always respond in the same language as the user's latest message. If the user asks in Vietnamese, reply in Vietnamese. If the user asks in English, reply in English. Do not override this based on the retrieved context language.";

      if (relevantChunks.length > 0) {
        const context = relevantChunks
          .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
          .join('\n\n');

        systemPrompt += `\n\nUse the following context from the knowledge base to answer questions:\n\n${context}`;
      }

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...(conversationHistory || []),
        {
          role: 'user' as const,
          content: question,
        },
      ];

      const answer = aiConfigId
        ? await this.aiProvidersService.chatWithHistoryUsingProvider(
          messages,
          modelName,
          aiConfigId,
          workspaceId ? 'workspace' : 'user',
          workspaceId || bot.createdBy || 'system',
        )
        : await this.aiProvidersService.chatWithHistory(messages, modelName);

      return {
        answer,
        sources: relevantChunks,
      };
    } catch (error) {
      this.logger.error(`Error generating answer for agent: ${error.message}`);
      throw error;
    }
  }

  async chatWithBot(
    message: string,
    botSystemPrompt?: string,
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
    // botId?: string // Optional for context resolution if needed
  ): Promise<string> {
    try {
      const systemPrompt = botSystemPrompt || 'You are a helpful assistant.';

      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt,
        },
        ...(conversationHistory || []),
        {
          role: 'user' as const,
          content: message,
        },
      ];

      return await this.aiProvidersService.chatWithHistory(
        messages,
        model || KbAiConfig.defaults.model,
      );
    } catch (error) {
      this.logger.error(`Error in chat: ${error.message}`);
      throw error;
    }
  }

  async chatWithBotAndRAG(
    message: string,
    botId?: string,
    knowledgeBaseIds?: string[],
    conversationHistory?: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>,
    model?: string,
  ): Promise<RAGResult> {
    try {
      const bot = botId
        ? await this.botRepository.findOne({
          where: { id: botId },
          select: [
            'id',
            'name',
            'workspaceId',
            'aiConfigId',
            'aiModelName',
            'systemPrompt',
            'createdBy',
          ],
        })
        : null;

      if (botId && !bot) {
        throw new NotFoundException(`Bot ${botId} not found`);
      }

      const systemPrompt = bot?.systemPrompt || 'You are a helpful assistant.';
      const defaultModel =
        bot?.aiModelName || model || KbAiConfig.defaults.model;

      let effectiveKnowledgeBaseIds = knowledgeBaseIds;

      if ((!knowledgeBaseIds || knowledgeBaseIds.length === 0) && botId) {
        const linkedKBs = await this.botKbRepository.find({
          where: {
            botId: botId,
            isActive: true,
          },
          select: ['knowledgeBaseId'],
          order: { priority: 'ASC' },
        });

        effectiveKnowledgeBaseIds = linkedKBs.map((lkb) => lkb.knowledgeBaseId);
      }

      let ragContext = '';
      let ragSources: ChunkSource[] = [];

      if (effectiveKnowledgeBaseIds && effectiveKnowledgeBaseIds.length > 0) {
        const ragWorkspaceId = bot?.workspaceId || 'default';
        const allChunks = await this.gatherRAGContext(
          message,
          ragWorkspaceId,
          effectiveKnowledgeBaseIds,
        );
        ragSources = allChunks.slice(0, 5);

        if (ragSources.length > 0) {
          ragContext = ragSources
            .map((chunk, i) => `[Source ${i + 1}]\n${chunk.content}`)
            .join('\n\n');
        }
      }

      const messages = this.buildMessages(
        systemPrompt,
        ragContext,
        conversationHistory || [],
        message,
      );

      const providerConfig = await this.resolveAIProvider(
        bot,
        effectiveKnowledgeBaseIds?.[0],
      );

      if (!providerConfig) {
        throw new UnprocessableEntityException(
          `No AI provider configured. Please configure an AI provider in Settings first.`,
        );
      }

      const finalModel = providerConfig.modelName || defaultModel;

      const answer = await this.aiProvidersService.chatWithHistoryUsingProvider(
        messages,
        finalModel,
        providerConfig.providerId,
        providerConfig.scope,
        providerConfig.scopeId,
        providerConfig.aiParameters,
      );

      return {
        answer,
        sources: ragSources,
      };
    } catch (error) {
      this.logger.error(`Error in chatWithBotAndRAG: ${error.message}`);
      throw error;
    }
  }

  public async gatherRAGContext(
    message: string,
    workspaceId: string,
    knowledgeBaseIds: string[],
  ): Promise<ChunkSource[]> {
    return this.searchService.gatherRAGContext(
      message,
      workspaceId,
      knowledgeBaseIds,
    );
  }

  private buildMessages(
    systemPrompt: string,
    ragContext: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    currentMessage: string,
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    let fullSystemPrompt = systemPrompt;

    const lang = I18nContext.current()?.lang;
    if (ragContext) {
      fullSystemPrompt +=
        `\n\n${this.i18n.t('ai.ragContextPrefix', { lang })}\n\n` +
        `${ragContext}\n\n` +
        this.i18n.t('ai.ragPromptPrefix', { lang });
    }

    return [
      { role: 'system', content: fullSystemPrompt },
      ...conversationHistory,
      { role: 'user', content: currentMessage },
    ];
  }

  private async resolveAIProvider(
    bot?: BotEntity | null,
    knowledgeBaseId?: string,
  ): Promise<{
    providerId: string;
    scope: 'workspace' | 'user';
    scopeId: string;
    modelName?: string;
    aiParameters?: Record<string, any>;
  } | null> {
    this.logger.debug(
      `🔎 Resolving AI Provider for Bot: ${bot?.id || 'none'}, KB: ${knowledgeBaseId || 'none'}`,
    );

    // 1. Knowledge Base specific AI settings (Specific Config ID)
    if (knowledgeBaseId && isUUID(knowledgeBaseId)) {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      if (kb?.aiConfigId) {
        // Try workspace config first
        if (kb.workspaceId) {
          const config = await this.aiProvidersService.getWorkspaceConfig(
            kb.workspaceId,
            kb.aiConfigId,
          );
          if (config && config.isActive) {
            return {
              providerId: config.providerId,
              scope: 'workspace',
              scopeId: kb.workspaceId,
              modelName: kb.ragModel || undefined,
              aiParameters: kb.aiParameters as Record<string, any>,
            };
          }
        }
      }
    }

    // 2. Bot specific AI settings (Config ID now)
    if (bot && bot.aiConfigId) {
      if (bot.workspaceId) {
        // Now retrieving using the Config ID directly
        const config = await this.aiProvidersService.getWorkspaceConfig(
          bot.workspaceId,
          bot.aiConfigId,
        );

        if (config) {
          return {
            providerId: config.providerId, // Resolved Provider ID from Config
            scope: 'workspace',
            scopeId: bot.workspaceId,
            modelName: bot.aiModelName || undefined,
            aiParameters: (bot as any).aiParameters as Record<string, any>,
          };
        }
      }

      if (bot.createdBy) {
        const config = await this.aiProvidersService.getUserConfig(
          bot.createdBy,
          bot.aiConfigId,
        );

        if (config) {
          return {
            providerId: config.providerId,
            scope: 'user',
            scopeId: bot.createdBy,
            modelName: bot.aiModelName || undefined,
            aiParameters: (bot as any).aiParameters as Record<string, any>,
          };
        }
      }
    }

    return null;
  }
}
