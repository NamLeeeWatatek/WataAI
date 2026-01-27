import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export class MarkdownProcessorUtil {
  private static turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  /**
   * Converts HTML content to clean Markdown.
   * Uses @mozilla/readability to extract the main content and remove noise.
   */
  static htmlToMarkdown(
    html: string,
    url?: string,
  ): { title: string; content: string; excerpt: string; images: string[] } {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document as unknown as Document);
    const article = reader.parse();

    if (!article) {
      // Fallback if readability fails
      const content = this.turndownService.turndown(html);
      return { title: '', content, excerpt: '', images: [] };
    }

    // Extract images from the parsed article content
    const images: string[] = [];
    if (article.content) {
      try {
        const contentDom = new JSDOM(article.content, { url });
        const imgs = contentDom.window.document.querySelectorAll('img');
        imgs.forEach((img) => {
          if (img.src && !img.src.startsWith('data:')) {
            images.push(img.src);
          }
        });
      } catch (e) {
        // Ignore image extraction errors
      }
    }

    const markdown = article.content
      ? this.turndownService.turndown(article.content)
      : '';

    return {
      title: article.title || '',
      content: this.cleanMarkdown(markdown),
      excerpt: article.excerpt || '',
      images: [...new Set(images)], // Remove duplicates
    };
  }

  /**
   * Cleans and normalizes Markdown content.
   */
  static cleanMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Remove excessive empty lines
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/\[\s*\]/g, '') // Remove empty links
      .trim();
  }
}
