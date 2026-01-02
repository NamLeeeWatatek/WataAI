import { Checkbox } from "../Checkbox"
import { Label } from "../Label"
import { DynamicFormFieldProps } from "./types"

export function FieldCheckbox({ field, value, onChange }: DynamicFormFieldProps) {
    return (
        <div className="flex items-center space-x-2 bg-card/50 p-3 rounded-md border border-border/50">
            <Checkbox
                id={field.name}
                checked={!!value}
                onCheckedChange={(checked) => onChange(field.name, !!checked)}
            />
            <Label
                htmlFor={field.name}
                className="text-sm font-medium leading-none cursor-pointer select-none"
            >
                {field.label}
            </Label>
        </div>
    )
}
