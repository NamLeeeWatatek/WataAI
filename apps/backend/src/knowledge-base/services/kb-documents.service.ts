import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateDocumentDto, UpdateDocumentDto } from '../dto/kb-document.dto';
import { FilterDocumentDto, SortDocumentDto } from '../dto/query-document.dto';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { KBManagementService } from './kb-management.service';
import { KBEmbeddingsService } from './kb-embeddings.service';
import {
  sanitizeText,
  sanitizeMetadata,
  extractCleanText,
} from '../utils/text-sanitizer';
import { FilesService } from '../../files/files.service';
import { KBProcessingQueueService } from './kb-processing-queue.service';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';
import {
  KbDocumentEntity,
  KnowledgeBaseDocumentEntity,
} from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';

@Injectable()
export class KBDocumentsService {
  private readonly logger = new Logger(KBDocumentsService.name);

  constructor(
    @InjectRepository(KnowledgeBaseDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    private readonly kbManagementService: KBManagementService,
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly filesService: FilesService,
    private readonly processingQueue: KBProcessingQueueService,
  ) {}

  private async extractPdfWithPdf2json(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        this.logger.error(`PDF parsing error: ${errData.parserError}`);
        reject(new Error(errData.parserError));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          let text = '';

          if (pdfData.Pages) {
            for (const page of pdfData.Pages) {
              if (page.Texts) {
                for (const textItem of page.Texts) {
                  if (textItem.R) {
                    for (const run of textItem.R) {
                      if (run.T) {
                        try {
                          // Try to decode properly - some PDFs store UTF-8 as URL-encoded
                          const decoded = decodeURIComponent(run.T);
                          // Validate the decoded text
                          const encoded = new TextEncoder().encode(decoded);
                          const redecoded = new TextDecoder('utf-8').decode(
                            encoded,
                          );
                          text += redecoded + ' ';
                        } catch (decodeError) {
                          // Fallback to original if decode fails
                          this.logger.warn(
                            `Failed to decode text segment: ${run.T}`,
                          );
                          text += run.T + ' ';
                        }
                      }
                    }
                  }
                }
                text += '\n';
              }
            }
          }

          // Final normalization for Vietnamese characters
          text = text.normalize('NFC').trim();
          text = text.replace(/·/g, '·'); // Preserve special chars

          this.logger.log(`PDF extraction completed: ${text.length} chars`);
          resolve(text);
        } catch (error) {
          this.logger.error(`PDF text processing error: ${error.message}`);
          reject(error);
        }
      });

      pdfParser.parseBuffer(buffer);
    });
  }

  async extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      this.logger.log(`ðŸ“„ Extracting text from ${mimeType}`);

      switch (mimeType) {
        case 'application/pdf':
          try {
            this.logger.log(
              'Using pdf2json for PDF extraction with UTF-8 support',
            );
            const text = await this.extractPdfWithPdf2json(buffer);
            if (text && text.length > 0) {
              this.logger.log(`Extracted ${text.length} chars with pdf2json`);
              return text;
            }
          } catch (pdf2jsonError) {
            this.logger.warn(
              `pdf2json failed, falling back to pdfjs: ${pdf2jsonError.message}`,
            );
          }

          const loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(buffer),
            useSystemFonts: true,
          });
          const pdfDocument = await loadingTask.promise;

          const textPages: string[] = [];

          for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();

            let lastY = -1;
            let pageText = '';

            for (const item of textContent.items) {
              const textItem = item as any;

              if (lastY !== -1 && Math.abs(textItem.transform[5] - lastY) > 5) {
                pageText += '\n';
              }

              if (
                pageText &&
                !pageText.endsWith(' ') &&
                !pageText.endsWith('\n')
              ) {
                pageText += ' ';
              }

              pageText += textItem.str;
              lastY = textItem.transform[5];
            }

            textPages.push(pageText.trim());
          }

          let fullText = textPages.join('\n\n').trim();

          // Validate Unicode preservation
          const originalLength = fullText.length;
          fullText = fullText.normalize('NFC');

          // Ensure Vietnamese characters are preserved
          if (fullText.includes('Ã') || fullText.includes('Â')) {
            this.logger.warn('Detected corrupted encoding in PDF content');
          }

          fullText = fullText
            .replace(/\s+/g, ' ')
            .replace(/\n\s+\n/g, '\n\n')
            .replace(/([.!?])\s*\n/g, '$1\n\n')
            .trim();

          this.logger.log(
            `PDF extracted with pdfjsLib: ${fullText.length} chars (was ${originalLength})`,
          );
          return fullText;

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          const docxResult = await mammoth.extractRawText({ buffer });
          return docxResult.value.trim();

        case 'text/plain':
        case 'text/markdown':
        case 'text/html':
        case 'application/json':
          return buffer.toString('utf-8');

        default:
          this.logger.warn(
            `âš ï¸ Unknown mime type ${mimeType}, trying as text`,
          );
          return buffer.toString('utf-8');
      }
    } catch (error) {
      this.logger.error(`âŒ Failed to extract text: ${error.message}`);
      throw new Error(
        `Failed to extract text from ${mimeType}: ${error.message}`,
      );
    }
  }

  async uploadFileToStorage(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    knowledgeBaseId?: string,
    userId?: string,
  ): Promise<{ fileUrl: string; fileId: string }> {
    try {
      this.logger.log(`ðŸ“¤ Uploading file to storage: ${filename}`);

      let workspaceId: string | undefined;
      if (knowledgeBaseId && userId) {
        try {
          const kb = await this.kbManagementService.findOne(
            knowledgeBaseId,
            userId,
          );
          workspaceId = kb.workspaceId || undefined;
        } catch (kbError) {
          this.logger.warn(
            `Could not fetch KB ${knowledgeBaseId} to get workspaceId: ${kbError.message}`,
          );
        }
      }

      const uploadDto = {
        fileName: filename,
        fileSize: buffer.length,
        bucket: 'documents', // Knowledge base documents go to documents bucket
      };

      const result = await this.filesService.create(uploadDto, workspaceId);

      if (!result || !result.uploadSignedUrl || !result.file) {
        throw new Error('Failed to generate upload URL');
      }

      const fetch = (await import('node-fetch')).default;
      const uploadResponse = await fetch(result.uploadSignedUrl, {
        method: 'PUT',
        body: buffer,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': buffer.length.toString(),
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}`);
      }

      const fileUrl = result.uploadSignedUrl.split('?')[0];

      this.logger.log(`âœ… File uploaded successfully: ${fileUrl}`);

      return {
        fileUrl,
        fileId: result.file.id,
      };
    } catch (error) {
      this.logger.error(`âŒ Failed to upload file: ${error.message}`);
      throw new Error(`Failed to upload file to storage: ${error.message}`);
    }
  }

  async create(
    userId: string,
    createDto: CreateDocumentDto,
  ): Promise<KbDocumentEntity> {
    const kb = await this.kbManagementService.findOne(
      createDto.knowledgeBaseId,
      userId,
    );

    const sanitizedName = sanitizeText(createDto.name);
    const sanitizedContent = extractCleanText(
      createDto.content,
      createDto.mimeType,
    );
    const sanitizedMetadata = sanitizeMetadata(createDto.metadata);

    if (!sanitizedName || !sanitizedContent) {
      throw new Error(
        'Document name and content cannot be empty after sanitization',
      );
    }

    this.logger.log(
      `Creating document: ${sanitizedName} (${sanitizedContent.length} chars)`,
    );

    const document = this.documentRepository.create({
      ...createDto,
      workspaceId: kb.workspaceId,
      title: sanitizedName,
      name: sanitizedName,
      content: sanitizedContent.length < 50000 ? sanitizedContent : '',
      metadata: sanitizedMetadata,
      fileType: createDto.fileType || 'text',
      fileSize: String(sanitizedContent.length),
      processingStatus: KbProcessingStatus.PENDING,
      createdBy: userId,
      type: 'text',
    });

    const savedDoc = await this.documentRepository.save(document);

    if (savedDoc.fileUrl) {
      await this.filesService.confirmFromUrl(savedDoc.fileUrl);
    }

    const jobId = this.processingQueue.addJob(
      savedDoc.id,
      createDto.knowledgeBaseId,
    );
    this.processingQueue.setJobDocumentName(jobId, sanitizedName);

    this.processDocumentWithTracking(savedDoc, kb, jobId).catch((error) => {
      this.logger.error(
        `Error processing document ${savedDoc.id}: ${error.message}`,
      );
      this.processingQueue.failJob(jobId, error.message);
    });

    return savedDoc;
  }

  private async getDocumentContent(
    document: KbDocumentEntity,
  ): Promise<string> {
    if (document.content) {
      return document.content;
    }

    if (document.fileUrl) {
      this.logger.log(`Reading document from S3: ${document.fileUrl}`);

      throw new Error(
        'S3 file reading not yet implemented. Please store content directly for now.',
      );
    }

    throw new Error('Document has no content or file URL');
  }

  async findManyWithPagination({
    kbId,
    filterOptions,
    sortOptions,
    paginationOptions,
    userId,
  }: {
    kbId: string;
    filterOptions?: FilterDocumentDto | null;
    sortOptions?: SortDocumentDto[] | null;
    paginationOptions: IPaginationOptions;
    userId: string;
  }): Promise<{ data: KbDocumentEntity[]; total: number }> {
    await this.kbManagementService.findOne(kbId, userId);

    const query = this.documentRepository
      .createQueryBuilder('doc')
      .where('doc.knowledgeBaseId = :kbId', { kbId });

    if (filterOptions?.folderId) {
      query.andWhere('doc.folderId = :folderId', {
        folderId: filterOptions.folderId,
      });
    } else if (filterOptions?.folderId === null) {
      query.andWhere('doc.folderId IS NULL');
    }

    if (filterOptions?.search) {
      query.andWhere('(doc.name ILIKE :search OR doc.title ILIKE :search)', {
        search: `%${filterOptions.search}%`,
      });
    }

    if (sortOptions?.length) {
      sortOptions.forEach((sort) => {
        if (sort.orderBy && (sort.orderBy as any) !== 'undefined') {
          query.addOrderBy(`doc.${sort.orderBy}`, sort.order as any);
        }
      });
    } else {
      query.orderBy('doc.createdAt', 'DESC');
    }

    query
      .skip((paginationOptions.page - 1) * paginationOptions.limit)
      .take(paginationOptions.limit);

    const [results, total] = await query.getManyAndCount();

    return { data: results, total };
  }

  async findAll(kbId: string, userId: string, folderId?: string) {
    const { data } = await this.findManyWithPagination({
      kbId,
      filterOptions: { folderId: folderId || null },
      paginationOptions: { page: 1, limit: 1000 },
      userId,
    });
    return data;
  }

  async findOne(documentId: string, userId: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['knowledgeBase'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.kbManagementService.findOne(document.knowledgeBaseId, userId);

    return document;
  }

  async getDownloadUrl(documentId: string, userId: string) {
    const document = await this.findOne(documentId, userId);

    if (!document.fileUrl) {
      throw new NotFoundException('Document file not found');
    }

    if (document.fileUrl.includes('?')) {
      return {
        url: document.fileUrl,
        filename:
          document.metadata?.originalName ||
          document.title ||
          document.name ||
          'document',
        mimeType: document.mimeType || document.fileType,
      };
    }

    try {
      let filePath = document.fileUrl;
      let bucketName: string | undefined;
      if (filePath.startsWith('http')) {
        const url = new URL(filePath);
        const pathParts = url.pathname.split('/').filter((p) => p);
        bucketName = pathParts[0];
        filePath = pathParts.slice(1).join('/');
      } else {
        // Fallback to default if not HTTP URL
        bucketName = undefined;
      }

      this.logger.log(
        `Generating download URL for: ${filePath} in bucket: ${bucketName}`,
      );

      const presignedUrl = await this.filesService.generateDownloadUrl(
        filePath,
        bucketName,
        3600,
      );

      return {
        url: presignedUrl,
        filename:
          document.metadata?.originalName ||
          document.title ||
          document.name ||
          'document',
        mimeType: document.mimeType || document.fileType,
      };
    } catch (error) {
      this.logger.error(`Failed to generate download URL: ${error.message}`);
      throw new NotFoundException('Failed to generate download URL');
    }
  }

  async update(
    documentId: string,
    userId: string,
    updateDto: UpdateDocumentDto,
  ) {
    const document = await this.findOne(documentId, userId);

    const sanitizedUpdate: Partial<KbDocumentEntity> = {};

    if (updateDto.name) {
      sanitizedUpdate.name = sanitizeText(updateDto.name);
      sanitizedUpdate.title = sanitizedUpdate.name;
    }

    if (updateDto.content) {
      sanitizedUpdate.content = extractCleanText(
        updateDto.content,
        document.mimeType || undefined,
      );
    }

    if (updateDto.metadata) {
      sanitizedUpdate.metadata = sanitizeMetadata(updateDto.metadata);
    }

    const contentChanged =
      sanitizedUpdate.content && sanitizedUpdate.content !== document.content;

    Object.assign(document, sanitizedUpdate);

    if (contentChanged) {
      document.processingStatus = KbProcessingStatus.PENDING;
      const savedDoc = await this.documentRepository.save(document);

      const kb = await this.kbManagementService.findOne(
        document.knowledgeBaseId,
        userId,
      );
      this.processDocument(savedDoc, kb).catch((error) => {
        this.logger.error(
          `Error reprocessing document ${savedDoc.id}: ${error.message}`,
        );
      });

      return savedDoc;
    }

    return this.documentRepository.save(document);
  }

  async remove(documentId: string, userId: string) {
    const document = await this.findOne(documentId, userId);

    const chunks = await this.chunkRepository.find({
      where: { documentId },
    });

    this.logger.log(
      `Deleting document ${documentId} with ${chunks.length} chunks`,
    );

    for (const chunk of chunks) {
      if (chunk.vectorId) {
        try {
          await this.embeddingsService.deleteVector(chunk.vectorId);
        } catch (error) {
          this.logger.warn(
            `Failed to delete vector ${chunk.vectorId}: ${error.message}`,
          );
        }
      }
    }

    await this.chunkRepository.remove(chunks);

    await this.documentRepository.remove(document);

    this.logger.log(`âœ… Document ${documentId} deleted successfully`);

    return { success: true };
  }

  async moveToFolder(
    documentId: string,
    userId: string,
    folderId: string | null,
  ) {
    const document = await this.findOne(documentId, userId);
    document.folderId = folderId;
    return this.documentRepository.save(document);
  }

  private async processDocumentWithTracking(
    document: KbDocumentEntity,
    kb: any,
    jobId: string,
  ) {
    try {
      this.processingQueue.startJob(jobId);
      await this.processDocument(document, kb, jobId);
      this.processingQueue.completeJob(jobId);
    } catch (error) {
      this.processingQueue.failJob(jobId, error.message);
      throw error;
    }
  }

  private async processDocument(
    document: KbDocumentEntity,
    kb: any,
    jobId?: string,
  ) {
    try {
      document.processingStatus = KbProcessingStatus.PROCESSING;
      await this.documentRepository.save(document);

      const content = await this.getDocumentContent(document);

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

      if (jobId) {
        this.processingQueue.updateJobProgress(jobId, 0, chunks.length);
      }

      const batchSize = 100;
      const chunkEntities: any[] = [];

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        const entities = batch.map((chunk, index) => {
          const sanitizedContent = sanitizeText(chunk.content);

          return this.chunkRepository.create({
            documentId: document.id,
            knowledgeBaseId: document.knowledgeBaseId,
            content: sanitizedContent,
            chunkIndex: i + index,
            startChar: chunk.startChar,
            endChar: chunk.endChar,
            tokenCount: chunk.tokenCount,
            metadata: sanitizeMetadata({
              documentName: document.metadata?.originalName || document.name,
              fileType: document.fileType,
            }),
            embeddingStatus: KbProcessingStatus.PENDING,
          });
        });

        const saved = await this.chunkRepository.save(entities);
        chunkEntities.push(...saved);

        this.logger.log(
          `ðŸ’¾ Saved chunks ${i + 1}-${Math.min(i + batchSize, chunks.length)} of ${chunks.length}`,
        );
      }

      // Check if Qdrant/vector service is available before processing embeddings
      const vectorService = (this.embeddingsService as any).vectorService;
      if (vectorService) {
        const connectionOk = await vectorService.testConnection();
        if (!connectionOk) {
          this.logger.warn(
            `âš ï¸ Qdrant service is unavailable for document ${document.id}, skipping vector embeddings`,
          );

          for (const chunk of chunkEntities) {
            chunk.embeddingStatus = KbProcessingStatus.SKIPPED;
            chunk.embeddingError = 'Vector service unavailable';
          }
          await this.chunkRepository.save(chunkEntities);

          document.processingStatus = KbProcessingStatus.COMPLETED;
          document.chunkCount = chunks.length;
          await this.documentRepository.save(document);
          this.logger.log(
            `âœ… Document ${document.id} processed without vector embeddings (Qdrant unavailable)`,
          );
          return;
        }
      } else {
        this.logger.error(
          `âš ï¸ Vector service not found, skipping embeddings processing`,
        );
      }

      await this.embeddingsService.processChunksWithProgress(
        chunkEntities,
        kb.embeddingModel,
        (processed, total) => {
          if (jobId) {
            this.processingQueue.updateJobProgress(jobId, processed, total);
          }

          this.logger.log(
            `âš¡ Processing embeddings: ${processed}/${total} (${Math.round((processed / total) * 100)}%)`,
          );
        },
      );

      document.processingStatus = KbProcessingStatus.COMPLETED;
      document.chunkCount = chunks.length;
      await this.documentRepository.save(document);

      this.logger.log(`âœ… Document ${document.id} processed successfully`);
    } catch (error) {
      document.processingStatus = KbProcessingStatus.FAILED;
      document.processingError = error.message;
      await this.documentRepository.save(document);
      throw error;
    }
  }
}
