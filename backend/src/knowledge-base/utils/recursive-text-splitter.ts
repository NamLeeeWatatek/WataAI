export interface RecursiveCharacterTextSplitterParams {
  chunkSize?: number;
  chunkOverlap?: number;
  separators?: string[];
  keepSeparator?: boolean;
}

export class RecursiveCharacterTextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];
  private keepSeparator: boolean;

  constructor(fields?: RecursiveCharacterTextSplitterParams) {
    this.chunkSize = fields?.chunkSize ?? 1000;
    this.chunkOverlap = fields?.chunkOverlap ?? 200;
    this.separators = fields?.separators ?? ['\n\n', '\n', ' ', ''];
    this.keepSeparator = fields?.keepSeparator ?? false;
  }

  async splitText(text: string): Promise<string[]> {
    const finalChunks: string[] = [];
    const goodSplits: string[] = [];

    // Determine the separator to use
    let separator = this.separators[this.separators.length - 1];
    let newSeparators: string[] = [];

    for (const s of this.separators) {
      if (s === '') {
        separator = s;
        break;
      }
      if (text.includes(s)) {
        separator = s;
        newSeparators = this.separators.slice(this.separators.indexOf(s) + 1);
        break;
      }
    }

    // Split using the selected separator
    const splits = this._splitTextWithSeparator(text, separator);

    // Recursively merge or split further
    let currentDoc: string[] = [];
    let total = 0;

    for (const d of splits) {
      const len = d.length;
      if (
        total + len + (currentDoc.length > 0 ? separator.length : 0) >
        this.chunkSize
      ) {
        if (total > this.chunkSize) {
          // This single chunk is too big, recurse on it
          if (currentDoc.length > 0) {
            const doc = this._joinDocs(currentDoc, separator);
            if (doc !== null) finalChunks.push(doc);

            // Backtrack overlap
            while (
              total > this.chunkOverlap ||
              (total > 0 && currentDoc.length === 0)
            ) {
              total -=
                currentDoc[0].length +
                (currentDoc.length > 1 ? separator.length : 0);
              currentDoc.shift();
            }
          }
        }

        if (currentDoc.length > 0) {
          const doc = this._joinDocs(currentDoc, separator);
          if (doc !== null) finalChunks.push(doc);

          // Overlap logic
          // Simple approach: Pop from front until we fit or empty
          while (
            total > this.chunkOverlap ||
            (total > 0 && currentDoc.length === 0)
          ) {
            total -=
              currentDoc[0].length +
              (currentDoc.length > 1 ? separator.length : 0);
            currentDoc.shift();
          }
        }
      }

      currentDoc.push(d);
      total += len + (currentDoc.length > 1 ? separator.length : 0);

      // If the chunk itself is larger than chunk size, and we have separators left, recurse
      if (len > this.chunkSize && newSeparators.length > 0) {
        // This piece 'd' needs further splitting
        // For now, simple logic: push what we have so far (minus 'd')
        // Then split 'd' recursively
        // This complexity is high for a simple impl, let's stick to simple accumulation
        // A true recursive splitter re-calls splitText on 'd'
        const recursiveSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: this.chunkSize,
          chunkOverlap: this.chunkOverlap,
          separators: newSeparators,
          keepSeparator: this.keepSeparator,
        });
        const subChunks = await recursiveSplitter.splitText(d);
        finalChunks.push(...subChunks);

        // Reset currentDoc/total because we handled 'd' externally
        currentDoc = [];
        total = 0;
      }
    }

    const doc = this._joinDocs(currentDoc, separator);
    if (doc !== null) finalChunks.push(doc);

    return finalChunks;
  }

  private _splitTextWithSeparator(text: string, separator: string): string[] {
    let splits: string[];
    if (separator) {
      if (this.keepSeparator) {
        const regex = new RegExp(
          `(${separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
          'g',
        );
        splits = text.split(regex);
        // Toggle join if separating by group capture
        for (let i = 1; i < splits.length; i += 2) {
          splits[i - 1] += splits[i];
          splits[i] = '';
        }
        splits = splits.filter((s) => s !== '');
      } else {
        splits = text.split(separator);
      }
    } else {
      splits = text.split('');
    }
    return splits.filter((s) => s !== '');
  }

  private _joinDocs(docs: string[], separator: string): string | null {
    const text = docs.join(separator).trim();
    return text === '' ? null : text;
  }
}
