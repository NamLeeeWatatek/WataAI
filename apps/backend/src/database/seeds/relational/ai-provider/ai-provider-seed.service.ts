import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiProviderEntity } from '../../../../ai-providers/infrastructure/persistence/relational/entities/ai-provider.entity';

@Injectable()
export class AiProviderSeedService {
  constructor(
    @InjectRepository(AiProviderEntity)
    private repository: Repository<AiProviderEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();

    if (count === 0) {
      const providers = [
        {
          key: 'openai',
          label: 'OpenAI',
          icon: 'AiOutlineOpenAI', // React Icon for OpenAI
          description: 'OpenAI API for GPT models and embeddings',
          requiredFields: ['apiKey'],
          optionalFields: [],
          defaultValues: {},
          isActive: true,
        },
        {
          key: 'anthropic',
          label: 'Anthropic',
          icon: 'SiClaude', // React Icon for Claude (Anthropic)
          description: 'Anthropic API for Claude models',
          requiredFields: ['apiKey'],
          optionalFields: [],
          defaultValues: {},
          isActive: true,
        },
        {
          key: 'google',
          label: 'Google AI',
          icon: 'RiGeminiLine', // React Icon for Gemini (Google)
          description: 'Google AI API for Gemini models',
          requiredFields: ['apiKey'],
          optionalFields: [],
          defaultValues: {},
          isActive: true,
        },
        {
          key: 'azure',
          label: 'Azure OpenAI',
          icon: 'VscAzure', // React Icon for Azure
          description: 'Azure OpenAI service',
          requiredFields: ['apiKey', 'endpoint', 'deploymentName'],
          optionalFields: [],
          defaultValues: {},
          isActive: true,
        },
        {
          key: 'ollama',
          label: 'Ollama',
          icon: 'SiOllama', // React Icon for Ollama
          description: 'Local Ollama instance for running models locally',
          requiredFields: [],
          optionalFields: ['baseUrl'],
          defaultValues: { baseUrl: 'http://localhost:11434' },
          isActive: true,
        },
        {
          key: 'custom',
          label: 'Custom Provider',
          icon: 'MdDashboardCustomize', // React Icon for Custom/Dashboard
          description: 'Custom AI provider configuration',
          requiredFields: [],
          optionalFields: ['apiKey', 'baseUrl'],
          defaultValues: {},
          isActive: true,
        },
      ];

      for (const provider of providers) {
        await this.repository.save(this.repository.create(provider));
      }

      console.log('✅ AI providers seeded successfully');
    } else {
      console.log('ℹ️ AI providers already exist, skipping seed');
    }
  }
}
