'use client'

import { useState, useEffect, memo } from 'react'
import { Upload, X, ArrowRight, ChevronDown, Monitor, Check, Image as ImageIcon, FileText, Facebook, Instagram, Share2, Globe } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'
import { Spinner } from './Spinner'
import axiosClient from '@/lib/axios-client'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger
} from './DropdownMenu'
import { RadioGroup, RadioGroupItem } from './RadioGroup'
import { Input } from './Input'
import { Slider } from './Slider'
import { Textarea } from './Textarea'
import { Label } from './Label'
import { Progress } from './Progress'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from './KeyValueEditor'
import { Media } from './Media'
import { ImagePreview } from './FilePreview'
import { isImageUrl, isVideoUrl } from '@/lib/utils/media'
import { Eye } from 'lucide-react'
import { Badge } from './Badge'
import { FormField as ApiFormField } from '@/lib/api/creation-tools'

// NodeProperty type from backend - sync with ApiFormField but more flexible
import { DynamicFormFieldProps } from './form-fields/types'
import { FieldFile } from './form-fields/FieldFile'

export const DynamicFormField = memo(function DynamicFormField({
    field,
    value,
    onChange,
    allValues = {},
    className
}: DynamicFormFieldProps) {
    const [jsonError, setJsonError] = useState<string | null>(null)
    const [dynamicOptions, setDynamicOptions] = useState<any[]>([])
    const [loadingOptions, setLoadingOptions] = useState(false)
    const [optionsConfig, setOptionsConfig] = useState<string>('')

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

    const currentValue = value !== undefined ? value : field.default
    const fieldId = `field-${field.name}`

    useEffect(() => {
        const options = field.options
        if (typeof options === 'string' && (options as string).startsWith('dynamic:')) {
            loadDynamicOptions(options as string)
        } else if (field.type === 'channel-select' || field.type === 'channel-selector') {
            loadDynamicOptions('dynamic:channels')
        }
    }, [field.name])

    const loadDynamicOptions = async (optionsStr: string) => {
        const optionsConfig = optionsStr.replace('dynamic:', '')
        setOptionsConfig(optionsConfig)

        try {
            setLoadingOptions(true)

            if (optionsConfig.startsWith('ai-models:')) {
                const typeFilter = optionsConfig.split(':')[1]
                // Call the correct dynamic options endpoint
                const data = await axiosClient.get<any[]>(`/node-types/dynamic-options/ai-models?type=${typeFilter}`)
                setDynamicOptions(data as any)
            }
            else if (optionsConfig === 'channels') {
                // Fetch actual connected channels from user config
                const data = await axiosClient.get<any[]>('/channels/')
                setDynamicOptions(data as any)
            }
        } catch (error) {
            console.warn('Failed to load dynamic options:', error)
            // Set empty array on error to prevent UI issues
            setDynamicOptions([])
        } finally {
            setLoadingOptions(false)
        }
    }

    const renderField = () => {
        switch (field.type) {
            case 'string':
                return (
                    <Input
                        type="text"
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        maxLength={field.maxLength}
                        pattern={field.pattern}
                        className="bg-card/50"
                    />
                )

            case 'text':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="resize-none bg-card/50"
                        rows={field.rows || 4}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'textarea':
                return (
                    <Textarea
                        value={currentValue || ''}
                        onChange={(e) => onChange(field.name, e.target.value)}
                        className="resize-none bg-card/50"
                        rows={field.rows || 6}
                        placeholder={field.placeholder}
                        required={field.required}
                    />
                )

            case 'json':
                return (
                    <div className="space-y-1">
                        <Textarea
                            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
                            onChange={(e) => {
                                const val = e.target.value
                                try {
                                    const parsed = JSON.parse(val)
                                    onChange(field.name, parsed)
                                    setJsonError(null)
                                } catch (err) {
                                    onChange(field.name, val)
                                    setJsonError('Invalid JSON format')
                                }
                            }}
                            className={cn(
                                "font-mono text-xs bg-slate-950 text-slate-50 border-slate-800 dark:bg-black dark:border-slate-800",
                                jsonError && "border-red-500 focus-visible:ring-red-500"
                            )}
                            rows={8}
                            placeholder='{"key": "value"}'
                            required={field.required}
                        />
                        {jsonError && (
                            <p className="text-xs text-destructive font-medium mt-1">{jsonError}</p>
                        )}
                    </div>
                )

            case 'key-value':
                return (
                    <KeyValueEditor
                        value={currentValue || {}}
                        onChange={(value) => onChange(field.name, value)}
                        placeholder={
                            typeof field.placeholder === 'object' ? field.placeholder : undefined
                        }
                    />
                )

            case 'select':
            case 'channel-select':
                const options = (field.type === 'channel-select' || (typeof field.options === 'string' && field.options.startsWith('dynamic:')))
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectValue = currentValue ? String(currentValue) : undefined

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
                                {options.map((opt: any) => {
                                    const isChannel = field.type === 'channel-select' || optionsConfig === 'channels'
                                    const optValue = isChannel ? opt.id : (typeof opt === 'string' ? opt : opt.value)
                                    const optLabel = isChannel ? (opt.name || opt.type) : (typeof opt === 'string' ? opt : opt.label)
                                    return (
                                        <SelectItem key={optValue} value={String(optValue)}>
                                            {optLabel}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>

                        {field.type === 'channel-select' && options.length === 0 && !loadingOptions && (
                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                                <Monitor className="w-4 h-4 text-amber-500 mt-0.5" />
                                <div>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                                        No channels connected yet.
                                    </p>
                                    <a
                                        href="/channels"
                                        target="_blank"
                                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 underline hover:text-amber-700"
                                    >
                                        Manage Channels <ArrowRight className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'channel-selector': {
                const activeChannels = dynamicOptions.filter(c => c.status === 'active' || c.status === 'connected');
                const selectedValues: string[] = Array.isArray(currentValue) ? currentValue : (currentValue ? [currentValue] : []);

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
                                    className="w-full justify-between bg-card/50 rounded-xl"
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {selectedValues.length > 0 ? (
                                            selectedValues.map((val) => {
                                                const platformOpt = (field.options as any[])?.find((o: any) => o.value === val)
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
                            {activeChannels.length > 0 ? (
                                activeChannels.map(channel => {
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
                                                "group flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-md cursor-pointer transition-all duration-300",
                                                isSelected
                                                    ? "border-primary bg-primary/10 shadow-lg ring-1 ring-primary/20"
                                                    : "border-primary/10 bg-card/40 hover:bg-card/60 hover:border-primary/30"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-inner",
                                                isSelected ? "bg-primary border-primary scale-110" : "bg-muted/50 border-primary/10"
                                            )}>
                                                {isSelected ? (
                                                    <Check className="w-5 h-5 text-primary-foreground animate-in zoom-in duration-300" />
                                                ) : (
                                                    getPlatformIcon(channel.type)
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-black truncate bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 tracking-tight">
                                                        {channel.name || channel.type}
                                                    </span>
                                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                                                    {channel.type}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="col-span-full p-8 rounded-2xl border border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center text-center gap-4 group">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                        <Monitor className="w-8 h-8 text-primary opacity-40" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 uppercase tracking-tight">
                                            No channels connected
                                        </p>
                                        <p className="text-[10px] text-muted-foreground mt-1 font-bold uppercase tracking-widest opacity-60">
                                            Integrate your accounts to start creating
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="rounded-full font-black text-[10px] uppercase tracking-wider h-8 px-6 border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
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

            case 'checkbox':
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2 bg-card/50 p-3 rounded-xl border border-border/50">
                        <Checkbox
                            id={field.name}
                            checked={!!currentValue}
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

            case 'number':
                return (
                    <Input
                        type="number"
                        value={currentValue ?? field.default ?? ''}
                        onChange={(e) => onChange(field.name, e.target.value ? Number(e.target.value) : null)}
                        placeholder={field.placeholder}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        required={field.required}
                        className="bg-card/50"
                    />
                )

            case 'slider':
                const min = field.min ?? 0
                const max = field.max ?? 100
                const step = field.step ?? 1
                const val = typeof currentValue === 'number' ? currentValue : min

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

            case 'color':
                return (
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-xl border border-border/50 shadow-sm shrink-0 transition-colors"
                            style={{ backgroundColor: currentValue || '#000000' }}
                        />
                        <div className="flex-1 relative">
                            <Input
                                type="text"
                                value={currentValue || ''}
                                onChange={(e) => onChange(field.name, e.target.value)}
                                placeholder="#000000"
                                className="font-mono bg-card/50 pl-10 upper"
                                maxLength={7}
                            />
                            <div className="absolute left-1 top-1 bottom-1 w-8 overflow-hidden rounded-md opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                <input
                                    type="color"
                                    value={currentValue || '#000000'}
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

            case 'file':
            case 'files':
                return (
                    <FieldFile
                        field={field}
                        value={currentValue}
                        onChange={onChange}
                        allValues={allValues}
                    />
                )

            case 'multi-select': {
                const multiOptions = typeof field.options === 'string' && field.options.startsWith('dynamic:')
                    ? dynamicOptions
                    : (field.options as any[]) || []

                const selectedValues = Array.isArray(currentValue) ? currentValue : []

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between font-normal hover:bg-accent hover:text-accent-foreground"
                            >
                                <span className={selectedValues.length === 0 ? "text-muted-foreground" : "text-foreground"}>
                                    {selectedValues.length === 0
                                        ? "Select options"
                                        : `${selectedValues.length} selected`}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                            {multiOptions.length === 0 && !loadingOptions && (
                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                            {multiOptions.map((opt: any) => {
                                const optValue = typeof opt === 'string' ? opt : opt.value
                                const optLabel = typeof opt === 'string' ? opt : opt.label
                                const isChecked = selectedValues.includes(String(optValue))

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={optValue}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let newValues
                                            if (checked) {
                                                newValues = [...selectedValues, String(optValue)]
                                            } else {
                                                newValues = selectedValues.filter((v: string) => v !== String(optValue))
                                            }
                                            onChange(field.name, newValues)
                                        }}
                                    >
                                        {optLabel}
                                    </DropdownMenuCheckboxItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            }

            case 'radio':
                const radioOptions = (field.options as any[]) || []
                return (
                    <RadioGroup
                        value={String(currentValue || '')}
                        onValueChange={(val) => onChange(field.name, val)}
                        className="flex flex-col space-y-2 mt-2"
                    >
                        {radioOptions.map((opt: any) => {
                            const optValue = typeof opt === 'string' ? opt : opt.value
                            const optLabel = typeof opt === 'string' ? opt : opt.label
                            const optionId = `${field.name}-${optValue}`

                            return (
                                <div key={optValue} className="flex items-center space-x-2">
                                    <RadioGroupItem value={String(optValue)} id={optionId} />
                                    <Label htmlFor={optionId} className="font-normal cursor-pointer">
                                        {optLabel}
                                    </Label>
                                </div>
                            )
                        })}
                    </RadioGroup>
                )

            default:
                return (
                    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
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
