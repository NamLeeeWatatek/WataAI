import { Injectable, Logger } from '@nestjs/common';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { KBVectorService } from './kb-vector.service';

export interface ChunkSource {
  content: string;
  score: number;
  documentId: string;
  chunkIndex: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class KBSearchService {
  private readonly logger = new Logger(KBSearchService.name);

  constructor(
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly vectorService: KBVectorService,
  ) {}

  async query(
    query: string,
    workspaceId: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
    useHybrid: boolean = true,
  ): Promise<ChunkSource[]> {
    if (useHybrid) {
      return this.hybridQuery(
        query,
        workspaceId,
        knowledgeBaseId,
        limit,
        similarityThreshold,
      );
    }

    try {
      const queryEmbedding =
        await this.embeddingsService.generateQueryEmbedding(
          query,
          undefined,
          knowledgeBaseId,
        );
      const filter = knowledgeBaseId ? { knowledgeBaseId } : undefined;
      const results = await this.vectorService.search(
        queryEmbedding,
        workspaceId,
        limit,
        filter,
      );
      if (results.length > 0) {
        results.forEach((r, i) => {
          this.logger.log(
            `  [${i + 1}] Score: ${r.score.toFixed(4)} | Content: ${r.payload.content?.substring(0, 100)}...`,
          );
        });
      }

      const filteredResults = results.filter(
        (r) => r.score >= similarityThreshold,
      );

      const validResults = filteredResults.filter((r) => r.payload.content);

      return validResults.map((result) => ({
        content: String(result.payload.content || ''),
        score: Number(result.score),
        metadata: (result.payload.metadata as Record<string, any>) || {},
        documentId: String(result.payload.documentId || ''),
        chunkIndex: Number(result.payload.chunkIndex || 0),
      }));
    } catch (error) {
      this.logger.error(`Error querying knowledge base: ${error.message}`);
      throw error;
    }
  }

  async hybridQuery(
    query: string,
    workspaceId: string,
    knowledgeBaseId?: string,
    limit: number = 5,
    similarityThreshold: number = 0.7,
  ): Promise<ChunkSource[]> {
    try {
      this.logger.log(`🔄 Performing Hybrid Search for: "${query}"`);

      // 1. Vector Search (Semantic)
      const queryEmbedding =
        await this.embeddingsService.generateQueryEmbedding(
          query,
          undefined,
          knowledgeBaseId,
        );
      const vectorResults = await this.vectorService.search(
        queryEmbedding,
        workspaceId,
        limit * 2, // Get more for re-ranking
        knowledgeBaseId ? { knowledgeBaseId } : undefined,
      );

      // 2. Keyword Search (Qdrant Payload Search)
      const keywordResults = await this.vectorService.searchByPayload(
        query,
        workspaceId,
        limit * 2,
        queryEmbedding.length, // Dynamic dimension from the actual embedding model
      );

      // 3. Merging with Reciprocal Rank Fusion (RRF)
      const rrfResults = new Map<string, { chunk: any; score: number }>();
      const k = 60; // Smoothing constant

      // Process Vector Results
      vectorResults.forEach((result, rank) => {
        const score = 1 / (k + rank);
        rrfResults.set(result.id, {
          chunk: {
            content: result.payload.content,
            metadata: result.payload.metadata,
            documentId: result.payload.documentId,
            chunkIndex: result.payload.chunkIndex,
          },
          score: score,
        });
      });

      // Process Keyword Results (from Qdrant)
      keywordResults.forEach((result, rank) => {
        const score = 1 / (k + rank);
        const existing = rrfResults.get(result.id);
        if (existing) {
          existing.score += score;
        } else {
          rrfResults.set(result.id, {
            chunk: {
              content: result.payload.content,
              metadata: result.payload.metadata,
              documentId: result.payload.documentId,
              chunkIndex: result.payload.chunkIndex,
            },
            score: score,
          });
        }
      });

      // Sort and Format
      const sortedResults = Array.from(rrfResults.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return sortedResults.map((r) => ({
        content: String(r.chunk.content || ''),
        metadata: r.chunk.metadata || {},
        documentId: String(r.chunk.documentId || ''),
        chunkIndex: Number(r.chunk.chunkIndex || 0),
        score: Number(r.score),
      }));
    } catch (error) {
      this.logger.error(`Error in hybrid query: ${error.message}`);
      // Fallback to simple vector search if hybrid fails
      return this.query(
        query,
        workspaceId,
        knowledgeBaseId,
        limit,
        similarityThreshold,
        false,
      );
    }
  }

  public async gatherRAGContext(
    message: string,
    workspaceId: string,
    knowledgeBaseIds: string[],
  ): Promise<ChunkSource[]> {
    const allChunks: ChunkSource[] = [];

    for (const kbId of knowledgeBaseIds) {
      try {
        const chunks = await this.query(message, workspaceId, kbId, 3, 0.5);
        allChunks.push(...chunks);
      } catch (error) {
        this.logger.warn(`Failed to query KB ${kbId}: ${error.message}`);
      }
    }

    return allChunks.sort((a, b) => b.score - a.score).slice(0, 10);
  }
}
