import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KbDocumentEntity } from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { KBProcessingQueueService } from './kb-processing-queue.service';
import { KBManagementService } from './kb-management.service';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { sanitizeText, sanitizeMetadata } from '../utils/text-sanitizer';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { AuditService } from '../../audit/audit.service';

export interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
  followLinks?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  respectRobotsTxt?: boolean;
  folderId?: string | null;
}

export interface CrawlResult {
  url: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  links: string[];
}

@Injectable()
export class KBCrawlerService {
  private readonly logger = new Logger(KBCrawlerService.name);
  private visitedUrls = new Set<string>();

  constructor(
    @InjectRepository(KbDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    private readonly processingQueue: KBProcessingQueueService,
    private readonly kbManagementService: KBManagementService,
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly auditService: AuditService,
  ) { }

  async crawlUrl(url: string): Promise<CrawlResult> {
    try {
      this.logger.log(`ðŸ•·ï¸ Crawling: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'KnowledgeBase-Bot/1.0',
        },
      });

      const html = response.data;
      const $ = cheerio.load(html);

      $('script, style, nav, header, footer, iframe, noscript').remove();

      const title =
        $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';

      const mainContent = $('main, article, .content, #content, body')
        .first()
        .text()
        .trim();

      const content = mainContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      const description = $('meta[name="description"]').attr('content') || '';

      const links: string[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            links.push(absoluteUrl);
          } catch (e) { }
        }
      });

      return {
        url,
        title: sanitizeText(title),
        content: sanitizeText(content),
        metadata: sanitizeMetadata({
          description,
          crawledAt: new Date().toISOString(),
          sourceUrl: url,
        }),
        links,
      };
    } catch (error) {
      this.logger.error(`Failed to crawl ${url}: ${error.message}`);
      throw error;
    }
  }

  async crawlWebsite(
    startUrl: string,
    knowledgeBaseId: string,
    userId: string,
    options: CrawlOptions = {},
  ): Promise<{
    documentsCreated: number;
    errors: string[];
    processingStarted: number;
  }> {
    const {
      maxPages = 50,
      maxDepth = 3,
      followLinks = true,
      includePatterns = [],
      excludePatterns = [],
      folderId,
    } = options;

    this.visitedUrls.clear();
    const errors: string[] = [];
    let documentsCreated = 0;
    let processingStarted = 0;

    const kb = await this.kbManagementService.findOne(knowledgeBaseId, userId);

    // Activity Log - Crawl Started
    await this.auditService.log({
      userId,
      workspaceId: kb.workspaceId,
      action: 'CRAWL_STARTED',
      resourceType: 'knowledge-base',
      resourceId: knowledgeBaseId,
      details: { startUrl, maxPages },
    });

    const urlsToCrawl: Array<{ url: string; depth: number }> = [
      { url: startUrl, depth: 0 },
    ];

    const crawlJobId = this.processingQueue.addJob(
      'crawl-' + Date.now(),
      knowledgeBaseId,
      'crawl',
    );
    this.processingQueue.setJobDocumentName(crawlJobId, `Crawl: ${startUrl}`);
    this.processingQueue.startJob(crawlJobId);

    while (urlsToCrawl.length > 0 && documentsCreated < maxPages) {
      const { url, depth } = urlsToCrawl.shift()!;

      if (this.visitedUrls.has(url)) continue;

      if (depth > maxDepth) continue;

      if (includePatterns.length > 0) {
        const matches = includePatterns.some((pattern) =>
          url.includes(pattern),
        );
        if (!matches) continue;
      }

      if (excludePatterns.length > 0) {
        const matches = excludePatterns.some((pattern) =>
          url.includes(pattern),
        );
        if (matches) continue;
      }

      try {
        this.visitedUrls.add(url);

        const existingDoc = await this.documentRepository.findOne({
          where: {
            knowledgeBaseId,
            sourceUrl: url,
          },
        });

        if (existingDoc) {
          this.logger.log(`â­ï¸  Skipping ${url} - already exists`);
          continue;
        }

        const result = await this.crawlUrl(url);

        if (!result.content || result.content.length === 0) {
          errors.push(`${url}: No content found`);
          continue;
        }

        const document = this.documentRepository.create({
          knowledgeBaseId,
          workspaceId: kb.workspaceId,
          folderId,
          name: result.title,
          title: result.title,
          content: result.content,
          metadata: result.metadata,
          fileType: 'webpage',
          mimeType: 'text/html',
          fileSize: String(result.content.length),
          processingStatus: KbProcessingStatus.PENDING,
          createdBy: userId,
          type: 'url',
          sourceUrl: url,
        });

        const savedDoc = await this.documentRepository.save(document);
        documentsCreated++;

        // Start processing asynchronously
        const jobId = this.processingQueue.addJob(savedDoc.id, knowledgeBaseId);
        this.processingQueue.setJobDocumentName(jobId, result.title);
        processingStarted++;

        // Don't await - let it process in background
        this.processDocument(savedDoc, kb, jobId).catch((error) => {
          this.logger.error(
            `Error processing document ${savedDoc.id}: ${error.message}`,
          );
          this.processingQueue.failJob(jobId, error.message);
        });

        this.logger.log(
          `âœ… Created document from ${url} (${documentsCreated}/${maxPages})`,
        );

        if (followLinks && depth < maxDepth) {
          const baseDomain = new URL(startUrl).hostname;
          result.links.forEach((link) => {
            try {
              const linkDomain = new URL(link).hostname;
              if (linkDomain === baseDomain && !this.visitedUrls.has(link)) {
                urlsToCrawl.push({ url: link, depth: depth + 1 });
              }
            } catch (e) {
              // Invalid URL, skip
            }
          });
        }
      } catch (error) {
        this.logger.error(`Error crawling ${url}: ${error.message}`);
        errors.push(`${url}: ${error.message}`);
      }

      this.processingQueue.updateJobProgress(
        crawlJobId,
        documentsCreated,
        maxPages,
      );
    }

    this.processingQueue.completeJob(crawlJobId);

    this.logger.log(
      `Crawling completed: ${documentsCreated} documents created, ${processingStarted} processing started, ${errors.length} errors`,
    );

    // Activity Log - Crawl Completed
    await this.auditService.log({
      userId,
      workspaceId: kb.workspaceId,
      action: 'CRAWL_COMPLETED',
      resourceType: 'knowledge-base',
      resourceId: knowledgeBaseId,
      details: { documentsCreated, errorCount: errors.length },
    });

    return { documentsCreated, errors, processingStarted };
  }

  private async processDocument(
    document: KbDocumentEntity,
    kb: any,
    jobId: string,
  ) {
    try {
      this.processingQueue.startJob(jobId);

      // Activity Log - Document Processing Started
      if (document.createdBy) {
        await this.auditService.log({
          userId: document.createdBy,
          workspaceId: document.workspaceId,
          action: 'DOCUMENT_PROCESSING',
          resourceType: 'knowledge-base-document',
          resourceId: document.id,
          details: { name: document.name },
        });
      }

      document.processingStatus = KbProcessingStatus.PROCESSING;
      await this.documentRepository.save(document);

      const content = document.content;
      if (!content || content.length === 0) {
        throw new Error('Document content is empty');
      }

      const chunks = await this.embeddingsService.chunkText(
        content,
        kb.chunkSize,
        kb.chunkOverlap,
      );

      this.logger.log(
        `ðŸ“„ Document ${document.id}: Created ${chunks.length} chunks`,
      );

      this.processingQueue.updateJobProgress(jobId, 0, chunks.length);

      const chunkEntities = chunks.map((chunk, index) => {
        const sanitizedContent = sanitizeText(chunk.content);

        return this.chunkRepository.create({
          documentId: document.id,
          knowledgeBaseId: document.knowledgeBaseId,
          content: sanitizedContent,
          chunkIndex: index,
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

      const savedChunks = await this.chunkRepository.save(chunkEntities);

      await this.embeddingsService.processChunksWithProgress(
        savedChunks,
        kb.embeddingModel,
        (processed, total) => {
          this.processingQueue.updateJobProgress(jobId, processed, total);
          this.logger.log(
            `âš¡ Processing embeddings: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`,
          );
        },
      );

      document.processingStatus = KbProcessingStatus.COMPLETED;
      document.chunkCount = chunks.length;
      await this.documentRepository.save(document);

      this.processingQueue.completeJob(jobId);
      this.logger.log(`âœ… Document ${document.id} processed successfully`);
    } catch (error) {
      document.processingStatus = KbProcessingStatus.FAILED;
      document.processingError = error.message;
      await this.documentRepository.save(document);
      this.processingQueue.failJob(jobId, error.message);
      throw error;
    }
  }
}
