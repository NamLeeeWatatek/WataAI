"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { AlertBanner, CodeBlock } from '@/components/ui/AlertBanner';
import {
  Settings,
  Trash2,
  Check,
  X,
  Plus,
  Facebook,
  MessageCircle,
  Instagram,
  Phone,
  Mail,
  Youtube,
  Twitter,
  Linkedin,
  Music,
  Monitor,
  MessageSquare,
  Smartphone,
  Globe,
  ShoppingCart,
  Target,
  Cloud,
  Send,
  Hash,
  MapPin,
  PhoneCall,
  Video,
  Zap,
  Book,
  BarChart,
  Users,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Key,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface IntegrationConfig {
  id?: string;
  provider: string;
  name: string;
  client_id: string;
  client_secret: string;
  scopes?: string;
  verify_token?: string;
  is_active: boolean;
}

interface ChannelConfigurationsTabProps {
  configs: IntegrationConfig[];
  isLoading: boolean;
  onSaveConfig: (config: any) => Promise<any>;
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

  const getIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      'facebook': <Facebook className="w-6 h-6" />,
      'messenger': <MessageCircle className="w-6 h-6" />,
      'instagram': <Instagram className="w-6 h-6" />,
      'whatsapp': <Phone className="w-6 h-6" />,
      'telegram': <Send className="w-6 h-6" />,
      'email': <Mail className="w-6 h-6" />,
      'youtube': <Youtube className="w-6 h-6" />,
      'twitter': <Twitter className="w-6 h-6" />,
      'linkedin': <Linkedin className="w-6 h-6" />,
      'tiktok': <Music className="w-6 h-6" />,
      'discord': <Hash className="w-6 h-6" />,
      'slack': <MessageSquare className="w-6 h-6" />,
      'zalo': <MessageCircle className="w-6 h-6" />,
      'line': <MessageSquare className="w-6 h-6" />,
      'viber': <PhoneCall className="w-6 h-6" />,
      'wechat': <MessageCircle className="w-6 h-6" />,
      'sms': <Smartphone className="w-6 h-6" />,
      'webchat': <Globe className="w-6 h-6" />,
      'shopify': <ShoppingCart className="w-6 h-6" />,
      'google': <Globe className="w-6 h-6" />,
      'hubspot': <Target className="w-6 h-6" />,
      'salesforce': <Cloud className="w-6 h-6" />,
      'mailchimp': <Mail className="w-6 h-6" />,
      'intercom': <MessageSquare className="w-6 h-6" />,
      'zapier': <Zap className="w-6 h-6" />,
      'notion': <Book className="w-6 h-6" />,
      'airtable': <BarChart className="w-6 h-6" />,
    };
    return icons[type] || <Smartphone className="w-6 h-6" />;
  };

  const getColor = (type: string) => {
    const colors: Record<string, string> = {
      'facebook': 'text-primary bg-primary/10 border-primary/20',
      'messenger': 'text-primary bg-primary/10 border-primary/20',
      'instagram': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'whatsapp': 'text-success bg-success/10 border-success/20',
      'telegram': 'text-info bg-info/10 border-info/20',
      'youtube': 'text-destructive bg-destructive/10 border-destructive/20',
      'twitter': 'text-info bg-info/10 border-info/20',
      'linkedin': 'text-primary bg-primary/10 border-primary/20',
      'tiktok': 'text-foreground bg-muted border-border/40',
      'discord': 'text-primary bg-primary/10 border-primary/20',
      'slack': 'text-primary bg-primary/10 border-primary/20',
      'zalo': 'text-info bg-info/10 border-info/20',
      'line': 'text-success bg-success/10 border-success/20',
      'viber': 'text-primary bg-primary/10 border-primary/20',
      'wechat': 'text-success bg-success/10 border-success/20',
      'sms': 'text-warning bg-warning/10 border-warning/20',
      'email': 'text-destructive bg-destructive/10 border-destructive/20',
      'webchat': 'text-primary bg-primary/10 border-primary/20',
      'shopify': 'text-success bg-success/10 border-success/20',
      'google': 'text-destructive bg-destructive/10 border-destructive/20',
      'hubspot': 'text-warning bg-warning/10 border-warning/20',
      'salesforce': 'text-primary bg-primary/10 border-primary/20',
      'mailchimp': 'text-warning bg-warning/10 border-warning/20',
      'intercom': 'text-primary bg-primary/10 border-primary/20',
      'zapier': 'text-warning bg-warning/10 border-warning/20',
      'notion': 'text-foreground bg-muted border-border/40',
      'airtable': 'text-info bg-info/10 border-info/20',
    };
    return colors[type] || 'text-muted-foreground bg-muted border-border/40';
  };

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

    // Prepare data by mapping snake_case to camelCase for the backend
    const payload: any = {
      id: configForm.id,
      provider: configForm.provider,
      name: configForm.name,
      clientId: configForm.client_id,
      scopes: configForm.scopes,
      verifyToken: configForm.verify_token,
      isActive: true // Default to active
    };

    // Only send secret if it's changed and not the mask '***'
    if (configForm.client_secret && configForm.client_secret !== '***') {
      payload.clientSecret = configForm.client_secret;
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

  const MESSAGING_CHANNELS = [
    { id: 'facebook', name: 'Facebook Page', description: 'Manage posts and comments on your Facebook Page', category: 'social', multiAccount: true },
    { id: 'messenger', name: 'Messenger', description: 'Reply to messages from your Facebook Page', category: 'messaging', multiAccount: true },
    { id: 'instagram', name: 'Instagram', description: 'Manage Instagram DMs, comments and posts', category: 'social', multiAccount: true },
    { id: 'whatsapp', name: 'WhatsApp Business', description: 'Connect WhatsApp Business API', category: 'messaging', multiAccount: true },
    { id: 'telegram', name: 'Telegram', description: 'Connect Telegram Bot for messaging', category: 'messaging', multiAccount: true },
    { id: 'youtube', name: 'YouTube', description: 'Manage YouTube channel and comments', category: 'social', multiAccount: true },
    { id: 'twitter', name: 'X / Twitter', description: 'Post tweets and manage DMs', category: 'social', multiAccount: true },
    { id: 'linkedin', name: 'LinkedIn', description: 'Post to LinkedIn and manage messages', category: 'social', multiAccount: true },
    { id: 'tiktok', name: 'TikTok', description: 'Post videos and manage TikTok account', category: 'social', multiAccount: true },
    { id: 'discord', name: 'Discord', description: 'Connect Discord bot for community', category: 'messaging', multiAccount: true },
    { id: 'slack', name: 'Slack', description: 'Send notifications to Slack channels', category: 'messaging', multiAccount: true },
    { id: 'zalo', name: 'Zalo OA', description: 'Connect Zalo Official Account (Vietnam)', category: 'messaging', multiAccount: true },
    { id: 'line', name: 'LINE', description: 'Connect LINE Official Account (Asia)', category: 'messaging', multiAccount: true },
    { id: 'viber', name: 'Viber', description: 'Connect Viber Business Messages', category: 'messaging', multiAccount: true },
    { id: 'wechat', name: 'WeChat', description: 'Connect WeChat Official Account (China)', category: 'messaging', multiAccount: true },
    { id: 'sms', name: 'SMS', description: 'Send SMS via Twilio or other providers', category: 'messaging', multiAccount: false },
    { id: 'email', name: 'Email', description: 'Send emails via SMTP or providers', category: 'messaging', multiAccount: false },
    { id: 'webchat', name: 'Web Chat', description: 'Embed chat widget on your website', category: 'messaging', multiAccount: false },
  ];

  const BUSINESS_INTEGRATIONS = [
    { id: 'shopify', name: 'Shopify', description: 'Sync orders and customers from Shopify', category: 'ecommerce', multiAccount: true },
    { id: 'google', name: 'Google Business', description: 'Manage Google Business Profile reviews', category: 'business', multiAccount: true },
    { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts and deals with HubSpot CRM', category: 'crm', multiAccount: false },
    { id: 'salesforce', name: 'Salesforce', description: 'Connect to Salesforce CRM', category: 'crm', multiAccount: false },
    { id: 'mailchimp', name: 'Mailchimp', description: 'Sync contacts for email marketing', category: 'marketing', multiAccount: false },
    { id: 'intercom', name: 'Intercom', description: 'Sync conversations with Intercom', category: 'support', multiAccount: false },
    { id: 'zapier', name: 'Zapier', description: 'Connect to 5000+ apps via Zapier', category: 'automation', multiAccount: false },
    { id: 'notion', name: 'Notion', description: 'Sync data with Notion databases', category: 'productivity', multiAccount: true },
    { id: 'airtable', name: 'Airtable', description: 'Connect to Airtable bases', category: 'productivity', multiAccount: true },
  ];

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
                <Card key={config.id} className="group h-full flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6 pt-6 px-6">
                    <div className={cn("p-4 rounded-xl transition-all duration-500", getColor(provider))}>
                      {getIcon(provider)}
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"

                        onClick={() => openConfig(config.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"

                        onClick={() => config.id && onDeleteConfig(config.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-6 flex-1">
                    <CardTitle className="text-xl font-black mb-1.5 tracking-tight">{config.name || channelInfo?.name || provider}</CardTitle>
                    <CardDescription className="mb-6 font-medium text-xs leading-relaxed opacity-70">
                      {channelInfo?.description || 'API configured'}
                    </CardDescription>
                    <div className="space-y-3">
                      <div className="bg-muted/30 rounded-xl border border-border/40 flex items-center justify-between p-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">ID Tag</span>
                        <span className="font-mono text-[10px] font-bold bg-muted px-2 py-0.5 rounded-lg">{config.client_id?.slice(0, 10) || 'N/A'}...</span>
                      </div>
                      <div className="bg-muted/30 rounded-xl border border-border/40 flex items-center justify-between p-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Registry</span>
                        <Badge className="text-[10px] font-black gap-1.5 py-0 px-2 uppercase">
                          <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.is_active ? 'bg-current' : 'bg-current')}></span>
                          {config.is_active ? 'STABLE' : 'OFFLINE'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-3 px-6 pb-6 pt-4">
                    <Button
                      size="lg"

                      className="flex-1 font-black tracking-tight"
                      onClick={() => onConnect(provider, config.id)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Link Account
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"

                      onClick={() => openConfig(config.id)}
                      className="px-4"
                    >
                      <Settings className="w-4 h-4" />
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

                className="cursor-pointer transition-all duration-300 group overflow-hidden"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                  <div className={cn("p-3 rounded-xl transition-all duration-500", getColor(channel.id))}>
                    {getIcon(channel.id)}
                  </div>
                  <Settings className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardTitle className="text-md font-bold mb-1 group-hover:text-primary transition-colors">{channel.name}</CardTitle>
                  <CardDescription className="text-[10px] opacity-70 font-medium leading-relaxed line-clamp-2">
                    {channel.description}
                  </CardDescription>
                </CardContent>
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

                className="cursor-pointer transition-all duration-300 group overflow-hidden"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                  <div className={cn("p-3 rounded-xl transition-all duration-500", getColor(integration.id))}>
                    {getIcon(integration.id)}
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black tracking-widest uppercase py-0 px-2 opacity-60">
                    {integration.category}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <CardTitle className="text-md font-bold mb-1 group-hover:text-primary transition-colors">{integration.name}</CardTitle>
                  <CardDescription className="text-[10px] opacity-70 font-medium leading-relaxed line-clamp-2">
                    {integration.description}
                  </CardDescription>
                </CardContent>
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
                <div className={cn("p-4 rounded-2xl", getColor(configForm.provider))}>
                  {getIcon(configForm.provider)}
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
