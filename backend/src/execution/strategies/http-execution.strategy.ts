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
    this.engine.registerFilter('strip_newlines', (v) => {
      if (typeof v !== 'string') return v;
      return v.replace(/\n|\r/g, '');
    });
    this.engine.registerFilter('newline_to_space', (v) => {
      if (typeof v !== 'string') return v;
      return v.replace(/\n|\r/g, ' ');
    });
    this.engine.registerFilter('escape_json', (v) => {
      if (typeof v !== 'string') return v;
      return v
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      this.engine.registerFilter('json_parse', (v) => {
        try {
          return JSON.parse(v);
        } catch {
          return v;
        }
      });
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

  /**
   * Cleans newlines and control characters from strings recursively.
   */
  private sanitizeData(obj: any): any {
    if (typeof obj === 'string') {
      return obj
        .replace(/[\x00-\x1F\x7F]/g, (char) => {
          if (char === '\n' || char === '\r') return ' '; // Chuyển xuống dòng thành khoảng trắng
          return ''; // Xóa các ký tự điều khiển khác
        })
        .trim();
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeData(item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.sanitizeData(value);
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

    // 0. Auto-Sanitize Inputs (Global Protection against \n and control characters)
    const sanitizedInputs = this.sanitizeData(inputs);

    // 1. Template Rendering
    this.logger.debug(`Rendering URL template: ${config.urlTemplate}`);
    const url = await this.engine.parseAndRender(
      config.urlTemplate,
      sanitizedInputs,
    );
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
        const renderedBody = await this.engine.parseAndRender(
          config.bodyTemplate,
          sanitizedInputs,
        );
        try {
          // Attempt to parse strictly
          body = JSON.parse(renderedBody);
        } catch (e) {
          // If strict parse fails, try to fix common JSON errors (e.g. newlines in strings)
          // or just fallback to sending the string (which might be intended for text/plain)
          this.logger.warn(
            `Failed to parse rendered body as JSON: ${e.message}. Content preview: ${renderedBody.substring(0, 50)}...`,
          );
          body = renderedBody;
        }
      } else {
        // CASE: Object Template (Recommended)
        // We render values recursively
        body = await this.renderRecursive(config.bodyTemplate, sanitizedInputs);
      }
    } else if (['POST', 'PUT', 'PATCH'].includes(config.method)) {
      // If no template, use sanitized inputs directly
      body = sanitizedInputs;
    }

    // Auto-inject system metadata
    // Ensure body is an object to inject metadata. If it's a string, we can't inject specific keys.
    if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
      if (!body._callbackUrl && inputs._callbackUrl)
        body._callbackUrl = inputs._callbackUrl;
      if (!body._jobId && inputs._jobId) body._jobId = inputs._jobId;
      if (!body._workspaceId && inputs._workspaceId)
        body._workspaceId = inputs._workspaceId;
    } else {
      this.logger.debug(
        `Body is not an object (${typeof body}), skipping metadata injection.`,
      );
    }

    // 2. SSRF Protection
    const isLocalOrPrivate = url.match(
      /^(https?:\/\/)?(localhost|127\.|0\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|169\.254\.)/i,
    );

    if (isLocalOrPrivate) {
      throw new Error(
        'Security Error: Target URL is not allowed (SSRF Protection). Private networks and localhost are blocked.',
      );
    }

    // 3. Execution (Always use sanitized body)
    try {
      this.logger.debug(`Request URL: ${url}`);
      this.logger.debug(`Request Body: ${JSON.stringify(body)}`);

      const finalBody = this.sanitizeData(body);

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
          data: finalBody,
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
