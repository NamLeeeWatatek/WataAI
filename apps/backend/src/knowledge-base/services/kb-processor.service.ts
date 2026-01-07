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
import { KBTextExtractorService } from './kb-text-extractor.service';
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
    private readonly textExtractorService: KBTextExtractorService,
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

      let content = document.content;

      // If document has no content but has a file URL, we need to extract it now
      if ((!content || content.length === 0) && document.fileUrl) {
        this.logger.log(`📥 Downloading file for extraction: ${document.fileUrl}`);

        try {
          // 1. Get download URL (could be S3 signed URL or local)
          // In current Files implementation, fileUrl in DB is mostly the signed URL or identifier
          // We can use filesService.generateDownloadUrl logic in reverse or just use what we have if it's http

          let buffer: Buffer;

          if (document.fileUrl.startsWith('http')) {
            const response = await (await import('axios')).default.get(document.fileUrl, {
              responseType: 'arraybuffer'
            });
            buffer = Buffer.from(response.data);
          } else {
            // Fallback for non-http paths (e.g. local or just key)
            // This might need adjustment based on how FilesService stores paths
            throw new Error(`Cannot download file with URL: ${document.fileUrl}`);
          }

          // 2. Extract Text
          const ext = document.name.split('.').pop()?.toLowerCase();
          // Simple mime inference if missing (though usually saved in mimeType)
          let mimeType = document.mimeType || 'application/octet-stream';
          if (!document.mimeType) {
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'txt') mimeType = 'text/plain';
          }

          this.logger.log(`📄 Extracting text from downloaded file (${buffer.length} bytes, ${mimeType})`);
          content = await this.textExtractorService.extractText(buffer, mimeType);

          // Update document with extracted content
          document.content = content;
          document.metadata = {
            ...document.metadata,
            extractedAt: new Date().toISOString(),
            extractedLength: content.length,
          };
          await this.documentRepository.save(document);
          this.logger.log(`✅ Text extracted and saved to DB (${content.length} chars)`);

        } catch (extractError) {
          this.logger.error(`❌ Background extraction failed: ${extractError.message}`);
          throw extractError;
        }
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
