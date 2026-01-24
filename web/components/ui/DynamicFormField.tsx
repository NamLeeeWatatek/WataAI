'use client'

import * as React from 'react'

import { memo } from 'react'
import { Label } from './Label'
import { cn } from '@/lib/utils'
import { RadioGroup, RadioGroupItem } from './RadioGroup'
import { Badge } from './Badge'

// Sub-components
import { DynamicFormFieldProps, NodeProperty } from './form-fields/types'
import { FieldFile } from './form-fields/FieldFile'
import { FieldInput } from './form-fields/FieldInput'
import { FieldTextarea } from './form-fields/FieldTextarea'
import { FieldSelect } from './form-fields/FieldSelect'
import { FieldCheckbox } from './form-fields/FieldCheckbox'
import { FieldMultiSelect } from './form-fields/FieldMultiSelect'
import { FieldColor } from './form-fields/FieldColor'
import { FieldSlider } from './form-fields/FieldSlider'
import { FieldChannelSelector } from './form-fields/FieldChannelSelector'
import { FieldTemplateSelector } from './form-fields/FieldTemplateSelector'
import { FieldPageSelector } from './form-fields/FieldPageSelector'
import { FieldResultPreview } from './form-fields/FieldResultPreview'
import { JsonEditor } from '../shared/JsonEditor'
import { KeyValueEditor } from '../shared/KeyValueEditor'
import dynamic from 'next/dynamic'
const CanvasEditorField = dynamic(() => import('./fields/CanvasEditorField').then(mod => mod.CanvasEditorField), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full animate-pulse bg-muted rounded-xl" />
})

interface OptionItem {
    label: string
    value: string | number
    icon?: string
    [key: string]: unknown
}

// fieldRegistry leverages dependency inversion to avoid the switch-case hell
const fieldRegistry: Record<string, React.ComponentType<DynamicFormFieldProps>> = {
    'string': FieldInput,
    'number': FieldInput,
    'text': FieldTextarea,
    'textarea': FieldTextarea,
    'json': (props) => (
        <JsonEditor
            value={typeof props.value === 'object' && props.value !== null ? props.value : {}}
            onChange={(val) => props.onChange(props.field.name, val)}
        />
    ),
    'key-value': (props) => (
        <KeyValueEditor
            value={(props.value as Record<string, string>) || {} as Record<string, string>}
            onChange={(val) => props.onChange(props.field.name, val)}
            placeholder={
                typeof props.field.placeholder === 'object' ? props.field.placeholder : undefined
            }
        />
    ),
    'select': FieldSelect,
    'channel-select': FieldSelect,
    'channel-selector': FieldChannelSelector,
    'template-selector': FieldTemplateSelector,
    'checkbox': FieldCheckbox,
    'boolean': FieldCheckbox,
    'slider': FieldSlider,
    'color': FieldColor,
    'file': FieldFile,
    'files': FieldFile,
    'multi-select': FieldMultiSelect,
    'page-selector': FieldPageSelector,
    'result-preview': FieldResultPreview,
    'canvas-editor': (props) => (
        <CanvasEditorField
            field={props.field as any} // NodeProperty extends FormField but TS needs assertion
            value={props.value}
            onChange={(val) => props.onChange(props.field.name, val)}
            previousStepResults={(props.allValues?.prev as Record<string, any>) || undefined}
        />
    ),
    'radio': (props) => {
        const { field, value, onChange } = props
        // Ensure field.options is always an array for mapping
        const radioOptions = Array.isArray(field.options) ? field.options : []
        return (
            <RadioGroup
                value={String(value || '')}
                onValueChange={(val) => onChange(field.name, val)}
                className="flex flex-col space-y-2 mt-2"
            >
                {radioOptions.map((opt) => {
                    const optValue = typeof opt === 'string' ? opt : opt.value
                    const optLabel = typeof opt === 'string' ? opt : opt.label
                    const optionId = `${field.name}-${optValue}`

                    return (
                        <div key={String(optValue)} className="flex items-center space-x-2">
                            <RadioGroupItem value={String(optValue)} id={optionId} />
                            <Label htmlFor={optionId} className="font-normal cursor-pointer">
                                {optLabel}
                            </Label>
                        </div>
                    )
                })}
            </RadioGroup>
        )
    },
}

