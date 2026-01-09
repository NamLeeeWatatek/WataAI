import { z } from 'zod';
import { FormField } from '@/lib/api/creation-tools';

export const generateZodSchema = (fields: FormField[]) => {
    const shape: Record<string, z.ZodTypeAny> = {};

    console.group('%c[SCHEMA-GENERATOR] BUILD TRACE', 'background: #1e3a8a; color: white; padding: 4px; border-radius: 4px;');

    fields.forEach((field) => {
        const type = field.type;
        const name = field.name;

        const validation = field.validation || {};
        const isRequired = !!(
            (field as any).required ||
            (field as any).isRequired ||
            (validation as any).required ||
            (field as any).is_required ||
            (field as any).mandatory
        );

        console.log(`Field: [${name}] | Required: ${isRequired}`, {
            raw: field,
            val: validation
        });

        let schema: z.ZodTypeAny;

        // Base Type
        if (type === 'number' || type === 'slider') {
            schema = z.coerce.number();
        } else if (type === 'boolean' || type === 'checkbox') {
            schema = z.boolean();
        } else if (['multi-select', 'files', 'file'].includes(type as any)) {
            schema = z.array(z.any());
        } else {
            schema = z.string();
        }

        // Apply Requiredness
        if (isRequired) {
            if (type === 'checkbox' || type === 'boolean') {
                schema = (schema as z.ZodBoolean).refine(val => val === true, { message: 'This field is required' });
            } else if (type === 'number' || type === 'slider') {
                schema = (schema as z.ZodNumber).refine(val => val !== undefined && val !== null && !isNaN(val), { message: 'Number is required' });
            } else if (['multi-select', 'files', 'file'].includes(type as any)) {
                schema = (schema as z.ZodArray<any>).min(1, { message: 'Please select at least one' });
            } else {
                schema = z.string({ message: 'This field is required' })
                    .trim()
                    .min(1, { message: 'This field cannot be empty' });
            }
        } else {
            // Optional handling
            if (type === 'number' || type === 'slider') {
                schema = schema.optional().or(z.literal('')).or(z.null());
            } else if (type === 'boolean' || type === 'checkbox') {
                schema = schema.optional();
            } else if (['multi-select', 'files', 'file'].includes(type as any)) {
                schema = schema.optional().default([]);
            } else {
                schema = schema.optional().or(z.literal(''));
            }
        }

        // Constraints
        if (field.validation) {
            const v = field.validation;
            const s = schema as any;
            if (v.minLength && typeof s.min === 'function') schema = s.min(v.minLength, { message: `Minimum ${v.minLength} characters required` });
            if (v.maxLength && typeof s.max === 'function') schema = s.max(v.maxLength, { message: `Maximum ${v.maxLength} characters allowed` });
            if (v.min !== undefined && typeof s.min === 'function' && (type === 'number' || type === 'slider')) schema = s.min(v.min, { message: `Minimum value is ${v.min}` });
            if (v.max !== undefined && typeof s.max === 'function' && (type === 'number' || type === 'slider')) schema = s.max(v.max, { message: `Maximum value is ${v.max}` });
            if (v.pattern && typeof s.regex === 'function') schema = s.regex(new RegExp(v.pattern), { message: 'Invalid format' });
        }

        shape[name] = schema;
    });

    console.groupEnd();
    return z.object(shape);
};
