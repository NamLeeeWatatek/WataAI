import { Injectable, Logger } from '@nestjs/common';
import { KBEmbeddingsService } from './kb-embeddings.service';
import { KBVectorService } from './kb-vector.service';

export interface ChunkSource {
  content: string;
  score: number;
  documentId: string;
  chunkIndex: number;
  metadata?: Record<string, any>;
  dimension?: number;
}

@Injectable()
export class KBSearchService {
  private readonly logger = new Logger(KBSearchService.name);

  constructor(
    private readonly embeddingsService: KBEmbeddingsService,
    private readonly vectorService: KBVectorService,
  ) { }

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
        dimension: queryEmbedding.length,
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
        limit * 3, // Get more for re-ranking
        knowledgeBaseId ? { knowledgeBaseId } : undefined,
      );

      // Filter vector results by similarity threshold immediately
      // This ensures we don't bring in junk semantic matches
      const filteredVectorResults = vectorResults.filter(
        (v) => v.score >= similarityThreshold,
      );

      // 2. Keyword Search (Qdrant Payload Search)
      // 2. Keyword Search (Qdrant Payload Search)
      let keywordResults: any[] = [];
      try {
        this.logger.debug(`Step 2: Starting keyword search...`);
        keywordResults = await this.vectorService.searchByPayload(
          query,
          workspaceId,
          limit * 3,
          queryEmbedding.length,
        );
        this.logger.debug(
          `Step 2 Done: Found ${keywordResults.length} keyword matches`,
        );
      } catch (err) {
        this.logger.warn(
          `Keyword search failed (skipping hybrid part): ${err.message}`,
        );
        keywordResults = [];
      }

      // 3. Merging with Weighted Reciprocal Rank Fusion (RRF)
      this.logger.debug(`Step 3: Starting RRF Merge...`);
      const rrfResults = new Map<
        string,
        { chunk: any; score: number; vectorScore: number }
      >();
      const k = 60; // Smoothing constant
      const vectorWeight = 0.8; // Weight for semantic search (more important)
      const keywordWeight = 0.2; // Weight for keyword matches (precision)

      // Process filtered Vector Results
      filteredVectorResults.forEach((result, rank) => {
        const semanticScore = 1 / (k + rank);
        rrfResults.set(result.id, {
          chunk: {
            content: result.payload.content,
            metadata: result.payload.metadata,
            documentId: result.payload.documentId,
            chunkIndex: result.payload.chunkIndex,
          },
          score: semanticScore * vectorWeight,
          vectorScore: result.score,
        });
      });

      // Process Keyword Results (from Qdrant)
      keywordResults.forEach((result, rank) => {
        const kwScore = 1 / (k + rank);
        const existing = rrfResults.get(result.id);
        if (existing) {
          existing.score += kwScore * keywordWeight;
        } else {
          // Only include keyword-only results if they are high rank
          // or if similarityThreshold is very low
          rrfResults.set(result.id, {
            chunk: {
              content: result.payload.content,
              metadata: result.payload.metadata,
              documentId: result.payload.documentId,
              chunkIndex: result.payload.chunkIndex,
            },
            score: kwScore * keywordWeight,
            vectorScore: 0,
          });
        }
      });

      // Sort
      const sortedIntermediate = Array.from(rrfResults.values()).sort(
        (a, b) => b.score - a.score,
      );

      // Normalize scores back to 0-1 range for similarityThreshold compatibility
      // Max possible RRF score with weights is (1/k * vectorWeight) + (1/k * keywordWeight) = 1/k
      const maxTheoreticalRRF = 1 / k;

      const pagedResults = sortedIntermediate.slice(0, limit);

      return pagedResults.map((r) => {
        // Map RRF score back to a similarity-like scale (0-1)
        // This is a heuristic: we divide by maxTheoreticalRRF
        let normalizedScore = r.score / maxTheoreticalRRF;

        // If we have a real vector score, blend it for more accuracy
        if (r.vectorScore > 0) {
          normalizedScore = (normalizedScore + r.vectorScore) / 2;
        }

        return {
          content: String(r.chunk.content || ''),
          metadata: r.chunk.metadata || {},
          documentId: String(r.chunk.documentId || ''),
          chunkIndex: Number(r.chunk.chunkIndex || 0),
          score: Number(normalizedScore.toFixed(4)),
          dimension: queryEmbedding.length,
        };
      });
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
        const chunks = await this.query(message, workspaceId, kbId, 5, 0.5);
        allChunks.push(...chunks);
      } catch (error) {
        this.logger.warn(`Failed to query KB ${kbId}: ${error.message}`);
      }
    }

    return allChunks.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  async fetchAdjacentChunks(
    source: ChunkSource,
    windowSize: number = 1,
  ): Promise<ChunkSource[]> {
    if (
      !source.documentId ||
      source.chunkIndex === undefined ||
      !source.dimension
    ) {
      return [source];
    }

    const indices: number[] = [];
    for (let i = -windowSize; i <= windowSize; i++) {
      if (i === 0) continue; // Original already included
      const idx = source.chunkIndex + i;
      if (idx >= 0) indices.push(idx);
    }

    if (indices.length === 0) return [source];

    const results = await this.vectorService.getPointsByPayload(
      {
        documentId: source.documentId,
        chunkIndex: indices,
      },
      source.dimension,
    );

    const adjacentChunks: ChunkSource[] = results.map((r) => ({
      content: String(r.payload.content || ''),
      score: source.score, // Inherit score for context
      documentId: source.documentId,
      chunkIndex: Number(r.payload.chunkIndex),
      metadata: r.payload.metadata,
      dimension: source.dimension,
    }));

    // Combine and sort by index
    return [source, ...adjacentChunks].sort(
      (a, b) => a.chunkIndex - b.chunkIndex,
    );
  }
}
