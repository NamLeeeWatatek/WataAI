import { Injectable, Logger } from '@nestjs/common';
import { IExecutionStrategy } from './execution.strategy.interface';
import { AiExecutionConfig } from '../../creation-tools/domain/creation-tool';

@Injectable()
export class AiExecutionStrategy implements IExecutionStrategy {
  private readonly logger = new Logger(AiExecutionStrategy.name);

  async execute(
    config: AiExecutionConfig,
    inputs: Record<string, any>,
  ): Promise<any> {
    this.logger.log(
      `Executing AI Strategy: ${config.provider} - ${config.model}`,
    );

    // TODO: Implement actual AI provider call logic here (OpenAI, Gemini, etc.)
    // For now, we simulate a response

    return {
      simulated: true,
      provider: config.provider,
      model: config.model,
      result: `Simulated AI content for prompt: ${config.promptTemplate} with inputs: ${JSON.stringify(inputs)}`,
    };
  }
}
