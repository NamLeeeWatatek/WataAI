import { Injectable } from '@nestjs/common';
import {
  AiProviderClient,
  AiProviderType,
} from './ai-provider-client.interface';
import { OpenAiClient } from './impl/openai-client';
import { GoogleAiClient } from './impl/google-client';
import { AnthropicClient } from './impl/anthropic-client';
import { OllamaClient } from './impl/ollama-client';

@Injectable()
export class AiClientFactory {
  createClient(
    providerType: AiProviderType | string,
    config: Record<string, any>,
  ): AiProviderClient {
    const { apiKey, baseUrl, baseURL } = config;

    switch (providerType) {
      case AiProviderType.OPENAI:
        return new OpenAiClient(apiKey, baseUrl || baseURL);

      case AiProviderType.ANTHROPIC:
        return new AnthropicClient(apiKey);

      case AiProviderType.GOOGLE:
        return new GoogleAiClient(apiKey);

      case AiProviderType.OLLAMA:
        return new OllamaClient(baseUrl || baseURL || 'http://localhost:11434');

      default:
        throw new Error(`Unsupported AI provider type: ${providerType}`);
    }
  }

  createClientFromProviderId(
    providerKey: string,
    config: Record<string, any>,
  ): AiProviderClient {
    return this.createClient(providerKey as AiProviderType, config);
  }
}
