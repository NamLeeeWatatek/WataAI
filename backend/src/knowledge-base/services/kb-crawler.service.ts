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
import { AuditService } from '../../audit/audit.service';
import { MarkdownProcessorUtil } from '../utils/markdown-processor.util';
import axios from 'axios';
import { JSDOM } from 'jsdom';

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
      this.logger.log(`🕷️ Crawling: ${url}`);

      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand)";v="24", "Google Chrome";v="122"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'Referer': 'https://www.google.com/',
        },
      });

      const html = response.data;
      const { title, content, excerpt } = MarkdownProcessorUtil.htmlToMarkdown(
        html,
        url,
      );

      const links: string[] = [];
      const dom = new JSDOM(html);
      const anchors = dom.window.document.querySelectorAll('a');

      anchors.forEach((anchor) => {
        const href = anchor.getAttribute('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).href;
            links.push(absoluteUrl);
          } catch (e) {
            // Ignore invalid URLs
          }
        }
      });

      return {
        url,
        title: title || 'Untitled',
        content: content,
        metadata: sanitizeMetadata({
          description: excerpt,
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
      respectRobotsTxt = false,
    } = options;

    if (respectRobotsTxt) {
      this.logger.warn(
        'Robots.txt respect requested but not yet fully implemented. Proceeding with caution.',
      );
    }

    const visitedUrls = new Set<string>();
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

    const crawlJobId = await this.processingQueue.addJob(
      'crawl-' + Date.now(),
      knowledgeBaseId,
      'crawl',
      userId,
      false, // Local tracking only, do not add to BullMQ
    );
    this.processingQueue.setJobDocumentName(crawlJobId, `Crawl: ${startUrl}`);
    this.processingQueue.startJob(crawlJobId);

    const BATCH_SIZE = 5; // Concurrent requests

    while (urlsToCrawl.length > 0 && documentsCreated < maxPages) {
      // Prepare batch
      const batch: Array<{ url: string; depth: number }> = [];

      // Fill batch with unvisited URLs
      while (batch.length < BATCH_SIZE && urlsToCrawl.length > 0) {
        const next = urlsToCrawl.shift();
        if (next && !visitedUrls.has(next.url)) {
          // Double check filters before adding to batch to save processing
          if (next.depth <= maxDepth) {
            const matchesInclude =
              includePatterns.length === 0 ||
              includePatterns.some((p) => next.url.includes(p));
            const matchesExclude =
              excludePatterns.length > 0 &&
              excludePatterns.some((p) => next.url.includes(p));

            if (matchesInclude && !matchesExclude) {
              visitedUrls.add(next.url);
              batch.push(next);
            }
          }
        }
      }

      if (batch.length === 0) continue;

      // Process batch in parallel
      await Promise.all(
        batch.map(async ({ url, depth }) => {
          if (documentsCreated >= maxPages) return;

          try {
            // Check existence again to be safe (though race cond is minor here)
            const existingDoc = await this.documentRepository.findOne({
              where: {
                knowledgeBaseId,
                sourceUrl: url,
              },
            });

            if (existingDoc) {
              this.logger.log(`⭐️ Skipping ${url} - already exists`);
              return;
            }

            const result = await this.crawlUrl(url);

            if (!result.content || result.content.length === 0) {
              errors.push(`${url}: No content found`);
              return;
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

            // Start processing asynchronously via BullMQ
            const jobId = await this.processingQueue.addJob(
              savedDoc.id,
              knowledgeBaseId,
              'embedding',
              userId,
            );
            this.processingQueue.setJobDocumentName(jobId, result.title);
            processingStarted++;

            this.logger.log(
              `✅ Created document from ${url} (${documentsCreated}/${maxPages})`,
            );

            if (followLinks && depth < maxDepth) {
              const baseDomain = new URL(startUrl).hostname;
              result.links.forEach((link) => {
                try {
                  const linkDomain = new URL(link).hostname;
                  if (linkDomain === baseDomain && !visitedUrls.has(link)) {
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
        }),
      );

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
}
