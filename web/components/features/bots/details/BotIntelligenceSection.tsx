'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';

interface BotIntelligenceSectionProps {
    loading: boolean;
    providers: any[];
    aiProviderId: string | null;
    aiModelName: string;
    aiParameters: {
        temperature: number;
        maxTokens: number;
    };
    enableAutoLearn: boolean;
    onChange: (updates: Partial<any>) => void;
}

export function BotIntelligenceSection({
    loading,
    providers,
    aiProviderId,
    aiModelName,
    aiParameters,
    enableAutoLearn,
    onChange
}: BotIntelligenceSectionProps) {
    const { t } = useTranslation();
    const [isManual, setIsManual] = useState(false);

    const selectedProvider = providers.find((p) => p.configId === aiProviderId);
    const availableModels = selectedProvider?.models || [];

    return (
        <Card className="lg:col-span-3 border-none shadow-xl bg-background/50 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Brain className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.intelligence', 'Intelligence')}</CardTitle>
                        <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.intelligence_desc', 'AI brain configuration')}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-8 pt-2">
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.ai_provider_config', 'Provider')}</Label>
                                <Select
                                    value={aiProviderId || undefined}
                                    onValueChange={(value) => {
                                        const newProvider = providers.find(p => p.configId === value);
                                        const defaultModel = newProvider?.models?.[0]?.name || '';
                                        onChange({
                                            aiProviderId: value,
                                            aiModelName: defaultModel
                                        });
                                    }}
                                >
                                    <SelectTrigger className="h-11 bg-background/50">
                                        <SelectValue placeholder={loading ? t('common.loading', 'Loading...') : t('bot_config.select_provider', 'Select Provider')} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl shadow-2xl border-none">
                                        {providers.length === 0 && !loading && (
                                            <SelectItem value="no-providers" disabled>
                                                {t('bot_config.no_providers', 'No providers found')}
                                            </SelectItem>
                                        )}
                                        {providers.map((p) => (
                                            <SelectItem key={p.configId} value={p.configId}>
                                                {p.providerName} {p.source === 'workspace' ? '(Workspace)' : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.model_name', 'Model')}</Label>
                                    {availableModels.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setIsManual(!isManual)}
                                            className="text-[10px] font-bold text-primary hover:underline transition-all"
                                        >
                                            {isManual ? t('bot_config.select_from_list', 'List') : t('bot_config.manual_input', 'Manual')}
                                        </button>
                                    )}
                                </div>

                                {availableModels.length > 0 && !isManual ? (
                                    <Select
                                        value={aiModelName || undefined}
                                        onValueChange={(value) => onChange({ aiModelName: value })}
                                    >
                                        <SelectTrigger className="h-11 bg-background/50 text-sm">
                                            <SelectValue placeholder={t('bot_config.select_model', 'Select Model')} />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-xl border-border/40">
                                            {availableModels.map((m: any) => (
                                                <SelectItem key={m.id} value={m.name}>
                                                    {m.displayName || m.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input
                                        value={aiModelName || ''}
                                        onChange={(e) => onChange({ aiModelName: e.target.value })}
                                        placeholder={t('bot_config.manual_model_placeholder', 'gpt-4o...')}
                                        className="h-11 bg-background/50 font-mono text-sm"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-muted/20">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-primary" />
                                <span className="text-sm font-black tracking-tight uppercase">{t('bot_config.performance_tuning', 'Auto Learning')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="text-xs font-bold">{t('bot_config.context_awareness', 'Knowledge Training')}</span>
                                    <p className="text-[10px] text-muted-foreground/70">{t('bot_config.context_desc', 'Auto learn from chats')}</p>
                                </div>
                                <Switch
                                    checked={enableAutoLearn}
                                    onCheckedChange={(checked) => onChange({ enableAutoLearn: checked })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                                    {t('bot_config.response_creativity', 'Creativity (Temp)')}
                                </Label>
                                <Badge variant="secondary" className="font-mono font-bold px-2 py-0.5 rounded-lg">
                                    {(aiParameters?.temperature ?? 0.7).toFixed(1)}
                                </Badge>
                            </div>
                            <Slider
                                value={[aiParameters?.temperature ?? 0.7]}
                                min={0}
                                max={1.2}
                                step={0.1}
                                onValueChange={([value]) => onChange({ aiParameters: { ...aiParameters, temperature: value } })}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 opacity-40">
                                <span>{t('bot_config.precise', 'Precise')}</span>
                                <span>{t('bot_config.creative', 'Creative')}</span>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.max_response_length', 'Max Length')}</Label>
                                <Badge variant="secondary" className="font-mono font-bold">
                                    {(aiParameters?.maxTokens || 1000).toLocaleString()}
                                </Badge>
                            </div>
                            <Slider
                                value={[aiParameters?.maxTokens || 1000]}
                                min={256}
                                max={8192}
                                step={128}
                                onValueChange={([value]) => onChange({ aiParameters: { ...aiParameters, maxTokens: value } })}
                                className="cursor-pointer"
                            />
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 opacity-40">
                                <span>{t('bot_config.short', 'Short')}</span>
                                <span>{t('bot_config.long', 'Long')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
