'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Zap, ShieldCheck, Settings2, Loader2, Gauge } from 'lucide-react';
import { useAiProviders, type SystemSettings } from '@/lib/hooks/features/useAiProviders';

export function AISettingsTab() {
  const {
    userConfigs,
    systemSettings: serverSettings,
    updateSystemSettings,
    isLoading,
    isMutating
  } = useAiProviders();

  const [localSettings, setLocalSettings] = useState(serverSettings);

  useEffect(() => {
    setLocalSettings(serverSettings);
  }, [serverSettings]);

  const handleSave = () => {
    updateSystemSettings(localSettings);
  };

  const activeProviders = userConfigs.filter(c => c.isActive);

  if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse">Loading configuration...</div>;

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Global Policy Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle>Global AI Settings</CardTitle>
                <CardDescription>Configure default AI models and behavior for the system</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Default AI Provider</Label>
              <Select
                value={localSettings.defaultProviderId}
                onValueChange={(val) => setLocalSettings((p: SystemSettings) => ({ ...p, defaultProviderId: val, defaultModel: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Default Model</Label>
              <Select
                value={localSettings.defaultModel}
                onValueChange={(val) => setLocalSettings((p: SystemSettings) => ({ ...p, defaultModel: val }))}
                disabled={!localSettings.defaultProviderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Model" />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.find(c => c.id === localSettings.defaultProviderId)?.modelList?.map((model: string) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  )) || <div className="p-4 text-center text-sm text-muted-foreground">No models found</div>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Temperature Range</Label>
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={localSettings.minTemperature}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, minTemperature: parseFloat(e.target.value) }))}
                    className="text-center"
                  />
                  <span className="absolute -top-2 left-4 px-1 bg-card text-xs text-muted-foreground">Min</span>
                </div>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={localSettings.maxTemperature}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, maxTemperature: parseFloat(e.target.value) }))}
                    className="text-center"
                  />
                  <span className="absolute -top-2 left-4 px-1 bg-card text-xs text-muted-foreground">Max</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Safety & Protocol */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <ShieldCheck className="size-5 text-green-500" />
              </div>
              <div>
                <CardTitle>Safety & Behavior</CardTitle>
                <CardDescription>Controls for AI content generation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { key: 'contentModeration', label: 'Content Moderation', desc: 'Scan and filter inappropriate content' },
                { key: 'safeFallbacks', label: 'Safe Fallbacks', desc: 'Use safe responses when generation fails' },
                { key: 'contextAware', label: 'Context Awareness', desc: 'Enable multi-turn conversation memory' }
              ].map((policy) => (
                <div key={policy.key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">{policy.label}</Label>
                    <p className="text-xs text-muted-foreground">{policy.desc}</p>
                  </div>
                  <Switch
                    checked={(localSettings as any)[policy.key]}
                    onCheckedChange={(v) => setLocalSettings((p: SystemSettings) => ({ ...p, [policy.key]: v }))}
                  />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t space-y-4">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-muted-foreground" />
                <h4 className="font-medium text-sm text-foreground">Rate Limiting</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Requests / Hour (System)</Label>
                  <Input
                    type="number"
                    value={localSettings.maxRequestsPerHour}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, maxRequestsPerHour: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Requests / Hour (User)</Label>
                  <Input
                    type="number"
                    value={localSettings.maxRequestsPerUser}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, maxRequestsPerUser: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isMutating}
          className="min-w-[150px]"
        >
          {isMutating ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Settings2 className="size-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
