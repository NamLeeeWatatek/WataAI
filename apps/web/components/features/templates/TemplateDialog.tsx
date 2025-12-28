'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import type { Template } from '@/lib/types/template'
import { FileUploader } from '@/components/shared/FileUploader'
import { creationToolsApi, CreationTool } from '@/lib/api/creation-tools'

interface TemplateDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    template?: Template | null
    onSubmit: (data: Partial<Template>) => Promise<void>
}

const categoryOptions = [
    { value: 'image-generation', label: 'Image Generation' },
    { value: 'video-editing', label: 'Video Editing' },
    { value: 'text-to-speech', label: 'Text to Speech' },
    { value: 'social-media', label: 'Social Media' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'other', label: 'Other' },
]

export function TemplateDialog({
    open,
    onOpenChange,
    template,
    onSubmit
}: TemplateDialogProps) {
    const [creationTools, setCreationTools] = useState<CreationTool[]>([])
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        promptTemplate: '',
        category: '',
        creationToolId: '',
        isActive: true,
        styleConfig: {} as Record<string, string>,
        mediaFiles: [] as string[],
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchTools = async () => {
            try {
                const tools = await creationToolsApi.getActive()
                setCreationTools(tools)
            } catch (error) {
                console.error('Failed to fetch creation tools:', error)
            }
        }
        fetchTools()
    }, [])

    // Initialize form data when editing an existing template or reset when dialog closes
    useEffect(() => {
        if (template && open) {
            setFormData({
                name: template.name,
                description: template.description || '',
                promptTemplate: template.promptTemplate || '',
                category: template.category || '',
                creationToolId: template.creationToolId || '',
                isActive: template.isActive,
                styleConfig: template.styleConfig || {},
                mediaFiles: template.mediaFiles || [],
            })
        } else if (!open) {
            setFormData({
                name: '',
                description: '',
                promptTemplate: '',
                category: '',
                creationToolId: '',
                isActive: true,
                styleConfig: {},
                mediaFiles: [],
            })
        }
    }, [template, open])

    // Handle form submission with validation and error handling
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Name is required')
            return
        }

        setLoading(true)
        try {
            await onSubmit(formData)
            onOpenChange(false)
        } catch (error) {
            console.error('Submit error:', error)
        } finally {
            setLoading(false)
        }
    }

    // Helper function to update form data fields immutably
    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template ? 'Edit Template' : 'Create Template'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Awesome Template"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe what this template is for..."
                            rows={3}
                            value={formData.description}
                            onChange={(e) => updateField('description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={formData.category} onValueChange={(value) => updateField('category', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categoryOptions.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="creationToolId">Assign to Creation Tool</Label>
                        <Select
                            value={formData.creationToolId}
                            onValueChange={(value) => updateField('creationToolId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={creationTools.length > 0 ? "Select a tool" : "No tools available"} />
                            </SelectTrigger>
                            <SelectContent>
                                {creationTools.map((tool) => (
                                    <SelectItem key={tool.id} value={tool.id}>
                                        {tool.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Optional: Assign this template to a specific Creation Tool flow.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="promptTemplate">AI Prompt Template</Label>
                        <Textarea
                            id="promptTemplate"
                            placeholder="Enter the AI prompt for content generation..."
                            rows={4}
                            value={formData.promptTemplate}
                            onChange={(e) => updateField('promptTemplate', e.target.value)}
                        />
                        <p className="text-sm text-muted-foreground">
                            The prompt that will be used to generate content with AI
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Style Configuration</Label>
                        <div className="rounded-md border p-4 bg-muted/20">

                            <p className="text-xs text-muted-foreground mt-2">
                                Define key-value pairs for template styling (e.g., colors, fonts)
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Media Files</Label>
                        <div className="rounded-md border p-4 bg-muted/20">
                            <FileUploader
                                value={formData.mediaFiles}
                                onChange={(urls) => updateField('mediaFiles', urls)}
                                multiple={true}
                                accept="image/*,video/*"
                            />
                            <p className="text-xs text-muted-foreground mt-2">
                                Upload images or videos to be used in this template
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Active</Label>
                            <p className="text-sm text-muted-foreground">
                                Whether this template is available for use
                            </p>
                        </div>
                        <Switch
                            checked={formData.isActive}
                            onCheckedChange={(checked) => updateField('isActive', checked)}
                        />
                    </div>

                    {/* Future enhancement: advanced schema editing */}
                    <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                        <p className="font-medium mb-2">Note:</p>
                        <p className="text-xs">
                            Advanced schema editing (drag-and-drop builder) is available in the visual editor after creation.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
