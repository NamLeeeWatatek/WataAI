import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import {
  FormConfig,
  FormField,
} from '../../creation-tools/domain/creation-tool';

@Injectable()
export class ExecutionValidationService {
  private readonly logger = new Logger(ExecutionValidationService.name);

  validateInputs(config: FormConfig, inputs: any): any {
    if (!config || !config.fields) {
      return inputs; // No validation rules
    }

    const schemaShape: Record<string, z.ZodTypeAny> = {};

    for (const field of config.fields) {
      let fieldSchema: z.ZodTypeAny;

      // 1. Base Type mapping
      switch (field.type) {
        case 'number':
        case 'slider':
          fieldSchema = z.number();
          if (field.validation?.min !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).min(
              field.validation.min,
            );
          if (field.validation?.max !== undefined)
            fieldSchema = (fieldSchema as z.ZodNumber).max(
              field.validation.max,
            );
          break;
        case 'checkbox':
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'file':
        case 'files':
        case 'multi-select':
        case 'channel-selector':
        case 'json':
        case 'key-value':
          // These fields can be arrays, objects, strings, or numbers
          fieldSchema = z.any();
          break;
        case 'text':
        case 'textarea':
        case 'string':
        case 'color':
        case 'select':
        case 'radio':
        case 'channel-select':
        default:
          fieldSchema = z.string();
          if (field.validation?.minLength)
            fieldSchema = (fieldSchema as z.ZodString).min(
              field.validation.minLength,
            );
          if (field.validation?.maxLength)
            fieldSchema = (fieldSchema as z.ZodString).max(
              field.validation.maxLength,
            );
          if (field.validation?.pattern)
            fieldSchema = (fieldSchema as z.ZodString).regex(
              new RegExp(field.validation.pattern),
            );
          break;
      }

      // 2. Optional vs Required
      if (!field.validation?.required) {
        fieldSchema = fieldSchema.optional().nullable();
      }

      schemaShape[field.name] = fieldSchema;
    }

    const dynamicSchema = z.object(schemaShape).passthrough();

    // 3. Parse (will throw ZodError if invalid)
    return dynamicSchema.parse(inputs);
  }
}
