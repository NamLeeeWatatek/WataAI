import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Liquid } from 'liquidjs';
import { firstValueFrom } from 'rxjs';
import { HttpExecutionConfig } from '../../creation-tools/domain/creation-tool';
import { IExecutionStrategy } from './execution.strategy.interface';

@Injectable()
export class HttpExecutionStrategy implements IExecutionStrategy {
  private readonly logger = new Logger(HttpExecutionStrategy.name);
  private readonly engine = new Liquid();

  constructor(private readonly httpService: HttpService) { }

  async execute(
    config: HttpExecutionConfig,
    inputs: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: { workspaceId?: string; userId?: string },
  ): Promise<any> {
    this.logger.log(
      `Executing HTTP Strategy: ${config.method} ${config.urlTemplate}`,
    );

    // 1. Template Rendering
    const url = await this.engine.parseAndRender(config.urlTemplate, inputs);

    let body = undefined;
    if (config.bodyTemplate) {
      if (typeof config.bodyTemplate === 'string') {
        const renderedBody = await this.engine.parseAndRender(
          config.bodyTemplate,
          inputs,
        );
        try {
          body = JSON.parse(renderedBody);
        } catch {
          body = renderedBody; // Send as raw string if not JSON
        }
      } else {
        // If bodyTemplate is an object, we need to stringify it first to act as a template,
        // or recursively render it. For simplicity/performance, let's assuming strict JSON/String templates.
        // A better approach for object templates is recursive rendering,
        // but let's encourage string-based JSON templates for full flexibility.
        const templateString = JSON.stringify(config.bodyTemplate);
        const renderedString = await this.engine.parseAndRender(
          templateString,
          inputs,
        );
        body = JSON.parse(renderedString);
      }
    }

    // 2. SSRF Check (Basic) - TODO: Enhance with strict IP check
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      throw new Error(
        'Security Error: Target URL is not allowed (SSRF Protection).',
      );
    }

    // 3. Execution
    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: config.method,
          url,
          headers: config.headers,
          data: body,
          timeout: config.timeoutMs || 5000,
        }),
      );

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      this.logger.error(`HTTP Execution Failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
