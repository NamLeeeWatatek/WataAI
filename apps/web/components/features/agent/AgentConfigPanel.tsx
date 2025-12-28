'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import axiosClient from '@/lib/axios-client'
import toast from '@/lib/toast'
import { Save, X, Loader2 } from 'lucide-react'
import { useAIModels } from '@/lib/hooks/useAIModels'

interface AgentConfig {
    id?: number
    flow_id: number
    name: string
    personality: string
    tone: string
    language: string
    system_prompt: string
    temperature: number
    max_tokens: number
    model: string
}

interface AgentConfigPanelProps {
    flowId: number
    onClose: () => void
    onSave?: () => void
}

const personalities = [
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'professional', label: 'Professional', description: 'Business-like and formal' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' }
]

const tones = [
    { value: 'formal', label: 'Formal' },
    { value: 'informal', label: 'Informal' }
]

export function AgentConfigPanel({ flowId, onClose, onSave }: AgentConfigPanelProps) {
    const [config, setConfig] = useState<AgentConfig>({
        flow_id: flowId,
        name: 'AI Assistant',
        personality: 'friendly',
        tone: 'informal',
        language: 'en',
        system_prompt: 'You are a helpful AI assistant.',
        temperature: 0.7,
        max_tokens: 150,
        model: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const { getModelOptions, getDefaultModel, loading: modelsLoading } = useAIModels()

    useEffect(() => {
        loadConfig()
    }, [flowId])

    useEffect(() => {
        if (!modelsLoading && !config.model) {
            setConfig(prev => ({ ...prev, model: getDefaultModel() }))
        }
    }, [modelsLoading, config.model, getDefaultModel])

    const loadConfig = async () => {
        try {
            setLoading(true)
            const data: any = await axiosClient.get(`/agent-configs/${flowId}`)
            setConfig(data)
        } catch {

        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)

            if (config.id) {
                await axiosClient.patch(`/agent-configs/${flowId}`, config)
            } else {
                await axiosClient.post('/agent-configs/', config)
            }

            toast.success('Agent configuration saved!')
            onSave?.()
            onClose()
        } catch {
            toast.error('Failed to save configuration')

        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8">
                    <p className="text-slate-400">Loading configuration...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                { }
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Agent Configuration</h2>
                        <p className="text-sm text-slate-400 mt-1">Configure AI behavior and personality</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    { }
                    <div>
                        <label className="block text-sm font-medium mb-2">Agent Name</label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600/30 rounded-lg focus:outline-none focus:border-purple-500"
                            placeholder="e.g., Customer Support Bot"
                        />
                    </div>

                    { }
                    <div>
                        <label className="block text-sm font-medium mb-2">Personality</label>
                        <div className="grid grid-cols-3 gap-3">
                            {personalities.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setConfig({ ...config, personality: p.value })}
                                    className={`p-4 rounded-lg border text-left transition-all ${config.personality === p.value
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-slate-600/30 bg-slate-700 hover:border-zinc-600'
                                        }`}
                                >
                                    <div className="font-medium">{p.label}</div>
                                    <div className="text-xs text-slate-400 mt-1">{p.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    { }
                    <div>
                        <label className="block text-sm font-medium mb-2">Tone</label>
                        <div className="flex gap-3">
                            {tones.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setConfig({ ...config, tone: t.value })}
                                    className={`flex-1 px-4 py-2 rounded-lg border transition-all ${config.tone === t.value
                                        ? 'border-purple-500 bg-purple-500/10'
                                        : 'border-slate-600/30 bg-slate-700 hover:border-zinc-600'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    { }
                    <div>
                        <label className="block text-sm font-medium mb-2">System Prompt</label>
                        <textarea
                            value={config.system_prompt}
                            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600/30 rounded-lg focus:outline-none focus:border-purple-500 resize-none"
                            placeholder="Define how the AI should behave..."
                        />
                    </div>

                    { }
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Model</label>
                            <Select
                                value={config.model}
                                onValueChange={(value) => setConfig({ ...config, model: value })}
                            >
                                <SelectTrigger className="w-full bg-slate-700 border-slate-600/30">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getModelOptions().map(m => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Language</label>
                            <input
                                type="text"
                                value={config.language}
                                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600/30 rounded-lg focus:outline-none focus:border-purple-500"
                                placeholder="en"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Temperature: {config.temperature}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={config.temperature}
                                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                <span>Precise</span>
                                <span>Creative</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Max Tokens</label>
                            <input
                                type="number"
                                value={config.max_tokens}
                                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-slate-700 border border-slate-600/30 rounded-lg focus:outline-none focus:border-purple-500"
                                min="50"
                                max="2000"
                            />
                        </div>
                    </div>
                </div>

                { }
                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                    <Button
                        onClick={onClose}
                        className="bg-slate-700 hover:bg-slate-700"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-700 hover:bg-slate-600"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Configuration
                    </Button>
                </div>
            </div>
        </div>
    )
}
