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

      // 2. Optional vs Required Logic (Consolidated with Frontend logic)
      const isRequired = !!(
        (field as any).required === true ||
        (field as any).required === 'true' ||
        (field as any).isRequired === true ||
        (field as any).isRequired === 'true' ||
        (field as any).validation?.required === true ||
        (field as any).validation?.required === 'true' ||
        (field as any).is_required === true ||
        (field as any).mandatory === true
      );

      if (isRequired) {
        // For strings, we MUST use .min(1) to block empty or whitespace-only strings
        if (fieldSchema instanceof z.ZodString) {
          fieldSchema = fieldSchema.trim().min(1, { message: `Field ${field.name} cannot be empty` });
        } else if (fieldSchema instanceof z.ZodNumber) {
          fieldSchema = fieldSchema.refine(val => val !== undefined && val !== null, { message: `Field ${field.name} is required` });
        }
      } else {
        fieldSchema = fieldSchema.optional().nullable();
      }

      schemaShape[field.name] = fieldSchema;
    }

    const dynamicSchema = z.object(schemaShape).passthrough();

    // 3. Parse (will throw ZodError if invalid)
    return dynamicSchema.parse(inputs);
  }

  /**
   * Prepares inputs for execution by simplifying complex objects (e.g., files to URLs).
   * This ensures that templates (LiquidJS) receive clean strings instead of metadata objects.
   */
  prepareInputs(config: FormConfig, inputs: any): any {
    if (!config || !config.fields) {
      return inputs;
    }

    const prepared = { ...inputs };

    for (const field of config.fields) {
      const value = prepared[field.name];
      if (!value) continue;

      if (field.type === 'file' || field.type === 'files') {
        if (Array.isArray(value)) {
          prepared[field.name] = value.map((v) =>
            typeof v === 'object' && v.url ? v.url : v,
          );
        } else if (typeof value === 'object' && value.url) {
          prepared[field.name] = value.url;
        }
      }
    }

    return prepared;
  }
}
