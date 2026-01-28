
import React, { JSX } from 'react';
import { Smartphone, MessageSquare } from 'lucide-react';
import {
    FacebookIcon,
    MessengerIcon,
    InstagramIcon,
    WebsiteIcon,
    TikTokIcon
} from '@/components/shared/icons/Logos';

export const CHANNEL_ICONS_CONFIG = {
    'facebook': FacebookIcon,
    'messenger': MessengerIcon,
    'instagram': InstagramIcon,
    'webchat': WebsiteIcon,
    'tiktok': TikTokIcon,
};

export const CHANNEL_COLORS: Record<string, string> = {
    'facebook': 'text-[#1877F2]',
    'messenger': 'text-[#00B2FF]',
    'instagram': 'text-[#E4405F]',
    'webchat': 'text-[#0EA5E9]',
    'tiktok': 'text-foreground',
};

// Removed brand background colors to avoid "double background" effect
export const CHANNEL_BG_COLORS: Record<string, string> = {
    'facebook': 'bg-transparent',
    'messenger': 'bg-transparent',
    'instagram': 'bg-transparent',
    'webchat': 'bg-transparent',
    'tiktok': 'bg-transparent',
};

export const MESSAGING_CHANNELS = [
    { id: 'facebook', name: 'Facebook', description: 'Manage posts and comments on your Facebook Page', category: 'social', multiAccount: true },
    { id: 'instagram', name: 'Instagram', description: 'Manage Instagram DMs, comments and posts', category: 'social', multiAccount: true },
    { id: 'tiktok', name: 'TikTok', description: 'Connect TikTok for Business', category: 'social', multiAccount: true },
    { id: 'webchat', name: 'Website', description: 'Embed chat widget on your website', category: 'messaging', multiAccount: false },
];

export const BUSINESS_INTEGRATIONS: any[] = [];

export const getChannelIcon = (type: string | undefined, className: string = "w-5 h-5"): JSX.Element => {
    if (!type) return <Smartphone className={className} />;
    const IconComponent = CHANNEL_ICONS_CONFIG[type as keyof typeof CHANNEL_ICONS_CONFIG];
    if (IconComponent) return <IconComponent className={className} />;
    return <MessageSquare className={className} />;
};

export const getChannelColor = (type: string | undefined): string => {
    if (!type) return 'text-muted-foreground';
    return CHANNEL_COLORS[type] || 'text-muted-foreground';
};

export const getChannelBgColor = (type: string | undefined): string => {
    return 'bg-secondary/50'; // Minimal consistent background
};

export const getChannelFullStyle = (type: string | undefined): string => {
    // Return a clean container style that doesn't clash with the icon's own color
    return `flex items-center justify-center rounded-xl overflow-hidden`;
};
