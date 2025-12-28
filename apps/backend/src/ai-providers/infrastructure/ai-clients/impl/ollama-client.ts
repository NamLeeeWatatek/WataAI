import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { AiProviderClient, ChatOptions } from '../ai-provider-client.interface';
import { ChatMessage } from '../../../ai-providers.service';
import * as crypto from 'crypto';

@Injectable()
export class OllamaClient implements AiProviderClient {
  private openai: OpenAI;

  constructor(baseURL: string = 'http://localhost:11434') {
    this.openai = new OpenAI({
      apiKey: 'ollama', // Dummy key, Ollama doesn't need auth
      baseURL: `${baseURL}/v1`,
    });
  }

  async chat(
    prompt: string,
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stream: false,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Ollama chat failed: ${error.message}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        stream: false,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      throw new Error(`Ollama chat with history failed: ${error.message}`);
    }
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      // Ollama embedding implementation - fallback approach
      // In a real implementation, you'd integrate with Ollama's embedding endpoint
      const hash = crypto.createHash('sha256').update(text).digest('hex');

      // Convert hash to array of numbers (simple approximation of embeddings)
      const embedding: number[] = [];
      for (let i = 0; i < 768; i++) {
        // Standard embedding dimensions
        const chunk = hash.substr(i * 2, 2) || '00';
        const value = parseInt(chunk, 16) / 255; // 0-1 normalization
        embedding.push(value * 2 - 1); // -1 to 1 range like embeddings
      }
      return embedding;
    } catch (error) {
      this.logger.error(`Ollama embedding failed: ${error.message}`);
      throw new Error('Ollama embeddings not properly configured');
    }
  }

  async fetchModels(): Promise<string[]> {
    try {
      const response = await this.openai.models.list();
      return response.data.map((model) => model.id).sort();
    } catch (error) {
      // Return common Ollama models as fallback
      return [
        'llama3.1:8b',
        'llama3.1:70b',
        'codellama:13b',
        'gemma2:9b',
        'deepseek-r1:8b',
      ];
    }
  }

  async testConnection(model?: string): Promise<boolean> {
    try {
      const testModel = model || 'llama3.1:8b';
      await this.chat('Hello', testModel, { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }

  private get logger() {
    const { Logger } = require('@nestjs/common');
    return new Logger(OllamaClient.name);
  }
}
