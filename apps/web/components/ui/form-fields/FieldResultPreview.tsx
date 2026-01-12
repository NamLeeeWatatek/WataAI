import { DynamicFormFieldProps } from "./types"
import { Eye, Info, Sparkles, FileText, Layout } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"

export function FieldResultPreview({ field, value, allValues = {} }: DynamicFormFieldProps) {
    // Template might use values from previous steps/fields
    // Example: "You have selected {{topic}} with {{model}}"
    const renderedContent = useMemo(() => {
        let text = field.description || field.placeholder || ""
        if (!text) return "No preview content configured."

        // Basic token replacement
        Object.entries(allValues).forEach(([key, val]) => {
            const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val || "")
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), displayVal)
            text = text.replace(new RegExp(`{${key}}`, 'g'), displayVal)
        })

        return text
    }, [field.description, field.placeholder, allValues])

    const iconMap: Record<string, any> = {
        'sparkles': Sparkles,
        'file': FileText,
        'layout': Layout,
        'eye': Eye
    }

    const Icon = iconMap[field.icon || 'eye'] || Eye

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1 px-1">
                <Icon className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70">{field.label || 'Preview'}</span>
            </div>

            <div className={cn(
                "p-5 rounded-2xl border-2 border-dashed transition-all relative group overflow-hidden bg-card/30 min-h-[100px]",
                "hover:border-primary/30 hover:bg-primary/5 border-muted-foreground/10"
            )}>
                <div className="relative z-10">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        {renderedContent.split('\n').map((line, i) => (
                            <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-2 last:mb-0">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>

                {/* Decorative background icon */}
                <Icon className="absolute -bottom-4 -right-4 w-24 h-24 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity" />
            </div>

            <div className="flex items-center gap-2 px-1">
                <Info className="w-3 h-3 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground italic">
                    This is a live preview of your configuration.
                </p>
            </div>
        </div>
    )
}
