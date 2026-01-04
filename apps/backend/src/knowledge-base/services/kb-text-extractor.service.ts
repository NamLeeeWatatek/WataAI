import { Injectable, Logger } from '@nestjs/common';
import { sanitizeText } from '../utils/text-sanitizer';
import { MarkdownProcessorUtil } from '../utils/markdown-processor.util';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';

@Injectable()
export class KBTextExtractorService {
  private readonly logger = new Logger(KBTextExtractorService.name);

  async extractText(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      this.logger.log(`📄 Extracting text from ${mimeType}`);

      switch (mimeType) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);

        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          return await this.extractFromDOCX(buffer);

        case 'text/html':
          return MarkdownProcessorUtil.htmlToMarkdown(buffer.toString('utf-8')).content;

        case 'text/plain':
        case 'text/markdown':
          return MarkdownProcessorUtil.cleanMarkdown(buffer.toString('utf-8'));

        case 'application/json':
          return buffer.toString('utf-8');

        default:
          this.logger.warn(
            `⚠️ Unknown mime type ${mimeType}, trying as text`,
          );
          return buffer.toString('utf-8');
      }
    } catch (error) {
      this.logger.error(`❌ Failed to extract text: ${error.message}`);
      throw new Error(
        `Failed to extract text from ${mimeType}: ${error.message}`,
      );
    }
  }

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

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    try {
      this.logger.log('Using pdfjs-dist for PDF extraction (Primary)');
      // Use pdfjs-dist first as it handles encoded fonts/cmaps better
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      });

      const pdfDocument = await loadingTask.promise;
      const textPages: string[] = [];

      for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as any[];

        if (items.length === 0) continue;

        // Group items by their vertical position (Y coordinate)
        const lines: Map<number, any[]> = new Map();
        const yThreshold = 2;

        for (const item of items) {
          const y = Math.round(item.transform[5] / yThreshold) * yThreshold;
          if (!lines.has(y)) {
            lines.set(y, []);
          }
          lines.get(y)!.push(item);
        }

        const sortedY = Array.from(lines.keys()).sort((a, b) => b - a);
        let pageText = '';

        for (const y of sortedY) {
          const lineItems = lines.get(y)!;
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          let lineText = '';
          let lastX = -1;
          let lastWidth = 0;

          for (const item of lineItems) {
            if (lastX !== -1 && item.transform[4] - (lastX + lastWidth) > 3) {
              lineText += ' ';
            }
            lineText += item.str;
            lastX = item.transform[4];
            lastWidth = item.width || 0;
          }
          pageText += lineText + '\n';
        }
        textPages.push(pageText.trim());
      }

      let fullText = textPages.join('\n\n').trim();
      fullText = fullText.normalize('NFC');

      fullText = fullText
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      if (fullText.length > 50) {
        this.logger.log(`PDF extraction completed (pdfjs-dist): ${fullText.length} chars`);
        return MarkdownProcessorUtil.cleanMarkdown(fullText);
      }
    } catch (error) {
      this.logger.warn(`pdfjs-dist failed, falling back to pdf2json: ${error.message}`);
    }

    // Fallback to pdf2json
    this.logger.log('Falling back to pdf2json for PDF extraction');
    return this.extractPdfWithPdf2json(buffer);
  }

  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    try {
      // Use convertToHtml to preserve semantic structure (headers, lists, tables)
      const result = await mammoth.convertToHtml({ buffer });
      const { content } = MarkdownProcessorUtil.htmlToMarkdown(result.value);

      if (!content || content.length === 0) {
        // Fallback to raw text if HTML conversion yields nothing
        const rawResult = await mammoth.extractRawText({ buffer });
        return MarkdownProcessorUtil.cleanMarkdown(rawResult.value);
      }

      if (result.messages.length > 0) {
        this.logger.warn(`DOCX extraction warnings: ${result.messages.length}`);
      }

      this.logger.log(`✅ Extracted structured Markdown (${content.length} chars) from DOCX`);
      return content;
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