function arePropsEqual(prev: DynamicFormFieldProps, next: DynamicFormFieldProps) {
    if (prev.value !== next.value) return false
    if (prev.field.name !== next.field.name) return false
    if (prev.onChange !== next.onChange) return false
    if (prev.error !== next.error) return false

    // CRITICAL FIX: Always re-render if preview or previous step results change
    // This is required for ResultPreview components to update after async generation
    if (prev.allValues?.preview !== next.allValues?.preview) return false
    if (prev.allValues?.prev !== next.allValues?.prev) return false

    if (!prev.field.showWhen && !prev.field.showIf && !next.field.showWhen && !next.field.showIf) {
        // For special fields that depend on allValues (like result-preview), we might need to be less aggressive
        if (['result-preview', 'canvas-editor'].includes(prev.field.type)) return false;

        return true;
    }

    if (prev.field.showWhen) {
        for (const key of Object.keys(prev.field.showWhen)) {
            if (prev.allValues?.[key] !== next.allValues?.[key]) return false
        }
    }

    if (prev.field.showIf) {
        const key = prev.field.showIf.field
        if (prev.allValues?.[key] !== next.allValues?.[key]) return false
    }

    if (prev.field !== next.field) return false

    if (prev.field.label !== next.field.label) return false
    if (prev.field.description !== next.field.description) return false
    if (prev.field.placeholder !== next.field.placeholder) return false
    if (prev.field.required !== next.field.required) return false
    if (JSON.stringify(prev.field.options) !== JSON.stringify(next.field.options)) return false
    if (JSON.stringify(prev.field.validation) !== JSON.stringify(next.field.validation)) return false

    return true
}

export const DynamicFormField = memo(function DynamicFormField(props: DynamicFormFieldProps) {
    const { field, allValues = {}, className } = props

    // Visibility logic
    if (field.showWhen) {
        const conditionMet = Object.entries(field.showWhen).every(
            ([key, val]) => allValues[key] === val
        )
        if (!conditionMet) return null
    }

    if (field.showIf) {
        const targetValue = allValues[field.showIf.field]
        let conditionMet = true

        switch (field.showIf.operator) {
            case 'equals':
                conditionMet = targetValue === field.showIf.value
                break
            case 'not-equals':
                conditionMet = targetValue !== field.showIf.value
                break
            case 'contains':
                conditionMet = String(targetValue || '').includes(String(field.showIf.value))
                break
            default:
                conditionMet = true
        }

        if (!conditionMet) return null
    }

    const fieldId = `field-${field.name}`
    const FieldComponent = fieldRegistry[field.type]

    return (
        <div className={cn('mb-10 last:mb-0', className)}>
            <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                    <Label htmlFor={fieldId} className="text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/50 transition-colors group-hover:text-primary/70">
                        {field.displayName || field.label}
                        {(field.required || field.validation?.required) && <span className="text-primary ml-1.5">*</span>}
                    </Label>
                    {field.hint && (
                        <p className="text-[10px] text-muted-foreground/60 font-medium">
                            {field.hint}
                        </p>
                    )}
                </div>
                {field.type === 'template-selector' && (
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter font-bold bg-primary/5 border-primary/20 text-primary">
                        Template Required
                    </Badge>
                )}
            </div>

            <div className="relative group/field">
                {FieldComponent ? (
                    <FieldComponent {...props} />
                ) : (
                    <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-xl border border-destructive/20 mt-2">
                        Unsupported field type: {field.type}
                    </div>
                )}
            </div>

            {props.error && (
                <p className="text-[0.8rem] font-semibold text-destructive mt-2.5 animate-in slide-in-from-top-1">
                    {props.error}
                </p>
            )}

            {(field.helpText || field.description) && (
                <p className="text-[0.85rem] text-muted-foreground/70 mt-3 leading-relaxed font-normal italic">
                    {field.helpText || field.description}
                </p>
            )}
        </div>
    )
}, arePropsEqual)
