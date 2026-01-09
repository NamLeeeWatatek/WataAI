import { Input } from "../Input"
import { DynamicFormFieldProps } from "./types"

export function FieldColor({ field, value, onChange }: DynamicFormFieldProps) {
    const colorValue = (value as string) || '#000000'

    return (
        <div className="flex items-center gap-3">
            <div
                className="w-10 h-10 rounded-md border border-border/50 shadow-sm shrink-0 transition-colors"
                style={{ backgroundColor: colorValue }}
            />
            <div className="flex-1 relative">
                <Input
                    type="text"
                    value={(value as string) || ''}
                    onChange={(e) => onChange(field.name, e.target.value)}
                    placeholder="#000000"
                    className="font-mono bg-card/50 pl-10 uppercase"
                    maxLength={7}
                />
                <div className="absolute left-1 top-1 bottom-1 w-8 overflow-hidden rounded-md opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <input
                        type="color"
                        value={colorValue}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="w-[150%] h-[150%] -m-[25%] cursor-pointer p-0 border-0"
                    />
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <span className="text-xs">#</span>
                </div>
            </div>
        </div>
    )
}
