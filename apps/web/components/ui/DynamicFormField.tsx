'use client'

import * as React from 'react'
import { memo } from 'react'
import { Label } from './Label'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from './KeyValueEditor'
import { RadioGroup, RadioGroupItem } from './RadioGroup'

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
import { JsonEditor } from './JsonEditor'

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
    'radio': (props) => {
        const { field, value, onChange } = props
        const radioOptions = (field.options as OptionItem[]) || []
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

    if (!prev.field.showWhen && !prev.field.showIf && !next.field.showWhen && !next.field.showIf) {
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
        <div className={cn('mb-5', className)}>
            <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor={fieldId} className="text-sm font-medium">
                    {field.displayName || field.label}
                    {(field.required || field.validation?.required) && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.hint && (
                    <span className="text-[10px] text-muted-foreground/80 uppercase tracking-widest font-semibold bg-muted/50 px-1.5 py-0.5 rounded">
                        {field.hint}
                    </span>
                )}
            </div>

            {FieldComponent ? (
                <FieldComponent {...props} />
            ) : (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    Unsupported field type: {field.type}
                </div>
            )}

            {props.error && (
                <p className="text-[0.8rem] font-medium text-destructive mt-1.5 animate-in slide-in-from-top-1">
                    {props.error}
                </p>
            )}

            {(field.helpText || field.description) && (
                <p className="text-[0.8rem] text-muted-foreground mt-1.5 leading-relaxed">
                    {field.helpText || field.description}
                </p>
            )}
        </div>
    )
}, arePropsEqual)
