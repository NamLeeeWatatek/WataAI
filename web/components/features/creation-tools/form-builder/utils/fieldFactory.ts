import { FormField } from '@/lib/api/creation-tools';

/**
 * Field type definitions
 */
export type FieldType = string;

/**
 * Generate a unique field name based on existing fields
 * @param type Field type (e.g., 'text', 'textarea')
 * @param existingFields Array of existing fields to check for name collisions
 * @returns Unique field name
 */
export const generateUniqueFieldName = (
    type: string,
    existingFields: FormField[]
): string => {
    const base = `field_${type}_${Date.now()}`;
    let name = base;
    let counter = 1;

    while (existingFields.some(f => f.name === name)) {
        name = `${base}_${counter}`;
        counter++;
    }

    return name;
};

/**
 * Create a new field with default values
 * @param type Field type
 * @param name Field name (unique identifier)
 * @returns New FormField object
 */
export const createField = (type: FieldType, name: string): FormField => {
    return {
        name,
        label: `New ${type}`,
        type: type as any,
        validation: { required: false }
    };
};

/**
 * Create a field with full customization
 * @param config Partial field configuration
 * @returns Complete FormField object
 */
export const createCustomField = (config: Partial<FormField> & { name: string; type: string }): FormField => {
    return {
        label: config.label || `New ${config.type}`,
        validation: { required: false },
        ...config,
    };
};
