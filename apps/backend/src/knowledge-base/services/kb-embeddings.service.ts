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
  ) {}

  chunkText(
    text: string,
    chunkSize: number = 1000,
    chunkOverlap: number = 200,
  ): TextChunk[] {
    const chunks: TextChunk[] = [];

    if (!text || text.length === 0) return chunks;
    if (chunkSize <= 0) chunkSize = 1000;
    if (chunkOverlap < 0) chunkOverlap = 0;
    if (chunkOverlap >= chunkSize) chunkOverlap = Math.floor(chunkSize * 0.2);

    let startChar = 0;
    const maxChunks = 10000;
    let chunkCount = 0;

    while (startChar < text.length && chunkCount < maxChunks) {
      const endChar = Math.min(startChar + chunkSize, text.length);
      const content = text.slice(startChar, endChar);

      chunks.push({
        content,
        startChar,
        endChar,
        tokenCount: this.estimateTokenCount(content),
      });

      chunkCount++;

      const step = chunkSize - chunkOverlap;
      if (step <= 0) break;

      startChar += step;
      if (startChar >= text.length) break;
    }

    if (chunkCount >= maxChunks) {
      this.logger.warn(`Document too large, truncated to ${maxChunks} chunks`);
    }

    return chunks;
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
    );
    const provider = providerConfig.provider;
    const model = providerConfig.model;
    const requiresApiKey = providerConfig.requiresApiKey;

    // Debug logging
    this.logger.log(
      `KB ${kbId} - User: ${userId}, Workspace: ${workspaceId}, KB Provider ID: ${kbAiProviderId}`,
    );
    this.logger.log(
      `KB ${kbId} - Selected provider: ${provider}, model: ${model}, requiresApiKey: ${requiresApiKey}`,
    );

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

    this.logger.log(
      `Using embedding provider ${provider} with model ${model} for KB ${kbId} ${requiresApiKey ? '(with API key)' : '(local)'}`,
    );

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
              } else {
                // For local providers (Ollama/Custom), use undefined apiKey
                this.logger.log(
                  `Using local provider ${provider}, no API key required`,
                );
              }

              // Generate embedding with API key (or undefined for local providers)
              embedding = await this.aiProvidersService.generateEmbedding(
                chunk.content,
                provider,
                model,
                apiKey, // Pass the API key (or undefined for local providers)
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
                    embeddingModel,
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
              `âŒ Failed to embed chunk ${chunk.id}: ${error.message}`,
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
    embeddingModel: string = 'text-embedding-004',
    kbId?: string,
  ): Promise<number[]> {
    let userId: string | undefined;
    let workspaceId: string | undefined;

    if (kbId) {
      const kb = await this.kbRepository.findOne({
        where: { id: kbId },
        select: ['workspaceId', 'createdBy', 'aiProviderId', 'embeddingModel'],
      });
      userId = kb?.createdBy ?? undefined;
      workspaceId = kb?.workspaceId || undefined;
    }

    // Get provider config using the same logic as chunk processing
    const providerConfig = await this.getProviderConfig(
      userId || undefined,
      workspaceId || undefined,
      kbId,
    );
    const provider = providerConfig.provider;
    const model = providerConfig.model;
    const requiresApiKey = providerConfig.requiresApiKey;

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
        `ðŸš€ Using cached embedding for: "${query.substring(0, 50)}..."`,
      );
      return cached;
    }

    try {
      const embedding = await this.aiProvidersService.generateEmbedding(
        query,
        provider,
        model,
        apiKey,
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
            attempt.model,
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
    kbAiProviderId?: string,
  ): Promise<{ provider: string; model: string; requiresApiKey: boolean }> {
    // Try to find a configured provider from KB settings
    if (kbAiProviderId && (workspaceId || userId)) {
      try {
        // Check both scopes - workspace first, then user
        const scopes = [
          workspaceId ? 'workspace' : null,
          userId ? 'user' : null,
        ].filter(Boolean);

        this.logger.log(
          `Looking for provider config: kbAiProviderId=${kbAiProviderId}, scopes=${scopes.join(', ')}`,
        );

        for (const scope of scopes) {
          if (!scope) continue;

          const scopeId = scope === 'workspace' ? workspaceId : userId;
          if (!scopeId) continue;

          try {
            const configs =
              scope === 'workspace'
                ? await this.aiProvidersService.getWorkspaceConfigs(scopeId)
                : await this.aiProvidersService.getUserConfigs(scopeId);

            this.logger.log(
              `Checking ${scope} configs: found ${(configs as any[]).length} configs`,
            );
            (configs as any[]).forEach((cfg: any, i: number) => {
              this.logger.log(
                `  Config ${i}: providerId=${cfg.providerId}, provider.key=${cfg.provider?.key}`,
              );
            });

            // Find config with matching providerId
            const config = (configs as any[]).find(
              (cfg: any) => cfg.providerId === kbAiProviderId,
            );
            if (config && config.provider && config.provider.key) {
              this.logger.log(
                `Found matching config: provider=${config.provider.key}, active=${config.isActive}`,
              );

              const providerKey = config.provider.key;
              const requiresApiKey =
                providerKey !== 'ollama' && providerKey !== 'custom';

              // Get KB model for Ollama/Custom
              let kbModel = config.modelList?.[0] || 'text-embedding-004';
              if (providerKey === 'ollama' || providerKey === 'custom') {
                const kbData = await this.kbRepository.findOne({
                  where: { id: kbAiProviderId },
                  select: ['embeddingModel'],
                });
                kbModel =
                  kbData?.embeddingModel ||
                  (providerKey === 'ollama'
                    ? 'mxbai-embed-large:latest'
                    : 'text-embedding-ada-002');
                this.logger.log(`Using KB embedding model: ${kbModel}`);
              }

              let model = kbModel;
              if (providerKey === 'openai') {
                model = 'text-embedding-ada-002';
              } else if (providerKey === 'google') {
                model = kbModel || 'text-embedding-004';
              }

              this.logger.log(
                `Returning provider config: ${providerKey}, model=${model}, requiresApiKey=${requiresApiKey}`,
              );
              return {
                provider: providerKey,
                model,
                requiresApiKey,
              };
            } else {
              this.logger.log(
                `Config ID ${kbAiProviderId} not found in ${scope}`,
              );
            }
          } catch (error) {
            this.logger.warn(
              `Error checking ${scope} provider config: ${error.message}`,
            );
          }
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get provider config, using default: ${error.message}`,
        );
      }
    } else {
      this.logger.log(
        `No KB AI Provider ID provided, checking for available providers`,
      );
    }

    // Smart fallback: check available providers when KB config not found
    try {
      // Check for Ollama config first (preferred for local models)
      const scopes = [
        workspaceId ? 'workspace' : null,
        userId ? 'user' : null,
      ].filter(Boolean);

      for (const scope of scopes) {
        if (!scope) continue;

        const scopeId = scope === 'workspace' ? workspaceId : userId;
        if (!scopeId) continue;

        try {
          const configs =
            scope === 'workspace'
              ? await this.aiProvidersService.getWorkspaceConfigs(scopeId)
              : await this.aiProvidersService.getUserConfigs(scopeId);

          // Try Ollama first
          const ollamaConfig = (configs as any[]).find(
            (cfg: any) => cfg.provider?.key === 'ollama',
          );
          if (ollamaConfig) {
            this.logger.log(
              `Found available Ollama config in ${scope}, using it`,
            );
            // Get KB model if it's an Ollama model
            const kbModel = kbAiProviderId
              ? await this.kbRepository
                  .findOne({
                    where: { id: kbAiProviderId },
                    select: ['embeddingModel'],
                  })
                  .then((kb) => kb?.embeddingModel)
              : null;

            return {
              provider: 'ollama',
              model: kbModel || 'mxbai-embed-large:latest',
              requiresApiKey: false, // Ollama doesn't need API key
            };
          }

          // Try Google next
          const googleConfig = (configs as any[]).find(
            (cfg: any) => cfg.provider?.key === 'google',
          );
          if (googleConfig && googleConfig.config?.apiKey) {
            this.logger.log(`Found available Google config in ${scope}`);
            return {
              provider: 'google',
              model: 'text-embedding-004',
              requiresApiKey: true,
            };
          }

          // Try OpenAI
          const openaiConfig = (configs as any[]).find(
            (cfg: any) => cfg.provider?.key === 'openai',
          );
          if (openaiConfig && openaiConfig.config?.apiKey) {
            this.logger.log(`Found available OpenAI config in ${scope}`);
            return {
              provider: 'openai',
              model: 'text-embedding-ada-002',
              requiresApiKey: true,
            };
          }
        } catch (error) {
          this.logger.warn(
            `Error checking ${scope} fallback providers: ${error.message}`,
          );
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to find fallback providers: ${error.message}`);
    }

    this.logger.log(`No configured providers found, using default Google`);
    // Absolute fallback
    return {
      provider: 'google',
      model: 'text-embedding-004',
      requiresApiKey: true,
    };
  }

  private async getEmbeddingProvider(
    userId?: string,
    workspaceId?: string,
    kbId?: string,
  ): Promise<{ provider: string; model: string }> {
    // Get KB embedding model if kbId provided
    let kbEmbeddingModel = 'text-embedding-004';
    if (kbId) {
      const kb = await this.kbRepository.findOne({
        where: { id: kbId },
        select: ['embeddingModel'],
      });
      kbEmbeddingModel = kb?.embeddingModel || kbEmbeddingModel;
    }

    if (kbId) {
      const kb = await this.kbRepository.findOne({
        where: { id: kbId },
        select: ['aiProviderId', 'embeddingModel'],
      });
      if (kb?.aiProviderId) {
        // Check if KB has a configured provider - first try workspace scope
        try {
          if (workspaceId) {
            const workspaceConfigs =
              await this.aiProvidersService.getWorkspaceConfigs(workspaceId);
            const config = workspaceConfigs.find(
              (cfg) => cfg.providerId === kb.aiProviderId,
            );
            if (config?.isActive && config.provider?.key) {
              const providerKey = config.provider.key;
              if (['google', 'openai', 'ollama'].includes(providerKey)) {
                const embeddingModel =
                  providerKey === 'openai'
                    ? 'text-embedding-ada-002'
                    : providerKey === 'google'
                      ? kbEmbeddingModel
                      : kbEmbeddingModel; // Use from KB for Ollama
                return { provider: providerKey, model: embeddingModel };
              }
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to check workspace provider for KB ${kbId}: ${error.message}`,
          );
        }

        // Try user scope
        try {
          if (userId) {
            const userConfigs =
              await this.aiProvidersService.getUserConfigs(userId);
            const config = userConfigs.find(
              (cfg) => cfg.providerId === kb.aiProviderId,
            );
            if (config?.isActive && config.provider?.key) {
              const providerKey = config.provider.key;
              if (['google', 'openai', 'ollama'].includes(providerKey)) {
                const embeddingModel =
                  providerKey === 'openai'
                    ? 'text-embedding-ada-002'
                    : providerKey === 'google'
                      ? kbEmbeddingModel
                      : kbEmbeddingModel; // Use from KB for Ollama
                return { provider: providerKey, model: embeddingModel };
              }
            }
          }
        } catch (error) {
          this.logger.warn(
            `Failed to check user provider for KB ${kbId}: ${error.message}`,
          );
        }
      }
    }

    // Find the first configured embedding provider for user/workspace
    if (workspaceId) {
      try {
        const workspaceProviders =
          await this.aiProvidersService.getWorkspaceProviders(workspaceId);
        for (const wp of workspaceProviders) {
          if (
            wp.key === 'google' ||
            wp.key === 'openai' ||
            wp.key === 'ollama'
          ) {
            const model =
              wp.key === 'openai'
                ? 'text-embedding-ada-002'
                : wp.key === 'google'
                  ? 'text-embedding-004'
                  : kbEmbeddingModel; // Use KB model for Ollama
            return { provider: wp.key, model };
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to get workspace providers: ${error.message}`);
      }
    }

    if (userId) {
      try {
        const userProviders =
          await this.aiProvidersService.getUserProviders(userId);
        for (const up of userProviders) {
          if (
            up.key === 'google' ||
            up.key === 'openai' ||
            up.key === 'ollama'
          ) {
            const model =
              up.key === 'openai'
                ? 'text-embedding-ada-002'
                : up.key === 'google'
                  ? 'text-embedding-004'
                  : kbEmbeddingModel; // Use KB model for Ollama
            return { provider: up.key, model };
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to get user providers: ${error.message}`);
      }
    }

    // Default fallback
    return { provider: 'google', model: kbEmbeddingModel };
  }

  async deleteVector(vectorId: string): Promise<void> {
    return this.vectorService.deleteVector(vectorId);
  }
}
