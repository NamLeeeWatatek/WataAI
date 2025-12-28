import { ChatMessage } from '../../ai-providers.service';

export interface AiProviderClient {
  /**
   * Send a single prompt to the AI provider
   */
  chat(prompt: string, model: string, options?: ChatOptions): Promise<string>;

  /**
   * Send conversation history to the AI provider
   */
  chatWithHistory(
    messages: ChatMessage[],
    model: string,
    options?: ChatOptions,
  ): Promise<string>;

  /**
   * Generate embeddings for text
   */
  generateEmbedding(text: string, model: string): Promise<number[]>;

  /**
   * Fetch available models from the provider
   */
  fetchModels(): Promise<string[]>;

  /**
   * Test the provider configuration
   */
  testConnection(model?: string): Promise<boolean>;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  stopSequences?: string[];
}

export interface EmbeddingOptions {
  model: string;
  dimensions?: number;
}

export enum AiProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
  AZURE = 'azure',
  CUSTOM = 'custom',
}
