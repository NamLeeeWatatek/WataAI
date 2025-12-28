import { ChatMessage } from '../../ai-providers.service';

export interface ChatOptions {
  model: string;
  apiKey?: string | null;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatService {
  chat(
    prompt: string,
    model: string,
    provider?: string,
    apiKey?: string | null,
  ): Promise<string>;
  chatWithHistory(
    messages: ChatMessage[],
    model: string,
    provider?: string,
    apiKey?: string | null,
  ): Promise<string>;
  generateEmbedding(
    query: string,
    provider?: string,
    model?: string,
    apiKey?: string | null,
  ): Promise<number[]>;
}

export interface EmbeddingService {
  generateEmbedding(
    query: string,
    provider?: string,
    model?: string,
    apiKey?: string | null,
  ): Promise<number[]>;
}

export interface ModelFetchService {
  fetchModelsByProvider(
    providerKey: string,
    config: Record<string, any>,
  ): Promise<string[]>;
}
