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

  constructor(private readonly httpService: HttpService) {
    this.engine.registerFilter('json', (v) => JSON.stringify(v));
  }

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

    // 2. SSRF Protection: Block private IP ranges and localhost
    const isLocalOrPrivate = url.match(
      /^(https?:\/\/)?(localhost|127\.|0\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/i,
    );

    if (isLocalOrPrivate) {
      throw new Error(
        'Security Error: Target URL is not allowed (SSRF Protection). Private networks and localhost are blocked.',
      );
    }

    // 3. Execution
    try {
      this.logger.debug(`Request URL: ${url}`);
      this.logger.debug(`Request Headers: ${JSON.stringify(config.headers)}`);
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);

      const response = await firstValueFrom(
        this.httpService.request({
          method: config.method,
          url,
          headers: {
            'User-Agent': 'WataAI/1.0',
            ...config.headers,
          },
          data: body,
          timeout: config.timeoutMs || 60000, // Default to 60s for slow webhooks
        }),
      );

      this.logger.log(
        `HTTP Strategy Response: ${response.status} ${response.statusText}`,
      );
      this.logger.debug(`Response Data: ${JSON.stringify(response.data)}`);

      return response.data;
    } catch (error) {
      if (error.response) {
        this.logger.error(
          `HTTP Error ${error.response.status}: ${JSON.stringify(
            error.response.data,
          )}`,
        );
      } else if (error.code === 'ECONNABORTED') {
        this.logger.error(`HTTP Strategy Timeout: Request took longer than timeout`);
      } else {
        this.logger.error(`HTTP Execution Failed: ${error.message}`);
      }
      throw error;
    }
  }
}
