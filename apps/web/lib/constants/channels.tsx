
import React, { JSX } from 'react';
import {
    Facebook,
    MessageCircle,
    Instagram,
    Phone,
    Send,
    Mail,
    Youtube,
    Twitter,
    Linkedin,
    Music,
    Hash,
    MessageSquare,
    PhoneCall,
    Smartphone,
    Globe,
    ShoppingCart,
    Target,
    Cloud,
    Zap,
    Book,
    BarChart,
    User
} from 'lucide-react';

export const CHANNEL_ICONS: Record<string, JSX.Element> = {
    'facebook': <Facebook className="w-5 h-5" />,
    'messenger': <MessageCircle className="w-5 h-5" />,
    'instagram': <Instagram className="w-5 h-5" />,
    'whatsapp': <Phone className="w-5 h-5" />,
    'telegram': <Send className="w-5 h-5" />,
    'email': <Mail className="w-5 h-5" />,
    'youtube': <Youtube className="w-5 h-5" />,
    'twitter': <Twitter className="w-5 h-5" />,
    'linkedin': <Linkedin className="w-5 h-5" />,
    'tiktok': <Music className="w-5 h-5" />,
    'discord': <Hash className="w-5 h-5" />,
    'slack': <MessageSquare className="w-5 h-5" />,
    'zalo': <MessageCircle className="w-5 h-5" />,
    'line': <MessageSquare className="w-5 h-5" />,
    'viber': <PhoneCall className="w-5 h-5" />,
    'wechat': <MessageCircle className="w-5 h-5" />,
    'sms': <Smartphone className="w-5 h-5" />,
    'webchat': <Globe className="w-5 h-5" />,
    'shopify': <ShoppingCart className="w-5 h-5" />,
    'google': <Globe className="w-5 h-5" />,
    'hubspot': <Target className="w-5 h-5" />,
    'salesforce': <Cloud className="w-5 h-5" />,
    'mailchimp': <Mail className="w-5 h-5" />,
    'intercom': <MessageSquare className="w-5 h-5" />,
    'zapier': <Zap className="w-5 h-5" />,
    'notion': <Book className="w-5 h-5" />,
    'airtable': <BarChart className="w-5 h-5" />,
};

export const CHANNEL_COLORS: Record<string, string> = {
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

export const MESSAGING_CHANNELS = [
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

export const BUSINESS_INTEGRATIONS = [
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

export const getChannelIcon = (type: string | undefined): JSX.Element => {
    if (!type) return <Smartphone className="w-5 h-5" />;
    return CHANNEL_ICONS[type] || <Smartphone className="w-5 h-5" />;
};

export const getChannelColor = (type: string | undefined): string => {
    if (!type) return 'text-muted-foreground bg-muted/50 border-border/40';
    return CHANNEL_COLORS[type] || 'text-muted-foreground bg-muted/50 border-border/40';
};
