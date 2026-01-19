import { Injectable, Logger } from '@nestjs/common';
import { IExecutionStrategy } from './execution.strategy.interface';
import { AiExecutionConfig } from '../../creation-tools/domain/creation-tool';
import {
  AiProvidersService,
  ChatMessage,
} from '../../ai-providers/ai-providers.service';
import { TemplatesService } from '../../templates/templates.service';
import { Liquid } from 'liquidjs';

import { KBRagService } from '../../knowledge-base/services/kb-rag.service';

@Injectable()
export class AiExecutionStrategy implements IExecutionStrategy {
  private readonly logger = new Logger(AiExecutionStrategy.name);
  private readonly engine = new Liquid();

  constructor(
    private readonly aiProvidersService: AiProvidersService,
    private readonly templatesService: TemplatesService,
    private readonly kbService: KBRagService,
  ) {
    this.engine.registerFilter('json', (v) => JSON.stringify(v));
  }

  async execute(
    config: AiExecutionConfig,
    inputs: Record<string, any>,
    context?: { workspaceId?: string; userId?: string; jobId?: string },
  ): Promise<any> {
    this.logger.log(
      `Executing AI Strategy: ${config.provider} - ${config.model}`,
    );

    let finalInputs = { ...inputs };
    const finalPromptTemplate = config.promptTemplate;

    // 0. Handle Template Inclusion if requested
    const shouldIncludeTemplate =
      inputs.includeTemplate === true || config.includeTemplate === true;

    if (shouldIncludeTemplate && inputs.templateId) {
      try {
        const template = await this.templatesService.findById(
          inputs.templateId,
        );
        if (template) {
          this.logger.debug(`Including Template Context: ${template.name}`);

          // Add template info to inputs for Liquid rendering
          finalInputs = {
            ...finalInputs,
            template: {
              name: template.name,
              description: template.description,
              prompt: template.prompt,
              content: template.promptTemplate, // Often promptTemplate contains the main content/instruction
            },
          };

          // If the template has its own promptTemplate, we might want to use it
          // Decision: If template has promptTemplate, it's often the 'specialized' prompt.
          // For now, we'll just expose it as {{template.content}} in the main promptTemplate.
        }
      } catch (error) {
        this.logger.warn(
          `Failed to fetch template ${inputs.templateId} for inclusion: ${error.message}`,
        );
      }
    }

    // 0.5 Handle RAG context if Knowledge Base is config
    if (config.knowledgeBaseId) {
      this.logger.log(`Performing RAG for KB: ${config.knowledgeBaseId}`);
      try {
        const workspaceId = context?.workspaceId || 'default';
        const ragResults = await this.kbService.query(
          JSON.stringify(finalInputs), // Query using inputs
          workspaceId,
          config.knowledgeBaseId,
          3, // Limit
          0.5, // Threshold
        );

        if (ragResults && ragResults.length > 0) {
          const contextText = ragResults.map((r) => r.content).join('\n\n');
          finalInputs['context'] = contextText;
          this.logger.log(
            `RAG Context Injected (Length: ${contextText.length})`,
          );
        }
      } catch (err) {
        this.logger.warn(`RAG Query failed: ${err.message}`);
      }
    }

    // 1. Render Prompt
    const prompt = await this.engine.parseAndRender(
      finalPromptTemplate,
      finalInputs,
    );

    // 2. Execute via AiProvidersService
    // Priority: Specific Config ID -> Fallback to Provider Key + Auto-Resolve
    let result: string;

    if (config.aiConfigId) {
      // We have a specific config configuration
      const scope = context?.workspaceId ? 'workspace' : 'user';
      const scopeId = context?.workspaceId || context?.userId;

      if (!scopeId) {
        this.logger.warn(
          'AiExecutionStrategy: aiConfigId provided but no context scope found (neither workspaceId nor userId). Falling back to basic chat logic.',
        );
        // Fallback or Error? fallback for now
        result = await this.aiProvidersService.chat(
          prompt,
          config.model,
          config.provider, // Fallback key
          undefined,
          context?.workspaceId,
        );
      } else {
        const messages: ChatMessage[] = [{ role: 'user', content: prompt }];
        result = await this.aiProvidersService.chatWithHistoryUsingProvider(
          messages,
          config.model,
          config.aiConfigId,
          scope,
          scopeId,
          config.parameters,
        );
      }
    } else {
      // Legacy behavior: use provider key (e.g. 'openai') and let system resolve
      result = await this.aiProvidersService.chat(
        prompt,
        config.model,
        config.provider,
        undefined, // apiKey (auto-resolve)
        context?.workspaceId,
        undefined, // baseURL (auto-resolve)
        config.useTools ?? false, // Enable tool usage like Google Search if configured
      );
    }

    return {
      provider: config.provider,
      model: config.model,
      prompt,
      result,
    };
  }
}
