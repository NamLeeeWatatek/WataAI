"use client";

import React, { useState, useEffect } from 'react';
import axiosClient from '@/lib/axios-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Zap, AlertCircle, Lightbulb, ShieldCheck, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface SystemSettings {
  defaultProviderId: string;
  defaultModel: string;
  minTemperature: number;
  maxTemperature: number;
  contentModeration: boolean;
  safeFallbacks: boolean;
  contextAware: boolean;
  maxRequestsPerHour: number;
  maxRequestsPerUser: number;
}

interface AISettingsTabProps {
  userConfigs: any[];
  systemSettings: SystemSettings;
  onSystemSettingsChange: (settings: SystemSettings | ((prev: SystemSettings) => SystemSettings)) => void;
}

export function AISettingsTab({ userConfigs, systemSettings, onSystemSettingsChange }: AISettingsTabProps) {
  const [aiSettingsLoading, setAiSettingsLoading] = useState(false);

  // Save system AI settings
  const handleSaveSystemSettings = async () => {
    setAiSettingsLoading(true);
    try {
      await axiosClient.patch('/ai-providers/system/settings', {
        defaultProviderId: systemSettings.defaultProviderId || undefined,
        defaultModel: systemSettings.defaultModel || undefined,
        minTemperature: systemSettings.minTemperature,
        maxTemperature: systemSettings.maxTemperature,
        contentModeration: systemSettings.contentModeration,
        safeFallbacks: systemSettings.safeFallbacks,
        contextAware: systemSettings.contextAware,
        maxRequestsPerHour: systemSettings.maxRequestsPerHour,
        maxRequestsPerUser: systemSettings.maxRequestsPerUser,
      });

      toast.success('System AI settings saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save system settings');
    } finally {
      setAiSettingsLoading(false);
    }
  };

  // Load system settings on mount
  const loadSystemSettings = async () => {
    try {
      const response = await axiosClient.get('/ai-providers/system/settings') as any;
      if (response) {
        onSystemSettingsChange({
          ...systemSettings,
          ...response,
        });
      }
    } catch (error) {
      // Settings not saved yet, use defaults
    }
  };

  useEffect(() => {
    loadSystemSettings();
  }, []);

  return (
    <div className="space-y-8">
      {/* System-wide AI Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>System AI Intelligence</CardTitle>
              <CardDescription>
                Configure default processing engines and global autonomy parameters
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Default Model Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Default Model Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default AI Provider</Label>
                <Select
                  value={systemSettings.defaultProviderId}
                  onValueChange={(value) => {
                    onSystemSettingsChange({ ...systemSettings, defaultProviderId: value, defaultModel: '' });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      userConfigs.filter(config => config.isActive).length > 0
                        ? "Select default provider"
                        : "Setup AI providers first"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {userConfigs.filter(config => config.isActive).map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {(() => {
                              const icons = {
                                'openai': 'AiOutlineOpenAI',
                                'anthropic': 'SiClaude',
                                'google': 'RiGeminiLine',
                                'azure': 'VscAzure',
                                'ollama': 'SiOllama',
                              };
                              return <span>{config.displayName}</span>;
                            })()}
                          </span>
                          <span className="font-medium">{config.displayName}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {config.provider?.key || ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose from your configured AI providers.{' '}
                  {userConfigs.filter(config => config.isActive).length === 0 && (
                    <span className="text-primary font-medium">
                      Go to "AI Providers" tab to setup providers first.
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Default Model</Label>
                <Select
                  value={systemSettings.defaultModel}
                  onValueChange={(value) => {
                    onSystemSettingsChange({ ...systemSettings, defaultModel: value });
                  }}
                  disabled={!systemSettings.defaultProviderId || userConfigs.filter(config => config.isActive).length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !systemSettings.defaultProviderId
                        ? "Select provider first"
                        : "Select default model"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const selectedConfig = userConfigs.find(c => c.id === systemSettings.defaultProviderId);
                      return selectedConfig?.modelList?.map((model: string) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      )) || [];
                    })()}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose model from selected provider. This will be used as default for new bots.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Temperature Range</Label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Min: 0.0"
                    step="0.1"
                    min="0"
                    max="2"
                    value={systemSettings.minTemperature}
                    onChange={(e) => onSystemSettingsChange(prev => ({
                      ...prev,
                      minTemperature: parseFloat(e.target.value) || 0.0
                    }))}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Max: 2.0"
                    step="0.1"
                    min="0"
                    max="2"
                    value={systemSettings.maxTemperature}
                    onChange={(e) => onSystemSettingsChange(prev => ({
                      ...prev,
                      maxTemperature: parseFloat(e.target.value) || 2.0
                    }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Restrict temperature values for bot consistency
              </p>
            </div>
          </div>

          {/* AI Generation Policies - Moved Inside System AI Defaults */}
          <div className="space-y-4 pt-8 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight">Autonomous Policy Design</h3>
                <p className="text-xs text-muted-foreground">
                  Governance protocols for AI generation and safety enforcement
                </p>
              </div>
            </div>

            {/* Content Filtering */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Content Policies</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="cursor-pointer font-medium">
                      Enable Content Moderation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Filter inappropriate content and responses
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.contentModeration}
                    onCheckedChange={(checked) =>
                      onSystemSettingsChange(prev => ({ ...prev, contentModeration: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="cursor-pointer font-medium">
                      Fallback to Safe Responses
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Provide safe alternatives when content is flagged
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.safeFallbacks}
                    onCheckedChange={(checked) =>
                      onSystemSettingsChange(prev => ({ ...prev, safeFallbacks: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label className="cursor-pointer font-medium">
                      Context-Aware Generation
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Consider conversation context for better responses
                    </p>
                  </div>
                  <Switch
                    checked={systemSettings.contextAware}
                    onCheckedChange={(checked) =>
                      onSystemSettingsChange(prev => ({ ...prev, contextAware: checked }))
                    }
                  />
                </div>
              </div>
            </div>

            {/* Rate Limiting */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium text-sm">Usage Limits</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Requests per Hour</Label>
                  <Input
                    type="number"
                    placeholder="1000"
                    value={systemSettings.maxRequestsPerHour}
                    onChange={(e) => onSystemSettingsChange(prev => ({
                      ...prev,
                      maxRequestsPerHour: parseInt(e.target.value) || 1000
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Requests per User per Hour</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={systemSettings.maxRequestsPerUser}
                    onChange={(e) => onSystemSettingsChange(prev => ({
                      ...prev,
                      maxRequestsPerUser: parseInt(e.target.value) || 100
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Prompt Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <CardTitle>Prompt Templates</CardTitle>
          </div>
          <CardDescription>
            Manage system prompt templates used across the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Custom Templates</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create and manage custom prompt templates for different use cases
              </p>
              <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                <Zap className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Built-in Templates:</h4>
              <div className="grid gap-3">
                {[
                  { name: 'Customer Support', count: '12 templates' },
                  { name: 'Marketing', count: '8 templates' },
                  { name: 'Technical', count: '15 templates' },
                  { name: 'Education', count: '6 templates' },
                  { name: 'Creative', count: '9 templates' }
                ].map((category) => (
                  <div key={category.name} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSaveSystemSettings}
          loading={aiSettingsLoading}
          className="rounded-full px-8 py-6 font-bold shadow-xl shadow-primary/20 active:scale-95 transition-all text-base bg-primary hover:bg-primary/90"
        >
          <Settings2 className="w-5 h-5 mr-3" />
          Synchronize AI Parameters
        </Button>
      </div>
    </div>
  );
}
