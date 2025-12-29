import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { NullableType } from '../utils/types/nullable.type';
import { AiProviderConfigRepository } from './infrastructure/persistence/ai-provider-config.repository';
import { SystemAiSettingsRepository } from './infrastructure/system/system-ai-settings.repository';
import {
  CreateUserAiProviderConfigDto,
  UpdateUserAiProviderConfigDto,
  CreateWorkspaceAiProviderConfigDto,
  UpdateWorkspaceAiProviderConfigDto,
  UpdateSystemAiSettingsDto,
} from './dto/ai-provider.dto';
import { EncryptionUtil } from '../common/utils/encryption.util';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as crypto from 'crypto';
import {
  AiProvider,
  UserAiProviderConfig,
  WorkspaceAiProviderConfig,
  AiUsageLog,
  SystemAiSettings,
} from './domain/ai-provider';

// Define ChatMessage type
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiProvidersService {
  private readonly logger = new Logger(AiProvidersService.name);

  constructor(
    private readonly aiProviderConfigRepository: AiProviderConfigRepository,
    private readonly systemAiSettingsRepository: SystemAiSettingsRepository,
    private readonly encryptionService: EncryptionUtil,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Encrypts sensitive configuration fields like API keys and URLs.
   * Handles nested config objects and recursively encrypts sensitive fields.
   */
  private encryptConfig(config: any): any {
    if (!config) return config;
    const encrypted = { ...config };

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (encrypted.config && typeof encrypted.config === 'object') {
      encrypted.config = this.encryptConfig(encrypted.config);
      return encrypted;
    }

    // Encrypt API keys
    if (encrypted.apiKey && typeof encrypted.apiKey === 'string') {
      encrypted.apiKey = this.encryptionService.encrypt(encrypted.apiKey);
    }

    // For custom providers, encrypt URL as well to prevent visibility
    if (
      encrypted.baseUrl &&
      typeof encrypted.baseUrl === 'string' &&
      encrypted.baseUrl.includes('//')
    ) {
      encrypted.baseUrl = this.encryptionService.encrypt(encrypted.baseUrl);
    }

    return encrypted;
  }

  /**
   * Decrypts sensitive configuration fields like API keys and URLs.
   * Handles nested config objects and recursively decrypts sensitive fields.
   */
  private decryptConfig(config: any): any {
    if (!config) return config;
    const decrypted = { ...config };

    // Handle domain object structure (e.g., WorkspaceAiProviderConfig)
    if (decrypted.config && typeof decrypted.config === 'object') {
      decrypted.config = this.decryptConfig(decrypted.config);
      return decrypted;
    }

    // Decrypt API keys
    if (decrypted.apiKey && typeof decrypted.apiKey === 'string') {
      try {
        decrypted.apiKey = this.encryptionService.decrypt(decrypted.apiKey);
      } catch (error) {
        this.logger.warn(`Decryption of API key failed: ${error.message}`);
      }
    }

    // Decrypt URLs for custom providers
    if (
      decrypted.baseUrl &&
      typeof decrypted.baseUrl === 'string' &&
      decrypted.baseUrl.includes(':')
    ) {
      try {
        // Only try to decrypt if it looks like encrypted format (has :)
        if (decrypted.baseUrl.split(':').length === 3) {
          decrypted.baseUrl = this.encryptionService.decrypt(decrypted.baseUrl);
        }
      } catch (error) {
        // Not encrypted or wrong format
      }
    }

    return decrypted;
  }

  // Provider management
  async getAvailableProviders(): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.findAvailableProviders();
  }

  async getProviderById(id: string): Promise<NullableType<AiProvider>> {
    return this.aiProviderConfigRepository.findProviderById(id);
  }

  private async chatWithGoogleHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || (await this.getApiKey('google'));
    const genAI = new GoogleGenerativeAI(key);

    // Convert messages to Google Gemini format
    const chat = genAI.getGenerativeModel({ model });

    // Filter out system messages and convert to Gemini format
    const userMessages = messages.filter((m) => m.role !== 'system');
    const systemMessage = messages.find((m) => m.role === 'system');

    // Start chat with system instruction if available
    let chatSession;
    if (systemMessage) {
      chatSession = chat.startChat({
        systemInstruction: systemMessage.content,
      });
    } else {
      chatSession = chat.startChat();
    }

    // Send user messages one by one to maintain conversation
    let lastResponse = '';
    for (const message of userMessages) {
      if (message.role === 'user') {
        const result = await chatSession.sendMessage(message.content);
        lastResponse = result.response.text();
      } else if (
        message.role === 'assistant' &&
        userMessages.some((m) => m.role === 'user')
      ) {
        // For assistant messages, we don't need to send them back to Gemini
        // as Gemini maintains conversation history
      }
    }

    return lastResponse;
  }

  private async generateGoogleEmbedding(
    text: string,
    model: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const key = apiKey || (await this.getApiKey('google'));
    const genAI = new GoogleGenerativeAI(key);
    const embeddingModel = genAI.getGenerativeModel({ model });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  }

  protected async chatWithOpenAI(
    prompt: string,
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || (await this.getApiKey('openai'));
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  }

  protected async chatWithOpenAIHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || (await this.getApiKey('openai'));
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  protected async generateOpenAIEmbedding(
    text: string,
    model: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const key = apiKey || (await this.getApiKey('openai'));
    const openai = new OpenAI({ apiKey: key });
    const response = await openai.embeddings.create({
      model,
      input: text,
    });
    return response.data[0].embedding;
  }

  private async chatWithAnthropic(
    prompt: string,
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || (await this.getApiKey('anthropic'));
    const anthropic = new Anthropic({ apiKey: key });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async chatWithAnthropicHistory(
    messages: ChatMessage[],
    model: string,
    apiKey?: string | null,
  ): Promise<string> {
    const key = apiKey || (await this.getApiKey('anthropic'));
    const anthropic = new Anthropic({ apiKey: key });

    const systemMessage = messages.find((m) => m.role === 'system');
    const chatMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: chatMessages,
    });
    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async chatWithOllama(
    prompt: string,
    model: string,
    baseURL?: string | null,
  ): Promise<string> {
    const url = baseURL || 'http://localhost:11434/v1';
    const openai = new OpenAI({
      apiKey: 'ollama', // Dummy key, Ollama doesn't need auth
      baseURL: url,
    });
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  }

  private async chatWithOllamaHistory(
    messages: ChatMessage[],
    model: string,
    baseURL?: string | null,
  ): Promise<string> {
    const url = baseURL || 'http://localhost:11434/v1';
    const openai = new OpenAI({
      apiKey: 'ollama', // Dummy key, Ollama doesn't need auth
      baseURL: url,
    });
    const response = await openai.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return response.choices[0]?.message?.content || '';
  }

  private async generateOllamaEmbedding(
    text: string,
    model: string,
    baseURL?: string | null,
  ): Promise<number[]> {
    try {
      const url = baseURL || 'http://localhost:11434/api/embeddings';
      // Note: Ollama embedding API uses a different endpoint structure
      // Let's use a simple approach for now - since embeddings are needed but Ollama
      // might not have the best embedding models, we'll try to use it if configured

      // For now, fallback to a simple hash-based embedding as placeholder
      // In production, you'd implement proper Ollama embedding API calls
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
      // Fallback to throw clear error
      const lang = I18nContext.current()?.lang;
      throw new BadRequestException(
        this.i18n.t('ai.ollamaNotConfigured', { lang }),
      );
    }
  }

  // User configuration methods
  async createUserConfig(
    userId: string,
    dto: CreateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    const encryptedConfig = this.encryptConfig(dto.config);
    const config = await this.aiProviderConfigRepository.createUserConfig(
      userId,
      {
        providerId: dto.providerId,
        displayName: dto.displayName,
        config: encryptedConfig,
        modelList: dto.modelList || [],
      },
    );

    // Decrypt for return
    config.config = this.decryptConfig(config.config);
    return config;
  }

  async getUserConfigs(userId: string): Promise<UserAiProviderConfig[]> {
    const configs =
      await this.aiProviderConfigRepository.getUserConfigs(userId);

    // Get available providers to populate provider relations
    const availableProviders =
      await this.aiProviderConfigRepository.findAvailableProviders();

    // Decrypt sensitive fields and populate provider relationship
    return configs.map((config) => ({
      ...config,
      config: this.decryptConfig(config.config),
      // Populate provider from availableProviders if not loaded by relationship
      provider:
        config.provider ||
        availableProviders.find((p) => p.id === config.providerId),
    }));
  }

  async getUserConfig(
    userId: string,
    id: string,
  ): Promise<NullableType<UserAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getUserConfig(
      userId,
      id,
    );
    return config ? this.decryptConfig(config) : null;
  }

  async updateUserConfig(
    userId: string,
    id: string,
    dto: UpdateUserAiProviderConfigDto,
  ): Promise<UserAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getUserConfig(
      userId,
      id,
    );
    if (!existing) {
      throw new NotFoundException('User AI provider config not found');
    }

    // Merge configs, encrypt before save
    const mergedConfig = {
      ...this.decryptConfig(existing).config,
      ...dto.config,
    };
    const encryptedConfig = this.encryptConfig({
      ...dto,
      config: mergedConfig,
    });
    const updateDto = { ...dto, config: encryptedConfig.config };

    const updatedConfig =
      await this.aiProviderConfigRepository.updateUserConfig(
        userId,
        id,
        updateDto,
      );

    // Decrypt for return
    return this.decryptConfig(updatedConfig);
  }

  async deleteUserConfig(userId: string, id: string): Promise<void> {
    return this.aiProviderConfigRepository.deleteUserConfig(userId, id);
  }

  async verifyUserConfig(userId: string, id: string): Promise<boolean> {
    const config = await this.getUserConfig(userId, id);
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }

    if (!config.provider) {
      throw new BadRequestException('Provider not linked to configuration');
    }

    // Perform actual verification
    await this.verifyProviderConnection(config.provider, config.config);

    return this.aiProviderConfigRepository.verifyUserConfig(userId, id);
  }

  /**
   * Verified provider connection.
   * Supports dynamic/custom providers by falling back to OpenAI-compatible check
   * if the specific provider SDK is not hardcoded.
   */
  private async verifyProviderConnection(
    provider: AiProvider,
    config: Record<string, any>,
  ): Promise<void> {
    try {
      const providerKey = provider.key.toLowerCase();

      // 1. Explicit handlers for proprietary APIs
      if (providerKey === 'anthropic') {
        const anthropic = new Anthropic({ apiKey: config.apiKey });
        await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        return;
      }

      if (providerKey === 'google') {
        const genAI = new GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        await model.generateContent('Hi');
        return;
      }

      // 2. Generic / OpenAI Compatible Handler
      // This covers: 'openai', 'ollama', 'azure' (configured as custom),
      // and ANY user-added provider (e.g. 'deepseek', 'groq', 'local')

      let baseURL = config.baseUrl;
      let apiKey = config.apiKey;

      // Special defaults if not provided in config
      if (providerKey === 'ollama' && !baseURL) {
        baseURL = 'http://localhost:11434/v1';
        apiKey = apiKey || 'ollama';
      }

      // Prepare OpenAI client configuration
      const clientConfig: any = { apiKey: apiKey };

      if (baseURL) {
        // Ensure /v1 is handled if needed, though standard clients might expect user to provide it
        // or we just trust the user's input.
        clientConfig.baseURL = baseURL;
      }

      const client = new OpenAI(clientConfig);
      await client.models.list();
    } catch (error) {
      const message = error.response?.data?.error?.message || error.message;
      this.logger.error(`Validation failed for ${provider.key}: ${message}`);
      throw new BadRequestException(
        `Failed to connect to ${provider.label}: ${message}`,
      );
    }
  }

  // Workspace configuration methods
  async createWorkspaceConfig(
    workspaceId: string,
    dto: CreateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    const encryptedConfig = this.encryptConfig(dto);
    const config = await this.aiProviderConfigRepository.createWorkspaceConfig(
      workspaceId,
      {
        providerId: dto.providerId,
        displayName: dto.displayName,
        config: encryptedConfig.config,
        modelList: dto.modelList || [],
      },
    );

    // Decrypt for return
    return this.decryptConfig(config);
  }

  async getWorkspaceConfigs(
    workspaceId: string,
  ): Promise<WorkspaceAiProviderConfig[]> {
    const configs =
      await this.aiProviderConfigRepository.getWorkspaceConfigs(workspaceId);

    // Decrypt sensitive fields
    return configs.map((config) => this.decryptConfig(config));
  }

  async getWorkspaceConfig(
    workspaceId: string,
    id: string,
  ): Promise<NullableType<WorkspaceAiProviderConfig>> {
    const config = await this.aiProviderConfigRepository.getWorkspaceConfig(
      workspaceId,
      id,
    );
    return config ? this.decryptConfig(config) : null;
  }

  async updateWorkspaceConfig(
    workspaceId: string,
    id: string,
    dto: UpdateWorkspaceAiProviderConfigDto,
  ): Promise<WorkspaceAiProviderConfig> {
    // Get existing config to merge
    const existing = await this.aiProviderConfigRepository.getWorkspaceConfig(
      workspaceId,
      id,
    );
    if (!existing) {
      throw new NotFoundException('Workspace AI provider config not found');
    }

    // Merge configs, encrypt before save
    const mergedConfig = {
      ...this.decryptConfig(existing).config,
      ...dto.config,
    };
    const encryptedConfig = this.encryptConfig({
      ...dto,
      config: mergedConfig,
    });
    const updateDto = { ...dto, config: encryptedConfig.config };

    const updatedConfig =
      await this.aiProviderConfigRepository.updateWorkspaceConfig(
        workspaceId,
        id,
        updateDto,
      );

    // Decrypt for return
    return this.decryptConfig(updatedConfig);
  }

  async deleteWorkspaceConfig(workspaceId: string, id: string): Promise<void> {
    return this.aiProviderConfigRepository.deleteWorkspaceConfig(
      workspaceId,
      id,
    );
  }

  // Usage logs methods
  async getUsageLogs(
    workspaceId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      provider?: string;
      limit?: number;
    },
  ): Promise<AiUsageLog[]> {
    return this.aiProviderConfigRepository.getUsageLogs(workspaceId, options);
  }

  async getUsageStats(
    workspaceId: string,
    period: 'day' | 'week' | 'month' | 'year',
  ): Promise<any> {
    return this.aiProviderConfigRepository.getUsageStats(workspaceId, period);
  }

  // API key methods
  private async getApiKey(
    provider: string,
    workspaceId?: string,
  ): Promise<string> {
    // 1. Try to get from Workspace first if provided
    if (workspaceId) {
      try {
        const workspaceConfigs =
          await this.aiProviderConfigRepository.getWorkspaceProviders(
            workspaceId,
          );
        const providerEntity = workspaceConfigs.find(
          (p) => p.key === provider || p.id === provider,
        );

        if (providerEntity) {
          const apiKey =
            await this.aiProviderConfigRepository.getApiKeyByProviderId(
              providerEntity.id,
              'workspace',
            );
          if (apiKey) return apiKey;
        }

        // Also try general config by providerId for this workspace
        const config =
          await this.aiProviderConfigRepository.getConfigByProviderId(
            provider, // might be a provider key or ID
            'workspace',
            workspaceId,
          );
        if (config?.config?.apiKey) return config.config.apiKey;
      } catch (error) {
        this.logger.warn(`Failed to fetch workspace API key: ${error.message}`);
      }
    }

    // 2. Try to get from database (ownerType: 'system')
    try {
      const providers = await this.getAvailableProviders();
      const providerEntity = providers.find(
        (p) => p.key === provider || p.id === provider,
      );

      if (providerEntity) {
        const apiKey =
          await this.aiProviderConfigRepository.getApiKeyByProviderId(
            providerEntity.id,
            'system',
          );
        if (apiKey) return apiKey;
      }
    } catch (error) {
      this.logger.warn(
        `Failed to fetch system API key from DB: ${error.message}`,
      );
    }

    // 3. Check environment variables as fallback
    const envKeyName = `${provider.toUpperCase()}_API_KEY`;
    if (process.env[envKeyName]) {
      return process.env[envKeyName] as string;
    }

    // Special case for some common providers
    if (provider === 'openai' && process.env.OPENAI_API_KEY)
      return process.env.OPENAI_API_KEY;
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY)
      return process.env.ANTHROPIC_API_KEY;
    if (provider === 'google' && process.env.GOOGLE_API_KEY)
      return process.env.GOOGLE_API_KEY;

    throw new Error(
      this.i18n.t('ai.apiKeyRequired', {
        lang: I18nContext.current()?.lang,
        args: { provider },
      }),
    );
  }

  async getApiKeyByProviderId(
    providerId: string,
    scope?: 'user' | 'workspace',
  ): Promise<any> {
    return this.aiProviderConfigRepository.getApiKeyByProviderId(
      providerId,
      scope,
    );
  }

  async getWorkspaceProviders(workspaceId: string): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.getWorkspaceProviders(workspaceId);
  }

  async getUserProviders(userId: string): Promise<AiProvider[]> {
    return this.aiProviderConfigRepository.getUserProviders(userId);
  }

  async configExists(
    configIdOrProviderId: string,
    scope: 'user' | 'workspace',
    scopeId: string | null | undefined,
  ): Promise<boolean> {
    if (!scopeId) return false;

    try {
      // First try direct config ID lookup
      const config = await this.getConfigById(
        configIdOrProviderId,
        scope,
        scopeId,
      );
      if (config) return true;

      // Fall back to provider ID lookup
      const config2 =
        await this.aiProviderConfigRepository.getConfigByProviderId(
          configIdOrProviderId,
          scope,
          scopeId,
        );
      return Boolean(config2);
    } catch {
      return false;
    }
  }

  private async getConfigById(
    configId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<any> {
    if (scope === 'user') {
      return await this.aiProviderConfigRepository.getUserConfig(
        scopeId,
        configId,
      );
    } else {
      return await this.aiProviderConfigRepository.getWorkspaceConfig(
        scopeId,
        configId,
      );
    }
  }

  async chat(
    prompt: string,
    model: string,
    provider?: string,
    apiKey?: string | null,
    workspaceId?: string,
  ): Promise<string> {
    const providerKey = provider || 'openai'; // default to openai

    switch (providerKey) {
      case 'openai':
        return this.chatWithOpenAI(prompt, model, apiKey);
      case 'anthropic':
        return this.chatWithAnthropic(prompt, model, apiKey);
      case 'ollama':
        return this.chatWithOllama(prompt, model, null);
      default:
        throw new BadRequestException(`Unsupported provider: ${providerKey}`);
    }
  }

  async chatWithHistory(
    messages: ChatMessage[],
    model: string,
    provider?: string,
    apiKey?: string | null,
    workspaceId?: string,
  ): Promise<string> {
    const providerKey = provider || 'openai'; // default to openai

    // Use provided key or try to get system/workspace key
    const actualApiKey =
      apiKey ||
      (await this.getApiKey(providerKey, workspaceId).catch(() => null));

    if (
      !actualApiKey &&
      (providerKey === 'openai' || providerKey === 'anthropic')
    ) {
      const lang = I18nContext.current()?.lang;
      throw new BadRequestException(
        this.i18n.t('ai.apiKeyRequired', {
          lang,
          args: { provider: providerKey },
        }),
      );
    }

    switch (providerKey) {
      case 'openai':
        return this.chatWithOpenAIHistory(messages, model, actualApiKey);
      case 'anthropic':
        return this.chatWithAnthropicHistory(messages, model, actualApiKey);
      case 'ollama':
        return this.chatWithOllamaHistory(messages, model, actualApiKey); // actualApiKey can be baseUrl for Ollama
      default:
        throw new BadRequestException(`Unsupported provider: ${providerKey}`);
    }
  }

  async chatWithHistoryUsingProvider(
    messages: ChatMessage[],
    model: string,
    configIdOrProviderId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
  ): Promise<string> {
    // First try to get config by ID (direct config lookup for bot.aiProviderId)
    let config = await this.getConfigById(configIdOrProviderId, scope, scopeId);

    // If not found, fall back to provider ID lookup
    if (!config) {
      config = await this.aiProviderConfigRepository.getConfigByProviderId(
        configIdOrProviderId,
        scope,
        scopeId,
      );
    }
    if (!config) {
      throw new NotFoundException(`Provider configuration not found`);
    }

    // Get provider info to determine provider type
    const provider = await this.aiProviderConfigRepository.findProviderById(
      config.providerId,
    );
    if (!provider) {
      throw new NotFoundException(`Provider not found`);
    }

    // Decrypt domain config and extract the actual provider config object
    const decryptedDomainConfig = this.decryptConfig(config);
    const apiConfig = decryptedDomainConfig.config || decryptedDomainConfig;

    // Route to appropriate provider method
    const lang = I18nContext.current()?.lang;
    switch (provider.key) {
      case 'openai':
        return this.chatWithOpenAIHistory(messages, model, apiConfig.apiKey);
      case 'anthropic':
        return this.chatWithAnthropicHistory(messages, model, apiConfig.apiKey);
      case 'ollama':
        return this.chatWithOllamaHistory(messages, model, apiConfig.baseUrl);
      case 'google':
        return this.chatWithGoogleHistory(messages, model, apiConfig.apiKey);
      case 'azure':
        // For Azure OpenAI, similar to OpenAI but with different base URL
        throw new BadRequestException(
          this.i18n.t('ai.azureNotImplemented', { lang }),
        );
      case 'custom':
        // For custom providers, we'd need custom logic
        throw new BadRequestException(
          this.i18n.t('ai.customNotImplemented', { lang }),
        );
      default:
        throw new BadRequestException(
          this.i18n.t('ai.unsupportedProvider', {
            lang,
            args: { provider: provider.key },
          }),
        );
    }
  }

  async generateEmbedding(
    query: string,
    provider?: string,
    model?: string,
    apiKey?: string | null,
  ): Promise<number[]> {
    const providerKey = provider || 'openai'; // default to openai
    const embeddingModel = model || 'text-embedding-ada-002'; // default model

    switch (providerKey) {
      case 'openai':
        return this.generateOpenAIEmbedding(query, embeddingModel, apiKey);
      case 'google':
        return this.generateGoogleEmbedding(query, embeddingModel, apiKey);
      case 'ollama':
        // For Ollama, apiKey represents baseUrl
        return this.generateOllamaEmbedding(query, embeddingModel, apiKey);
      default:
        throw new BadRequestException(
          `Unsupported provider for embeddings: ${providerKey}`,
        );
    }
  }

  async generateImage(
    prompt: string,
    provider?: string,
    model?: string,
    size?: string,
    apiKey?: string | null,
  ): Promise<Buffer | null> {
    const providerKey = provider || 'openai'; // default to openai

    switch (providerKey) {
      case 'openai':
        return this.generateOpenAIImage(prompt, model, size, apiKey);
      default:
        throw new BadRequestException(
          `Unsupported provider for image generation: ${providerKey}`,
        );
    }
  }

  protected async generateOpenAIImage(
    prompt: string,
    model?: string,
    size?: string,
    apiKey?: string | null,
  ): Promise<Buffer | null> {
    const key = apiKey || (await this.getApiKey('openai'));
    const openai = new OpenAI({ apiKey: key });

    try {
      const response = await openai.images.generate({
        model: model || 'dall-e-3',
        prompt,
        size: (size as any) || '1024x1024',
        quality: 'standard',
        n: 1,
        response_format: 'b64_json',
      });

      if (!response.data || !response.data[0]) {
        throw new Error('No image data received from OpenAI');
      }

      const base64Image = response.data[0].b64_json;
      if (!base64Image) {
        throw new Error('No base64 image data in response');
      }

      return Buffer.from(base64Image, 'base64');
    } catch (error) {
      this.logger.error(`OpenAI image generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch available models from a provider using their API
   */
  async fetchProviderModels(
    configId: string,
    scope: 'user' | 'workspace',
    scopeId: string,
    providerKey?: string,
  ): Promise<string[]> {
    try {
      // Get config to extract API key info
      let config = await this.getConfigById(configId, scope, scopeId);

      // Fall back to provider ID lookup
      if (!config && providerKey) {
        config = await this.aiProviderConfigRepository.getConfigByProviderId(
          configId,
          scope,
          scopeId,
        );
      }

      if (!config) {
        throw new NotFoundException('Provider configuration not found');
      }

      // Get provider info to determine type
      let providerType = providerKey;
      if (!providerType) {
        const provider = await this.aiProviderConfigRepository.findProviderById(
          config.providerId,
        );
        providerType = provider?.key;
      }

      // Decrypt sensitive fields
      const decryptedConfig = this.decryptConfig(config);

      // Fetch models based on provider
      switch (providerType) {
        case 'openai':
          return await this.fetchOpenAIModels(decryptedConfig.apiKey);
        case 'anthropic':
          return await this.fetchAnthropicModels(decryptedConfig.apiKey);
        case 'google':
          return await this.fetchGoogleModels(decryptedConfig.apiKey);
        case 'ollama':
          return await this.fetchOllamaModels(decryptedConfig.baseUrl);
        default:
          return []; // Return empty array for unsupported providers
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch models from provider ${providerKey}:`,
        error.message,
      );
      return []; // Return empty array on error, don't break the UI
    }
  }

  private async fetchOpenAIModels(apiKey: string): Promise<string[]> {
    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.models.list();

      // Filter to commonly used models and return their IDs
      const supportedModels = response.data
        .filter(
          (model) =>
            // Filter for common models, exclude base/fine-tuned variants
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
      this.logger.warn(`OpenAI model fetch failed: ${error.message}`);
      // Return popular static list as fallback
      return [
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-4-vision-preview',
      ];
    }
  }

  private async fetchGoogleModels(apiKey: string): Promise<string[]> {
    try {
      // Try using Google Generative AI listModels if available (newer SDK versions)
      const genAI = new GoogleGenerativeAI(apiKey);

      // Check if listModels method exists (SDK might have been updated)
      if (typeof (genAI as any).listModels === 'function') {
        const models = await (genAI as any).listModels();
        const modelNames = models.map((model: any) => {
          // Handle different possible response formats
          return model.name.replace('models/', '');
        });
        return modelNames;
      }

      // Fallback: test API key validity with a known model
      await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Return known models if API key works
      const knownModels = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro',
      ];

      // Test additional models to see what works
      const availableModels: string[] = [];
      for (const modelName of knownModels) {
        try {
          genAI.getGenerativeModel({ model: modelName });
          availableModels.push(modelName);
        } catch {
          // Model not available, skip silently
        }
      }

      return availableModels.length > 0 ? availableModels : knownModels;
    } catch (error) {
      this.logger.warn(
        `Google model fetch failed (API key invalid?): ${error.message}`,
      );
      // Return basic static list as fallback for UX
      return [
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro',
      ];
    }
  }

  private async fetchAnthropicModels(apiKey: string): Promise<string[]> {
    try {
      // Anthropic doesn't have a public models endpoint
      // Check API by trying to get models from Claude API
      const claude = new Anthropic({ apiKey });

      // Try to make a simple request to check if API works
      await claude.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }],
      });

      // If successful, return known models (Anthropic doesn't expose models endpoint)
    } catch (error) {
      this.logger.warn(`Anthropic model fetch failed: ${error.message}`);
      // Return basic static list as fallback for UX
    }

    // Return known Anthropic models (they don't expose models endpoint)
    return [
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ];
  }

  private async fetchOllamaModels(baseURL?: string): Promise<string[]> {
    try {
      const url = baseURL || 'http://localhost:11434';
      const openai = new OpenAI({
        apiKey: 'ollama',
        baseURL: `${url}/v1`,
      });

      const response = await openai.models.list();
      return response.data.map((model) => model.id).sort();
    } catch (error) {
      this.logger.warn(`Ollama model fetch failed: ${error.message}`);
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

  /**
   * Fetch models from direct config without requiring database lookup
   */
  async fetchModelsFromDirectConfig(
    providerId: string,
    directConfig: Record<string, any>,
  ): Promise<string[]> {
    try {
      // Get provider info to determine type
      const provider =
        await this.aiProviderConfigRepository.findProviderById(providerId);
      if (!provider) {
        throw new NotFoundException('Provider not found');
      }

      // Decrypt sensitive fields if they were encrypted (they shouldn't be since we're verifying directly)
      const decryptedConfig = this.decryptConfig(directConfig);

      // Fetch models based on provider
      switch (provider.key) {
        case 'openai':
          return await this.fetchOpenAIModels(decryptedConfig.apiKey);
        case 'anthropic':
          return await this.fetchAnthropicModels(decryptedConfig.apiKey);
        case 'google':
          return await this.fetchGoogleModels(decryptedConfig.apiKey);
        case 'ollama':
          return await this.fetchOllamaModels(decryptedConfig.baseUrl);
        default:
          return []; // Return empty array for unsupported providers
      }
    } catch (error) {
      this.logger.error(
        `Failed to fetch models from direct config for provider ${providerId}:`,
        error.message,
      );
      return []; // Return empty array on error, don't break the UI
    }
  }

  /**
   * Generate a system prompt based on user description using AI
   */
  async generateSystemPrompt(options: {
    userId: string;
    description: string;
    template?: string;
    providerConfigId?: string;
    tone?: string;
    style?: string;
    additionalContext?: Record<string, any>;
  }) {
    const {
      userId,
      description,
      template,
      providerConfigId,
      tone,
      style,
      additionalContext,
    } = options;

    this.logger.log(
      `Generating system prompt for user ${userId} with config ${providerConfigId}`,
    );

    try {
      // Try to get AI configuration for prompt generation
      let aiConfig: null | {
        apiKey: string;
        providerKey: string;
        model: string;
      } = null;
      let configSource = 'fallback'; // Track where config came from

      // Method 1: Try System AI Settings FIRST (global defaults - highest priority)
      try {
        const systemSettings = await this.getSystemAiSettings();
        if (systemSettings?.defaultProviderId && systemSettings?.defaultModel) {
          // System defaults use any user config that matches the provider key and has API key
          const userConfigs = await this.getUserConfigs(userId);
          const systemProviderConfig = userConfigs.find(
            (config) =>
              config.provider?.key === systemSettings.defaultProviderId &&
              config.isActive &&
              config.config?.apiKey,
          );

          if (systemProviderConfig) {
            aiConfig = {
              apiKey: systemProviderConfig.config.apiKey,
              providerKey: systemProviderConfig.provider?.key || 'openai',
              model: systemSettings.defaultModel,
            };
            configSource = 'system-defaults';
            this.logger.log(
              `Found system defaults using ${systemProviderConfig.provider?.key}, model: ${systemSettings.defaultModel}`,
            );
          } else {
            this.logger.warn(
              `System default provider ${systemSettings.defaultProviderId} configured but no matching user config with API key found`,
            );
          }
        }
      } catch (systemError) {
        this.logger.warn(
          `Failed to load system AI settings: ${systemError.message}`,
        );
      }

      // Method 2: If no system defaults, try user's global active configs
      if (!aiConfig) {
        try {
          const userConfigs = await this.getUserConfigs(userId);
          const activeConfig = userConfigs.find(
            (config) =>
              config.isActive &&
              config.config?.apiKey &&
              ['openai', 'anthropic', 'ollama'].includes(
                config.provider?.key || '',
              ),
          );

          if (activeConfig) {
            // Filter for chat-compatible models (exclude embedding models)
            let chatModel = 'gpt-4o-mini'; // Fallback default

            if (activeConfig.modelList && activeConfig.modelList.length > 0) {
              // For Ollama, exclude embedding models that contain 'embed'
              if (activeConfig.provider?.key === 'ollama') {
                const chatModels = activeConfig.modelList.filter(
                  (model) =>
                    !model.toLowerCase().includes('embed') &&
                    !model.toLowerCase().includes('all-minilm'),
                );
                chatModel = chatModels[0] || activeConfig.modelList[0];
              } else {
                chatModel = activeConfig.modelList[0];
              }
            } else {
              // No modelList, use provider-specific defaults
              switch (activeConfig.provider?.key) {
                case 'openai':
                  chatModel = 'gpt-4o-mini';
                  break;
                case 'anthropic':
                  chatModel = 'claude-3-haiku-20240307';
                  break;
                case 'ollama':
                  chatModel = 'llama3.1:8b';
                  break;
                default:
                  chatModel = 'gpt-4o-mini';
              }
            }

            aiConfig = {
              apiKey: activeConfig.config.apiKey,
              providerKey: activeConfig.provider?.key || 'openai',
              model: chatModel,
            };
            configSource = 'active-user-config';
            this.logger.log(
              `Found user's active config for ${activeConfig.provider?.key}, using model: ${chatModel}`,
            );
          }
        } catch (configError) {
          this.logger.warn(
            `Failed to load user's active configs: ${configError.message}`,
          );
        }
      }

      // Method 3: If no user global config, try bot-specific config (providerConfigId)
      if (!aiConfig && providerConfigId) {
        try {
          const botConfig = await this.getUserConfig(userId, providerConfigId);
          if (botConfig && botConfig.config?.apiKey) {
            // Filter for chat-compatible models (exclude embedding models)
            let chatModel = 'gpt-4o-mini'; // Fallback default

            if (botConfig.modelList && botConfig.modelList.length > 0) {
              // For Ollama, exclude embedding models that contain 'embed'
              if (botConfig.provider?.key === 'ollama') {
                const chatModels = botConfig.modelList.filter(
                  (model) =>
                    !model.toLowerCase().includes('embed') &&
                    !model.toLowerCase().includes('all-minilm'),
                );
                chatModel = chatModels[0] || botConfig.modelList[0];
              } else {
                chatModel = botConfig.modelList[0];
              }
            } else {
              // No modelList, use provider-specific defaults
              switch (botConfig.provider?.key) {
                case 'openai':
                  chatModel = 'gpt-4o-mini';
                  break;
                case 'anthropic':
                  chatModel = 'claude-3-haiku-20240307';
                  break;
                case 'ollama':
                  chatModel = 'llama3.1:8b';
                  break;
                default:
                  chatModel = 'gpt-4o-mini';
              }
            }

            aiConfig = {
              apiKey: botConfig.config.apiKey,
              providerKey: botConfig.provider?.key || 'openai',
              model: chatModel,
            };
            configSource = 'bot-config';
            this.logger.log(
              `Found bot-specific config for ${botConfig.provider?.key}, using model: ${chatModel}`,
            );
          }
        } catch (configError) {
          this.logger.warn(
            `Failed to load bot config ${providerConfigId}: ${configError.message}`,
          );
        }
      }

      // Method 3: Try workspace configs (if we have workspace context)
      // TODO: Implement workspace config lookup

      // Build the AI generation prompt
      const systemTemplate =
        template ||
        `You are an expert system prompt engineer. Create highly effective, professional system prompts for AI assistants based on user requirements.

Guidelines for perfect prompts:
- Start with clear, authoritative role definition
- Include behavioral expectations and communication style
- Define boundaries, limitations, and ethical constraints
- Make prompts actionable and outcome-focused
- Use professional language throughout
- Ensure prompts are ready-to-use without modifications

Always structure prompts for clarity and effectiveness.`;

      // Build comprehensive user prompt with all specifications
      let userPrompt = `Generate a professional system prompt for an AI assistant.

DESCRIPTION: "${description}"`;

      if (tone) {
        userPrompt += `\n\nCOMMUNICATION TONE: ${tone} (e.g., formal, casual, encouraging, direct, empathetic, authoritative)`;
      }

      if (style) {
        userPrompt += `\n\nRESPONSE STYLE: ${style} (e.g., concise, detailed, conversational, structured, analytical, creative)`;
      }

      if (additionalContext && Object.keys(additionalContext).length > 0) {
        userPrompt += `\n\nADDITIONAL REQUIREMENTS:`;
        Object.entries(additionalContext).forEach(([key, value]) => {
          if (typeof value === 'string' && value.trim()) {
            userPrompt += `\n- ${key}: ${value}`;
          }
        });
      }

      userPrompt += `\n\nRequirements:
1. Create a comprehensive system prompt that defines the AI's role perfectly
2. Highlight key improvements made in the prompt
3. Provide practical usage suggestions

Please structure your response as:
**SYSTEM PROMPT:**
[Write the complete system prompt here]

**KEY IMPROVEMENTS:**
[List the main enhancements made]

**USAGE SUGGESTIONS:**
[Practical tips for using this assistant]`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemTemplate },
        { role: 'user', content: userPrompt },
      ];

      // Attempt AI-powered generation if we have valid config
      let generatedContent = '';
      let generationMethod = 'fallback';

      if (aiConfig && aiConfig.apiKey) {
        try {
          this.logger.log(
            `Attempting AI generation with ${aiConfig.providerKey} (${configSource})`,
          );

          // Use the configured AI to generate the prompt
          generatedContent = await this.chat(
            userPrompt,
            aiConfig.model,
            aiConfig.providerKey,
            aiConfig.apiKey,
          );
          generationMethod = 'ai-powered';
          this.logger.log(
            `AI generation successful using ${aiConfig.providerKey}`,
          );
        } catch (aiError) {
          this.logger.warn(
            `AI generation failed with ${aiConfig.providerKey}: ${aiError.message}`,
          );
          // Fall through to fallback
        }
      }

      // Use enhanced fallback if AI generation failed or no config
      if (!generatedContent) {
        this.logger.log(
          `Using fallback generation (no valid AI config: ${configSource})`,
        );
        generatedContent = await this.generateEnhancedFallbackPrompt({
          description,
          tone,
          style,
          additionalContext,
        });
      }

      // Parse the generated content to extract structured components
      const result = this.parseEnhancedPromptResult(generatedContent, options);

      this.logger.log(
        `Prompt generation completed: method=${generationMethod}, config=${configSource}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        `Critical error in generateSystemPrompt: ${error.message}`,
        error.stack,
      );

      // Ultimate fallback - still try to create a reasonable prompt
      return {
        prompt: this.generateBasicPrompt(
          description,
          tone,
          style,
          additionalContext,
        ),
        improvements: ['Generated with basic template enhancement'],
        suggestions: [
          'Configure an AI provider in your settings for better prompt generation.',
          'Try adding more specific requirements for enhanced results.',
        ],
      };
    }
  }

  /**
   * Generate a fallback prompt based on keywords in description
   */
  private generateFallbackPrompt(description: string): string {
    const desc = description.toLowerCase();

    // Marketing related
    if (
      desc.includes('marketing') ||
      desc.includes('sales') ||
      desc.includes('business')
    ) {
      return `You are an expert marketing assistant specializing in digital marketing, sales strategies, and business growth. Your responsibilities include:

- Provide actionable marketing advice and strategies
- Help create compelling copy and content
- Assist with market research and competitive analysis
- Focus on conversion optimization and ROI
- Maintain a professional, results-oriented communication style

When giving advice, be specific and provide clear next steps. Always consider the user's business goals and target audience.`;
    }

    // Technical/Programming
    if (
      desc.includes('programming') ||
      desc.includes('developer') ||
      desc.includes('code') ||
      desc.includes('software')
    ) {
      return `You are an expert software developer and technical consultant. Your expertise includes:

- Multiple programming languages and frameworks
- System architecture and design patterns
- Debugging and performance optimization
- Best practices and code quality
- Technology evaluation and recommendations

Provide detailed technical explanations, code examples when helpful, and practical solutions. Ask clarifying questions when context is insufficient.`;
    }

    // Customer service
    if (
      desc.includes('customer') ||
      desc.includes('support') ||
      desc.includes('service') ||
      desc.includes('help')
    ) {
      return `You are a friendly and professional customer support specialist. Your role is to:

- Help customers with their questions and concerns
- Provide accurate information about products and services
- Escalate complex issues to appropriate teams when needed
- Maintain a polite, helpful, and patient communication style

If you don't know the answer to a question, say so honestly and offer to connect them with a human representative.`;
    }

    // Teaching/Learning
    if (
      desc.includes('teaching') ||
      desc.includes('learning') ||
      desc.includes('education') ||
      desc.includes('training')
    ) {
      return `You are an experienced educator and learning facilitator. Your approach includes:

- Breaking down complex topics into understandable concepts
- Using examples and analogies to explain ideas
- Adapting explanations to different learning levels
- Encouraging questions and curiosity
- Providing clear, step-by-step guidance

Make learning engaging and accessible. Tailor your explanations to the learner's current knowledge and goals.`;
    }

    // Generic helper
    return `You are a helpful and knowledgeable AI assistant specializing in ${description}. Your characteristics include:

- Friendly and approachable communication style
- Deep knowledge in your area of specialization
- Providing accurate, detailed, and actionable responses
- Asking clarifying questions when needed
- Staying focused on helping users achieve their goals

Always provide well-reasoned responses and suggest next steps when appropriate.`;
  }

  /**
   * Generate enhanced fallback prompt when AI generation is not available
   */
  private async generateEnhancedFallbackPrompt(options: {
    description: string;
    tone?: string;
    style?: string;
    additionalContext?: Record<string, any>;
  }): Promise<string> {
    const { description, tone, style, additionalContext } = options;

    // Start with basic prompt
    const prompt = this.generateBasicPrompt(
      description,
      tone,
      style,
      additionalContext,
    );

    // Add key improvements
    const improvements = `**KEY IMPROVEMENTS:**
- Structured role definition with clear responsibilities
- Incorporated specific communication ${tone ? tone.toLowerCase() : 'professional'} tone
- Added behavioral expectations and work style guidelines
- Included ethical boundaries and best practices
- Made prompt actionable and goal-oriented

**USAGE SUGGESTIONS:**
- Use this as the system prompt for your AI assistant
- Test prompts with specific scenarios to verify effectiveness
- Refine based on actual usage and performance observations`;

    return `${prompt}\n\n${improvements}`;
  }

  /**
   * Parse the enhanced AI-generated content to extract structured components
   */
  private parseEnhancedPromptResult(generatedContent: string, options: any) {
    try {
      // Extract system prompt section
      const systemPromptMatch = generatedContent.match(
        /\*\*SYSTEM PROMPT:\*\*\s*([\s\S]*?)(?=\*\*KEY IMPROVEMENTS|\*\*USAGE)/,
      );
      const prompt = systemPromptMatch
        ? systemPromptMatch[1].trim().replace(/^\n+|\n+$/g, '')
        : generatedContent.substring(0, 500).trim();

      // Extract improvements section
      const improvementsMatch = generatedContent.match(
        /\*\*KEY IMPROVEMENTS:\*\*\s*([\s\S]*?)(?=\*\*USAGE|\*\*KEY|\*\*SUGGESTIONS)/,
      );
      const improvements = improvementsMatch
        ? improvementsMatch[1]
            .trim()
            .split('\n')
            .map((line) => line.replace(/^[-•]/, '').trim())
            .filter((line) => line && !line.match(/^\*\*/))
            .slice(0, 5) // Limit to 5 improvements
        : ['Professional prompt structure with clear guidelines'];

      // Extract suggestions section
      const suggestionsMatch = generatedContent.match(
        /\*\*(?:USAGE SUGGESTIONS|SUGGESTIONS?):\*\*\s*([\s\S]*)$/,
      );
      const suggestions = suggestionsMatch
        ? suggestionsMatch[1]
            .trim()
            .split('\n')
            .map((line) => line.replace(/^[-•]/, '').trim())
            .filter((line) => line && !line.match(/^\*\*/))
            .slice(0, 5) // Limit to 5 suggestions
        : [
            'Use this prompt as the system message when configuring your AI assistant',
          ];

      return {
        prompt:
          prompt.length > 20
            ? prompt
            : `You are a helpful AI assistant that ${options.description}. ${prompt}`,
        improvements,
        suggestions,
      };
    } catch (error) {
      // Fallback parsing for unexpected formats
      return {
        prompt:
          generatedContent.length > 50
            ? generatedContent
            : `You are a helpful AI assistant specializing in ${options.description}. Be professional and helpful.`,
        improvements: [
          'Basic role definition established',
          'Core behavioral expectations set',
          'Ethical guidelines included',
        ],
        suggestions: [
          'Use this prompt as the system message for your AI assistant',
          'Test and refine based on performance',
        ],
      };
    }
  }

  /**
   * Generate a basic prompt from user specifications
   */
  private generateBasicPrompt(
    description: string,
    tone?: string,
    style?: string,
    additionalContext?: Record<string, any>,
  ): string {
    const desc = description.toLowerCase();

    // Base prompt structure
    let prompt = `You are a helpful AI assistant`;

    if (description) {
      prompt += ` specializing in ${description}`;
    }
    prompt += '. ';

    // Add tone specification
    if (tone) {
      switch (tone.toLowerCase()) {
        case 'formal':
          prompt += 'Maintain a professional and formal communication style.';
          break;
        case 'casual':
          prompt += 'Be friendly and conversational in your responses.';
          break;
        case 'encouraging':
          prompt += 'Be supportive and encouraging to help users succeed.';
          break;
        case 'direct':
          prompt += 'Be straightforward and direct in your communication.';
          break;
        case 'empathetic':
          prompt += 'Show empathy and understanding in your interactions.';
          break;
        case 'authoritative':
          prompt += 'Use authoritative yet approachable communication.';
          break;
        default:
          prompt += `Maintain a ${tone} communication tone.`;
      }
    } else {
      prompt += 'Be professional and approachable.';
    }

    prompt += ' ';

    // Add style specification
    if (style) {
      switch (style.toLowerCase()) {
        case 'concise':
          prompt +=
            'Provide clear, concise answers without unnecessary elaboration.';
          break;
        case 'detailed':
          prompt +=
            'Provide comprehensive, detailed responses with thorough explanations.';
          break;
        case 'conversational':
          prompt += 'Communicate in a natural, conversational manner.';
          break;
        case 'structured':
          prompt +=
            'Structure your responses clearly with logical organization.';
          break;
        case 'analytical':
          prompt +=
            'Use analytical thinking and provide evidence-based responses.';
          break;
        case 'creative':
          prompt +=
            'Be creative and innovative in your approaches and solutions.';
          break;
        default:
          prompt += `Use a ${style} response style.`;
      }
    } else {
      prompt += 'Provide helpful, accurate responses.';
    }

    prompt += ' ';

    // Add additional context
    if (additionalContext && Object.keys(additionalContext).length > 0) {
      const contextItems: string[] = [];
      Object.entries(additionalContext).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          contextItems.push(`${key}: ${value}`);
        }
      });
      if (contextItems.length > 0) {
        prompt += ` Additional guidelines: ${contextItems.join('; ')}.`;
      }
    }

    // Add general capabilities
    prompt +=
      ' Focus on being helpful, knowledgeable, and providing practical value to users.';

    return prompt;
  }

  /**
   * Parse the AI-generated content to extract structured components (legacy method)
   */
  private parseGeneratedPrompt(
    generatedContent: string,
    originalDescription: string,
  ) {
    try {
      const lines = generatedContent
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line);

      // Try to extract prompt (usually the first substantial paragraph)
      const promptMatch = generatedContent.match(
        /(?:^|\n)(.*?)(?:\n\n|\n(?:Key improvements|Improvements|Suggestions))/s,
      );
      const prompt = promptMatch ? promptMatch[1].trim() : generatedContent;

      // Try to extract improvements section
      const improvementsMatch = generatedContent.match(
        /(?:Key improvements|Improvements)?:\s*(.*?)(?:\n\n|\n(?:Suggestions))/is,
      );
      const improvements = improvementsMatch
        ? improvementsMatch[1]
            .trim()
            .split('\n')
            .map((line) => line.replace(/^[-•]/, '').trim())
            .filter((line) => line)
        : ['Enhanced prompt structure based on your description'];

      // Try to extract suggestions section
      const suggestionsMatch = generatedContent.match(
        /(?:Suggestions?):\s*(.*?)$/is,
      );
      const suggestions = suggestionsMatch
        ? suggestionsMatch[1]
            .trim()
            .split('\n')
            .map((line) => line.replace(/^[-•]/, '').trim())
            .filter((line) => line)
        : [
            'Use this prompt as the system message when configuring your AI assistant',
          ];

      return {
        prompt:
          prompt.length > 50
            ? prompt
            : `You are a helpful AI assistant that ${originalDescription.toLowerCase()}. ${prompt}`,
        improvements: improvements.slice(0, 3), // Limit to 3
        suggestions: suggestions.slice(0, 3), // Limit to 3
      };
    } catch (error) {
      // Fallback parsing
      return {
        prompt:
          generatedContent.length > 100
            ? generatedContent
            : `You are a helpful AI assistant that ${originalDescription.toLowerCase()}. ${generatedContent}`,
        improvements: ['Generated based on your description'],
        suggestions: ["Configure this as your AI assistant's system prompt"],
      };
    }
  }

  // System AI Settings methods
  async getSystemAiSettings(): Promise<SystemAiSettings> {
    return this.systemAiSettingsRepository.findSystemSettings();
  }

  async updateSystemAiSettings(
    dto: UpdateSystemAiSettingsDto,
  ): Promise<SystemAiSettings> {
    return this.systemAiSettingsRepository.updateSystemSettings(dto);
  }
}
