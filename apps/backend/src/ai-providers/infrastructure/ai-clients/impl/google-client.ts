import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProviderClient, ChatOptions } from '../ai-provider-client.interface';
import { ChatMessage } from '../../../ai-providers.service';

@Injectable()
export class GoogleAiClient implements AiProviderClient {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chat(
    prompt: string,
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: model || 'gemini-pro',
      });
      const result = await chatModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      throw new Error(`Google AI chat failed: ${error.message}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    options?: ChatOptions,
  ): Promise<string> {
    try {
      const chatModel = this.genAI.getGenerativeModel({
        model: model || 'gemini-pro',
      });

      // Filter out system messages and convert to Google Gemini format
      const userMessages = messages.filter((m) => m.role !== 'system');
      const systemMessage = messages.find((m) => m.role === 'system');

      // Start chat with system instruction if available
      let chatSession;
      if (systemMessage) {
        chatSession = chatModel.startChat({
          systemInstruction: systemMessage.content,
        });
      } else {
        chatSession = chatModel.startChat();
      }

      // Send user messages one by one to maintain conversation
      let lastResponse = '';
      for (const message of userMessages) {
        if (message.role === 'user') {
          const result = await chatSession.sendMessage(message.content);
          lastResponse = result.response.text();
        }
      }

      return lastResponse;
    } catch (error) {
      throw new Error(`Google AI chat with history failed: ${error.message}`);
    }
  }

  async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      const embeddingModel = this.genAI.getGenerativeModel({
        model: model || 'text-embedding-004',
      });
      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      throw new Error(`Google AI embedding failed: ${error.message}`);
    }
  }

  async fetchModels(): Promise<string[]> {
    try {
      // Google AI doesn't expose a public models endpoint
      // Return known models
      return [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro',
        'text-bison-001',
        'chat-bison-001',
      ];
    } catch (error) {
      return [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro',
      ];
    }
  }

  async testConnection(model?: string): Promise<boolean> {
    try {
      const testModel = model || 'gemini-1.5-flash';
      await this.chat('Hello', testModel, { maxTokens: 5 });
      return true;
    } catch {
      return false;
    }
  }
}
