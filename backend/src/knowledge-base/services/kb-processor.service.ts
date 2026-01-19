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
import { KBCrawlerService } from './kb-crawler.service';
import { MarkdownProcessorUtil } from '../utils/markdown-processor.util';

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
    private readonly crawlerService: KBCrawlerService,
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
      // Ensure tracking handles cases where we restarted and lost in-memory state
      this.processingQueue.ensureJobTracking({
        id: internalJobId,
        documentId,
        knowledgeBaseId,
        status: 'processing',
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        type: 'embedding',
        startedAt: new Date(),
      });

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

      // Check for cancellation
      await this.checkCancellation(internalJobId);

      // If document has no content but has a file URL, we need to extract it now
      if ((!content || content.length === 0) && document.fileUrl) {
        this.logger.log(
          `📥 Downloading file for extraction: ${document.fileUrl}`,
        );

        let buffer: Buffer;

        if (document.fileUrl.startsWith('http')) {
          const axios = (await import('axios')).default;
          const response = await axios.get(document.fileUrl, {
            responseType: 'arraybuffer',
            validateStatus: () => true,
          });

          if (response.status >= 400) {
            throw new Error(
              `Failed to download file: Server returned ${response.status}`,
            );
          }

          buffer = Buffer.from(response.data);
        } else {
          throw new Error(`Cannot download file with URL: ${document.fileUrl}`);
        }

        // Check for cancellation after download
        await this.checkCancellation(internalJobId);

        // 2. Extract Text
        const ext = document.name.split('.').pop()?.toLowerCase();
        let mimeType = document.mimeType || 'application/octet-stream';
        if (!document.mimeType) {
          if (ext === 'pdf') mimeType = 'application/pdf';
          else if (ext === 'docx')
            mimeType =
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (ext === 'txt') mimeType = 'text/plain';
        }

        content = await this.textExtractorService.extractText(
          buffer,
          mimeType,
          {
            workspaceId: kb.workspaceId,
            userId: userId,
            model: kb.ragModel || undefined, // Let the service handle default resolution if undefined
          },
        );

        // Update document local state, save once later or now if needed for status
        document.content = content;
        document.metadata = {
          ...document.metadata,
          extractedAt: new Date().toISOString(),
          extractedLength: content.length,
        };
        // Status remains PROCESSING, just saving the content
        await this.documentRepository.save(document);
      }

      // Check for cancellation before chunking
      await this.checkCancellation(internalJobId);

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
        // Check for cancellation periodically during chunk saving
        await this.checkCancellation(internalJobId);

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
          kb.embeddingModel || undefined,
          async (processed, total) => {
            // Check for cancellation during embedding generation
            await this.checkCancellation(internalJobId);

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
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (error.message === 'Job cancelled by user') {
        this.logger.warn(`Job ${job.id} was cancelled.`);

        if (document) {
          document.processingStatus = KbProcessingStatus.CANCELLED;
          document.processingError = 'Cancelled by user';
          await this.documentRepository.save(document);
        }

        return { cancelled: true };
      }

      this.logger.error(`❌ Job ${job.id} failed: ${error.message}`);

      if (document) {
        document.processingStatus = KbProcessingStatus.FAILED;
        document.processingError = sanitizeText(error.message);
        await this.documentRepository.save(document);
      }

      this.processingQueue.failJob(internalJobId, sanitizeText(error.message));
      throw error;
    }
  }

  private async checkCancellation(internalJobId: string) {
    const status = this.processingQueue.getJob(internalJobId)?.status;
    if (status === 'cancelled') {
      throw new Error('Job cancelled by user');
    }
  }

  private async handleCrawlWebsite(job: Job<any>) {
    const { documentId, internalJobId, knowledgeBaseId } = job.data;

    try {
      this.logger.log(
        `🕷️ Starting crawl for job ${internalJobId} (Doc: ${documentId})`,
      );
      // Ensure tracking
      this.processingQueue.ensureJobTracking({
        id: internalJobId,
        documentId,
        knowledgeBaseId,
        status: 'processing',
        progress: 0,
        totalChunks: 0,
        processedChunks: 0,
        type: 'crawl',
        startedAt: new Date(),
      });

      this.processingQueue.startJob(internalJobId);
      await this.checkCancellation(internalJobId);

      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });

      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      // Use sourceUrl for websites, fallback to fileUrl
      const url = document.sourceUrl || document.fileUrl;
      if (!url) {
        throw new Error('No URL provided for crawling');
      }

      this.logger.log(`🕸️ Fetching URL: ${url}`);

      this.logger.log(`🕸️ Fetching URL via unified stealth crawler: ${url}`);

      // Use the unified fetcher with Jina Reader fallback to bypass 403s
      const html = await this.crawlerService.fetchUrlContent(url);

      const { title, content, excerpt } = MarkdownProcessorUtil.htmlToMarkdown(
        html,
        url,
      );

      this.logger.log(
        `✅ Crawled ${content.length} chars (Title: ${title}). Updating document...`,
      );

      if (!content) {
        throw new Error('Crawled content is empty');
      }

      this.logger.log(
        `✅ Crawled ${content.length} chars. Updating document...`,
      );

      await this.checkCancellation(internalJobId);

      document.content = content;
      document.metadata = {
        ...document.metadata,
        title,
        description: excerpt || '',
        crawledAt: new Date().toISOString(),
        contentType: 'text/html',
      };
      // Keep status as PROCESSING so handleProcessDocument doesn't freak out
      document.processingStatus = KbProcessingStatus.PROCESSING;

      await this.documentRepository.save(document);

      // Chain to standard processing (Chunking -> Embedding)
      return this.handleProcessDocument(job);
    } catch (error) {
      if (error.message === 'Job cancelled by user') {
        this.logger.warn(`Crawl job for ${documentId} was cancelled.`);
        const document = await this.documentRepository.findOne({
          where: { id: documentId },
        });
        if (document) {
          document.processingStatus = KbProcessingStatus.CANCELLED;
          document.processingError = 'Cancelled by user';
          await this.documentRepository.save(document);
        }
        return { cancelled: true };
      }
      this.logger.error(`❌ Crawl failed: ${error.message}`);
      this.processingQueue.failJob(internalJobId, sanitizeText(error.message));

      // Update document status
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });
      if (document) {
        document.processingStatus = KbProcessingStatus.FAILED;
        document.processingError = sanitizeText(
          `Crawl failed: ${error.message}`,
        );
        await this.documentRepository.save(document);
      }

      throw error;
    }
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
