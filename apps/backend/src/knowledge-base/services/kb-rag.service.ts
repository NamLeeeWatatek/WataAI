import { Injectable, Logger } from '@nestjs/common';
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
import { ILike } from 'typeorm';
import { KbAiConfig } from '../config/kb-ai.config';

export interface RAGResult {
  answer: string;
  sources: Array<{
    content: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
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
  ) {
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
  ) {
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
        queryEmbedding.length // Dynamic dimension from the actual embedding model
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
              score: score,
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
      // Cast to any to bypass the missing hybridQuery error if it still exists during application
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

  async generateAnswer(
    question: string,
    knowledgeBaseId?: string,
    model?: string,
    options?: {
      limit?: number;
      similarityThreshold?: number;
    },
  ): Promise<RAGResult> {
    try {
      const limit = options?.limit || 5;
      const threshold = options?.similarityThreshold || 0.5;

      const relevantChunks = await this.query(
        question,
        'system', // Default scope if knowledgeBaseId missing, but generateAnswerFromKb handles it
        knowledgeBaseId,
        limit,
        threshold,
      );

      if (relevantChunks.length === 0) {
        this.logger.warn(
          `⚠️ No relevant chunks found for question: "${question}"`,
        );
        const lang = I18nContext.current()?.lang;
        return {
          answer: this.i18n.t('ai.ragNoInfo', { lang }),
          sources: [],
        };
      }

      this.logger.log(
        `✅ Using ${relevantChunks.length} chunks for answer generation`,
      );

      const context = relevantChunks
        .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
        .join('\n\n');

      const lang = I18nContext.current()?.lang;
      const prompt = `${this.i18n.t('ai.ragPromptPrefix', { lang })}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

      // ✅ Use configured AI provider for the knowledge base if available
      let answer: string;
      if (knowledgeBaseId) {
        // Try to get knowledge base and use its configured AI provider
        answer = await this.generateAnswerFromKb(
          prompt,
          knowledgeBaseId,
          model,
        );
      } else {
        // Fallback to default provider
        answer = await this.aiProvidersService.chat(
          prompt,
          model || KbAiConfig.defaults.model,
        );
      }

      return {
        answer,
        sources: relevantChunks.map((chunk) => ({
          content: chunk.content,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
      };
    } catch (error) {
      this.logger.error(`Error generating answer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate answer using knowledge base's configured AI provider
   */
  private async generateAnswerFromKb(
    prompt: string,
    knowledgeBaseId: string,
    model?: string,
  ): Promise<string> {
    try {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      // Use KB's RAG model if configured, otherwise fall back to the model parameter or default
      const finalModel = kb?.ragModel || model || KbAiConfig.defaults.model;

      if (kb && kb.aiProviderId) {
        const userId = kb.createdBy || 'system';

        // Try workspace provider first, then user provider
        if (
          kb.workspaceId &&
          (await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          )) &&
          kb.workspaceId
        ) {
          this.logger.log(
            `🔎 Using KB's workspace AI provider: ${kb.aiProviderId} with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chatWithHistoryUsingProvider(
            [{ role: 'user', content: prompt }],
            finalModel,
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          );
        } else if (
          await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'user',
            userId,
          )
        ) {
          this.logger.log(
            `🔎 Using KB's user AI provider: ${kb.aiProviderId} with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chatWithHistoryUsingProvider(
            [{ role: 'user', content: prompt }],
            finalModel,
            kb.aiProviderId,
            'user',
            userId as string,
          );
        } else {
          this.logger.log(
            `🔎 KB AI provider ${kb.aiProviderId} not found, using default with model: ${finalModel}`,
          );
          return await this.aiProvidersService.chat(prompt, finalModel);
        }
      } else {
        this.logger.log(
          `🔎 KB provider config incomplete, using default with model: ${finalModel}`,
        );
        return await this.aiProvidersService.chat(prompt, finalModel);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to use KB AI provider, falling back to default: ${error.message}`,
      );
      return await this.aiProvidersService.chat(
        prompt,
        model || KbAiConfig.defaults.model,
      );
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
          'aiProviderId',
          'aiModelName',
          'createdBy',
        ],
      });

      if (!bot) {
        throw new Error(`Bot ${agentId} not found`);
      }

      const workspaceId = bot.workspaceId ?? undefined;
      const aiProviderId = bot.aiProviderId ?? undefined;
      const modelName = model || bot.aiModelName || KbAiConfig.defaults.model;

      this.logger.log(
        `🤖 Bot: ${bot.name}, Workspace: ${workspaceId}, AI Provider: ${aiProviderId || 'auto'}, Model: ${modelName}`,
      );

      let relevantChunks: any[] = [];

      // Get linked knowledge bases for the bot
      const linkedKBs = await this.botKbRepository.find({
        where: {
          botId: agentId,
          isActive: true,
        },
        select: ['knowledgeBaseId'],
        order: { priority: 'ASC' },
      });

      const knowledgeBaseIds = linkedKBs.map((lkb) => lkb.knowledgeBaseId);

      // Try to query knowledge base, but don't fail if it errors
      if (knowledgeBaseIds.length > 0) {
        try {
          // Query across all linked knowledge bases
          const allChunks: any[] = [];
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
          // Sort by score and take top 5
          relevantChunks = allChunks
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

          this.logger.log(
            `✅ Found ${relevantChunks.length} relevant chunks from ${knowledgeBaseIds.length} linked KBs`,
          );
        } catch (kbError) {
          this.logger.warn(
            `⚠️ Knowledge base query failed: ${kbError.message}. Continuing without KB context.`,
          );
          // Continue without KB context
        }
      } else {
        this.logger.log(`⚠️ No linked knowledge bases for bot ${bot.name}`);
      }

      let systemPrompt = botSystemPrompt || 'You are a helpful assistant.';

      if (relevantChunks.length > 0) {
        const context = relevantChunks
          .map((chunk, index) => `[${index + 1}] ${chunk.content}`)
          .join('\n\n');

        systemPrompt += `\n\nUse the following context from the knowledge base to answer questions:\n\n${context}`;
        this.logger.log(`📚 Using KB context (${context.length} chars)`);
      } else {
        this.logger.log(`💬 No KB context available, using AI only`);
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

      // Use chatWithHistoryUsingProvider to properly get API key from user settings
      const answer = aiProviderId
        ? await this.aiProvidersService.chatWithHistoryUsingProvider(
          messages,
          modelName,
          aiProviderId,
          workspaceId ? 'workspace' : 'user',
          workspaceId || bot.createdBy || 'system',
        )
        : await this.aiProvidersService.chatWithHistory(messages, modelName);

      return {
        answer,
        sources: relevantChunks.map((chunk) => ({
          content: chunk.content,
          score: chunk.score,
          metadata: chunk.metadata,
        })),
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
            'aiProviderId',
            'aiModelName',
            'systemPrompt',
            'createdBy',
          ],
        })
        : null;

      if (botId && !bot) {
        throw new Error(`Bot ${botId} not found`);
      }

      const systemPrompt = bot?.systemPrompt || 'You are a helpful assistant.';
      const defaultModel = bot?.aiModelName || model || KbAiConfig.defaults.model;

      let effectiveKnowledgeBaseIds = knowledgeBaseIds;

      // If no explicit knowledge bases provided but we have a bot, use the bot's linked knowledge bases
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

      // Handle RAG context gathering (if knowledge bases available)
      let ragContext = '';
      let ragSources: Array<{
        content: string;
        score: number;
        metadata?: Record<string, any>;
      }> = [];

      if (effectiveKnowledgeBaseIds && effectiveKnowledgeBaseIds.length > 0) {
        const ragWorkspaceId = bot?.workspaceId || 'default';
        const allChunks = await this.gatherRAGContext(
          message,
          ragWorkspaceId,
          effectiveKnowledgeBaseIds!,
        );
        ragSources = allChunks.slice(0, 5); // Top 5 results

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

      // Get AI provider using proper hierarchy: KB Workspace > KB User > Bot Provider > User Configs > Error
      const providerConfig = await this.resolveAIProvider(
        bot,
        effectiveKnowledgeBaseIds?.[0],
      );

      if (!providerConfig) {
        throw new Error(
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
        sources: ragSources.map((s) => ({
          content: String(s.content || ''),
          score: Number(s.score || 0),
          metadata: (s.metadata as Record<string, any>) || {},
        })),
      };
    } catch (error) {
      this.logger.error(`Error in chatWithBotAndRAG: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gather RAG context from knowledge bases
   */
  private async gatherRAGContext(
    message: string,
    workspaceId: string,
    knowledgeBaseIds: string[],
  ): Promise<
    Array<{
      content: string;
      score: number;
      metadata?: Record<string, any>;
    }>
  > {
    const allChunks: Array<{
      content: string;
      score: number;
      metadata?: Record<string, any>;
    }> = [];

    for (const kbId of knowledgeBaseIds) {
      try {
        const chunks = await this.query(message, workspaceId, kbId, 3, 0.5);
        allChunks.push(...chunks);
      } catch (error) {
        this.logger.warn(`Failed to query KB ${kbId}: ${error.message}`);
      }
    }

    // Sort by score descending
    return allChunks
      .sort((a, b) => b.score - a.score)
      .map((chunk) => ({
        content: String(chunk.content || ''),
        score: Number(chunk.score || 0),
        metadata: (chunk.metadata as Record<string, any>) || {},
      }));
  }

  /**
   * Build conversation messages with system prompt, RAG context, and history
   */
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

  /**
   * Resolve AI provider with proper hierarchy
   * Priority: KB Workspace Provider > KB User Provider > Bot Provider > User Configs > Fail
   */
  private async resolveAIProvider(
    bot?: BotEntity | null,
    knowledgeBaseId?: string,
  ): Promise<{
    providerId: string;
    scope: 'workspace' | 'user';
    scopeId: string;
    modelName?: string;
  } | null> {
    // 1. Knowledge Base AI provider (Highest priority)
    if (knowledgeBaseId) {
      const kb = await this.kbRepository.findOne({
        where: { id: knowledgeBaseId },
      });

      if (kb?.aiProviderId) {
        // Try KB Workspace Provider
        if (
          kb.workspaceId &&
          (await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'workspace',
            kb.workspaceId,
          ))
        ) {
          return {
            providerId: kb.aiProviderId,
            scope: 'workspace',
            scopeId: kb.workspaceId,
            modelName: kb.ragModel || undefined,
          };
        }

        // Try KB User Provider
        const userId = kb.createdBy || 'system';
        if (
          await this.aiProvidersService.configExists(
            kb.aiProviderId,
            'user',
            userId,
          )
        ) {
          return {
            providerId: kb.aiProviderId,
            scope: 'user',
            scopeId: userId as string,
            modelName: kb.ragModel || undefined,
          };
        }
      }
    }

    // 2. Bot's AI provider (Secondary priority)
    if (bot?.aiProviderId) {
      if (
        bot.workspaceId &&
        (await this.aiProvidersService.configExists(
          bot.aiProviderId,
          'workspace',
          bot.workspaceId,
        ))
      ) {
        return {
          providerId: bot.aiProviderId,
          scope: 'workspace',
          scopeId: bot.workspaceId,
          modelName: bot.aiModelName || undefined,
        };
      }

      if (
        await this.aiProvidersService.configExists(
          bot.aiProviderId,
          'user',
          bot.createdBy || 'system',
        )
      ) {
        return {
          providerId: bot.aiProviderId,
          scope: 'user',
          scopeId: bot.createdBy || 'system',
          modelName: bot.aiModelName || undefined,
        };
      }
    }

    // 3. Fallback to Bot's user or system default
    const fallbackUserId = bot?.createdBy || 'system';
    const fallbackProviderId = 'gemini'; // Default fallback

    try {
      if (
        await this.aiProvidersService.configExists(
          fallbackProviderId,
          'user',
          fallbackUserId,
        )
      ) {
        this.logger.log(`Using default fallback provider: ${fallbackProviderId}`);
        return {
          providerId: fallbackProviderId,
          scope: 'user',
          scopeId: fallbackUserId,
        };
      }
    } catch (e) {
      // Ignore
    }

    return null;
  }
}
