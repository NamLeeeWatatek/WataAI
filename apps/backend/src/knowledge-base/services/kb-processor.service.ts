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
        this.logger.log(
          `📥 Downloading file for extraction: ${document.fileUrl}`,
        );

        try {
          // 1. Get download URL (could be S3 signed URL or local)
          // In current Files implementation, fileUrl in DB is mostly the signed URL or identifier
          // We can use filesService.generateDownloadUrl logic in reverse or just use what we have if it's http

          let buffer: Buffer;

          if (document.fileUrl.startsWith('http')) {
            const response = await (
              await import('axios')
            ).default.get(document.fileUrl, {
              responseType: 'arraybuffer',
              validateStatus: () => true, // Don't throw on error status yet so we can log it
            });

            this.logger.log(
              `📥 Download status: ${response.status} ${response.statusText}`,
            );
            this.logger.log(
              `📥 Content-Type: ${response.headers['content-type']}`,
            );

            if (response.status >= 400) {
              this.logger.error(
                `❌ Failed to download file. Status: ${response.status}`,
              );
              // Accessing data from arraybuffer might be tricky if it's text, but Buffer.from handles it
              const errorBody = Buffer.from(response.data)
                .toString('utf8')
                .slice(0, 200);
              this.logger.error(`❌ Response body preview: ${errorBody}`);
              throw new Error(
                `Failed to download file: Server returned ${response.status}`,
              );
            }

            buffer = Buffer.from(response.data);

            // Debug: Check if it looks like a PDF
            const preview = buffer.toString('utf8', 0, 50);
            this.logger.log(
              `📥 File header preview (hex): ${buffer.toString('hex', 0, 20)}`,
            );
            this.logger.log(`📥 File header preview (text): ${preview}`);
          } else {
            // Fallback for non-http paths (e.g. local or just key)
            // This might need adjustment based on how FilesService stores paths
            throw new Error(
              `Cannot download file with URL: ${document.fileUrl}`,
            );
          }

          // 2. Extract Text
          const ext = document.name.split('.').pop()?.toLowerCase();
          // Simple mime inference if missing (though usually saved in mimeType)
          let mimeType = document.mimeType || 'application/octet-stream';
          if (!document.mimeType) {
            if (ext === 'pdf') mimeType = 'application/pdf';
            else if (ext === 'docx')
              mimeType =
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'txt') mimeType = 'text/plain';
          }

          this.logger.log(
            `📄 Extracting text from downloaded file (${buffer.length} bytes, ${mimeType})`,
          );
          content = await this.textExtractorService.extractText(
            buffer,
            mimeType,
          );

          // Update document with extracted content
          document.content = content;
          document.metadata = {
            ...document.metadata,
            extractedAt: new Date().toISOString(),
            extractedLength: content.length,
          };
          await this.documentRepository.save(document);
          this.logger.log(
            `✅ Text extracted and saved to DB (${content.length} chars)`,
          );
        } catch (extractError) {
          this.logger.error(
            `❌ Background extraction failed: ${extractError.message}`,
          );
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
    const { documentId, internalJobId } = job.data;

    try {
      this.logger.log(
        `🕷️ Starting crawl for job ${internalJobId} (Doc: ${documentId})`,
      );
      this.processingQueue.startJob(internalJobId);

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

      // Dynamic imports
      const axios = (await import('axios')).default;
      const cheerio = await import('cheerio');

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'WataAI-Crawler/1.0',
        },
        timeout: 10000, // 10s timeout
      });

      const $ = cheerio.load(response.data);

      // Cleanup
      $('script, style, nav, footer, iframe, noscript, svg').remove();

      // Extract metadata
      const title = $('title').text().trim() || document.name;
      const description = $('meta[name="description"]').attr('content') || '';

      // Extract main content
      // Prioritize article, main, or body
      let content = '';
      if ($('article').length > 0) {
        content = $('article').text();
      } else if ($('main').length > 0) {
        content = $('main').text();
      } else {
        content = $('body').text();
      }

      content = content.replace(/\s+/g, ' ').trim();

      if (!content) {
        throw new Error('Crawled content is empty');
      }

      this.logger.log(
        `✅ Crawled ${content.length} chars. Updating document...`,
      );

      document.content = content;
      document.metadata = {
        ...document.metadata,
        title,
        description,
        crawledAt: new Date().toISOString(),
        contentType: 'text/html',
      };
      // Keep status as PROCESSING so handleProcessDocument doesn't freak out
      document.processingStatus = KbProcessingStatus.PROCESSING;

      await this.documentRepository.save(document);

      // Chain to standard processing (Chunking -> Embedding)
      return this.handleProcessDocument(job);
    } catch (error) {
      this.logger.error(`❌ Crawl failed: ${error.message}`);
      this.processingQueue.failJob(internalJobId, error.message);

      // Update document status
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });
      if (document) {
        document.processingStatus = KbProcessingStatus.FAILED;
        document.processingError = `Crawl failed: ${error.message}`;
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
