import {
  Injectable,
  Logger,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from '../../config/config.type';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

@Injectable()
export class KBVectorService implements OnModuleInit {
  private readonly logger = new Logger(KBVectorService.name);
  private qdrantClient: QdrantClient | null = null;
  private readonly collectionPrefix: string;
  private readonly isAvailable: boolean;
  private activeCreations = new Map<string, Promise<string>>();

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.collectionPrefix =
      this.configService.get('kb.vectorCollectionName', { infer: true }) ||
      'kb';

    // Robust default for local development
    let qdrantUrl = process.env.QDRANT_URL || 'http://127.0.0.1:6333';
    // Fix Node 18+ IPv6 resolution issue
    if (qdrantUrl.includes('localhost')) {
      qdrantUrl = qdrantUrl.replace('localhost', '127.0.0.1');
    }

    const qdrantApiKey = process.env.QDRANT_API_KEY;

    try {
      this.qdrantClient = new QdrantClient({
        url: qdrantUrl,
        apiKey: qdrantApiKey, // Optional for local Qdrant
      });
      this.isAvailable = true;
      this.logger.log(`🔌 Qdrant client config loaded for: ${qdrantUrl}`);
    } catch (error) {
      this.isAvailable = false;
      this.logger.error(
        `❌ Failed to initialize Qdrant client: ${error.message}`,
      );
    }
  }

  async onModuleInit() {
    if (this.isAvailable) {
      const connected = await this.testConnection();
      if (connected) {
        this.logger.log('✅ Successfully connected to Qdrant cluster');
      } else {
        this.logger.error(
          '❌ Qdrant client initialized but connection FAILED. Check URL and Network.',
        );
      }
    }
  }

  /**
   * Derives the collection name from the dimension.
   * Format: {prefix}_dim_{dimension} (standardizes names)
   */
  public getCollectionName(dimension: number): string {
    // Backwards compatibility for the original name if it's 768 (optional but helpful)
    if (this.collectionPrefix === 'knowledge-base' && dimension === 768) {
      return 'knowledge-base';
    }
    return `${this.collectionPrefix}_dim_${dimension}`;
  }

  /**
   * Ensures the collection exists with the correct dimension.
   * If it exists with a DIFFERENT dimension, it throws a specific error.
   */
  public async ensureCollection(dimension: number): Promise<string> {
    if (!this.qdrantClient)
      throw new InternalServerErrorException('Qdrant not available');

    const collectionName = this.getCollectionName(dimension);

    // Concurrency Lock: If already creating this collection, wait for it
    const existingCreation = this.activeCreations.get(collectionName);
    if (existingCreation) {
      return existingCreation;
    }

    const creationPromise = (async () => {
      try {
        const collections = await this.qdrantClient!.getCollections();
        const exists = collections.collections.some(
          (c) => c.name === collectionName,
        );

        if (!exists) {
          this.logger.log(
            `🏗️ Creating collection '${collectionName}' with dimension ${dimension}...`,
          );
          await this.qdrantClient!.createCollection(collectionName, {
            vectors: {
              size: dimension,
              distance: 'Cosine',
            },
          });
          return collectionName;
        }

        // Check existing dimension
        const info = await this.qdrantClient!.getCollection(collectionName);
        const params = info.config?.params as unknown as {
          vectors?: { size?: number; default?: { size: number } };
        };
        const vectors = params?.vectors;
        const currentSize =
          typeof vectors?.size === 'number'
            ? vectors.size
            : vectors?.default?.size;

        if (currentSize && currentSize !== dimension) {
          const errorMsg = `Dimension mismatch in collection '${collectionName}'. Expected ${currentSize}, but received ${dimension}.`;
          this.logger.error(`❌ ${errorMsg}`);
          throw new InternalServerErrorException(errorMsg);
        }

        return collectionName;
      } finally {
        // Clear the lock after completion (success or failure)
        this.activeCreations.delete(collectionName);
      }
    })();

    this.activeCreations.set(collectionName, creationPromise);
    return creationPromise;
  }

  async upsertVector(point: VectorPoint, workspaceId: string): Promise<string> {
    if (!this.qdrantClient) {
      throw new InternalServerErrorException('Qdrant client not available');
    }

    try {
      const dimension = point.vector.length;
      const collectionName = await this.ensureCollection(dimension);

      this.logger.debug(
        `Upserting vector to ${collectionName}: ID=${point.id}, Dim=${dimension}`,
      );

      const sanitizedPayload = {
        ...point.payload,
        workspace_id: workspaceId,
        content: point.payload.content
          ? Buffer.from(point.payload.content, 'utf-8').toString('utf-8')
          : '',
      };

      await this.qdrantClient.upsert(collectionName, {
        points: [
          {
            id: point.id,
            vector: point.vector,
            payload: sanitizedPayload,
          },
        ],
      });

      return point.id;
    } catch (error) {
      this.logger.error(`Error upserting vector: ${error.message}`);
      if (error.data) {
        this.logger.error(
          `Qdrant error details: ${JSON.stringify(error.data)}`,
        );
      }
      throw error;
    }
  }

  async search(
    vector: number[],
    workspaceId: string,
    limit: number = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - returning empty results');
      return [];
    }

    try {
      const dimension = vector.length;
      const collectionName = this.getCollectionName(dimension);

      const searchFilter = {
        ...filter,
        workspace_id: workspaceId,
      };

      this.logger.debug(
        `Searching vectors in ${collectionName}: Dim=${dimension}, Filter=${JSON.stringify(
          searchFilter,
        )}`,
      );

      const searchResult = await this.qdrantClient.search(collectionName, {
        vector,
        limit,
        filter: this.buildFilter(searchFilter),
      });

      return searchResult.map((result) => ({
        id: result.id as string,
        score: result.score,
        payload: result.payload as Record<string, any>,
      }));
    } catch (error) {
      this.logger.error(`Error searching vectors: ${error.message}`, {
        cause: error.cause,
        stack: error.stack,
      });
      console.error(error); // Force full log to stdout
      throw error;
    }
  }

  async deleteVector(id: string, dimension: number): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete');
      return;
    }

    try {
      const collectionName = this.getCollectionName(dimension);
      await this.qdrantClient.delete(collectionName, {
        points: [id],
      });
    } catch (error) {
      this.logger.error(
        `Error deleting vector from ${this.getCollectionName(dimension)}: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteByFilter(
    workspaceId: string,
    filter: Record<string, any>,
    dimension: number,
  ): Promise<void> {
    if (!this.qdrantClient) {
      this.logger.warn('Qdrant client not available - skipping delete');
      return;
    }

    try {
      const collectionName = this.getCollectionName(dimension);
      const deleteFilter = {
        ...filter,
        workspace_id: workspaceId,
      };

      await this.qdrantClient.delete(collectionName, {
        filter: this.buildFilter(deleteFilter),
      });
    } catch (error) {
      this.logger.error(
        `Error deleting by filter in ${this.getCollectionName(dimension)}: ${error.message}`,
      );
      throw error;
    }
  }

  private buildFilter(filter: Record<string, any>): any {
    const must: any[] = [];

    for (const [key, value] of Object.entries(filter)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        // Match any value in array
        must.push({
          key,
          match: { any: value },
        });
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Range filter
        if (
          'gte' in value ||
          'lte' in value ||
          'gt' in value ||
          'lt' in value
        ) {
          must.push({
            key,
            range: {
              gt: value.gt,
              gte: value.gte,
              lt: value.lt,
              lte: value.lte,
            },
          });
        } else {
          // Standard equality for objects (if any)
          must.push({
            key,
            match: { value: JSON.stringify(value) },
          });
        }
      } else {
        // Standard equality
        must.push({
          key,
          match: { value },
        });
      }
    }

    return { must };
  }

  isServiceAvailable(): boolean {
    return this.isAvailable && this.qdrantClient !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.qdrantClient) {
      return false;
    }

    try {
      await this.qdrantClient.getCollections();
      return true;
    } catch (error) {
      this.logger.error(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  async recreateCollection(dimension: number): Promise<void> {
    if (!this.qdrantClient) {
      throw new InternalServerErrorException('Qdrant client not available');
    }

    try {
      const collectionName = this.getCollectionName(dimension);
      this.logger.log(
        `Recreating collection '${collectionName}' with dimension ${dimension}...`,
      );

      // Check if exists first to avoid error on delete
      const collections = await this.qdrantClient.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === collectionName,
      );

      if (exists) {
        await this.qdrantClient.deleteCollection(collectionName);
        this.logger.log(`Deleted existing collection '${collectionName}'`);
      }

      await this.qdrantClient.createCollection(collectionName, {
        vectors: {
          size: dimension,
          distance: 'Cosine',
        },
      });

      this.logger.log(
        `[SUCCESS] Collection '${collectionName}' recreated with dimension ${dimension}`,
      );
    } catch (error) {
      this.logger.error(`Failed to recreate collection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clears ALL collections from Qdrant.
   * USE WITH CAUTION.
   */
  async clearAllCollections(): Promise<string[]> {
    if (!this.qdrantClient) {
      throw new InternalServerErrorException('Qdrant client not available');
    }

    try {
      const { collections } = await this.qdrantClient.getCollections();
      const deleted: string[] = [];

      for (const collection of collections) {
        this.logger.warn(`🔥 Deleting collection: ${collection.name}`);
        await this.qdrantClient.deleteCollection(collection.name);
        deleted.push(collection.name);
      }

      this.logger.log(`🧹 Cleaned up ${deleted.length} collections`);
      return deleted;
    } catch (error) {
      this.logger.error(`Failed to clear collections: ${error.message}`);
      throw error;
    }
  }
  /**
   * Creates a Full-Text Index on the 'content' payload field.
   * Required for performant keyword search.
   */
  async createPayloadIndex(dimension: number): Promise<void> {
    if (!this.qdrantClient) return;

    const collectionName = this.getCollectionName(dimension);
    this.logger.log(
      `Creating payload index for 'content' in ${collectionName}...`,
    );

    try {
      await this.qdrantClient.createPayloadIndex(collectionName, {
        field_name: 'content',
        field_schema: 'text', // Full-Text Index
      });
      this.logger.log(`✅ Payload index created for ${collectionName}`);
    } catch (error) {
      this.logger.warn(`Failed to create payload index: ${error.message}`);
    }
  }

  /**
   * Search for chunks containing specific keywords using Qdrant Payload Search.
   * Replaces slow Postgres ILike.
   */
  async searchByPayload(
    query: string,
    workspaceId: string,
    limit: number = 5,
    dimension: number = 1536, // Default to common dim if unknown
  ): Promise<SearchResult[]> {
    if (!this.qdrantClient) return [];

    const collectionName = this.getCollectionName(dimension);

    try {
      // Qdrant Scroll API with Filter
      const result = await this.qdrantClient.scroll(collectionName, {
        limit,
        with_payload: true,
        with_vector: false,
        filter: {
          must: [
            {
              key: 'workspace_id',
              match: { value: workspaceId },
            },
            {
              key: 'content',
              match: { text: query }, // Full-Text Match
            },
          ],
        },
      });

      return result.points.map((point) => ({
        id: point.id as string,
        score: 1.0, // Payload matching doesn't score by default unless we use 'recommend' or newer APIs. RRF handles ranking.
        payload: point.payload as Record<string, any>,
      }));
    } catch (error) {
      // Fallback: If collection doesn't exist (e.g. wrong dimension), return empty
      this.logger.debug(
        `Payload search failed (likely collection miss): ${error.message}`,
      );
      return [];
    }
  }

  async getPointsByPayload(
    filter: Record<string, any>,
    dimension: number,
  ): Promise<SearchResult[]> {
    if (!this.qdrantClient) return [];

    const collectionName = this.getCollectionName(dimension);
    try {
      const result = await this.qdrantClient.scroll(collectionName, {
        limit: 100,
        with_payload: true,
        with_vector: false,
        filter: this.buildFilter(filter),
      });

      return result.points.map((point) => ({
        id: point.id as string,
        score: 1.0,
        payload: point.payload as Record<string, any>,
      }));
    } catch (error) {
      this.logger.debug(`Failed to fetch points by payload: ${error.message}`);
      return [];
    }
  }
}
