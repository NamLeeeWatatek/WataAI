"use client";

import React, { useState, useEffect, JSX } from 'react';
import { useTranslation } from 'react-i18next';
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
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getChannelIcon,
  getChannelFullStyle,
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
  isMutating?: boolean;
  onSaveConfig: (config: CreateIntegrationDto | UpdateIntegrationDto) => Promise<void>;
  onDeleteConfig: (id: string) => void;
  onConnect: (provider: string, configId?: string) => void;
}

export function ChannelConfigurationsTab({
  configs,
  isLoading,
  isMutating,
  onSaveConfig,
  onDeleteConfig,
  onConnect
}: ChannelConfigurationsTabProps) {
  const { t } = useTranslation();
  const [configForm, setConfigForm] = useState({
    id: undefined as string | undefined,
    provider: '',
    name: '',
    client_id: '',
    client_secret: '',
    scopes: '',
    verify_token: ''
  });

  const [showClientSecret, setShowClientSecret] = useState(false);

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
      toast.error(t('channels.config.providerRequired'));
      return;
    }

    if (!configForm.client_id) {
      toast.error(t('channels.config.clientIdRequired'));
      return;
    }

    const payload: any = {
      id: configForm.id,
      provider: configForm.provider,
      name: configForm.name,
      client_id: configForm.client_id,
      scopes: configForm.scopes,
      verify_token: configForm.verify_token,
      is_active: true
    };

    if (configForm.client_secret && configForm.client_secret !== '***') {
      payload.client_secret = configForm.client_secret;
    } else if (!configForm.id && !configForm.client_secret) {
      toast.error(t('channels.config.clientSecretRequired'));
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
    <div className="space-y-12">
      {configs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-8 flex items-center gap-2 tracking-tight" suppressHydrationWarning>
            {t('channels.config.configuredTitle')}
            <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 ml-2">
              {configs.length}
            </Badge>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {configs.map((config) => {
              const provider = config.provider;
              const channelInfo = [...MESSAGING_CHANNELS, ...BUSINESS_INTEGRATIONS].find(c => c.id === provider);

              return (
                <Card key={config.id} className="group h-full flex flex-col border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                    <div className="flex gap-4">
                      <div className={cn("w-12 h-12 flex items-center justify-center rounded-xl border border-border/40 bg-card/50", getChannelFullStyle(provider))}>
                        {getChannelIcon(provider, "w-8 h-8")}
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          {config.name || channelInfo?.name || provider}
                          {config.is_active && (
                            <span className="relative flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs font-medium capitalize flex items-center gap-2">
                          <span className="text-foreground/80">{channelInfo?.category || 'Integration'}</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className={cn("text-[10px] font-mono uppercase tracking-wider", config.is_active ? "text-green-500" : "text-muted-foreground")} suppressHydrationWarning>
                            {config.is_active ? t('channels_config.active') : 'Offline'}
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
                          {t('channels.config.editConfig')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => config.id && onDeleteConfig(config.id)}
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          {t('channels.config.disconnect')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>

                  <CardContent className="flex-1 py-4">
                    <div className="bg-muted/40 rounded-lg p-3 border border-border/40 flex items-center justify-between group/id">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('channels.config.clientId')}</span>
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
                          toast.success(t('channels.config.copiedClientId'));
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
                      <span suppressHydrationWarning>{t('channels.config.connectChannel')}</span>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Available Integrations */}
      <section className="pt-12 border-t border-border/10">
        <h2 className="text-xl font-bold mb-8 tracking-tight" suppressHydrationWarning>
          {t('channels.config.availableTitle')}
        </h2>

        {/* Messaging Channels */}
        <div className="mb-14">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1" suppressHydrationWarning>{t('channels.config.messagingTitle')}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {MESSAGING_CHANNELS.map((channel) => (
              <Card
                key={channel.id}
                onClick={() => openConfig(undefined, channel.id)}
                className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div className={cn("w-12 h-12 flex items-center justify-center rounded-xl border border-border/40 bg-card/50", getChannelFullStyle(channel.id))}>
                    {getChannelIcon(channel.id, "w-8 h-8")}
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
          <div className="flex items-center gap-4 mb-8">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1" suppressHydrationWarning>{t('channels.config.businessTitle')}</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {BUSINESS_INTEGRATIONS.map((integration) => (
              <Card
                key={integration.id}
                onClick={() => openConfig(undefined, integration.id)}
                className="group cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-center gap-4 p-4">
                  <div className={cn("w-12 h-12 flex items-center justify-center rounded-xl border border-border/40 bg-card/50", getChannelFullStyle(integration.id))}>
                    {getChannelIcon(integration.id, "w-8 h-8")}
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
      </section>

      {/* Configuration Dialog */}
      {showConfigDialog && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center gap-5 mb-8 border-b border-border/40 pb-6">
                <div className={cn("w-16 h-16 flex items-center justify-center rounded-2xl border border-border/40 bg-card/50", getChannelFullStyle(configForm.provider))}>
                  {getChannelIcon(configForm.provider, "w-10 h-10")}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black tracking-tight capitalize">{configForm.provider}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5 font-bold text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span suppressHydrationWarning>{t('channels.config.securityProtocol')}</span>
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
                <span dangerouslySetInnerHTML={{ __html: t('channels.config.devPortalHint', { provider: configForm.provider }) }} />
              </AlertBanner>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
                      {t('channels.config.label')} <span className="text-muted-foreground font-normal">({t('channels.config.friendlyName')})</span>
                    </Label>
                    <Input
                      type="text"
                      className="h-12 rounded-xl bg-secondary/10 border-border/40 focus:border-primary/50"
                      value={configForm.name}
                      onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                      placeholder="e.g. Primary Facebook Portal"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
                      {t('channels.config.accessId')} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="text"
                      className="h-12 rounded-xl bg-secondary/10 border-border/40 focus:border-primary/50 font-mono"
                      value={configForm.client_id}
                      onChange={(e) => setConfigForm({ ...configForm, client_id: e.target.value })}
                      placeholder="Client / App ID"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
                      {t('channels.config.authSecret')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showClientSecret ? "text" : "password"}
                        className="h-12 rounded-xl bg-secondary/10 border-border/40 focus:border-primary/50 font-mono pr-12"
                        value={configForm.client_secret}
                        onChange={(e) => setConfigForm({ ...configForm, client_secret: e.target.value })}
                        placeholder={t('channels.config.secretKey')}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowClientSecret(!showClientSecret)}
                      >
                        {showClientSecret ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {(configForm.provider === 'facebook' || configForm.provider === 'messenger' || configForm.provider === 'instagram') && (
                  <div className="space-y-6 border-t border-white/5 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/40 h-full">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">{t('channels.config.oauthRedirect')}</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={`${origin}/channels/callback/${configForm.provider || 'facebook'}`}
                            className="bg-background/50 font-mono text-[10px] h-8 truncate"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 shrink-0"
                            onClick={() => {
                              navigator.clipboard.writeText(`${origin}/channels/callback/${configForm.provider || 'facebook'}`);
                              toast.success(t('channels.config.copiedOAuth'));
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/40 h-full">
                        <Label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">{t('channels.config.webhookUrl')}</Label>
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
                              toast.success(t('channels.config.copiedWebhook'));
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="md:col-span-1 flex flex-col gap-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
                          {t('channels.config.webhookVerification')}
                        </Label>
                        <Input
                          type="text"
                          className="h-12 rounded-xl bg-secondary/10 border-border/40 focus:border-primary/50"
                          value={configForm.verify_token}
                          onChange={(e) => setConfigForm({ ...configForm, verify_token: e.target.value })}
                          placeholder={t('channels.config.securityToken')}
                          required
                        />
                        <p className="text-[10px] font-bold text-muted-foreground/50 ml-1">
                          {t('channels.config.webhookHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {configForm.provider !== 'facebook' && configForm.provider !== 'messenger' && configForm.provider !== 'instagram' && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-[11px] font-bold uppercase tracking-widest text-foreground/50">
                      {t('channels.config.permissionScopes')}
                    </Label>
                    <Input
                      type="text"
                      className="h-12 rounded-xl bg-secondary/10 border-border/40 focus:border-primary/50"
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
                    {t('channels.config.discard')}
                  </Button>
                  <Button
                    className="flex-[2] h-12 font-black uppercase tracking-widest text-xs active:scale-95 transition-all"
                    onClick={saveConfig}
                    disabled={!configForm.client_id || !configForm.client_secret || isMutating}
                  >
                    {isMutating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        {t('common.processing', { defaultValue: 'Processing...' })}
                      </span>
                    ) : (
                      configForm.id ? t('channels.config.pushUpdate') : t('channels.config.initLimit')
                    )}
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
