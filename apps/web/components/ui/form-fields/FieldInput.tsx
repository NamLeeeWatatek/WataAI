import { Input } from "../Input"
import { DynamicFormFieldProps } from "./types"

export function FieldInput({ field, value, onChange }: DynamicFormFieldProps) {
    return (
        <Input
            type={field.type === 'number' ? 'number' : 'text'}
            value={(value as string | number) ?? (field.default as string | number) ?? ''}
            onChange={(e) => {
                const val = e.target.value
                onChange(field.name, field.type === 'number' ? (val ? Number(val) : null) : val)
            }}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            pattern={field.pattern}
            min={field.min}
            max={field.max}
            step={field.step}
            className="bg-muted/10 border-muted-foreground/10 focus:border-primary/30 h-12 text-base px-5 rounded-xl transition-all hover:bg-muted/20 focus:bg-background"
        />
    )
}
