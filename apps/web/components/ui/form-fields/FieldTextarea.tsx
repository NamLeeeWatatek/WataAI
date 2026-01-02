import { Textarea } from "../Textarea"
import { DynamicFormFieldProps } from "./types"

export function FieldTextarea({ field, value, onChange }: DynamicFormFieldProps) {
    return (
        <Textarea
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            className="resize-none bg-card/50"
            rows={field.rows || (field.type === 'textarea' ? 6 : 4)}
            placeholder={field.placeholder}
            required={field.required}
        />
    )
}
