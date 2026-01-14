"use client";

import React, { useEffect, useState } from 'react';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Brain, Sparkles, MessageSquare, Settings2, Info, Eye, EyeOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { BotStatus } from '@/lib/types/bots';

interface BotFormData {
  name: string;
  description: string;
  systemPrompt: string;
  aiProviderId: string | null;
  aiModelName: string;
  aiParameters: {
    temperature: number;
    maxTokens: number;
  };
  enableAutoLearn: boolean;
  status: BotStatus;
}

interface BotConfigurationTabProps {
  formData: BotFormData;
  onChange: (updates: Partial<BotFormData>) => void;
  workspaceId?: string;
}

export function BotConfigurationTab({ formData, onChange, workspaceId }: BotConfigurationTabProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Deduplicate by providerId to avoid showing duplicates in dropdown
        const uniqueProviders = combined.filter((provider, index, self) =>
          index === self.findIndex((p) => p.providerId === provider.providerId)
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

  const selectedProviderData = providers.find(p => p.providerId === formData.aiProviderId);
  const availableModels = selectedProviderData?.models || [];
  const isOnline = formData.status === 'active';

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
                <CardTitle className="text-xl font-bold tracking-tight">Bot Identity</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Define how your bot appears to users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-8 pt-2">
            <div className="grid gap-6">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Bot Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="e.g. Customer Support Agent"
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="status" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Protocol Status</Label>
                  <Badge variant={isOnline ? "default" : "secondary"} className="font-black px-2 py-0.5">
                    {formData.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 border border-border/40 rounded-2xl bg-muted/20">
                  <div className="space-y-1">
                    <span className="text-sm font-bold tracking-tight flex items-center gap-2">
                      {isOnline ? <Eye className="w-3.5 h-3.5 text-primary" /> : <EyeOff className="w-3.5 h-3.5" />}
                      Online Visibility
                    </span>
                    <p className="text-[10px] font-medium text-muted-foreground/70">Enable public accessibility for this agent</p>
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
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Briefly describe what this bot does..."
                className="resize-none min-h-[120px] bg-background/50"
                rows={2}
              />
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
                <CardTitle className="text-xl font-bold tracking-tight">System Prompt</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Core personality & behavior protocols</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-2 min-h-[450px]">
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              placeholder="You are a helpful AI assistant tasked with..."
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
                <CardTitle className="text-xl font-bold tracking-tight">Model Intelligence</CardTitle>
                <CardDescription className="text-xs font-medium text-muted-foreground/60">Configure the AI model and generation parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-2">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">AI Provider</Label>
                    <Select value={formData.aiProviderId || undefined} onValueChange={(value) => onChange({ aiProviderId: value, aiModelName: '' })}>
                      <SelectTrigger className="h-11 bg-background/50">
                        <SelectValue placeholder={loading ? "Loading..." : "Select provider"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-none">
                        {providers.length === 0 && !loading && (
                          <SelectItem value="no-providers" disabled>
                            No providers configured
                          </SelectItem>
                        )}
                        {providers.map((p) => {
                          const isDuplicateName = p.providerName.toLowerCase() === (p.displayName || '').toLowerCase();
                          const label = isDuplicateName
                            ? p.providerName
                            : `${p.providerName} ${p.displayName ? `(${p.displayName})` : ''}`;

                          return (
                            <SelectItem key={`${p.providerId}-${p.source}`} value={p.providerId}>
                              {label} {p.source === 'workspace' ? '(Workspace)' : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {providers.length === 0 && !loading && (
                      <p className="text-[10px] text-destructive font-medium mt-1">
                        No AI providers found. <a href="/settings/integrations" className="underline hover:text-destructive/80" target="_blank">Configure Integrations</a>
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Model</Label>
                    <Select value={formData.aiModelName} onValueChange={(value) => onChange({ aiModelName: value })}>
                      <SelectTrigger className="h-11 bg-background/50">
                        <SelectValue placeholder={!formData.aiProviderId ? "Select provider first" : "Select model"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl border-none">
                        {availableModels.map((model: string) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.aiProviderId && availableModels.length === 0 && !loading && (
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-500 font-medium bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                        <Info className="w-3 h-3 shrink-0" />
                        <p>No models found. Check API Key in Integrations.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 p-5 rounded-2xl border border-border/40 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-black tracking-tight uppercase">Performance Tuning</span>
                  </div>
                  <Separator className="bg-border/20" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold">Context Awareness</span>
                      <p className="text-[10px] text-muted-foreground/70">Improve responses based on historical conversation context</p>
                    </div>
                    <Switch
                      checked={formData.enableAutoLearn}
                      onCheckedChange={(checked) => onChange({ enableAutoLearn: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10 p-8 rounded-[2rem] border border-border/20 bg-muted/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                  <Brain className="w-48 h-48" />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                      Response Creativity
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-purple-500 transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-xl p-4 border-border/40 max-w-[280px] bg-background shadow-2xl">
                            <p className="text-xs font-medium leading-relaxed">
                              Lower values make the model more <span className="text-purple-500 font-black underline">Precise</span>.
                              Higher values make it more <span className="text-pink-500 font-black underline">Creative</span>.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Badge className="font-mono font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary border-none">
                      {(formData.aiParameters?.temperature ?? 0.7).toFixed(1)}
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.aiParameters?.temperature ?? 0.7]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => onChange({ aiParameters: { ...(formData.aiParameters || { temperature: 0.7, maxTokens: 1000 }), temperature: value } })}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 opacity-40">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Max Response Length (Tokens)</Label>
                    <Badge variant="outline" className="font-mono font-bold border-border/40">
                      {(formData.aiParameters?.maxTokens || 0).toLocaleString()}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    value={formData.aiParameters?.maxTokens || 0}
                    onChange={(e) => onChange({ aiParameters: { ...(formData.aiParameters || { temperature: 0.7, maxTokens: 1000 }), maxTokens: parseInt(e.target.value) || 0 } })}
                    max={128000}
                    min={1}
                    className="bg-background/40 h-11"
                  />
                  <p className="text-[10px] font-medium text-muted-foreground/60 flex items-center gap-1.5 px-1 uppercase tracking-tight">
                    <Info className="w-3 h-3" />
                    Maximum generation length per session
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
