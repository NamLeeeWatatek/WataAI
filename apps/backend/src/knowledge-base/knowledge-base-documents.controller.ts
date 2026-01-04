import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { KBDocumentsService } from './services/kb-documents.service';
import { KBCrawlerService } from './services/kb-crawler.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  CrawlWebsiteDto,
} from './dto/kb-document.dto';
import { QueryDocumentDto } from './dto/query-document.dto';
import { infinityPagination } from '../utils/infinity-pagination';
import { sanitizeFilename } from './utils/text-sanitizer';
// Windows-1252 to Byte mapping for 0x80-0x9F range
const win1252ToByte: Record<number, number> = {
  0x20ac: 0x80,
  0x201a: 0x82,
  0x0192: 0x83,
  0x201e: 0x84,
  0x2026: 0x85,
  0x2020: 0x86,
  0x2021: 0x87,
  0x02c6: 0x88,
  0x2030: 0x89,
  0x0160: 0x8a,
  0x2039: 0x8b,
  0x0152: 0x8c,
  0x017d: 0x8e,
  0x2018: 0x91,
  0x2019: 0x92,
  0x201c: 0x93,
  0x201d: 0x94,
  0x2022: 0x95,
  0x2013: 0x96,
  0x2014: 0x97,
  0x02dc: 0x98,
  0x2122: 0x99,
  0x0161: 0x9a,
  0x203a: 0x9b,
  0x0153: 0x9c,
  0x017e: 0x9e,
  0x0178: 0x9f,
};

function fixEncoding(filename: string): string {
  if (!filename) return filename;

  try {
    // Strategy: Try to reverse Windows-1252 (or Latin-1) decoding
    // This handles cases where UTF-8 bytes were interpreted as Windows-1252 characters
    const bytes: number[] = [];
    let isLikelyMojibake = false;

    for (let i = 0; i < filename.length; i++) {
      const code = filename.charCodeAt(i);

      if (code <= 0xff) {
        bytes.push(code);
        // If we see high-byte chars, it COULD be mojibake
        if (code > 0x7f) isLikelyMojibake = true;
      } else {
        // Check if it's one of the Windows-1252 extra characters
        const byte = win1252ToByte[code];
        if (byte) {
          bytes.push(byte);
          isLikelyMojibake = true;
        } else {
          // If we encounter a character that isn't in Windows-1252 (e.g. explicit Unicode emoji or CJK),
          // then this string is already UTF-8 or otherwise not the Mojibake we expect.
          return filename;
        }
      }
    }

    // Only attempt to fix if we found non-ASCII chars
    if (!isLikelyMojibake) return filename;

    const buffer = Buffer.from(bytes);
    // Try to decode as UTF-8. 'fatal: true' ensures we don't produce garbage (replacement chars)
    // if the bytes don't form valid UTF-8.
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const decoded = decoder.decode(buffer);

    // Normalization helps with composed/decomposed characters
    return decoded.normalize('NFC');
  } catch (error) {
    // If decoding fails, it wasn't valid UTF-8 bytes, so return original
    return filename;
  }
}

// Alias for backward compatibility if needed, though we'll update calls
const decodeFilename = fixEncoding;

import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';

@ApiTags('Knowledge Base - Documents')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), WorkspaceAccessGuard)
@Controller({ path: 'knowledge-bases', version: '1' })
export class KnowledgeBaseDocumentsController {
  constructor(
    private readonly documentsService: KBDocumentsService,
    private readonly crawlerService: KBCrawlerService,
  ) { }

