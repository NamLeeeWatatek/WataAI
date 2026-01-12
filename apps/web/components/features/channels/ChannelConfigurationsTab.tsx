"use client";

import React, { useState, useEffect, JSX } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { AlertBanner, CodeBlock } from '@/components/ui/AlertBanner';
import {
  Plus,
  Zap,
  ShieldCheck,
  X,
  Copy,
  ExternalLink,
  Settings,
  Trash2,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getChannelIcon,
  getChannelColor,
  MESSAGING_CHANNELS,
  BUSINESS_INTEGRATIONS
} from '@/lib/constants/channels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { toast } from 'sonner';
import type { IntegrationConfig, CreateIntegrationDto, UpdateIntegrationDto } from '@/lib/types/channel';


interface ChannelConfigurationsTabProps {
  configs: IntegrationConfig[];
  isLoading: boolean;
  onSaveConfig: (config: CreateIntegrationDto | UpdateIntegrationDto) => Promise<void>;
  onDeleteConfig: (id: string) => void;
  onConnect: (provider: string, configId?: string) => void;
}

export function ChannelConfigurationsTab({
  configs,
  isLoading,
  onSaveConfig,
  onDeleteConfig,
  onConnect
}: ChannelConfigurationsTabProps) {
  const [configForm, setConfigForm] = useState({
    id: undefined as string | undefined,
    provider: '',
    name: '',
    client_id: '',
    client_secret: '',
    scopes: '',
    verify_token: ''
  });

  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);





  const openConfig = (configId?: string, provider?: string) => {
    const existing = configId ? configs.find(c => String(c.id) === String(configId)) : null;
    setConfigForm({
      id: existing?.id ? String(existing.id) : undefined,
      provider: existing?.provider || provider || '',
      name: existing?.name || '',
      client_id: existing?.client_id || '',
      client_secret: existing?.client_secret || '',
      scopes: existing?.scopes || '',
      verify_token: existing?.verify_token || ''
    });
    setShowConfigDialog(true);
  };

  const closeConfigDialog = () => {
    setShowConfigDialog(false);
    setConfigForm({
      id: undefined,
      provider: '',
      name: '',
      client_id: '',
      client_secret: '',
      scopes: '',
      verify_token: ''
    });
  };

  const saveConfig = async () => {
    if (!configForm.provider) {
      toast.error("Provider is required");
      return;
    }

    if (!configForm.client_id) {
      toast.error("Client ID is required");
      return;
    }

    // Prepare data using snake_case to match backend DTO @Expose expectations
    const payload: any = {
      id: configForm.id,
      provider: configForm.provider,
      name: configForm.name,
      client_id: configForm.client_id,
      scopes: configForm.scopes,
      verify_token: configForm.verify_token,
      is_active: true // Default to active
    };

    // Only send secret if it's changed and not the mask '***'
    if (configForm.client_secret && configForm.client_secret !== '***') {
      payload.client_secret = configForm.client_secret;
    } else if (!configForm.id && !configForm.client_secret) {
      // Secret is required for new configs
      toast.error("Client Secret is required");
      return;
    }

    try {
      await onSaveConfig(payload);
      closeConfigDialog();
    } catch (error) {
      console.error("Save config error", error);
    }
  };





  return (
    <div>
      {configs.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            Configured Integrations
            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5">
              {configs.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map((config) => {
              const provider = config.provider;
              const channelInfo = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS].find(c => c.id === provider);

              return (
                <Card key={config.id} className="group h-full flex flex-col border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex gap-4">
                      <div className={cn("p-2.5 rounded-xl border border-white/5 h-fit", getChannelColor(provider))}>
                        {getChannelIcon(provider)}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          {config.name || channelInfo?.name || provider}
                          {config.is_active && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium capitalize flex items-center gap-2">
                          <span className="text-foreground/80">{channelInfo?.category || 'Integration'}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className={cn("text-[10px] font-mono uppercase tracking-wider", config.is_active ? "text-green-500" : "text-muted-foreground")}>
                            {config.is_active ? 'Online' : 'Offline'}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-2">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openConfig(config.id)}>
                          <Edit2 className="w-3.5 h-3.5 mr-2" />
                          Edit Configuration
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => config.id && onDeleteConfig(config.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Disconnect
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="flex-1 py-4">
                    <div className="bg-muted/40 rounded-lg p-3 border border-border/40 flex items-center justify-between group/id">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client ID</span>
                        <code className="text-xs font-mono text-foreground/80">
                          {config.client_id?.slice(0, 8)}...{config.client_id?.slice(-4)}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover/id:opacity-100 transition-opacity"
                        onClick={() => {
                          navigator.clipboard.writeText(config.client_id);
                          toast.success("Copied Client ID");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      size="sm"
                      className="w-full font-bold shadow-sm"
                      onClick={() => onConnect(provider, config.id)}
                    >
                      <Zap className="w-3.5 h-3.5 mr-2 fill-current" />
                      Connect Channel
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      <div>
        <h2 className="text-xl font-semibold mb-6">
          Available Integrations
        </h2>

        {/* Messaging Channels */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Global Messaging Channels</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MESSAGING_CHANNELS.map((channel) => (
              <Card
                key={channel.id}
                onClick={() => openConfig(undefined, channel.id)}
                className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div className={cn("p-2.5 rounded-xl border border-white/5 bg-muted/20 group-hover:scale-105 transition-transform", getChannelColor(channel.id))}>
                    {getChannelIcon(channel.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold truncate pr-2">{channel.name}</CardTitle>
                      <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                    </div>
                    <CardDescription className="text-[10px] opacity-70 line-clamp-1 mt-0.5">
                      {channel.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Business Integrations */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Business Logic Integrations</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {BUSINESS_INTEGRATIONS.map((integration) => (
              <Card
                key={integration.id}
                onClick={() => openConfig(undefined, integration.id)}
                className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div className={cn("p-2.5 rounded-xl border border-white/5 bg-muted/20 group-hover:scale-105 transition-transform", getChannelColor(integration.id))}>
                    {getChannelIcon(integration.id)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-bold truncate pr-2">{integration.name}</CardTitle>
                      <Badge variant="secondary" className="text-[9px] h-5 px-1.5 font-normal opacity-60">
                        {integration.category}
                      </Badge>
                    </div>
                    <CardDescription className="text-[10px] opacity-70 line-clamp-1 mt-0.5">
                      {integration.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      {showConfigDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <Card className="w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center gap-5 mb-8 border-b border-border/40 pb-6">
                <div className={cn("p-4 rounded-2xl", getChannelColor(configForm.provider))}>
                  {getChannelIcon(configForm.provider)}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight capitalize">{configForm.provider}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    Security Protocol
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeConfigDialog}
                  className="hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors h-10 w-10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <AlertBanner variant="info" className="mb-8 rounded-xl border-primary/20 bg-primary/5 font-bold text-xs p-4 leading-relaxed">
                Connect via the <span className="text-primary underline cursor-pointer">{configForm.provider} developer portal</span> to retrieve your cryptographic credentials.
              </AlertBanner>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">
                      Label <span className="text-muted-foreground font-normal">(Friendly Name)</span>
                    </Label>
                    <Input
                      type="text"

                      value={configForm.name}
                      onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                      placeholder="e.g. Primary Facebook Portal"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Access Identification <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"

                      value={configForm.client_id}
                      onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                      placeholder="Client / App ID"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block">
                      Authorization Secret <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="password"

                      value={configForm.client_secret}
                      onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                      placeholder="Secret Key"
                      className="font-mono"
                    />
                  </div>
                </div>

                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                  <div className="space-y-6 border-t border-white/5 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/40 h-full">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">OAuth Redirect URI</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={`${origin}/channels/callback?provider=${configForm.provider || 'facebook'}`}
                            className="bg-background/50 font-mono text-[10px] h-8 truncate"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`${origin}/channels/callback?provider=${configForm.provider || 'facebook'}`);
                              toast.success("Copied OAuth URL");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/40 h-full">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">Webhook Callback URL</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '').includes('/v1') ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '') : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '') + '/v1'}/webhooks/facebook`}
                            className="bg-background/50 font-mono text-[10px] h-8 truncate"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
                              const url = `${base.includes('/v1') ? base : base + '/v1'}/webhooks/facebook`;
                              navigator.clipboard.writeText(url);
                              toast.success("Copied Webhook URL");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <Label className="mb-2 block">
                          Webhook Verification
                        </Label>
                        <Input
                          type="text"

                          value={configForm.verify_token}
                          onChange={(e) => setConfigForm({ ...configForm, verify_token: e.target.value })}
                          placeholder="Security Token"
                          required
                        />
                        <p className="text-[10px] font-bold text-muted-foreground/50 mt-2 ml-1">
                          Target this token within your external developer dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {configForm.provider !== 'facebook' && configForm.provider !== 'messenger' && configForm.provider !== 'instagram' && (
                  <div>
                    <Label className="mb-2 block">
                      Permission Scopes
                    </Label>
                    <Input
                      type="text"

                      value={configForm.scopes}
                      onChange={(e) => setConfigForm({ ...configForm, scopes: e.target.value })}
                      placeholder="e.g. read_messages, write_post"
                    />
                  </div>
                )}

                <div className="flex gap-4 mt-8 pt-6 border-t border-white/5">
                  <Button
                    variant="ghost"

                    className="flex-1 h-12 font-black uppercase tracking-widest text-xs opacity-60 hover:opacity-100 transition-opacity"
                    onClick={closeConfigDialog}
                  >
                    Discard
                  </Button>
                  <Button

                    className="flex-[2] h-12 font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                    onClick={saveConfig}
                    disabled={!configForm.client_id || !configForm.client_secret}
                  >
                    {configForm.id ? 'Push Update' : 'Initialize Config'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
