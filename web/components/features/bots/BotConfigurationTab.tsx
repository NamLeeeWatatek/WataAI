"use client";

import React, { useEffect, useState } from 'react';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { UnifiedFileUpload } from '@/components/shared/UnifiedFileUpload';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { useTranslation } from 'react-i18next';
import { Brain, MessageSquare, Settings2, Info, Eye, EyeOff, Tag, Plus, X } from 'lucide-react';
import { BotStatus } from '@/lib/types/bots';

interface BotFormData {
  name: string;
  description: string;
  avatarUrl: string | null;
  systemPrompt: string;
  aiProviderId: string | null;
  aiModelName: string;
  aiParameters: {
    temperature: number;
    maxTokens: number;
  };
  enableAutoLearn: boolean;
  status: BotStatus;
  tags: string[];
}

interface BotConfigurationTabProps {
  formData: BotFormData;
  onChange: (updates: Partial<BotFormData>) => void;
  workspaceId?: string;
  totalServed?: number;
}

export function BotConfigurationTab({ formData, onChange, workspaceId, totalServed = 0 }: BotConfigurationTabProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const { t } = useTranslation();

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      onChange({ tags: [...formData.tags, currentTag.trim()] });
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: formData.tags.filter(t => t !== tagToRemove) });
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  useEffect(() => {
    const loadProviders = async () => {
      try {
        setLoading(true);
        const userModelsPromise = aiProvidersApi.getAvailableModels();

        const workspaceModelsPromise = workspaceId
          ? aiProvidersApi.getWorkspaceModels(workspaceId)
          : Promise.resolve([]);

        const [userModels, workspaceModels] = await Promise.all([
          userModelsPromise,
          workspaceModelsPromise
        ]);

        const combined = [
          ...(workspaceModels || []).map((p) => ({ ...p, source: 'workspace' })),
          ...(userModels || []).map((p) => ({ ...p, source: 'user' }))
        ];

        // Deduplicate by configId to avoid showing duplicates in dropdown
        const uniqueProviders = combined.filter((provider, index, self) =>
          index === self.findIndex((p) => p.configId === provider.configId)
        );

        setProviders(uniqueProviders);
      } catch (error) {
        console.error('Failed to load AI providers:', error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };
    loadProviders();
  }, [workspaceId]);

  const isOnline = formData.status === 'active';
  const selectedProvider = providers.find((p) => p.configId === formData.aiProviderId);
  const availableModels = selectedProvider?.models || [];

  return (
    <div className="space-y-6">

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Identity Section */}
        <Card className="lg:col-span-1 border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.identity')}</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.identity_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-8 pt-2">
            <div className="grid gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="avatar" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.avatar')}</Label>
                <div className="flex gap-6 items-center">
                  <UnifiedFileUpload
                    variant="avatar"
                    value={formData.avatarUrl}
                    onChange={(value) => {
                      if (typeof value === 'string') onChange({ avatarUrl: value });
                      else if (Array.isArray(value) && value.length > 0) onChange({ avatarUrl: value[0] });
                      else onChange({ avatarUrl: null });
                    }}
                    maxSize={2 * 1024 * 1024}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="h-24 w-24"
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground/80 lowercase">
                      {t('bot_config.supported_formats')}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      {t('bot_config.max_size')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder={t('bot_config.name_placeholder')}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.protocol_status')}</Label>
                  <Badge variant={isOnline ? "default" : "secondary"} className="font-black px-2 py-0.5">
                    {t(`bots.${formData.status}`).toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-border/40 rounded-2xl bg-muted/20">
                  <div className="space-y-1">
                    <span className="text-sm font-bold tracking-tight flex items-center gap-2">
                      {isOnline ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {t('bot_config.online_visibility')}
                    </span>
                    <p className="text-[10px] font-medium text-muted-foreground/70">{t('bot_config.visibility_desc')}</p>
                  </div>
                  <Switch
                    id="status"
                    checked={isOnline}
                    onCheckedChange={(checked) => onChange({ status: checked ? 'active' : 'paused' })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder={t('bot_config.description_placeholder')}
                className="resize-none min-h-[120px] bg-background/50"
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.purpose_tags')}</Label>
              <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 border border-border/40 rounded-xl bg-muted/10">
                {formData.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pl-2 pr-1 py-0.5 gap-1 text-[10px] font-bold bg-primary/5 hover:bg-primary/10 border-primary/20 transition-all">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="p-0.5 hover:bg-destructive/20 rounded-full transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
                {(!formData.tags || formData.tags.length === 0) && (
                  <span className="text-[10px] text-muted-foreground/50 self-center px-1 italic">{t('bot_config.no_tags')}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder={t('bot_config.tags_placeholder')}
                  className="h-9 text-xs bg-background/50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddTag}
                  className="h-9 px-3 border-dashed"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic pl-1">{t('bot_config.press_enter_tags')}</p>
            </div>
          </CardContent>
        </Card>

        {/* System Prompt Section */}
        <Card className="lg:col-span-2 border-none shadow-xl bg-background/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.system_prompt')}</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.prompt_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-2 min-h-[450px]">
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              placeholder={t('bot_config.prompt_placeholder')}
              className="flex-1 resize-none font-mono text-sm p-5 bg-background/30 scrollbar-thin scrollbar-thumb-border hover:scrollbar-thumb-primary/30 border-none outline-none ring-0 focus-visible:ring-0"
            />
          </CardContent>
        </Card>

        {/* Intelligence Section */}
        <Card className="lg:col-span-3 border-none shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">{t('bot_config.intelligence')}</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">{t('bot_config.intelligence_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-2">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.ai_provider_config')}</Label>
                    <Select
                      value={formData.aiProviderId || undefined}
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
                        <SelectValue placeholder={loading ? t('common.loading') + "..." : t('bot_config.select_provider')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-none">
                        {providers.length === 0 && !loading && (
                          <SelectItem value="no-providers" disabled>
                            {t('bot_config.no_providers')}
                          </SelectItem>
                        )}
                        {providers.map((p) => {
                          return (
                            <SelectItem key={p.configId} value={p.configId}>
                              {p.providerName} {p.source === 'workspace' ? '(Workspace)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {providers.length === 0 && !loading && (
                      <p className="text-[10px] text-destructive font-medium mt-1">
                        {t('bot_config.no_providers')}. <a href="/settings/integrations" className="underline hover:text-destructive/80" target="_blank">{t('bot_config.configure_integrations')}</a>
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.model_name')}</Label>
                      {availableModels.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsManual(!isManual)}
                          className="text-[10px] font-bold text-primary hover:underline transition-all"
                        >
                          {isManual ? t('bot_config.select_from_list') : t('bot_config.manual_input')}
                        </button>
                      )}
                    </div>

                    {availableModels.length > 0 && !isManual ? (
                      <Select
                        value={formData.aiModelName || undefined}
                        onValueChange={(value) => onChange({ aiModelName: value })}
                      >
                        <SelectTrigger className="h-11 bg-background/50 text-sm">
                          <SelectValue placeholder={t('bot_config.select_model')} />
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
                        value={formData.aiModelName || ''}
                        onChange={(e) => onChange({ aiModelName: e.target.value })}
                        placeholder={t('bot_config.manual_model_placeholder')}
                        className="h-11 bg-background/50 font-mono text-sm"
                      />
                    )}
                    <p className="text-[10px] text-muted-foreground">
                      {isManual || availableModels.length === 0
                        ? t('bot_config.manual_model_desc')
                        : t('bot_config.optimal_model_desc')}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="text-sm font-black tracking-tight uppercase">{t('bot_config.performance_tuning')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold">{t('bot_config.context_awareness')}</span>
                      <p className="text-[10px] text-muted-foreground/70">{t('bot_config.context_desc')}</p>
                    </div>
                    <Switch
                      checked={formData.enableAutoLearn}
                      onCheckedChange={(checked) => onChange({ enableAutoLearn: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    {t('bot_config.response_creativity')}
                  </Label>
                  <Badge variant="secondary" className="font-mono font-bold px-2 py-0.5 rounded-lg">
                    {(formData.aiParameters?.temperature ?? 0.7).toFixed(1)}
                  </Badge>
                </div>
                <Slider
                  value={[formData.aiParameters?.temperature ?? 0.7]}
                  min={0}
                  max={1.2}
                  step={0.1}
                  onValueChange={([value]) => onChange({ aiParameters: { ...(formData.aiParameters || { temperature: 0.7, maxTokens: 1000 }), temperature: value } })}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 opacity-40">
                  <span>{t('bot_config.precise')}</span>
                  <span>{t('bot_config.creative')}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">{t('bot_config.max_response_length')}</Label>
                  <Badge variant="secondary" className="font-mono font-bold">
                    {(formData.aiParameters?.maxTokens || 1000).toLocaleString()}
                  </Badge>
                </div>
                <Slider
                  value={[formData.aiParameters?.maxTokens || 1000]}
                  min={256}
                  max={8192}
                  step={128}
                  onValueChange={([value]) => onChange({ aiParameters: { ...(formData.aiParameters || { temperature: 0.7, maxTokens: 1000 }), maxTokens: value } })}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 opacity-40">
                  <span>{t('bot_config.short')}</span>
                  <span>{t('bot_config.long')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
