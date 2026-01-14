import { AiEnhancedTextarea } from "../AiEnhancedTextarea"
import { DynamicFormFieldProps } from "./types"

export function FieldTextarea({ field, value, onChange }: DynamicFormFieldProps) {
    // Infer type from field name or hints
    const aiType =
        field.name.toLowerCase().includes('image') || field.label.toLowerCase().includes('image') ? 'image' :
            field.name.toLowerCase().includes('code') || field.label.toLowerCase().includes('code') ? 'code' :
                'general';

    return (
        <AiEnhancedTextarea
            value={(value as string) || ''}
            onValueChange={(val) => onChange(field.name, val)}
            className="resize-none bg-card/50"
            rows={field.rows || (field.type === 'textarea' ? 6 : 4)}
            placeholder={field.placeholder}
            type={aiType}
        />
    )
}
