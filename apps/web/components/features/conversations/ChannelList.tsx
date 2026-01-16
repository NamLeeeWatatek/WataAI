import { Badge } from '@/components/ui/Badge';
import { LoadingLogo } from '@/components/shared/LoadingLogo';
import { cn } from '@/lib/utils';
import { Inbox, Hash, MessageSquare, Facebook, Instagram, Phone, Send, Mail, MessageCircle } from 'lucide-react';
import { JSX } from 'react';

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

const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
        facebook: <Facebook className="w-4.5 h-4.5" />,
        messenger: <MessageCircle className="w-4.5 h-4.5" />,
        instagram: <Instagram className="w-4.5 h-4.5" />,
        whatsapp: <Phone className="w-4.5 h-4.5" />,
        telegram: <Send className="w-4.5 h-4.5" />,
        email: <Mail className="w-4.5 h-4.5" />,
        webchat: <MessageCircle className="w-4.5 h-4.5" />,
    };
    return icons[type] || <MessageSquare className="w-4.5 h-4.5" />;
};

const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
        facebook: 'text-blue-500',
        messenger: 'text-blue-500',
        instagram: 'text-pink-500',
        whatsapp: 'text-green-500',
        telegram: 'text-sky-500',
        email: 'text-red-500',
        webchat: 'text-cyan-500',
    };
    return colors[type] || 'text-gray-500';
};

export function ChannelList({
    channels,
    selectedChannel,
    onSelect,
    totalUnread,
    loading
}: ChannelListProps) {
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
                    <span className="font-bold text-sm tracking-tight">All Messages</span>
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
                    <p className="text-sm font-medium text-foreground mb-1">No channels yet</p>
                    <p className="text-xs text-muted-foreground">Connect a channel to get started</p>
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
                                    {channel.icon || getChannelIcon(channel.type)}
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
