/**
 * Remove null bytes and other invalid characters for PostgreSQL UTF8
 */
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uD800-\uDFFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Validate if text is safe for database storage
 */
export function isValidText(text: string): boolean {
  if (!text) return true;

  if (text.includes('\0')) return false;

  try {
    const encoded = new TextEncoder().encode(text);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
    return decoded === text;
  } catch {
    return false;
  }
}

/**
 * Sanitize filename - preserve Vietnamese characters and emojis
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[\x00-\x1F]/g, '_') // Only remove control characters
    .trim();
}

/**
 * Truncate text to max length safely (don't break UTF-8)
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  let truncated = text.substring(0, maxLength);

  const lastChar = truncated.charCodeAt(truncated.length - 1);
  if (lastChar >= 0xd800 && lastChar <= 0xdbff) {
    truncated = truncated.substring(0, truncated.length - 1);
  }

  return truncated;
}

/**
 * Extract clean text from various formats
 */
export function extractCleanText(content: string, mimeType?: string): string {
  let cleaned = sanitizeText(content);

  if (mimeType?.includes('html')) {
    cleaned = cleaned.replace(/<[^>]*>/g, ' ');
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  }

  if (mimeType?.includes('json')) {
    try {
      const parsed = JSON.parse(cleaned);
      cleaned = JSON.stringify(parsed, null, 2);
    } catch {}
  }

  return cleaned;
}

/**
 * Detect and handle different encodings
 */
export function normalizeEncoding(buffer: Buffer): string {
  try {
    const utf8Text = buffer.toString('utf-8');
    if (isValidText(utf8Text)) {
      return sanitizeText(utf8Text);
    }
  } catch {}

  try {
    const latin1Text = buffer.toString('latin1');
    return sanitizeText(latin1Text);
  } catch {}

  return sanitizeText(buffer.toString('ascii', 0, buffer.length));
}

/**
 * Validate and sanitize metadata object
 */
export function sanitizeMetadata(
  metadata: Record<string, any> | null | undefined,
): Record<string, any> {
  if (!metadata) return {};

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const sanitizedKey = sanitizeText(key);

    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeText(value);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = value.map((item) =>
        typeof item === 'string' ? sanitizeText(item) : item,
      );
    } else if (value && typeof value === 'object') {
      sanitized[sanitizedKey] = sanitizeMetadata(value);
    }
  }

  return sanitized;
}
