import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KbDocumentEntity,
  KnowledgeBaseEntity,
} from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { KBProcessingQueueService } from './kb-processing-queue.service';
import { KBManagementService } from './kb-management.service';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { sanitizeText, sanitizeMetadata } from '../utils/text-sanitizer';

@Processor('kb-processing')
export class KBProcessor extends WorkerHost {
  private readonly logger = new Logger(KBProcessor.name);

  constructor(
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly processingQueue: KBProcessingQueueService,
    private readonly kbManagementService: KBManagementService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`🚀 Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'process-document':
        return this.handleProcessDocument(job);
      case 'crawl-website':
        return this.handleCrawlWebsite(job);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleProcessDocument(job: Job<any>) {
    const { documentId, knowledgeBaseId, userId } = job.data;
    const internalJobId = job.data.internalJobId;

    try {
      this.processingQueue.startJob(internalJobId);

      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      const kb = await this.kbManagementService.findOne(
        knowledgeBaseId,
        userId,
      );

      document.processingStatus = KbProcessingStatus.PROCESSING;
      await this.documentRepository.save(document);

      // We rely on content being already extracted and stored in 'content' field for manual/uploaded docs
      // or we might need to fetch it from S3 if it's too large (future proofing)
      const content = document.content;

      if (!content && document.fileUrl) {
        // Fallback or extra extraction logic could go here
        this.logger.warn(
          `Document ${documentId} has no content but has fileUrl. Extraction should have happened before queuing.`,
        );
      }

      if (!content || content.length === 0) {
        throw new Error('Document content is empty');
      }

      const chunks = await this.embeddingsService.chunkText(
        content,
        kb.chunkSize,
        kb.chunkOverlap,
      );

      this.logger.log(
        `📄 Document ${document.id}: Created ${chunks.length} chunks`,
      );
      this.processingQueue.updateJobProgress(internalJobId, 0, chunks.length);

      // Save chunks in batches
      const batchSize = 100;
      const chunkEntities: KBChunkEntity[] = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const entities = batch.map((chunk, index) => {
          return this.chunkRepository.create({
            documentId: document.id,
            knowledgeBaseId: document.knowledgeBaseId,
            content: sanitizeText(chunk.content),
            chunkIndex: i + index,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount,
            metadata: sanitizeMetadata({
              documentName: document.name,
              fileType: document.fileType,
              sourceUrl: document.sourceUrl,
            }),
            embeddingStatus: KbProcessingStatus.PENDING,
          });
        });

        const saved = await this.chunkRepository.save(entities);
        chunkEntities.push(...saved);

        await job.updateProgress(
          Math.round(((i + batch.length) / chunks.length) * 20),
        ); // First 20% for chunking/saving
      }

      // Process Embeddings
      const processingResult =
        await this.embeddingsService.processChunksWithProgress(
          chunkEntities,
          kb.embeddingModel,
          async (processed, total) => {
            this.processingQueue.updateJobProgress(
              internalJobId,
              processed,
              total,
            );
            const progress = 20 + Math.round((processed / total) * 80);
            await job.updateProgress(progress);
          },
        );

      if (processingResult.failures > 0) {
        if (processingResult.successes === 0) {
          throw new Error(
            `Embedding generation failed for all ${processingResult.failures} chunks.`,
          );
        }
        this.logger.warn(
          `Partial processed: ${processingResult.successes} succeeded, ${processingResult.failures} failed.`,
        );
      }

      document.processingStatus = KbProcessingStatus.COMPLETED;
      document.chunkCount = chunks.length;

      await this.documentRepository.save(document);

      this.processingQueue.completeJob(internalJobId);
      this.logger.log(`✅ Document ${document.id} processed successfully`);

      return { success: true, chunksCount: chunks.length };
    } catch (error) {
      this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);

      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });
      if (document) {
        document.processingStatus = KbProcessingStatus.FAILED;
        document.processingError = error.message;
        await this.documentRepository.save(document);
      }

      this.processingQueue.failJob(internalJobId, error.message);
      throw error;
    }
  }

  private async handleCrawlWebsite(job: Job<any>) {
    // Crawl logic would be more complex as it spawns other jobs or does it sequentially
    // For now, let's just log and provide a placeholder
    this.logger.log(`Crawl job processing for ${job.data.url}`);
    // The actual crawling happens in KBCrawlerService which now should probably just
    // call this processor or we keep the crawler as is but use workers for document processing.
    return { success: true };
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed!`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed: ${err.message}`);
  }
}
