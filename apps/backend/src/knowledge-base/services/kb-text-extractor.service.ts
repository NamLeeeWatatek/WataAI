import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KBTextExtractorService {
  private readonly logger = new Logger(KBTextExtractorService.name);

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      this.logger.log(`ðŸ“„ Extracting text from ${mimeType}`);

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromDOCX(buffer);

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

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      const text = data.text.trim();

      if (!text || text.length === 0) {
        throw new Error('PDF contains no extractable text');
      }

      this.logger.log(`âœ… Extracted ${text.length} characters from PDF`);
      return text;
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${error.message}`);
      throw error;
    }
  }

  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value.trim();

      if (!text || text.length === 0) {
        throw new Error('DOCX contains no extractable text');
      }

      if (result.messages.length > 0) {
        this.logger.warn(`DOCX extraction warnings: ${result.messages.length}`);
      }

      this.logger.log(`âœ… Extracted ${text.length} characters from DOCX`);
      return text;
    } catch (error) {
      this.logger.error(`Failed to parse DOCX: ${error.message}`);
      throw error;
    }
  }

  isSupportedFileType(mimeType: string): boolean {
    const supported = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'text/html',
      'application/json',
    ];

    return supported.includes(mimeType);
  }

  getSupportedExtensions(): string[] {
    return ['.pdf', '.docx', '.doc', '.txt', '.md', '.html', '.json'];
  }
}
