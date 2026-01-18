import { Slider } from "../Slider"
import { DynamicFormFieldProps } from "./types"

export function FieldSlider({ field, value, onChange }: DynamicFormFieldProps) {
    const min = field.min ?? 0
    const max = field.max ?? 100
    const step = field.step ?? 1
    const val = typeof value === 'number' ? value : min

    return (
        <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-mono">
                    {min}
                </span>
                <span className="text-sm font-bold text-primary">
                    {val}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                    {max}
                </span>
            </div>
            <Slider
                value={[val]}
                min={min}
                max={max}
                step={step}
                onValueChange={(vals) => onChange(field.name, vals[0])}
                className="py-2"
            />
        </div>
    )
}
