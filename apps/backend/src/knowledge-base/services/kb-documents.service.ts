import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';
import { Repository } from 'typeorm';

import { CreateDocumentDto, UpdateDocumentDto } from '../dto/kb-document.dto';
import { FilterDocumentDto, SortDocumentDto } from '../dto/query-document.dto';
import { IPaginationOptions } from '../../utils/types/pagination-options';
import { KBEmbeddingsService } from './kb-embeddings.service';
import {
  sanitizeText,
  sanitizeMetadata,
  extractCleanText,
} from '../utils/text-sanitizer';
import { FilesService } from '../../files/files.service';
import { KBProcessingQueueService } from './kb-processing-queue.service';
import { KBTextExtractorService } from './kb-text-extractor.service';
import {
  KbDocumentEntity,
  KnowledgeBaseDocumentEntity,
  KnowledgeBaseEntity,
} from '../infrastructure/persistence/relational/entities/knowledge-base.entity';
import { KbProcessingStatus } from '../knowledge-base.enum';
import { KBChunkEntity } from '../infrastructure/persistence/relational/entities/kb-chunk.entity';

@Injectable()
export class KBDocumentsService {
  private readonly logger = new Logger(KBDocumentsService.name);

  constructor(
    @InjectRepository(KnowledgeBaseDocumentEntity)
    private readonly documentRepository: Repository<KbDocumentEntity>,
    @InjectRepository(KnowledgeBaseEntity)
    private readonly kbRepository: Repository<KnowledgeBaseEntity>,
    @InjectRepository(KBChunkEntity)
    private readonly chunkRepository: Repository<KBChunkEntity>,
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly filesService: FilesService,
    private readonly processingQueue: KBProcessingQueueService,
    private readonly textExtractorService: KBTextExtractorService,
    private readonly configService: ConfigService<AllConfigType>,
  ) { }

  async extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    return this.textExtractorService.extractText(buffer, mimeType);
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
          const kb = await this.kbRepository.findOne({
            where: { id: knowledgeBaseId }
          });
          if (!kb) throw new Error('Knowledge Base not found');

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
        bucket:
          this.configService.get('kb.storageBucket', { infer: true }) ||
          'documents',
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

      this.logger.log(`File uploaded successfully: ${fileUrl}`);

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
    const kb = await this.kbRepository.findOne({
      where: { id: createDto.knowledgeBaseId },
    });
    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

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

    const jobId = await this.processingQueue.addJob(
      savedDoc.id,
      createDto.knowledgeBaseId,
      'embedding',
      userId,
    );
    this.processingQueue.setJobDocumentName(jobId, sanitizedName);

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
    paginationOptions: IPaginationOptions & { offset?: number };
    userId: string;
  }): Promise<{ data: KbDocumentEntity[]; total: number }> {
    const kb = await this.kbRepository.findOne({ where: { id: kbId } });
    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

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

    const skip =
      paginationOptions.offset !== undefined
        ? paginationOptions.offset
        : (paginationOptions.page - 1) * paginationOptions.limit;

    query.skip(skip).take(paginationOptions.limit);

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

    const kb = await this.kbRepository.findOne({
      where: { id: document.knowledgeBaseId },
    });
    if (!kb) {
      throw new NotFoundException('Knowledge Base not found');
    }

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

      await this.processingQueue.addJob(
        documentId,
        document.knowledgeBaseId,
        'embedding',
        userId,
      );

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

    // Find dimension for document's KB to target the right collection
    let dimension = 768; // fallback
    try {
      const kb = await this.kbRepository.findOne({ where: { id: document.knowledgeBaseId } });
      if (kb) {
        dimension = await this.embeddingsService.probeDimension(
          kb.aiProviderId || 'ollama', // fallback provider
          kb.ragModel || 'mxbai-embed-large' // fallback model
        );
      }
    } catch (dimError) {
      this.logger.warn(`Could not determine dimension for KB ${document.knowledgeBaseId}: ${dimError.message}`);
    }

    for (const chunk of chunks) {
      if (chunk.vectorId) {
        try {
          await this.embeddingsService.deleteVector(chunk.vectorId, dimension);
        } catch (error) {
          this.logger.warn(
            `Failed to delete vector ${chunk.vectorId} from dim ${dimension}: ${error.message}`,
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

  async findOneWithSecurity(documentId: string, userId: string) {
    return this.findOne(documentId, userId);
  }
}
