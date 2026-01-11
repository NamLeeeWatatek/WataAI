import { Injectable, Logger } from '@nestjs/common';
import { sanitizeText } from '../utils/text-sanitizer';
import { MarkdownProcessorUtil } from '../utils/markdown-processor.util';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import PDFParser from 'pdf2json';

interface PDFPageRun {
  T: string;
}

interface PDFPageText {
  R: PDFPageRun[];
}

interface PDFPage {
  Texts: PDFPageText[];
}

interface PDFData {
  Pages: PDFPage[];
}

interface PDFParserError {
  parserError: string;
}

interface PDFTextItem {
  str: string; // The text content
  dir: string; // Text direction
  transform: number[]; // Matrix for transformation [scaleX, skewY, skewX, scaleY, translateX, translateY]
  width: number;
  height: number;
  fontName: string;
  hasEOL: boolean;
}

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
          return this.processText(
            MarkdownProcessorUtil.htmlToMarkdown(buffer.toString('utf-8'))
              .content,
          );

        case 'text/plain':
        case 'text/markdown':
        case 'application/json':
          return this.processText(buffer.toString('utf-8'));

        default:
          this.logger.warn(`⚠️ Unknown mime type ${mimeType}, trying as text`);
          return this.processText(buffer.toString('utf-8'));
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

      const timeoutId = setTimeout(() => {
        reject(new Error('pdf2json extraction timed out after 60s'));
      }, 60000);

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        clearTimeout(timeoutId);
        const parserError =
          errData?.parserError || errData?.message || String(errData);
        this.logger.error(`PDF parsing error: ${parserError}`);
        reject(new Error(parserError));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: PDFData) => {
        clearTimeout(timeoutId);
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

          // Final processing using standard pipeline
          const processed = this.processText(text);

          this.logger.log(
            `PDF extraction completed: ${processed.length} chars`,
          );
          resolve(processed);
        } catch (error) {
          clearTimeout(timeoutId);
          this.logger.error(`PDF text processing error: ${error.message}`);
          reject(error);
        }
      });

      try {
        pdfParser.parseBuffer(buffer);
      } catch (err) {
        clearTimeout(timeoutId);
        reject(err);
      }
    });
  }

  private async extractFromPDF(buffer: Buffer): Promise<string> {
    const PDF_MAGIC_BYTES = '%PDF';
    const header = buffer.subarray(0, 1024).toString('ascii'); // Check first 1KB

    if (!header.includes(PDF_MAGIC_BYTES)) {
      this.logger.error(
        `❌ Invalid PDF header. First 20 chars: ${buffer
          .subarray(0, 20)
          .toString('utf-8')}`,
      );
      this.logger.error(
        `❌ Hex dump: ${buffer.subarray(0, 20).toString('hex')}`,
      );
      throw new Error('Invalid PDF format: Missing %PDF header');
    }

    try {
      this.logger.log('Using pdfjs-dist for PDF extraction (Primary)');

      // Set a timeout for extraction to prevent infinite hanging
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(() => {
          reject(new Error('PDF extraction timed out after 60s'));
        }, 60000); // 60 seconds timeout
      });

      const extractionPromise = (async () => {
        // Use pdfjs-dist first as it handles encoded fonts/cmaps better
        // Note: loadingTask is a weird object in recent pdfjs-dist versions for Node
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          useSystemFonts: false, // process.env.NODE_ENV !== 'production', // Safer to disable in some envs
          disableFontFace: true, // Disable font face loading to improve stability on servers
          verbosity: 0, // Suppress warnings
        });

        const pdfDocument = await loadingTask.promise;
        const textPages: string[] = [];

        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as PDFTextItem[];

          if (items.length === 0) continue;

          // Group items by their vertical position (Y coordinate)
          const lines: Map<number, PDFTextItem[]> = new Map();
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

              let textContent = item.str;
              // Attempt to fix common encoding issues where text is URI encoded or double encoded
              try {
                if (textContent.includes('%')) {
                  textContent = decodeURIComponent(textContent);
                }
              } catch (e) {
                // Keep original if decode fails
              }

              lineText += textContent;
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

        if (fullText.length > 0) {
          this.logger.log(
            `PDF extraction completed (pdfjs-dist): ${fullText.length} chars`,
          );
          // Use the centralized processText to ensure consistent cleaning/decoding/normalization
          return this.processText(fullText);
        } else {
          throw new Error('Extracted text is empty');
        }
      })();

      return await Promise.race([extractionPromise, timeoutPromise]);
    } catch (error) {
      this.logger.warn(
        `pdfjs-dist failed, falling back to pdf2json: ${error.message}`,
      );
    }

    // Fallback to pdf2json
    this.logger.log('Falling back to pdf2json for PDF extraction');
    return this.extractPdfWithPdf2json(buffer);
  }

  private processText(text: string): string {
    // 1. Attempt to fix URL encoding if present
    try {
      if (text.includes('%')) {
        // Try to decode URI component but continue if it fails
        const decoded = decodeURIComponent(text);
        // If decoded length is significantly different or looks valid, use it
        if (decoded.length < text.length) {
          text = decoded;
        }
      }
    } catch (e) {
      // Ignore decode errors
    }

    // 2. Normalize Unicode (NFC)
    text = text.normalize('NFC').trim();

    // 3. Clean special characters
    text = text.replace(/·/g, '·');

    // 4. Use Markdown cleaning for final polish
    return MarkdownProcessorUtil.cleanMarkdown(text);
  }

  private async extractFromDOCX(buffer: Buffer): Promise<string> {
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        reject(new Error('DOCX extraction timed out after 60s'));
      }, 60000);
    });

    const extractionPromise = (async () => {
      try {
        // Use convertToHtml to preserve semantic structure (headers, lists, tables)
        const result = await mammoth.convertToHtml({ buffer });

        // If mammoth returns nothing or empty, try raw text
        if (!result || !result.value) {
          const rawResult = await mammoth.extractRawText({ buffer });
          if (rawResult.value) {
            return this.processText(rawResult.value);
          }
          throw new Error('Empty result from DOCX extractor');
        }

        const { content } = MarkdownProcessorUtil.htmlToMarkdown(result.value);

        if (!content || content.length === 0) {
          // Fallback to raw text if HTML conversion yields nothing textually
          const rawResult = await mammoth.extractRawText({ buffer });
          return this.processText(rawResult.value);
        }

        if (result.messages.length > 0) {
          this.logger.warn(
            `DOCX extraction warnings: ${result.messages.length}`,
          );
        }

        const processed = this.processText(content);
        this.logger.log(
          `✅ Extracted structured Markdown (${processed.length} chars) from DOCX`,
        );
        return processed;
      } catch (error) {
        this.logger.error(`Failed to parse DOCX: ${error.message}`);
        throw error;
      }
    })();

    return await Promise.race([extractionPromise, timeoutPromise]);
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
