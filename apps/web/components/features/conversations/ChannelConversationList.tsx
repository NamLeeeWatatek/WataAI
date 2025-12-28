'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { MessageSquare, Facebook, Instagram, Mail, MessageCircle } from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';
import { Badge } from '@/components/ui/Badge';

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

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Recently';
    }

    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch {
    return 'Recently';
  }
};

const getChannelIcon = (type: string) => {
  const icons: Record<string, JSX.Element> = {
    facebook: <Facebook className="w-4 h-4" />,
    messenger: <FaFacebookMessenger className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    whatsapp: <FaWhatsapp className="w-4 h-4" />,
    telegram: <FaTelegram className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    webchat: <MessageCircle className="w-4 h-4" />,
  };
  return icons[type] || <MessageSquare className="w-4 h-4" />;
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

export function ChannelConversationList({
  conversations,
  selectedId,
  onSelect,
  loading = false
}: ChannelConversationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <MessageSquare className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-base mb-2">No conversations yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Conversations from your channels will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {conversations.map((conv, index) => (
        <motion.button
          key={conv.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.02, 0.2) }}
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
                <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-sm font-semibold">
                  {(conv.customerName || 'User').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Channel icon badge */}
              <div className={cn(
                'absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-background border border-background shadow-sm',
                getChannelColor(conv.channelType)
              )}>
                <div className="w-3 h-3 flex items-center justify-center">
                  {getChannelIcon(conv.channelType)}
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
                <span className="text-xs text-muted-foreground shrink-0">
                  {formatRelativeTime(conv.lastMessageAt)}
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
        </motion.button>
      ))}
    </div>
  );
}
