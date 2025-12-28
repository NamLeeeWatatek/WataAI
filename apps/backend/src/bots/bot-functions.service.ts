import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBotFunctionDto } from './dto/create-bot-function.dto';
import { UpdateBotFunctionDto } from './dto/update-bot-function.dto';
import { ExecuteBotFunctionDto } from './dto/execute-bot-function.dto';
import { KBRagService } from '../knowledge-base/services/kb-rag.service';
import { AiProvidersService } from '../ai-providers/ai-providers.service';
import { BotEntity } from './infrastructure/persistence/relational/entities/bot.entity';

export interface BotFunction {
  id: string;
  botId: string;
  name: string;
  functionType: string;
  isEnabled: boolean;
  config?: Record<string, any>;
  bot?: { systemPrompt?: string };
  createdAt: Date;
}

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);
  private functions: Map<string, BotFunction> = new Map();

  constructor(
    @InjectRepository(BotEntity)
    private botRepository: Repository<BotEntity>,
    private kbRagService: KBRagService,
    private aiProvidersService: AiProvidersService,
  ) {}

  async create(createDto: CreateBotFunctionDto) {
    const bot = await this.botRepository.findOne({
      where: { id: createDto.botId },
    });

    if (!bot) {
      throw new NotFoundException('Bot not found');
    }

    const id = `func-${Date.now()}`;
    const botFunction: BotFunction = {
      id,
      botId: createDto.botId,
      name: createDto.name,
      functionType: createDto.functionType,
      isEnabled: createDto.isEnabled ?? true,
      config: createDto.config,
      createdAt: new Date(),
    };
    this.functions.set(id, botFunction);
    return botFunction;
  }

  async findAll(botId: string) {
    return Array.from(this.functions.values())
      .filter((f) => f.botId === botId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findOne(id: string) {
    const botFunction = this.functions.get(id);
    if (!botFunction) {
      throw new NotFoundException('Bot function not found');
    }
    return botFunction;
  }

  async update(id: string, updateDto: UpdateBotFunctionDto) {
    const botFunction = await this.findOne(id);
    Object.assign(botFunction, updateDto);
    this.functions.set(id, botFunction);
    return botFunction;
  }

  async remove(id: string) {
    const botFunction = await this.findOne(id);
    this.functions.delete(id);
    return botFunction;
  }

  async execute(executeDto: ExecuteBotFunctionDto) {
    const botFunction = await this.findOne(executeDto.functionId);

    if (!botFunction.isEnabled) {
      throw new Error('Bot function is disabled');
    }

    this.logger.log(
      `Executing bot function: ${botFunction.name} (${botFunction.functionType})`,
    );

    switch (botFunction.functionType) {
      case 'document_access':
        return this.executeDocumentAccess(botFunction, executeDto);
      case 'auto_fill':
        return this.executeAutoFill(botFunction, executeDto);
      case 'ai_suggest':
        return this.executeAiSuggest(botFunction, executeDto);
      case 'custom':
        return this.executeCustomFunction(botFunction, executeDto);
      default:
        throw new Error(`Unknown function type: ${botFunction.functionType}`);
    }
  }

  private async executeDocumentAccess(
    botFunction: BotFunction,
    executeDto: ExecuteBotFunctionDto,
  ) {
    const { query, maxResults = 5 } = executeDto.input;
    const config = botFunction.config || {};

    this.logger.log(`Searching documents for query: "${query}"`);

    try {
      const results = await this.kbRagService.query(
        query,
        botFunction.botId,
        config.maxResults || maxResults,
      );

      return {
        success: true,
        functionType: 'document_access',
        results: results.map((r) => ({
          content: r.content,
          score: r.score,
          metadata: r.metadata,
        })),
        count: results.length,
      };
    } catch (error) {
      this.logger.error(`Document access error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async executeAutoFill(
    botFunction: BotFunction,
    executeDto: ExecuteBotFunctionDto,
  ) {
    const { field, context, currentValue } = executeDto.input;
    const config = botFunction.config || {};

    this.logger.log(`Auto-filling field: ${field}`);

    try {
      const prompt = `You are a helpful assistant that suggests appropriate values for form fields.

Based on the following context, suggest a value for the "${field}" field.
      
Context: ${context}
Current value: ${currentValue || 'empty'}
Field: ${field}

Provide a single, concise suggestion that would be appropriate for this field.`;

      const suggestion = await this.aiProvidersService.chat(
        prompt,
        config.model || 'gemini-2.0-flash',
      );

      return {
        success: true,
        functionType: 'auto_fill',
        field,
        suggestion: suggestion.trim(),
        confidence: config.confidence || 0.8,
      };
    } catch (error) {
      this.logger.error(`Auto-fill error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async executeAiSuggest(
    botFunction: BotFunction,
    executeDto: ExecuteBotFunctionDto,
  ) {
    const { task, context, options } = executeDto.input;
    const config = botFunction.config || {};

    this.logger.log(`AI suggesting for task: ${task}`);

    try {
      const systemPrompt =
        config.systemPrompt ||
        botFunction.bot?.systemPrompt ||
        'You are a helpful AI assistant.';

      const prompt = `${systemPrompt}

Task: ${task}
Context: ${JSON.stringify(context, null, 2)}
${options ? `Options: ${JSON.stringify(options, null, 2)}` : ''}

Please provide helpful suggestions for this task.`;

      const response = await this.aiProvidersService.chat(
        prompt,
        config.model || 'gemini-2.0-flash',
      );

      return {
        success: true,
        functionType: 'ai_suggest',
        task,
        suggestion: response,
        model: config.model || 'gemini-2.0-flash',
      };
    } catch (error) {
      this.logger.error(`AI suggest error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async executeCustomFunction(
    botFunction: BotFunction,
    executeDto: ExecuteBotFunctionDto,
  ) {
    this.logger.log(`Executing custom function: ${botFunction.name}`);

    return {
      success: true,
      functionType: 'custom',
      message: 'Custom function executed',
      input: executeDto.input,
      config: botFunction.config,
    };
  }
}
