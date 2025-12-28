import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';
import { AiProviderClient, ChatOptions } from '../ai-provider-client.interface';
import { ChatMessage } from '../../../ai-providers.service';

@Injectable()
export class OpenAiClient implements AiProviderClient {
  private openai: OpenAI;

  constructor(
    apiKey: string,
    private readonly baseURL?: string,
  ) {
    this.openai = new OpenAI({
      apiKey,
      baseURL: baseURL || 'https://api.openai.com/v1',
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
      throw new Error(`OpenAI chat failed: ${error.message}`);
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
      throw new Error(`OpenAI chat with history failed: ${error.message}`);
    }
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: model || 'text-embedding-ada-002',
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  async fetchModels(): Promise<string[]> {
    try {
      const response = await this.openai.models.list();

      // Filter to commonly used models
      const supportedModels = response.data
        .filter(
          (model) =>
            !model.id.includes('fine-tuned') &&
            !model.id.includes('audio') &&
            !model.id.includes('embed') &&
            !model.id.includes('moderation') &&
            !model.id.includes('-legacy') &&
            (model.id.startsWith('gpt-') ||
              model.id.startsWith('dall-') ||
              model.id.includes('turbo') ||
              model.id.includes('vision')),
        )
        .map((model) => model.id)
        .sort();

      return supportedModels;
    } catch (error) {
      // Return popular static list as fallback
      return ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
    }
  }

  async testConnection(model?: string): Promise<boolean> {
    try {
      const testModel = model || 'gpt-3.5-turbo';
      await this.chat('Hello', testModel, { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
