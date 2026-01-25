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
    this.engine.registerFilter('url_encode', (v) => encodeURIComponent(v));
    this.engine.registerFilter('url_decode', (v) => decodeURIComponent(v));
    this.engine.registerFilter('escape_json', (v) => {
      if (typeof v !== 'string') return v;
      return v
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
    });
  }

  /**
   * Recursively renders string templates inside an object or array.
   * This preserves the technical structure of the object while only rendering the values,
   * which prevents JSON syntax errors caused by raw newlines or special characters in variables.
   */
  private async renderRecursive(obj: any, inputs: any): Promise<any> {
    if (typeof obj === 'string') {
      return this.engine.parseAndRender(obj, inputs);
    }

    if (Array.isArray(obj)) {
      return Promise.all(obj.map((item) => this.renderRecursive(item, inputs)));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = await this.renderRecursive(value, inputs);
      }
      return result;
    }

    return obj;
  }

  async execute(
    config: HttpExecutionConfig,
    inputs: Record<string, any>,
    context?: { workspaceId?: string; userId?: string; jobId?: string },
  ): Promise<any> {
    this.logger.log(
      `Executing HTTP Strategy: ${config.method} ${config.urlTemplate}`,
    );

    // 1. Template Rendering
    this.logger.debug(`Rendering URL template: ${config.urlTemplate}`);
    const url = await this.engine.parseAndRender(config.urlTemplate, inputs);
    this.logger.debug(`Rendered URL result: "${url}"`);

    if (!url || !url.startsWith('http')) {
      const errorMsg = `Execution Failed: Rendered URL is invalid or not absolute: "${url}". Template: "${config.urlTemplate}". Make sure all variables in the template are provided in the form data.`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    let body: any = undefined;
    if (config.bodyTemplate) {
      if (typeof config.bodyTemplate === 'string') {
        // CASE: String Template (e.g. JSON string with tags)
        // User must use {{variable | json}} to safely handle newlines in complex strings
        const renderedBody = await this.engine.parseAndRender(
          config.bodyTemplate,
          inputs,
        );
        try {
          body = JSON.parse(renderedBody);
        } catch {
          // If it's not valid JSON, we treat the whole thing as a raw string body
          body = renderedBody;
        }
      } else {
        // CASE: Object Template (Recommended)
        // We render values recursively to PRESERVE object structure.
        // This is safe because JS strings in an object can contain raw newlines,
        // and axios/httpService will handle the correct JSON serialization later.
        body = await this.renderRecursive(config.bodyTemplate, inputs);
      }
    } else if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
      body = inputs;
    }

    // Auto-inject system metadata (Business Rule: Always provide context)
    // This ensures that even if the bodyTemplate didn't include _callbackUrl, we force it in.
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      if (!body._callbackUrl && inputs._callbackUrl)
        body._callbackUrl = inputs._callbackUrl;
      if (!body._jobId && inputs._jobId) body._jobId = inputs._jobId;
      if (!body._workspaceId && inputs._workspaceId)
        body._workspaceId = inputs._workspaceId;
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

      this.logger.debug(
        `Request timeout configured to: ${config.timeoutMs || 60000}ms`,
      );
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

        if (error.response.status === 504) {
          this.logger.warn(
            'Gateway Timeout (504) detected. The external tool took too long to respond to the initial webhook. ' +
            'Ensure your n8n Webhook Node is set to "Respond: Immediately" (not "When Last Node Finishes"). ' +
            'Using Async Pattern in WataAI requires the external tool to ACK immediately.',
          );
        }
      } else if (error.code === 'ECONNABORTED') {
        this.logger.error(
          `HTTP Strategy Timeout: Request took longer than ${config.timeoutMs || 60000}ms`,
        );
        this.logger.warn(
          'Request Timeout detected. The external tool took too long to respond. ' +
          '1. check if your Tool Configuration has a low "timeoutMs" set (e.g. 5000ms). ' +
          '2. Ensure your n8n Webhook Node is set to "Respond: Immediately".',
        );
      } else {
        this.logger.error(`HTTP Execution Failed: ${error.message}`);
      }
      throw error;
    }
  }
}
