/**
 * Clean AiProvider domain entity
 * Single responsibility: Provider metadata and configuration schema
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProviderKey } from '../enums';
import { IAiProvider, ConfigField } from '../interfaces';

// Export CreateProviderRequest from here
export interface CreateProviderRequest {
  key: ProviderKey;
  label: string;
  description?: string;
  requiredFields: ConfigField[];
  defaultValues: Record<string, any>;
  isActive?: boolean;
}

export class AiProvider implements IAiProvider {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ example: 'openai' })
  key: ProviderKey;

  @ApiProperty({ example: 'OpenAI GPT' })
  label: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Add missing properties that the service expects
  requiredFields: ConfigField[];
  defaultValues: Record<string, any>;

  // Business logic methods - Clean encapsulation
  getRequiredConfigFields(): ConfigField[] {
    // Return provider-specific required fields
    switch (this.key) {
      case ProviderKey.OPENAI:
        return [
          {
            name: 'apiKey',
            label: 'API Key',
            type: 'string',
            required: true,
            validation: {
              pattern: /^sk-[a-zA-Z0-9]{48}$/,
            },
          },
        ];

      case ProviderKey.ANTHROPIC:
        return [
          {
            name: 'apiKey',
            label: 'API Key',
            type: 'string',
            required: true,
            validation: {
              pattern: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
            },
          },
        ];

      case ProviderKey.GOOGLE:
        return [
          {
            name: 'apiKey',
            label: 'API Key',
            type: 'string',
            required: true,
          },
        ];

      case ProviderKey.OLLAMA:
        return [
          {
            name: 'baseUrl',
            label: 'Base URL',
            type: 'string',
            required: false,
            default: 'http://localhost:11434',
          },
        ];

      default:
        return [];
    }
  }

  getDefaultValues(): Record<string, any> {
    const defaults: Record<string, any> = {
      useStream: true,
      timeout: 60000, // 60 seconds
      retryAttempts: 3,
      rateLimitPerMinute: 60,
    };

    // Provider-specific defaults
    switch (this.key) {
      case ProviderKey.OPENAI:
        defaults.apiVersion = 'v1';
        defaults.defaultModel = 'gpt-3.5-turbo';
        defaults.availableModels = [
          'gpt-3.5-turbo',
          'gpt-4',
          'gpt-4-turbo-preview',
          'gpt-4o',
        ];
        break;

      case ProviderKey.ANTHROPIC:
        defaults.apiVersion = '2023-06-01';
        defaults.defaultModel = 'claude-3-sonnet-20240229';
        defaults.availableModels = [
          'claude-3-haiku-20240307',
          'claude-3-sonnet-20240229',
          'claude-3-opus-20240229',
        ];
        break;

      case ProviderKey.GOOGLE:
        defaults.defaultModel = 'gemini-pro';
        defaults.availableModels = [
          'gemini-pro',
          'gemini-pro-vision',
          'gemini-ultra',
        ];
        break;

      case ProviderKey.OLLAMA:
        defaults.baseUrl = 'http://localhost:11434';
        defaults.defaultModel = 'llama2';
        defaults.availableModels = [
          'llama2',
          'llama2:13b',
          'codellama',
          'mistral',
        ];
        break;
    }

    return defaults;
  }

  // Domain behavior methods
  supportsStreaming(): boolean {
    // Most providers support streaming now
    return this.key !== ProviderKey.CUSTOM;
  }

  getContextWindow(model?: string): number {
    // Provider-specific context windows
    switch (this.key) {
      case ProviderKey.OPENAI:
        if (model?.includes('gpt-4')) return 8192;
        if (model?.includes('gpt-4-turbo')) return 128000;
        if (model?.includes('gpt-4o')) return 128000;
        return 4096; // gpt-3.5-turbo

      case ProviderKey.ANTHROPIC:
        return 200000; // Claude context window

      case ProviderKey.GOOGLE:
        return 32768; // Gemini context window

      case ProviderKey.OLLAMA:
        // Depends on the model, but default to reasonable value
        return 4096;

      default:
        return 4096; // Safe default
    }
  }

  hasFunctionCalling(model?: string): boolean {
    // Only certain providers/models support function calling
    switch (this.key) {
      case ProviderKey.OPENAI:
        return model
          ? ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'].some((m) =>
              model.includes(m),
            )
          : true;

      case ProviderKey.ANTHROPIC:
        return true;

      default:
        return false;
    }
  }

  // Factory methods for different provider types
  static createOpenAi(): AiProvider {
    const provider = new AiProvider();
    provider.key = ProviderKey.OPENAI;
    provider.label = 'OpenAI GPT';
    provider.description = 'OpenAI GPT models including ChatGPT';
    provider.isActive = true;
    provider.requiredFields = provider.getRequiredConfigFields();
    provider.defaultValues = provider.getDefaultValues();
    return provider;
  }

  static createAnthropic(): AiProvider {
    const provider = new AiProvider();
    provider.key = ProviderKey.ANTHROPIC;
    provider.label = 'Anthropic Claude';
    provider.description = 'Anthropic Claude AI models';
    provider.isActive = true;
    provider.requiredFields = provider.getRequiredConfigFields();
    provider.defaultValues = provider.getDefaultValues();
    return provider;
  }

  static createGoogle(): AiProvider {
    const provider = new AiProvider();
    provider.key = ProviderKey.GOOGLE;
    provider.label = 'Google Gemini';
    provider.description = 'Google Gemini AI models';
    provider.isActive = true;
    provider.requiredFields = provider.getRequiredConfigFields();
    provider.defaultValues = provider.getDefaultValues();
    return provider;
  }

  static createOllama(): AiProvider {
    const provider = new AiProvider();
    provider.key = ProviderKey.OLLAMA;
    provider.label = 'Ollama';
    provider.description = 'Local AI models via Ollama';
    provider.isActive = true;
    provider.requiredFields = provider.getRequiredConfigFields();
    provider.defaultValues = provider.getDefaultValues();
    return provider;
  }
}
