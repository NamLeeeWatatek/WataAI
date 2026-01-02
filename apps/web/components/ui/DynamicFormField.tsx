'use client'

import { memo } from 'react'
import { Label } from './Label'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from './KeyValueEditor'
import { RadioGroup, RadioGroupItem } from './RadioGroup'

// Sub-components
import { DynamicFormFieldProps } from './form-fields/types'
import { FieldFile } from './form-fields/FieldFile'
import { FieldInput } from './form-fields/FieldInput'
import { FieldTextarea } from './form-fields/FieldTextarea'
import { FieldSelect } from './form-fields/FieldSelect'
import { FieldCheckbox } from './form-fields/FieldCheckbox'
import { FieldMultiSelect } from './form-fields/FieldMultiSelect'
import { FieldColor } from './form-fields/FieldColor'
import { FieldSlider } from './form-fields/FieldSlider'
import { JsonEditor } from './JsonEditor'
import { Button } from './Button'
import { ChevronDown, Check, Facebook, Instagram, Share2, Globe, Monitor, ArrowRight } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from './DropdownMenu'
import { Badge } from './Badge'
import { useDynamicOptions } from '@/lib/hooks/useDynamicOptions'
import { FormField } from '@/lib/api/creation-tools'

interface OptionItem {
    label: string
    value: string | number
    icon?: string
    [key: string]: any
}

// TODO: Move ChannelSelector to its own file if it grows, keeping inline for now as it shares types
function FieldChannelSelector({ field, value, onChange }: DynamicFormFieldProps) {
    const { options: dynamicOptions } = useDynamicOptions(field as unknown as FormField);

    const activeChannels = dynamicOptions.filter((c: any) => c.status === 'active' || c.status === 'connected');
    const selectedValues: string[] = Array.isArray(value) ? value : (value ? [value] : []);

    const getPlatformIcon = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
            case 'telegram': return <Share2 className="w-4 h-4 text-sky-500" />;
            default: return <Globe className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const selectorPlaceholder = "Select platforms"

    return (
        <div className="space-y-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between bg-card/50 rounded-md"
                    >
                        <div className="flex flex-wrap gap-1">
                            {selectedValues.length > 0 ? (
                                selectedValues.map((val) => {
                                    const platformOpt = (field.options as OptionItem[])?.find((o) => o.value === val)
                                    return (
                                        <Badge
                                            key={val}
                                            variant="secondary"
                                            className="bg-primary/10 text-primary border-primary/20"
                                        >
                                            {platformOpt?.label || val}
                                        </Badge>
                                    )
                                })
                            ) : (
                                <span className="text-muted-foreground">{selectorPlaceholder}</span>
                            )}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                    {dynamicOptions.map((channel: any) => {
                        const isSelected = selectedValues.includes(channel.id)
                        return (
                            <DropdownMenuCheckboxItem
                                key={channel.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                    const newValue = checked
                                        ? [...selectedValues, channel.id]
                                        : selectedValues.filter(v => v !== channel.id)
                                    onChange(field.name, newValue)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {getPlatformIcon(channel.type)}
                                    <span>{channel.name || channel.type}</span>
                                </div>
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Simplified Channel Selector */}
                {activeChannels.length > 0 ? (
                    activeChannels.map((channel: any) => {
                        const isSelected = selectedValues.includes(channel.id);
                        return (
                            <div
                                key={channel.id}
                                onClick={() => {
                                    const newValue = isSelected
                                        ? selectedValues.filter(v => v !== channel.id)
                                        : [...selectedValues, channel.id];
                                    onChange(field.name, newValue);
                                }}
                                className={cn(
                                    "group flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors",
                                    isSelected
                                        ? "bg-accent border-primary/50"
                                        : "bg-card hover:bg-accent/50 border-input"
                                )}
                            >
                                <div className="w-8 h-8 flex items-center justify-center">
                                    {isSelected ? (
                                        <Check className="w-4 h-4 text-primary" />
                                    ) : (
                                        getPlatformIcon(channel.type)
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate">
                                        {channel.name || channel.type}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {channel.type}
                                    </span>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-6 border border-dashed rounded-md bg-muted/10 text-center gap-2">
                        <Monitor className="w-8 h-8 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">No channels connected</p>
                            <p className="text-xs text-muted-foreground">Integrate your accounts to start creating</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => window.open('/channels', '_blank')}
                        >
                            Explore integrations <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}


export const DynamicFormField = memo(function DynamicFormField(props: DynamicFormFieldProps) {
    const { field, value, onChange, allValues = {}, className } = props

    // Visibility logic: support both showWhen (simple) and showIf (complex)
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
                conditionMet = String(targetValue || '').includes(field.showIf.value)
                break
            default:
                conditionMet = true
        }

        if (!conditionMet) return null
    }

    const fieldId = `field-${field.name}`

    const renderField = () => {
        switch (field.type) {
            case 'string':
            case 'number':
                return <FieldInput {...props} />

            case 'text':
            case 'textarea':
                return <FieldTextarea {...props} />

            case 'json':
                return (
                    <JsonEditor
                        value={typeof value === 'object' ? value : {}}
                        onChange={(val) => onChange(field.name, val)}
                    />
                )

            case 'key-value':
                return (
                    <KeyValueEditor
                        value={value || {}}
                        onChange={(value) => onChange(field.name, value)}
                        placeholder={
                            typeof field.placeholder === 'object' ? field.placeholder : undefined
                        }
                    />
                )

            case 'select':
            case 'channel-select':
                return <FieldSelect {...props} />

            case 'channel-selector':
                return <FieldChannelSelector {...props} />

            case 'checkbox':
            case 'boolean':
                return <FieldCheckbox {...props} />

            case 'slider':
                return <FieldSlider {...props} />

            case 'color':
                return <FieldColor {...props} />

            case 'file':
            case 'files':
                return <FieldFile {...props} />

            case 'multi-select':
                return <FieldMultiSelect {...props} />

            case 'radio': {
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
            }

            default:
                return (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                        Unsupported field type: {field.type}
                    </div>
                )
        }
    }

    return (
        <div className={cn('mb-5', className)}>
            <div className="flex items-center justify-between mb-1.5">
                <Label htmlFor={fieldId} className="text-sm font-medium">
                    {field.displayName || field.label}
                    {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.hint && (
                    <span className="text-[10px] text-muted-foreground/80 uppercase tracking-widest font-semibold bg-muted/50 px-1.5 py-0.5 rounded">
                        {field.hint}
                    </span>
                )}
            </div>

            {renderField()}

            {(field.helpText || field.description) && (
                <p className="text-[0.8rem] text-muted-foreground mt-1.5 leading-relaxed">
                    {field.helpText || field.description}
                </p>
            )}
        </div>
    )
})
