import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';
import { KBVectorService } from './kb-vector.service';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '../utils/recursive-text-splitter';

export interface TextChunk {
  content: string;
  startChar: number;
  endChar: number;
  tokenCount?: number;
}

@Injectable()
export class KBEmbeddingsService {
  private readonly logger = new Logger(KBEmbeddingsService.name);

  constructor(
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    private readonly aiProvidersService: AiProvidersService,
    private readonly vectorService: KBVectorService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  async chunkText(
    text: string,
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
  ): Promise<TextChunk[]> {
    if (!text || text.length === 0) return [];

    // Use the smart RecursiveCharacterTextSplitter
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''], // Preserves paragraphs/sentences
      keepSeparator: false
    });

    const rawChunks = await splitter.splitText(text);

    // Map back to TextChunk format (simplified start/end char tracking)
    // Note: Recursive splitter loses exact char indices easily, 
    // so we approximate or scan. For RAG, content is king.

    let currentPos = 0;
    return rawChunks.map(content => {
      // Find approximate real position (optional optimization)
      const startChar = text.indexOf(content, currentPos);
      const realStart = startChar !== -1 ? startChar : currentPos;
      currentPos = realStart + content.length;

      return {
        content,
        startChar: realStart,
        endChar: currentPos,
        tokenCount: this.estimateTokenCount(content)
      };
    });
  }

  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async processChunks(chunks: KBChunkEntity[], embeddingModel?: string) {
    await this.processChunksWithProgress(chunks, embeddingModel);
  }

  async processChunksWithProgress(
    chunks: KBChunkEntity[],
    embeddingModel?: string,
    onProgress?: (processed: number, total: number) => void,
  ) {
    if (chunks.length === 0) return;

    const kbId = chunks[0].knowledgeBaseId;
    const kb = await this.kbRepository.findOne({
      where: { id: kbId },
      select: ['workspaceId', 'createdBy', 'aiProviderId', 'embeddingModel'],
    });
    const workspaceId = kb?.workspaceId || undefined;
    const userId = kb?.createdBy;
    const kbAiProviderId = kb?.aiProviderId || undefined;
    const kbEmbeddingModel =
      embeddingModel || kb?.embeddingModel || 'text-embedding-004';

    // Get provider config based on KB's settings
    const providerConfig = await this.getProviderConfig(
      userId || undefined,
      workspaceId || undefined,
      kbAiProviderId || undefined,
      kbEmbeddingModel,
    );
    const provider = providerConfig.provider;
    const model = providerConfig.model;
    const requiresApiKey = providerConfig.requiresApiKey;


    // Only fetch API key for providers that require it
    let apiKey: string | undefined;

    if (requiresApiKey) {
      // Try to get API key from workspace scope first
      if (workspaceId) {
        const workspaceConfigs =
          await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
        const config = workspaceConfigs.find(
          (c) => c.providerId === kbAiProviderId,
        );
        if (config?.config?.apiKey) {
          apiKey = config.config.apiKey;
        }
      }
      // Fall back to user scope
      if (!apiKey && userId) {
        const userConfigs =
          await this.aiProvidersService.getUserConfigs(userId);
        const config = userConfigs.find((c) => c.providerId === kbAiProviderId);
        if (config?.config?.apiKey) {
          apiKey = config.config.apiKey;
        }
      }

      if (!apiKey) {
        throw new BadRequestException(
          `No API key configured for provider ${provider}`,
        );
      }
    }


    const batchSize = 10;
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (chunk) => {
          try {
            chunk.embeddingStatus = KbProcessingStatus.PROCESSING;
            await this.chunkRepository.save(chunk);

            let embedding: number[];
            try {
              // For providers that require API key, get it
              let apiKey: string | undefined;

              if (requiresApiKey) {
                // Try to get API key for the configured provider
                try {
                  // Try to get API key from workspace scope first
                  if (workspaceId) {
                    const configs =
                      await this.aiProvidersService.getWorkspaceConfigs(
                        workspaceId,
                      );
                    const config = configs.find(
                      (c) => c.providerId === kbAiProviderId,
                    );
                    if (config?.config?.apiKey) {
                      apiKey = config.config.apiKey;
                    }
                  }
                  // Fall back to user scope
                  if (!apiKey && userId) {
                    const configs =
                      await this.aiProvidersService.getUserConfigs(userId);
                    const config = configs.find(
                      (c) => c.providerId === kbAiProviderId,
                    );
                    if (config?.config?.apiKey) {
                      apiKey = config.config.apiKey;
                    }
                  }
                } catch (error) {
                  this.logger.warn(
                    `Failed to get API key for embedding: ${error.message}`,
                  );
                }

                if (!apiKey) {
                  throw new BadRequestException(
                    `No API key configured for provider ${provider}`,
                  );
                }
              }

              // Generate embedding with API key (or undefined for local providers)
              embedding = await this.aiProvidersService.generateEmbedding(
                chunk.content,
                provider,
                model,
                apiKey, // Pass the API key (or undefined for local providers)
                { baseUrl: providerConfig.baseUrl }, // Pass baseUrl for Ollama
              );
            } catch (error) {
              // If selected provider fails, try fallback
              if (
                provider === 'google' &&
                error.message.includes('No API key configured for google')
              ) {
                this.logger.log(
                  `Google embedding failed for chunk ${chunk.id}, trying OpenAI...`,
                );
                try {
                  embedding = await this.aiProvidersService.generateEmbedding(
                    chunk.content,
                    'openai',
                    'text-embedding-ada-002',
                  );
                } catch (openaiError) {
                  this.logger.error(
                    `No embedding provider configured for chunk ${chunk.id}: both Google and OpenAI failed`,
                  );
                  throw new BadRequestException(
                    'No embedding provider configured. Please configure Google or OpenAI API key in Settings > AI Providers.',
                  );
                }
              } else if (
                provider === 'openai' &&
                error.message.includes('No API key configured for openai')
              ) {
                this.logger.log(
                  `OpenAI embedding failed for chunk ${chunk.id}, trying Google...`,
                );
                try {
                  embedding = await this.aiProvidersService.generateEmbedding(
                    chunk.content,
                    'google',
                    embeddingModel || 'text-embedding-004',
                  );
                } catch (googleError) {
                  this.logger.error(
                    `No embedding provider configured for chunk ${chunk.id}: both OpenAI and Google failed`,
                  );
                  throw new BadRequestException(
                    'No embedding provider configured. Please configure Google or OpenAI API key in Settings > AI Providers.',
                  );
                }
              } else {
                throw error;
              }
            }

            const vectorId = await this.vectorService.upsertVector(
              {
                id: chunk.id,
                vector: embedding,
                payload: {
                  content: chunk.content,
                  documentId: chunk.documentId,
                  knowledgeBaseId: chunk.knowledgeBaseId,
                  workspace_id: workspaceId,
                  chunkIndex: chunk.chunkIndex,
                  metadata: chunk.metadata,
                },
              },
              workspaceId || 'default',
            );

            chunk.vectorId = vectorId;
            chunk.embeddingStatus = KbProcessingStatus.COMPLETED;
            await this.chunkRepository.save(chunk);

            processedCount++;
            if (onProgress) {
              onProgress(processedCount, chunks.length);
            }
          } catch (error) {
            chunk.embeddingStatus = KbProcessingStatus.FAILED;
            chunk.embeddingError = error.message;
            await this.chunkRepository.save(chunk);
            this.logger.error(
              `❌ Failed to embed chunk ${chunk.id}: ${error.message}`,
            );

            processedCount++;
            if (onProgress) {
              onProgress(processedCount, chunks.length);
            }
          }
        }),
      );

      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  async generateQueryEmbedding(
    query: string,
    embeddingModel?: string,
    kbId?: string,
  ): Promise<number[]> {
    let userId: string | undefined;
    let workspaceId: string | undefined;
    let kbAiProviderId: string | undefined;
    let effectiveEmbeddingModel = embeddingModel;

    if (kbId) {
      const kb = await this.kbRepository.findOne({
        where: { id: kbId },
        select: ['workspaceId', 'createdBy', 'aiProviderId', 'embeddingModel'],
      });
      userId = kb?.createdBy ?? undefined;
      workspaceId = kb?.workspaceId || undefined;
      kbAiProviderId = kb?.aiProviderId || undefined;
      if (kb?.embeddingModel) {
        effectiveEmbeddingModel = kb.embeddingModel;
      }
    }

    // Get provider config using the same logic as chunk processing
    const providerConfig = await this.getProviderConfig(
      userId || undefined,
      workspaceId || undefined,
      kbAiProviderId,
      effectiveEmbeddingModel,
    );
    const provider = providerConfig.provider;
    const model = providerConfig.model;
    const requiresApiKey = providerConfig.requiresApiKey;

    this.logger.debug(
      `Generating Query Embedding for KB: ${kbId || 'system'} | Provider: ${provider} | Model: ${model}`,
    );

    // Get API key only if required
    let apiKey: string | undefined;
    if (requiresApiKey) {
      try {
        // Try to get API key from workspace scope first
        if (workspaceId) {
          const workspaceConfigs =
            await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
          const config = workspaceConfigs.find((c) => c.providerId === kbId);
          if (config?.config?.apiKey) {
            apiKey = config.config.apiKey;
          }
        }
        // Fall back to user scope
        if (!apiKey && userId) {
          const userConfigs =
            await this.aiProvidersService.getUserConfigs(userId);
          const config = userConfigs.find((c) => c.providerId === kbId);
          if (config?.config?.apiKey) {
            apiKey = config.config.apiKey;
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get API key for query embedding: ${error.message}`,
        );
      }

      if (!apiKey) {
        throw new BadRequestException(
          `No API key configured for provider ${provider}`,
        );
      }
    }

    // Check cache first
    const cacheKey = `embedding:${provider}:${model}:${Buffer.from(query).toString('base64').substring(0, 100)}`;
    const cached = await this.cacheManager.get<number[]>(cacheKey);
    if (cached) {
      this.logger.log(
        `🚀 Using cached embedding for: "${query.substring(0, 50)}..."`,
      );
      return cached;
    }

    try {
      const embedding = await this.aiProvidersService.generateEmbedding(
        query,
        provider,
        model,
        apiKey,
        { baseUrl: providerConfig.baseUrl },
      );

      // Cache for 1 hour (3600 seconds)
      await this.cacheManager.set(cacheKey, embedding, 3600);
      return embedding;
    } catch (error) {
      // If the selected provider fails, try fallback providers
      this.logger.error(
        `Primary embedding provider ${provider} failed: ${error.message}`,
      );

      // Try fallback combinations
      const fallbackAttempts = [
        provider === 'google'
          ? { provider: 'openai', model: 'text-embedding-ada-002' }
          : null,
        provider === 'openai'
          ? { provider: 'google', model: embeddingModel }
          : null,
        { provider: 'ollama', model: embeddingModel }, // Try Ollama as last resort
      ].filter(Boolean);

      for (const attempt of fallbackAttempts) {
        if (!attempt) continue;

        try {
          this.logger.log(
            `Trying fallback embedding: ${attempt.provider} with model ${attempt.model}`,
          );
          // For Ollama fallback, check if it requires API key
          const fallbackRequiresKey = attempt.provider !== 'ollama';
          const fallbackApiKey = fallbackRequiresKey ? apiKey : undefined; // Use same key for other providers, undefined for Ollama

          return this.aiProvidersService.generateEmbedding(
            query,
            attempt.provider,
            attempt.model || 'text-embedding-3-small',
            fallbackApiKey,
          );
        } catch (fallbackError) {
          this.logger.warn(
            `Fallback embedding ${attempt.provider} failed: ${fallbackError.message}`,
          );
        }
      }

      throw new BadRequestException(
        'No embedding provider configured. Please configure Google, OpenAI, or Ollama API key in Settings > AI Providers.',
      );
    }
  }

  private async getKbWorkspaceId(kbId: string): Promise<string | null> {
    const kb = await this.kbRepository.findOne({
      where: { id: kbId },
      select: ['workspaceId'],
    });
    return kb?.workspaceId || null;
  }

  private async getProviderConfig(
    userId?: string,
    workspaceId?: string,
    providerId?: string,
    preferredModel?: string,
  ): Promise<{ provider: string; model: string; requiresApiKey: boolean; baseUrl?: string }> {
    // 1. Try to find the specifically configured provider
    if (providerId) {
      const scopes = [
        workspaceId ? { id: workspaceId, type: 'workspace' } : null,
        userId ? { id: userId, type: 'user' } : null,
      ].filter(Boolean);

      for (const scope of scopes) {
        if (!scope) continue;

        try {
          const configs =
            scope.type === 'workspace'
              ? await this.aiProvidersService.getWorkspaceConfigs(scope.id)
              : await this.aiProvidersService.getUserConfigs(scope.id);

          const config = configs.find(
            (c) => c.providerId === providerId,
          );

          if (config && config.provider && config.provider.key) {
            const providerKey = config.provider.key;
            // OpenAI and Google require API keys (unless using Vertex AI but simplicity first)
            // Ollama and Custom typically don't (or use internal auth)
            const requiresApiKey =
              providerKey !== 'ollama' && providerKey !== 'custom';

            const baseUrl = config.config?.baseUrl;

            // Determines the embedding model to use
            let model = 'text-embedding-ada-002'; // default

            // For Ollama/Custom, we respect the KB's specific embedding model setting
            // or fall back to sensible defaults
            if (providerKey === 'ollama' || providerKey === 'custom') {
              model = preferredModel ||
                (providerKey === 'ollama' ? 'mxbai-embed-large:latest' : 'text-embedding-ada-002');
            } else if (providerKey === 'google') {
              model = 'text-embedding-004';
            }

            return {
              provider: providerKey,
              model,
              requiresApiKey,
              baseUrl,
            };
          }
        } catch (error) {
          this.logger.warn(`Error checking ${scope.type} config: ${error.message}`);
        }
      }
    }

    // 2. Fallback: No specific provider found (or not configured). 
    // Search for ANY available provider, prioritizing local/Ollama.
    const scopes = [
      workspaceId ? { id: workspaceId, type: 'workspace' } : null,
      userId ? { id: userId, type: 'user' } : null,
    ].filter(Boolean);

    for (const scope of scopes) {
      if (!scope) continue;

      try {
        const configs =
          scope.type === 'workspace'
            ? await this.aiProvidersService.getWorkspaceConfigs(scope.id)
            : await this.aiProvidersService.getUserConfigs(scope.id);

        // Priority 1: Ollama
        const ollamaConfig = configs.find((c) => c.provider?.key === 'ollama');
        if (ollamaConfig) {
          return {
            provider: 'ollama',
            model: preferredModel || 'mxbai-embed-large:latest',
            requiresApiKey: false,
            baseUrl: ollamaConfig.config?.baseUrl,
          };
        }

        // Priority 2: Google
        const googleConfig = configs.find((c) => c.provider?.key === 'google');
        if (googleConfig && googleConfig.config?.apiKey) {
          return {
            provider: 'google',
            model: 'text-embedding-004',
            requiresApiKey: true,
          };
        }

        // Priority 3: OpenAI
        const openaiConfig = configs.find((c) => c.provider?.key === 'openai');
        if (openaiConfig && openaiConfig.config?.apiKey) {
          return {
            provider: 'openai',
            model: 'text-embedding-ada-002',
            requiresApiKey: true,
          };
        }
      } catch (error) {
        this.logger.warn(`Error checking ${scope.type} fallback: ${error.message}`);
      }
    }

    // 3. Absolute Fallback
    this.logger.warn('No configured AI providers found for embeddings. Defaulting to Google placeholders.');
    return {
      provider: 'google',
      model: 'text-embedding-004',
      requiresApiKey: true,
    };
  }

  // Cleaned up helper for legacy support or internal use
  private async getEmbeddingProvider(
    userId?: string,
    workspaceId?: string,
    kbId?: string,
  ): Promise<{ provider: string; model: string }> {
    // Reuse getProviderConfig logic
    const config = await this.getProviderConfig(userId, workspaceId, kbId, undefined);
    return { provider: config.provider, model: config.model };
  }

  async deleteVector(vectorId: string, dimension: number): Promise<void> {
    return this.vectorService.deleteVector(vectorId, dimension);
  }

  /**
   * Probes the dimension of an embedding model.
   * Useful for automatic collection initialization.
   */
  async probeDimension(
    provider: string,
    model: string,
    apiKey?: string,
    options?: { baseUrl?: string },
  ): Promise<number> {
    const cacheKey = `dim_probe:${provider}:${model}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    if (cached) return cached;

    try {
      this.logger.debug(`🔍 Probing dimension for ${provider}/${model}...`);
      const embedding = await this.aiProvidersService.generateEmbedding(
        'probe',
        provider,
        model,
        apiKey,
        options,
      );
      const dimension = embedding.length;
      await this.cacheManager.set(cacheKey, dimension, 86400); // 24h
      return dimension;
    } catch (error) {
      this.logger.error(`Failed to probe dimension: ${error.message}`);
      throw error;
    }
  }
}
