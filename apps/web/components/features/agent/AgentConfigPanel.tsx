'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
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
            <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center">
                <Card className="p-10 flex flex-col items-center gap-4 border-none">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
                </Card>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-background/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-none shadow-2xl">
                <div className="p-8 border-b border-border/10 flex items-center justify-between bg-muted/5">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight uppercase">Agent configuration</h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mt-1 flex items-center gap-2">
                            <span className="w-8 h-px bg-primary/20" />
                            Behavior & Personality matrix
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="hover:bg-destructive/10 hover:text-destructive transition-all"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                { }
                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 px-1">Identity handle</label>
                        <input
                            type="text"
                            value={config.name}
                            onChange={(e) => setConfig({ ...config, name: e.target.value })}
                            className="w-full px-4 py-3 bg-muted/20 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                            placeholder="e.g., Customer Support Bot"
                        />
                    </div>

                    { }
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-3 px-1">Personality architecture</label>
                        <div className="grid grid-cols-3 gap-4">
                            {personalities.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => setConfig({ ...config, personality: p.value })}
                                    className={cn(
                                        "p-4 rounded-2xl border-2 text-left transition-all duration-300",
                                        config.personality === p.value
                                            ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                            : 'border-border/40 bg-muted/10 hover:border-border/80 grayscale opacity-60 hover:opacity-100 hover:grayscale-0'
                                    )}
                                >
                                    <div className={cn("font-black text-xs uppercase tracking-tight", config.personality === p.value ? "text-primary" : "text-foreground")}>{p.label}</div>
                                    <div className="text-[9px] font-bold text-muted-foreground mt-1 leading-relaxed">{p.description}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    { }
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-3 px-1">Tone selection</label>
                        <div className="flex gap-4">
                            {tones.map(t => (
                                <button
                                    key={t.value}
                                    onClick={() => setConfig({ ...config, tone: t.value })}
                                    className={cn(
                                        "flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 font-black text-xs uppercase tracking-widest",
                                        config.tone === t.value
                                            ? 'border-primary bg-primary shadow-md text-primary-foreground'
                                            : 'border-border/40 bg-muted/20 text-muted-foreground hover:border-border/80'
                                    )}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    { }
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 px-1">System instructions</label>
                        <textarea
                            value={config.system_prompt}
                            onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 bg-muted/20 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm resize-none"
                            placeholder="Define how the AI should behave..."
                        />
                    </div>

                    { }
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 px-1">Intelligence model</label>
                            <Select
                                value={config.model}
                                onValueChange={(value) => setConfig({ ...config, model: value })}
                            >
                                <SelectTrigger className="w-full h-11 bg-muted/20 border-border/40 rounded-xl font-bold">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getModelOptions().map(m => (
                                        <SelectItem key={m.value} value={m.value} className="font-bold cursor-pointer">
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 px-1">Linguistic profile</label>
                            <input
                                type="text"
                                value={config.language}
                                onChange={(e) => setConfig({ ...config, language: e.target.value })}
                                className="w-full px-4 py-2.5 bg-muted/20 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                                placeholder="en"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <div className="flex justify-between items-center mb-4 px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Creativity bias</label>
                                <Badge variant="outline" className="text-[10px] font-black h-5 border-primary/20 bg-primary/5 text-primary">{config.temperature}</Badge>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={config.temperature}
                                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                                className="w-full accent-primary h-1.5 rounded-full"
                            />
                            <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-muted-foreground/50 mt-2">
                                <span>Logic strict</span>
                                <span>Neural creative</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-2 px-1">Output limit</label>
                            <input
                                type="number"
                                value={config.max_tokens}
                                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 bg-muted/20 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm"
                                min="50"
                                max="2000"
                            />
                        </div>
                    </div>
                </div>

                { }
                <div className="p-8 border-t border-border/10 flex justify-end gap-3 bg-muted/5">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="font-bold text-xs"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 font-black uppercase tracking-widest text-[11px]"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Matrix initialization
                    </Button>
                </div>
            </Card>
        </div>
    )
}
