'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Zap, ShieldCheck, Settings2, Gauge } from 'lucide-react';
import { useAiProviders, type SystemSettings } from '@/lib/hooks/features/useAiProviders';
import { FormActions } from '@/components/shared/FormActions';
import { useTranslation } from 'react-i18next';

export function AISettingsTab() {
  const { t } = useTranslation();
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

  const isDirty = JSON.stringify(localSettings) !== JSON.stringify(serverSettings);
  const activeProviders = userConfigs.filter(c => c.isActive);

  if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse" suppressHydrationWarning>{t('common.loading')}</div>;

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
                <CardTitle suppressHydrationWarning>{t('settingsPage.aiSettingsTab.title')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('settingsPage.aiSettingsTab.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label suppressHydrationWarning>{t('settingsPage.aiSettingsTab.defaultProvider')}</Label>
              <Select
                value={localSettings.defaultProviderId}
                onValueChange={(val) => setLocalSettings((p: SystemSettings) => ({ ...p, defaultProviderId: val, defaultModel: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settingsPage.aiSettingsTab.selectProvider')} />
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
              <Label suppressHydrationWarning>{t('settingsPage.aiSettingsTab.defaultModel')}</Label>
              <Select
                value={localSettings.defaultModel}
                onValueChange={(val) => setLocalSettings((p: SystemSettings) => ({ ...p, defaultModel: val }))}
                disabled={!localSettings.defaultProviderId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('settingsPage.aiSettingsTab.selectModel')} />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.find(c => c.id === localSettings.defaultProviderId)?.modelList?.map((model: string) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  )) || <div className="p-4 text-center text-sm text-muted-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.noModels')}</div>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label suppressHydrationWarning>{t('settingsPage.aiSettingsTab.temperature')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="min-temp" className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.minTemp')}</Label>
                  <Input
                    id="min-temp"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={localSettings.minTemperature}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, minTemperature: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max-temp" className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.maxTemp')}</Label>
                  <Input
                    id="max-temp"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={localSettings.maxTemperature}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, maxTemperature: parseFloat(e.target.value) }))}
                  />
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
                <CardTitle suppressHydrationWarning>{t('settingsPage.aiSettingsTab.safety')}</CardTitle>
                <CardDescription suppressHydrationWarning>{t('settingsPage.aiSettingsTab.safetyDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { key: 'contentModeration', label: t('settingsPage.aiSettingsTab.contentModeration'), desc: t('settingsPage.aiSettingsTab.contentModerationDesc') },
                { key: 'safeFallbacks', label: t('settingsPage.aiSettingsTab.safeFallbacks'), desc: t('settingsPage.aiSettingsTab.safeFallbacksDesc') },
                { key: 'contextAware', label: t('settingsPage.aiSettingsTab.contextAware'), desc: t('settingsPage.aiSettingsTab.contextAwareDesc') }
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
                <h4 className="font-medium text-sm text-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.rateLimiting')}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.requestsPerHourSystem')}</Label>
                  <Input
                    type="number"
                    value={localSettings.maxRequestsPerHour}
                    onChange={(e) => setLocalSettings((p: SystemSettings) => ({ ...p, maxRequestsPerHour: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground" suppressHydrationWarning>{t('settingsPage.aiSettingsTab.requestsPerHourUser')}</Label>
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

      <FormActions
        onSave={handleSave}
        disabled={!isDirty}
        loading={isMutating}
        saveLabel={t('settingsPage.aiSettingsTab.saveSettings')}
        icon={<Settings2 className="mr-3 h-5 w-5" />}
      />
    </div>
  );
}
