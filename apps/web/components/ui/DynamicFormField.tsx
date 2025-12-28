'use client'

import { useState, useEffect, memo } from 'react'
import { Upload, X, ArrowRight, ChevronDown, Monitor, Check, Image as ImageIcon, FileText } from 'lucide-react'
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
import { Input } from './Input'
import { Textarea } from './Textarea'
import { Label } from './Label'
import { useFileUpload } from '@/lib/hooks/use-file-upload'
import { cn } from '@/lib/utils'
import { KeyValueEditor } from './KeyValueEditor'

// NodeProperty type from backend - this should match the backend definition
interface NodeProperty {
    name: string
    label: string
    type: 'string' | 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multi-select' | 'json' | 'file' | 'files' | 'key-value' | 'dynamic-form' | 'channel-select'
    displayName?: string
    description?: string
    helpText?: string
    hint?: string
    required?: boolean
    placeholder?: string
    options?: Array<{ value: string; label: string } | string> | string
    default?: any
    showWhen?: Record<string, any>
    min?: number
    max?: number
    step?: number
    pattern?: string
    maxLength?: number
    rows?: number
    accept?: string
    multiple?: boolean
    properties?: NodeProperty[]
}

interface DynamicFormFieldProps {
    field: NodeProperty
    value: any
    onChange: (key: string, value: any) => void
    allValues?: Record<string, any>
    className?: string
}

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
    const [previewFiles, setPreviewFiles] = useState<any[]>([])

    const { uploadFile, uploadMultipleFiles, uploading: uploadLoading, error: uploadHookError } = useFileUpload({
        bucket: 'images',
        onProgress: (progress) => {
            // Could add progress tracking here if needed
        },
        onSuccess: (fileUrl, fileData) => {
            // Handle successful upload
        },
    })

    const resizeImage = (file: File, maxWidth = 1200): Promise<File> => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            const img = new Image()
            img.onload = () => {
                const ratio = Math.min(1, maxWidth / img.width)
                canvas.width = img.width * ratio
                canvas.height = img.height * ratio
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                canvas.toBlob((blob) => {
                    const resizedFile = new File([blob!], file.name, { type: file.type })
                    resolve(resizedFile)
                }, file.type)
            }
            img.src = URL.createObjectURL(file)
        })
    }

    if (field.showWhen) {
        const conditionMet = Object.entries(field.showWhen).every(
            ([key, val]) => allValues[key] === val
        )
        if (!conditionMet) return null
    }

    const currentValue = value !== undefined ? value : field.default
    const fieldId = `field-${field.name}`

    useEffect(() => {
        const options = field.options
        if (typeof options === 'string' && (options as string).startsWith('dynamic:')) {
            loadDynamicOptions(options as string)
        } else if (field.type === 'channel-select') {
            loadDynamicOptions('dynamic:channels')
        }
    }, [field.name])

    useEffect(() => {
        return () => {
            previewFiles.forEach(p => URL.revokeObjectURL(p.url))
        }
    }, [previewFiles])

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
                // Call the correct dynamic options endpoint
                const data = await axiosClient.get<any[]>('/node-types/dynamic-options/channels')
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

    const handleFileDelete = async (fileId: string) => {
        try {
            await axiosClient.delete(`/files/${fileId}`)
        } catch (error) {
            console.error('Delete error:', error)
            throw error
        }
    }

    const handleFileUpload = async (files: FileList) => {
        if (!files || files.length === 0) return;

        if (field.multiple) {
            const filesArray = Array.from(files)
            const processedFiles = await Promise.all(filesArray.map(file =>
                file.type.startsWith('image/') ? resizeImage(file) : Promise.resolve(file)
            ))

            try {
                const uploadedFiles = await uploadMultipleFiles(processedFiles)
                const formattedFiles = uploadedFiles.map((uploadResult, index) => ({
                    url: uploadResult?.fileUrl || '',
                    fileId: uploadResult?.fileData?.id || '',
                    fileKey: uploadResult?.fileData?.path || '',
                    name: filesArray[index]?.name || `file_${index}`
                }))

                onChange(field.name, formattedFiles)
                setPreviewFiles([])
            } catch (error) {
                console.error('Multiple upload failed:', error)
            }
        } else {
            if (!files[0]) return;
            let processedFile = files[0]

            // Resize image if necessary
            if (processedFile.type.startsWith('image/')) {
                processedFile = await resizeImage(processedFile)
            }

            try {
                const uploadResult = await uploadFile(processedFile)
                const formattedFile = {
                    url: uploadResult?.fileUrl || '',
                    fileId: uploadResult?.fileData?.id || '',
                    fileKey: uploadResult?.fileData?.path || '',
                    name: files[0]?.name || 'unknown_file'
                }
                onChange(field.name, formattedFile)
                setPreviewFiles([])
            } catch (error) {
                console.error('Single upload failed:', error)
            }
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
                                    const optValue = typeof opt === 'string' ? opt : opt.value
                                    const optLabel = typeof opt === 'string' ? opt : opt.label
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

            case 'boolean':
                return (
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-input bg-card/50 hover:bg-accent/50 transition-colors">
                        <Checkbox
                            id={fieldId}
                            checked={currentValue || false}
                            onCheckedChange={(checked) => onChange(field.name, checked)}
                        />
                        <Label htmlFor={fieldId} className="text-sm font-medium cursor-pointer">
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

            case 'file':
            case 'files':
                const isMultiple = field.type === 'files' || field.multiple
                const filesToShow = previewFiles.length > 0 ? previewFiles : currentValue

                return (
                    <div className="space-y-3">
                        {/* Upload Zone */}
                        <div className="relative">
                            <input
                                type="file"
                                id={`file-${field.name}`}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                        const filesArray = Array.from(e.target.files)
                                        const previews = filesArray.map(file => ({
                                            url: URL.createObjectURL(file),
                                            name: file.name,
                                            isPreview: true
                                        }))
                                        if (field.multiple) {
                                            setPreviewFiles(previews)
                                        } else {
                                            setPreviewFiles([previews[0]])
                                        }
                                        handleFileUpload(e.target.files)
                                        e.target.value = ''
                                    }
                                }}
                                className="hidden"
                                accept={field.accept}
                                multiple={isMultiple}
                                disabled={uploadLoading}
                            />
                            <label
                                htmlFor={`file-${field.name}`}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-all",
                                    uploadLoading
                                        ? 'border-muted bg-muted/50 cursor-not-allowed'
                                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 bg-card/30'
                                )}
                            >
                                {uploadLoading ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Spinner className="w-5 h-5 text-primary" />
                                        <span className="text-xs text-muted-foreground">Processing</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                            <Upload className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground">Click to upload</span>
                                            <span className="text-xs text-muted-foreground block mt-0.5">or drag and drop</span>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>

                        {uploadHookError && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <X className="w-3 h-3" /> {uploadHookError.message}
                            </p>
                        )}

                        {/* File List / Previews */}
                        {(previewFiles.length > 0 || currentValue) && (() => {
                            const items = Array.isArray(filesToShow) ? filesToShow : (filesToShow ? [filesToShow] : [])

                            if (items.length === 0) return null

                            return (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {items.map((item: any, idx: number) => {
                                        const fileObj = typeof item === 'object' && item.url ? item : { url: item, fileId: null, fileKey: null }
                                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileObj.url)
                                        const canDelete = true // Allow delete

                                        return (
                                            <div key={idx} className="relative group rounded-lg border border-border/50 bg-card overflow-hidden hover:shadow-sm transition-all">
                                                {isImage ? (
                                                    <div className="aspect-square relative">
                                                        <img
                                                            src={fileObj.url}
                                                            alt={`File ${idx}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            {canDelete && (
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-full"
                                                                    onClick={async () => {
                                                                        if (fileObj.fileId) {
                                                                            try {
                                                                                await handleFileDelete(fileObj.fileId)
                                                                            } catch (error) {
                                                                                console.error('Failed to delete file:', error)
                                                                            }
                                                                        }
                                                                        // Update parent
                                                                        if (Array.isArray(currentValue)) {
                                                                            const newFiles = items.filter((_, i) => i !== idx)
                                                                            onChange(field.name, newFiles.length > 0 ? newFiles : null)
                                                                        } else {
                                                                            onChange(field.name, null)
                                                                        }
                                                                    }}
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-3 flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                                                <FileText className="w-4 h-4 text-primary" />
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-xs font-medium truncate">
                                                                    {fileObj.name || fileObj.url.split('/').pop() || 'File'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {canDelete && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                onClick={async () => {
                                                                    // Same delete logic
                                                                    if (fileObj.fileId) {
                                                                        try {
                                                                            await handleFileDelete(fileObj.fileId)
                                                                        } catch (error) {
                                                                            console.error('Failed to delete file:', error)
                                                                        }
                                                                    }
                                                                    if (Array.isArray(currentValue)) {
                                                                        const newFiles = items.filter((_, i) => i !== idx)
                                                                        onChange(field.name, newFiles.length > 0 ? newFiles : null)
                                                                    } else {
                                                                        onChange(field.name, null)
                                                                    }
                                                                }}
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })()}
                    </div>
                )

            case 'multi-select':
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
                                className="w-full justify-between bg-card/50 font-normal hover:bg-accent hover:text-accent-foreground"
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
