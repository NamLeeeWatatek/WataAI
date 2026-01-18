'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/Dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'

interface BotFunction {
    id: string
    bot_id: string
    function_type: string
    name: string
    description?: string
    is_enabled: boolean
    config?: Record<string, any>
}

interface BotFunctionModalProps {
    open: boolean
    onClose: () => void
    botId: string
    botFunction?: BotFunction | null
    onSuccess: () => void
}

const FUNCTION_TYPES = [
    {
        value: 'document_access',
        label: 'Document Access',
        description: 'Search and retrieve documents from knowledge base',
    },
    {
        value: 'auto_fill',
        label: 'Auto Fill',
        description: 'Automatically suggest values for form fields',
    },
    {
        value: 'ai_suggest',
        label: 'AI Suggest',
        description: 'Provide AI-powered suggestions for specific tasks',
    },
    {
        value: 'custom',
        label: 'Custom Function',
        description: 'Create a custom function with your own logic',
    },
]

export function BotFunctionModal({
    open,
    onClose,
    botId,
    botFunction,
    onSuccess,
}: BotFunctionModalProps) {
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        function_type: 'ai_suggest',
        name: '',
        description: '',
        is_enabled: true,
        config: {},
    })

    useEffect(() => {
        if (botFunction) {
            setFormData({
                function_type: botFunction.function_type,
                name: botFunction.name,
                description: botFunction.description || '',
                is_enabled: botFunction.is_enabled,
                config: botFunction.config || {},
            })
        } else {
            setFormData({
                function_type: 'ai_suggest',
                name: '',
                description: '',
                is_enabled: true,
                config: {},
            })
        }
    }, [botFunction, open])

    const saveFunction = async () => {
        if (!formData.name.trim()) {
            toast.error('Function name is required')
            return
        }

        try {
            setSaving(true)
            if (botFunction) {
                await axiosClient.patch(`/bots/functions/${botFunction.id}`, formData)
                toast.success('Function updated')
            } else {
                await axiosClient.post(`/bots/${botId}/functions`, {
                    ...formData,
                    bot_id: botId,
                })
                toast.success('Function created')
            }
            onSuccess()
        } catch {
            toast.error('Failed to save function')
        } finally {
            setSaving(false)
        }
    }

    const selectedType = FUNCTION_TYPES.find((t) => t.value === formData.function_type)

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {botFunction ? 'Edit Function' : 'Create Function'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="function-type">Function Type</Label>
                        <Select
                            value={formData.function_type}
                            onValueChange={(value) =>
                                setFormData({ ...formData, function_type: value })
                            }
                            disabled={!!botFunction}
                        >
                            <SelectTrigger id="function-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FUNCTION_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        <div>
                                            <div className="font-medium">{type.label}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {type.description}
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {selectedType && (
                            <p className="text-xs text-muted-foreground">
                                {selectedType.description}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Function Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="My Function"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={3}
                            placeholder="Describe what this function does..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="config">Configuration (JSON)</Label>
                        <Textarea
                            id="config"
                            value={JSON.stringify(formData.config, null, 2)}
                            onChange={(e) => {
                                try {
                                    const config = JSON.parse(e.target.value)
                                    setFormData({ ...formData, config })
                                } catch {
                                }
                            }}
                            rows={6}
                            placeholder="{}"
                            className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                            Function-specific configuration in JSON format
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is-enabled"
                            checked={formData.is_enabled}
                            onChange={(e) =>
                                setFormData({ ...formData, is_enabled: e.target.checked })
                            }
                            className="rounded"
                        />
                        <Label htmlFor="is-enabled" className="cursor-pointer">
                            Enable this function
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={saveFunction} loading={saving}>
                        {botFunction ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

