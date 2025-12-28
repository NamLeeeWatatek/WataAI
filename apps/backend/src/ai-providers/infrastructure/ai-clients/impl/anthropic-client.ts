import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AiProviderClient, ChatOptions } from '../ai-provider-client.interface';
import { ChatMessage } from '../../../ai-providers.service';

@Injectable()
export class AnthropicClient implements AiProviderClient {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async chat(
    prompt: string,
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 4096,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature,
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      throw new Error(`Anthropic chat failed: ${error.message}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const systemMessage = messages.find((m) => m.role === 'system');
      const chatMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      const response = await this.anthropic.messages.create({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: options?.maxTokens || 4096,
        system: systemMessage?.content,
        messages: chatMessages,
        temperature: options?.temperature,
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      throw new Error(`Anthropic chat with history failed: ${error.message}`);
    }
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    // Anthropic doesn't provide embedding API
    // This would need to be handled differently or throw an error
    throw new Error('Anthropic does not provide embedding functionality');
  }

  async fetchModels(): Promise<string[]> {
    try {
      // Anthropic doesn't have a public models endpoint
      // Return known models
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-2.1',
        'claude-2',
        'claude-instant-1.2',
      ];
    } catch (error) {
      return [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
      ];
    }
  }

  async testConnection(model?: string): Promise<boolean> {
    try {
      const testModel = model || 'claude-3-haiku-20240307';
      await this.chat('Hello', testModel, { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
