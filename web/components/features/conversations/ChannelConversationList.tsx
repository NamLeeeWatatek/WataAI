'use client';


import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import React, { JSX } from 'react';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ChatListSkeleton } from '@/components/shared/Skeletons';
import { getChannelIcon, getChannelColor } from '@/lib/constants/channels';

export interface ChannelConversation {
  id: string;
  externalId: string;
  channelId: string;
  channelType: string;
  channelName: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'pending' | 'closed';
  assignedTo?: string;
  metadata?: any;
}

interface ChannelConversationListProps {
  conversations: ChannelConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading?: boolean;
}

const formatRelativeTime = (dateString: string, t: any, i18n: any): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return t('conversations.date.recently', { defaultValue: 'Recently' });
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return t('conversations.date.justNow', { defaultValue: 'Just now' });
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return t('conversations.date.recently', { defaultValue: 'Recently' });
  }
};

export function ChannelConversationList({
  conversations,
  selectedId,
  onSelect,
  loading = false
}: ChannelConversationListProps) {
  const { t, i18n } = useTranslation();
  if (loading) {
    return <ChatListSkeleton count={10} />;
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-base mb-2" suppressHydrationWarning>{t('conversations.noConversations', { defaultValue: 'No conversations yet' })}</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed" suppressHydrationWarning>
          {t('conversations.noConversationsDesc', { defaultValue: 'Conversations from your channels will appear here' })}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            'w-full px-4 py-3 text-left transition-all duration-200 relative group',
            'hover:bg-muted/60',
            selectedId === conv.id && 'bg-primary/5 border-l-2 border-primary'
          )}
        >
          <div className="flex gap-3 items-start">
            {/* Avatar with channel badge */}
            <div className="relative shrink-0">
              <Avatar className="h-11 w-11 ring-1 ring-border">
                <AvatarImage src={conv.customerAvatar} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {(conv.customerName || t('conversations.unknown', { defaultValue: 'User' })).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Channel icon badge */}
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-background border border-background shadow-sm',
                getChannelColor(conv.channelType)
              )}>
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  {getChannelIcon(conv.channelType, "w-3.5 h-3.5")}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className={cn(
                  "font-semibold text-[15px] truncate",
                  conv.unreadCount > 0 ? 'text-foreground' : 'text-foreground/90'
                )}>
                  {conv.customerName}
                </h3>
                <span className="text-xs text-muted-foreground shrink-0" suppressHydrationWarning>
                  {formatRelativeTime(conv.lastMessageAt, t, i18n)}
                </span>
              </div>

              {/* Badge row */}
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium">
                  {conv.channelName}
                </Badge>
              </div>

              {/* Message preview */}
              <div className="flex items-center justify-between gap-2">
                <p className={cn(
                  "text-[13px] truncate leading-tight",
                  conv.unreadCount > 0
                    ? 'text-foreground/80 font-medium'
                    : 'text-muted-foreground'
                )}>
                  {conv.lastMessage}
                </p>

                {/* Unread badge */}
                {conv.unreadCount > 0 && (
                  <Badge className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[11px] font-semibold shrink-0">
                    {conv.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
