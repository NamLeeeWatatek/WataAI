import {
  Injectable,
  Logger,
  UnprocessableEntityException,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { KBVectorService } from './kb-vector.service';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';
import type { ChatMessage } from '../../ai-providers/ai-providers.service';
import {
  BotEntity,
  BotKnowledgeBaseEntity,
} from '../../bots/infrastructure/persistence/relational/entities/bot.entity';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';
import { KbAiConfig } from '../config/kb-ai.config';
import { ILike } from 'typeorm';
import { isUUID } from '../../utils/is-uuid';

export interface ChunkSource {
  content: string;
  score: number;
  documentId: string;
  chunkIndex: number;
  metadata?: Record<string, any>;
}

export interface RAGResult {
  answer: string;
  sources: ChunkSource[];
}

interface RRFResult {
  chunk: Omit<ChunkSource, 'score'>;
  score: number;
}

@Injectable()
export class KBRagService {
  private readonly logger = new Logger(KBRagService.name);

  constructor(
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly vectorService: KBVectorService,
    private readonly aiProvidersService: AiProvidersService,
    @InjectRepository(BotEntity)
    private readonly botRepository: Repository<BotEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(BotKnowledgeBaseEntity)
    private readonly botKbRepository: Repository<BotKnowledgeBaseEntity>,
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
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
    if (useHybrid) {
      return this.hybridQuery(
        query,
        workspaceId,
        knowledgeBaseId,
        limit,
        similarityThreshold,
      );
    }

    try {
      const queryEmbedding =
        await this.embeddingsService.generateQueryEmbedding(
          query,
          undefined,
          knowledgeBaseId,
        );
      const filter = knowledgeBaseId ? { knowledgeBaseId } : undefined;
      const results = await this.vectorService.search(
        queryEmbedding,
        workspaceId,
        limit,
        filter,
      );
      if (results.length > 0) {
        results.forEach((r, i) => {
          this.logger.log(
            `  [${i + 1}] Score: ${r.score.toFixed(4)} | Content: ${r.payload.content?.substring(0, 100)}...`,
          );
        });
      }

      const filteredResults = results.filter(
        (r) => r.score >= similarityThreshold,
      );

      const validResults = filteredResults.filter((r) => r.payload.content);

      return validResults.map((result) => ({
        content: String(result.payload.content || ''),
        score: Number(result.score),
        metadata: (result.payload.metadata as Record<string, any>) || {},
        documentId: String(result.payload.documentId || ''),
        chunkIndex: Number(result.payload.chunkIndex || 0),
      }));
    } catch (error) {
      this.logger.error(`Error querying knowledge base: ${error.message}`);
      throw error;
    }
  }

  async hybridQuery(
    query: string,
    workspaceId: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
  ): Promise<ChunkSource[]> {
    try {
      this.logger.log(`🔄 Performing Hybrid Search for: "${query}"`);

      // 1. Vector Search (Semantic)
      const queryEmbedding =
        await this.embeddingsService.generateQueryEmbedding(
          query,
          undefined,
          knowledgeBaseId,
        );
      const vectorResults = await this.vectorService.search(
        queryEmbedding,
        workspaceId,
        limit * 2, // Get more for re-ranking
        knowledgeBaseId ? { knowledgeBaseId } : undefined,
      );

      // 2. Keyword Search (Qdrant Payload Search)
      const keywordResults = await this.vectorService.searchByPayload(
        query,
        workspaceId,
        limit * 2,
        queryEmbedding.length, // Dynamic dimension from the actual embedding model
      );

      // 3. Merging with Reciprocal Rank Fusion (RRF)
      const rrfResults = new Map<string, { chunk: any; score: number }>();
      const k = 60; // Smoothing constant

      // Process Vector Results
      vectorResults.forEach((result, rank) => {
        const score = 1 / (k + rank);
        rrfResults.set(result.id, {
          chunk: {
            content: result.payload.content,
            metadata: result.payload.metadata,
            documentId: result.payload.documentId,
            chunkIndex: result.payload.chunkIndex,
          },
          score: score,
        });
      });

      // Process Keyword Results (from Qdrant)
      keywordResults.forEach((result, rank) => {
        const score = 1 / (k + rank);
        const existing = rrfResults.get(result.id);
        if (existing) {
          existing.score += score;
        } else {
          rrfResults.set(result.id, {
            chunk: {
              content: result.payload.content,
              metadata: result.payload.metadata,
              documentId: result.payload.documentId,
              chunkIndex: result.payload.chunkIndex,
            },
            score: score,
          });
        }
      });

      // Sort and Format
      const sortedResults = Array.from(rrfResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return sortedResults.map((r) => ({
        content: String(r.chunk.content || ''),
        metadata: r.chunk.metadata || {},
        documentId: String(r.chunk.documentId || ''),
        chunkIndex: Number(r.chunk.chunkIndex || 0),
        score: Number(r.score),
      }));
    } catch (error) {
      this.logger.error(`Error in hybrid query: ${error.message}`);
      // Fallback to simple vector search if hybrid fails
      return this.query(
        query,
        workspaceId,
        knowledgeBaseId,
        limit,
        similarityThreshold,
        false,
      );
    }
  }

  async *generateAnswerStream(
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
          const allChunks: ChunkSource[] = [];
          for (const kbId of knowledgeBaseIds) {
            const chunks = await this.query(
              question,
              workspaceId || 'default',
              kbId,
              3,
              0.5,
            );
            allChunks.push(...chunks);
          }
          relevantChunks = allChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
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

  private async gatherRAGContext(
    message: string,
    workspaceId: string,
    knowledgeBaseIds: string[],
  ): Promise<ChunkSource[]> {
    const allChunks: ChunkSource[] = [];

    for (const kbId of knowledgeBaseIds) {
      try {
        const chunks = await this.query(message, workspaceId, kbId, 3, 0.5);
        allChunks.push(...chunks);
      } catch (error) {
        this.logger.warn(`Failed to query KB ${kbId}: ${error.message}`);
      }
    }

    return allChunks.sort((a, b) => b.score - a.score).slice(0, 10);
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
            };
          }
        }

        // Try user config
        if (kb.createdBy) {
          const config = await this.aiProvidersService.getUserConfig(
            kb.createdBy,
            kb.aiConfigId,
          );
          if (config && config.isActive) {
            return {
              providerId: config.providerId,
              scope: 'user',
              scopeId: kb.createdBy,
              modelName: kb.ragModel || undefined,
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
          };
        }
      }

      if (bot.createdBy) {
        const config = await this.aiProvidersService.getUserConfig(
          bot.createdBy,
          bot.aiConfigId
        );

        if (config) {
          return {
            providerId: config.providerId,
            scope: 'user',
            scopeId: bot.createdBy,
            modelName: bot.aiModelName || undefined,
          };
        }
      }
    }

    return null;
  }

  // --- Expert RAG Enhancements ---

  /**
   * Expands context by fetching neighboring chunks (prev/next) for each retrieved chunk.
   * This helps simulate "Parent Document" retrieval and provides better flow.
   */
  private async expandContext(chunks: ChunkSource[]): Promise<ChunkSource[]> {
    if (chunks.length === 0) return [];
    this.logger.log(`Expanding context for ${chunks.length} chunks...`);

    const expandedChunks: ChunkSource[] = [];
    const seenChunkIds = new Set<string>(); // composite key: docId_chunkIndex

    for (const chunk of chunks) {
      const docId = chunk.documentId;
      const index = chunk.chunkIndex;

      // Add original chunk first
      const originalKey = `${docId}_${index}`;
      if (!seenChunkIds.has(originalKey)) {
        expandedChunks.push(chunk);
        seenChunkIds.add(originalKey);
      }

      // Try to fetch neighbor chunks (index - 1, index + 1)
      const neighbors = await this.chunkRepository.find({
        where: [
          { documentId: docId as any, chunkIndex: index - 1 },
          { documentId: docId as any, chunkIndex: index + 1 },
        ],
        order: { chunkIndex: 'ASC' },
      });

      for (const neighbor of neighbors) {
        const key = `${docId}_${neighbor.chunkIndex}`;
        if (!seenChunkIds.has(key)) {
          // Merge neighbor into result
          expandedChunks.push({
            content: neighbor.content,
            score: chunk.score * 0.9, // Decay score slightly
            documentId: neighbor.documentId,
            chunkIndex: neighbor.chunkIndex,
            metadata: neighbor.metadata || undefined,
          });
          seenChunkIds.add(key);
        }
      }
    }

    return expandedChunks.sort((a, b) => b.score - a.score);
  }

  /**
   * Uses an LLM to re-rank the retrieved chunks based on strict relevance.
   * Helps filter out "keyword match but context mismatch" results.
   */
  private async reRankChunks(
    question: string,
    chunks: ChunkSource[],
    topK: number,
  ): Promise<ChunkSource[]> {
    if (chunks.length <= topK) return chunks;
    this.logger.log(`Re-ranking ${chunks.length} candidates to top ${topK}...`);

    try {
      // Create a simplified list for the LLM
      const candidates = chunks.map((c, i) => ({
        id: i,
        content: c.content.substring(0, 300), // Truncate for speed/tokens
      }));

      const prompt = `
You are a relevance ranking expert.
Question: "${question}"

Rank the following text chunks by their relevance to the question.
Format your response as a JSON array of the indices of the top ${topK} most relevant chunks.
Example: [1, 5, 0]

Chunks:
${candidates.map((c) => `[${c.id}] ${c.content}`).join('\n')}

Response (JSON array only):
      `.trim();

      // Use a fast model if possible, defaulting to the general chat simple
      const result = await this.aiProvidersService.chat(
        prompt,
        KbAiConfig.defaults.model,
      );

      // Parse JSON
      const match = result.match(/\[.*\]/s);
      if (!match) {
        this.logger.warn(
          'Re-ranking failed to parse JSON, returning original top K',
        );
        return chunks.slice(0, topK);
      }

      const indices: number[] = JSON.parse(match[0]);

      // Map back to original chunks
      const reRanked = indices.map((i) => chunks[i]).filter(Boolean); // Filter undefined if LLM hallucinated an index

      // Fill with original top chunks if LLM returned too few
      if (reRanked.length < topK) {
        const remaining = chunks.filter((c) => !reRanked.includes(c));
        reRanked.push(...remaining.slice(0, topK - reRanked.length));
      }

      // Preserve full content (LLM saw truncated)
      return reRanked;
    } catch (error) {
      this.logger.error(`Re-ranking failed: ${error.message}`);
      return chunks.slice(0, topK); // Fallback
    }
  }
}
