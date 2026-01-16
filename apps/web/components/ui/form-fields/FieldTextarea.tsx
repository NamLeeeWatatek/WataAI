import { AiEnhancedTextarea } from "@/components/shared/AiEnhancedTextarea";
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
            className="resize-none bg-muted/10 border-muted-foreground/10 focus:border-primary/30 p-5 rounded-xl transition-all hover:bg-muted/20 focus:bg-background text-base min-h-[120px]"
            rows={field.rows || (field.type === 'textarea' ? 6 : 4)}
            placeholder={field.placeholder}
            type={aiType}
        />
    )
}
