import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';
import { KnowledgeBaseEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBVectorService } from './kb-vector.service';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';

@Injectable()
export class KBSyncService {
  private readonly logger = new Logger(KBSyncService.name);

  constructor(
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    private readonly vectorService: KBVectorService,
    private readonly aiProvidersService: AiProvidersService,
  ) {}

  async rebuildCollection(knowledgeBaseId: string): Promise<{
    success: boolean;
    chunksProcessed: number;
    errors: number;
  }> {
    this.logger.log(
      `ðŸ”„ Starting collection rebuild for KB: ${knowledgeBaseId}`,
    );

    const kb = await this.kbRepository.findOne({
      where: { id: knowledgeBaseId },
    });

    if (!kb) {
      throw new Error('Knowledge base not found');
    }

    const chunks = await this.chunkRepository.find({
      where: { knowledgeBaseId },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`ðŸ“Š Found ${chunks.length} chunks to rebuild`);

    let processed = 0;
    let errors = 0;
    const batchSize = 10;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (chunk) => {
          try {
            const embedding = await this.aiProvidersService.generateEmbedding(
              chunk.content,
              'google',
              kb.embeddingModel || 'text-embedding-004',
            );

            const vectorId = await this.vectorService.upsertVector(
              {
                id: chunk.id,
                vector: embedding,
                payload: {
                  content: chunk.content,
                  documentId: chunk.documentId,
                  knowledgeBaseId: chunk.knowledgeBaseId,
                  chunkIndex: chunk.chunkIndex,
                  metadata: chunk.metadata,
                },
              },
              kb.workspaceId,
            );

            chunk.vectorId = vectorId;
            chunk.vectorId = vectorId;
            chunk.embeddingStatus = KbProcessingStatus.COMPLETED;
            await this.chunkRepository.save(chunk);
            await this.chunkRepository.save(chunk);

            processed++;
          } catch (error) {
            this.logger.error(
              `âŒ Failed to rebuild chunk ${chunk.id}: ${error.message}`,
            );
            chunk.embeddingStatus = KbProcessingStatus.FAILED;
            chunk.embeddingError = error.message;
            await this.chunkRepository.save(chunk);
            errors++;
          }
        }),
      );

      this.logger.log(
        `âš¡ Progress: ${Math.min(i + batchSize, chunks.length)}/${chunks.length} (${Math.round((Math.min(i + batchSize, chunks.length) / chunks.length) * 100)}%)`,
      );

      if (i + batchSize < chunks.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.logger.log(
      `âœ… Collection rebuild complete: ${processed} processed, ${errors} errors`,
    );

    return {
      success: true,
      chunksProcessed: processed,
      errors,
    };
  }

  async verifyCollection(knowledgeBaseId: string): Promise<{
    totalChunks: number;
    missingVectors: number;
    failedEmbeddings: number;
  }> {
    const chunks = await this.chunkRepository.find({
      where: { knowledgeBaseId },
    });

    const missingVectors = chunks.filter(
      (c) => !c.vectorId || c.embeddingStatus !== KbProcessingStatus.COMPLETED,
    ).length;

    const failedEmbeddings = chunks.filter(
      (c) => c.embeddingStatus === KbProcessingStatus.FAILED,
    ).length;

    return {
      totalChunks: chunks.length,
      missingVectors,
      failedEmbeddings,
    };
  }

  async syncMissingVectors(knowledgeBaseId: string): Promise<{
    success: boolean;
    synced: number;
    errors: number;
  }> {
    this.logger.log(`ðŸ”„ Syncing missing vectors for KB: ${knowledgeBaseId}`);

    const kb = await this.kbRepository.findOne({
      where: { id: knowledgeBaseId },
    });

    if (!kb) {
      throw new Error('Knowledge base not found');
    }

    const chunks = await this.chunkRepository
      .createQueryBuilder('chunk')
      .where('chunk.knowledgeBaseId = :knowledgeBaseId', { knowledgeBaseId })
      .andWhere('(chunk.vectorId IS NULL OR chunk.embeddingStatus = :status)', {
        status: KbProcessingStatus.FAILED,
      })
      .getMany();

    this.logger.log(`ðŸ“Š Found ${chunks.length} chunks to sync`);

    let synced = 0;
    let errors = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await this.aiProvidersService.generateEmbedding(
          chunk.content,
          'google',
          kb.embeddingModel || 'text-embedding-004',
        );

        const vectorId = await this.vectorService.upsertVector(
          {
            id: chunk.id,
            vector: embedding,
            payload: {
              content: chunk.content,
              documentId: chunk.documentId,
              knowledgeBaseId: chunk.knowledgeBaseId,
              chunkIndex: chunk.chunkIndex,
              metadata: chunk.metadata,
            },
          },
          kb.workspaceId,
        );

        chunk.vectorId = vectorId;
        chunk.embeddingStatus = KbProcessingStatus.COMPLETED;
        await this.chunkRepository.save(chunk);

        synced++;
      } catch (error) {
        this.logger.error(
          `âŒ Failed to sync chunk ${chunk.id}: ${error.message}`,
        );
        errors++;
      }
    }

    this.logger.log(`âœ… Sync complete: ${synced} synced, ${errors} errors`);

    return {
      success: true,
      synced,
      errors,
    };
  }
}
