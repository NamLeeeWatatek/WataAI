import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { LoadingLogo } from '@/components/shared/LoadingLogo';
import { cn } from '@/lib/utils';
import { getChannelIcon, getChannelColor } from '@/lib/constants/channels';
import { Inbox, Hash } from 'lucide-react';
import React, { JSX } from 'react';

export interface Channel {
    id: string;
    name: string;
    type: string;
    icon?: JSX.Element;
    color?: string;
    unreadCount: number;
}

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: string;
    onSelect: (id: string) => void;
    totalUnread: number;
    loading: boolean;
}

export function ChannelList({
    channels,
    selectedChannel,
    onSelect,
    totalUnread,
    loading
}: ChannelListProps) {
    const { t } = useTranslation();
    return (
        <div className="space-y-1">
            <button
                onClick={() => onSelect('all')}
                className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group',
                    selectedChannel === 'all'
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'hover:bg-muted/80 text-foreground/80 hover:text-foreground'
                )}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        'p-2.5 rounded-xl transition-colors',
                        selectedChannel === 'all' ? 'bg-primary-foreground/20' : 'bg-primary/10 group-hover:bg-primary/20'
                    )}>
                        <Inbox className="w-4.5 h-4.5" />
                    </div>
                    <span className="font-bold text-sm tracking-tight" suppressHydrationWarning>{t('conversations.allMessages', { defaultValue: 'All Messages' })}</span>
                </div>
                {totalUnread > 0 && (
                    <Badge
                        variant={selectedChannel === 'all' ? 'secondary' : 'default'}
                        className="h-6 min-w-[24px] px-2 rounded-full font-bold"
                    >
                        {totalUnread}
                    </Badge>
                )}
            </button>

            <div className="py-3 px-4">
                <div className="h-px bg-border/50" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <LoadingLogo size="sm" />
                </div>
            ) : channels.length === 0 ? (
                <div className="px-4 py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                        <Hash className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1" suppressHydrationWarning>{t('conversations.noChannels', { defaultValue: 'No channels yet' })}</p>
                    <p className="text-xs text-muted-foreground" suppressHydrationWarning>{t('conversations.connectChannel', { defaultValue: 'Connect a channel to get started' })}</p>
                </div>
            ) : (
                channels.map((channel) => (
                    <button
                        key={channel.id}
                        onClick={() => onSelect(channel.id)}
                        className={cn(
                            'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group',
                            selectedChannel === channel.id
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
                        )}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                'p-2.5 rounded-xl transition-colors shrink-0',
                                selectedChannel === channel.id
                                    ? 'bg-primary-foreground/20'
                                    : 'bg-card border border-border/40 group-hover:bg-muted group-hover:border-border transition-all'
                            )}>
                                <div className={cn(
                                    "transition-transform group-hover:scale-110 duration-300",
                                    selectedChannel === channel.id ? 'text-primary-foreground' : (channel.color || getChannelColor(channel.type))
                                )}>
                                    {channel.icon || getChannelIcon(channel.type, "w-5.5 h-5.5")}
                                </div>
                            </div>
                            <span className="font-bold text-sm truncate tracking-tight">{channel.name}</span>
                        </div>
                        {channel.unreadCount > 0 && (
                            <Badge
                                variant={selectedChannel === channel.id ? 'secondary' : 'default'}
                                className="h-6 min-w-[24px] px-2 rounded-full shrink-0 ml-2 font-bold"
                            >
                                {channel.unreadCount}
                            </Badge>
                        )}
                    </button>
                ))
            )}
        </div>
    );
}
