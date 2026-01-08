import { ArrowRight, Monitor } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select"
import { DynamicFormFieldProps } from "./types"
import { useDynamicOptions } from "@/lib/hooks/useDynamicOptions"
import { FormField } from "@/lib/api/creation-tools"

import { ReactNode } from "react"

interface OptionItem {
    label: string
    value: string | number
    icon?: string
    [key: string]: unknown
}

export function FieldSelect({ field, value, onChange, allValues }: DynamicFormFieldProps) {
    // Cast to FormField to match hook expectation
    const { options: dynamicOptions, isLoading: loadingOptions, optionsConfig } = useDynamicOptions(field as unknown as FormField)

    const options: OptionItem[] = (field.type === 'channel-select' || (typeof field.options === 'string' && field.options.startsWith('dynamic:')))
        ? dynamicOptions
        : (field.options as OptionItem[]) || []

    const selectValue = value ? String(value) : undefined

    let placeholder = "Select an option"
    if (loadingOptions) {
        if (optionsConfig?.startsWith('ai-models:')) {
            placeholder = "Loading AI models"
        } else if (optionsConfig === 'channels') {
            placeholder = "Loading channels"
        } else {
            placeholder = "Loading options"
        }
    } else {
        if (field.type === 'channel-select') {
            placeholder = "Select a channel"
        } else if (optionsConfig?.startsWith('ai-models:')) {
            placeholder = "Select an AI model"
        }
    }

    return (
        <div className="space-y-2">
            <Select
                value={selectValue}
                onValueChange={(value) => onChange(field.name, value)}
                disabled={loadingOptions}
            >
                <SelectTrigger className="w-full bg-card/50">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.length === 0 && !loadingOptions && (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                            {field.type === 'channel-select' ? 'No channels connected' : 'No options available'}
                        </div>
                    )}
                    {options.map((opt) => {
                        const isChannel = field.type === 'channel-select' || optionsConfig === 'channels'
                        const optValue = isChannel ? opt.id : (typeof opt === 'string' ? opt : opt.value)
                        const optLabel = isChannel ? (opt.name || opt.type) : (typeof opt === 'string' ? opt : opt.label)
                        return (
                            <SelectItem key={String(optValue)} value={String(optValue)}>
                                {optLabel as ReactNode}
                            </SelectItem>
                        )
                    })}
                </SelectContent>
            </Select>

            {field.type === 'channel-select' && options.length === 0 && !loadingOptions && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-2">
                    <Monitor className="w-4 h-4 text-amber-500 mt-0.5" />
                    <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                            No channels connected yet.
                        </p>
                        <a
                            href="/channels"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 underline hover:text-amber-700"
                        >
                            Manage Channels <ArrowRight className="w-3 h-3" />
                        </a>
                    </div>
                </div>
            )}
        </div>
    )
}