  @Post('documents')
  @ApiOperation({ summary: 'Create document' })
  async create(@Request() req, @Body() createDto: CreateDocumentDto) {
    const userId = req.user.id;
    const workspaceId = createDto.workspaceId || req.user.workspaceId;
    return this.documentsService.create(userId, { ...createDto, workspaceId });
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get documents in knowledge base' })
  async getDocuments(
    @Param('id') id: string,
    @Request() req,
    @Query() query: QueryDocumentDto,
  ) {
    const userId = req.user.id;
    const page = query?.page ?? 1;
    let limit = query?.limit ?? 10;
    if (limit > 50) {
      limit = 50;
    }

    const filters = query?.filters || {};
    // Ensure folderId from query takes precedence if provided separately
    const folderId =
      filters.folderId === 'null' ? null : (filters.folderId ?? null);

    const { data, total } = await this.documentsService.findManyWithPagination({
      kbId: id,
      filterOptions: { ...filters, folderId },
      sortOptions: query?.sort || undefined,
      paginationOptions: { page, limit },
      userId,
    });

    const decodedData = data.map((doc) => ({
      ...doc,
      name: decodeFilename(doc.name || ''),
      title: doc.title ? decodeFilename(doc.title) : doc.title,
      metadata: doc.metadata
        ? {
          ...doc.metadata,
          originalName: doc.metadata.originalName
            ? decodeFilename(doc.metadata.originalName)
            : doc.metadata.originalName,
        }
        : doc.metadata,
    }));

    return infinityPagination(decodedData, { page, limit }, total);
  }

  @Get('documents/:documentId')
  @ApiOperation({ summary: 'Get document by ID' })
  async getDocument(@Param('documentId') documentId: string, @Request() req) {
    const userId = req.user.id;
    return this.documentsService.findOne(documentId, userId);
  }

  @Get('documents/:documentId/download')
  @ApiOperation({ summary: 'Download document file' })
  async downloadDocument(
    @Param('documentId') documentId: string,
    @Request() req,
  ) {
    const userId = req.user.id;
    return this.documentsService.getDownloadUrl(documentId, userId);
  }

  @Patch('documents/:documentId')
  @ApiOperation({ summary: 'Update document' })
  async update(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    const userId = req.user.id;
    return this.documentsService.update(documentId, userId, updateDto);
  }

  @Delete('documents/:documentId')
  @ApiOperation({ summary: 'Delete document' })
  async remove(@Param('documentId') documentId: string, @Request() req) {
    const userId = req.user.id;
    return this.documentsService.remove(documentId, userId);
  }

  @Patch('documents/:documentId/move')
  @ApiOperation({ summary: 'Move document to folder' })
  async moveDocument(
    @Param('documentId') documentId: string,
    @Request() req,
    @Body('folderId') folderId?: string | null,
  ) {
    const userId = req.user.id;
    return this.documentsService.moveToFolder(
      documentId,
      userId,
      folderId || null,
    );
  }

  @Post('documents/upload')
  @ApiOperation({ summary: 'Upload document file(s)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      // Set proper filename handling with UTF-8 support
      fileFilter: (req, file, callback) => {
        // Accept document files
        const allowedMimes = [
          'application/pdf',
          'text/plain',
          'text/markdown',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
          'application/json',
          'video/mp4',
          'video/mpeg',
          'video/quicktime',
          'video/x-msvideo',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
          'audio/ogg',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
        ];

        if (!allowedMimes.includes(file.mimetype)) {
          return callback(
            new Error(`File type ${file.mimetype} not allowed`),
            false,
          );
        }

        callback(null, true);
      },
      // Ensure proper UTF-8 filename handling
      preservePath: false,
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body('knowledgeBaseId') knowledgeBaseId: string,
    @Body('folderId') folderId?: string,
  ) {
    const userId = req.user.id;

    console.log('🔍 UPLOAD REQUEST RECEIVED:', {
      userId,
      knowledgeBaseId,
      folderId,
      fileName: file?.originalname,
      fileSize: file?.size,
      mimeType: file?.mimetype,
      hasBuffer: !!file?.buffer,
      bufferLength: file?.buffer?.length,
    });

    if (!file) {
      console.error('❌ No file uploaded in request');
      throw new BadRequestException('No file uploaded');
    }

    // Log raw filename to understand encoding at source level
    console.log('🎯 RAW UPLOAD RECEIVED:', {
      filename: file.originalname,
      isEmpty: !file.originalname,
      length: file.originalname?.length,
      charCodes: [...(file.originalname || '')].map((x) => x.charCodeAt(0)),
      containsNonAscii: [...(file.originalname || '')].some(
        (c) => c.charCodeAt(0) > 127,
      ),
      encoding: Buffer.from(file.originalname || '', 'utf8').toString(),
    });

    // Fix filename encoding issues (specifically Windows-1252 to UTF-8 mojibake)
    const fileNameFixed = fixEncoding(file.originalname);

    // Store fixed name if it was different
    if (fileNameFixed !== file.originalname) {
      console.log('✨ Fixed Mojibake filename:', {
        original: file.originalname,
        fixed: fileNameFixed,
      });
    }

    const sanitizedFilename = sanitizeFilename(fileNameFixed);
    console.log('🔄 Filename processing:', {
      original: file.originalname,
      fixed: fileNameFixed,
      sanitized: sanitizedFilename,
    });

    let fileUrl: string | null = null;
    let fileId: string | null = null;

    try {
      const uploadResult = await this.documentsService.uploadFileToStorage(
        file.buffer,
        sanitizedFilename,
        file.mimetype,
        knowledgeBaseId,
        userId,
      );
      fileUrl = uploadResult.fileUrl;
      fileId = uploadResult.fileId;
    } catch (error) {
      return {
        success: false,
        error: `Failed to upload file to storage: ${error.message}`,
      };
    }

    let content: string;
    try {
      content = await this.documentsService.extractTextFromFile(
        file.buffer,
        file.mimetype,
      );
    } catch (error) {
      return {
        success: false,
        error: `Failed to extract text: ${error.message}`,
      };
    }

    if (!content || content.length === 0) {
      return { success: false, error: 'File content is empty or invalid' };
    }

    const createdDoc: any = await this.documentsService.create(userId, {
      knowledgeBaseId,
      folderId,
      name: sanitizedFilename,
      content,
      workspaceId: req.user.workspaceId,
      fileType: file.mimetype,
      mimeType: file.mimetype,
      fileUrl,
      metadata: {
        originalName: fileNameFixed, // Store the fixed version
        size: file.size,
        extractedLength: content.length,
        uploadedAt: new Date().toISOString(),
        fileId,
      },
    });

    // Apply filename fixing to upload response too
    return {
      ...createdDoc,
      name: decodeFilename(createdDoc.name || ''),
      title: createdDoc.title
        ? decodeFilename(createdDoc.title)
        : createdDoc.title,
      metadata: createdDoc.metadata
        ? {
          ...createdDoc.metadata,
          originalName: createdDoc.metadata.originalName
            ? decodeFilename(createdDoc.metadata.originalName)
            : createdDoc.metadata.originalName,
        }
        : createdDoc.metadata,
    };
  }

  @Post('crawl/website')
  @ApiOperation({ summary: 'Crawl website and add to knowledge base' })
  async crawlWebsite(@Request() req, @Body() crawlDto: CrawlWebsiteDto) {
    const userId = req.user.id;

    // Start crawl in background and return success immediately
    this.crawlerService
      .crawlWebsite(crawlDto.url, crawlDto.knowledgeBaseId, userId, {
        maxPages: crawlDto.maxPages,
        maxDepth: crawlDto.maxDepth,
        followLinks: crawlDto.followLinks,
        includePatterns: crawlDto.includePatterns,
        excludePatterns: crawlDto.excludePatterns,
        folderId: crawlDto.folderId,
      })
      .catch((error) => {
        const logger = new Logger('KbCrawlError');
        logger.error(`Background crawl failed: ${error.message}`);
      });

    return {
      success: true,
      message: 'Crawling started in the background',
    };
  }
}
