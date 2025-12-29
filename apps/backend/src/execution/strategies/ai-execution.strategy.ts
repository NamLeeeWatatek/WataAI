import { Injectable, Logger } from '@nestjs/common';
import { IExecutionStrategy } from './execution.strategy.interface';
import { AiExecutionConfig } from '../../creation-tools/domain/creation-tool';
import { AiProvidersService } from '../../ai-providers/ai-providers.service';
import { Liquid } from 'liquidjs';

@Injectable()
export class AiExecutionStrategy implements IExecutionStrategy {
  private readonly logger = new Logger(AiExecutionStrategy.name);
  private readonly engine = new Liquid();

  constructor(private readonly aiProvidersService: AiProvidersService) { }

  async execute(
    config: AiExecutionConfig,
    inputs: Record<string, any>,
    context?: { workspaceId?: string; userId?: string },
  ): Promise<any> {
    this.logger.log(
      `Executing AI Strategy: ${config.provider} - ${config.model}`,
    );

    // 1. Render Prompt
    const prompt = await this.engine.parseAndRender(
      config.promptTemplate,
      inputs,
    );

    // 2. Execute via AiProvidersService
    // This will automatically loop up credentials for the workspace if available,
    // or fallback to system/env keys.
    const result = await this.aiProvidersService.chat(
      prompt,
      config.model,
      config.provider,
      undefined, // apiKey (auto-resolve)
      context?.workspaceId,
    );

    return {
      provider: config.provider,
      model: config.model,
      prompt,
      result,
    };
  }
}
