'use client';

import { useState, useCallback, useMemo, Suspense, useEffect, JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useDebounce } from '@/lib/hooks/useDebounce';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Inbox,
  Users,
  RefreshCw,
  Bell,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Search } from '@/components/shared/Search';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

import { ChatListSkeleton } from '@/components/shared/Skeletons';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChannelConversation, ChannelConversationList } from '@/components/features/conversations/ChannelConversationList';
import { ChannelList, Channel } from '@/components/features/conversations/ChannelList';
import { Badge } from '@/components/ui/Badge';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { getBotConversations } from '@/lib/api/conversations';
import { useBotConversations, useBotConversation, botConversationKeys } from '@/lib/hooks/features/useBotConversations';
import { useChannels } from '@/lib/hooks/features/useChannels';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { MessageRole } from '@/lib/types/conversations';
import type { SocketConversation, SocketMessage } from '@/lib/types/socket';
import { getChannelIcon, getChannelColor, getChannelBgColor } from '@/lib/constants/channels';
import { useNotificationPreferences } from '@/lib/hooks/use-notification-preferences';

type Conversation = ChannelConversation;

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

const mapConversation = (conv: Record<string, unknown>, t: any): Conversation => {
  let lastMessage = t('conversations.noMessages', { defaultValue: 'No messages yet' });

  if (typeof conv.lastMessage === 'string') {
    lastMessage = conv.lastMessage;
  } else if (typeof conv.last_message === 'string') {
    lastMessage = conv.last_message;
  } else if (isRecord(conv.metadata) && typeof conv.metadata.lastMessage === 'string') {
    lastMessage = conv.metadata.lastMessage;
  } else if (Array.isArray(conv.messages) && conv.messages.length > 0) {
    const lastMsg = conv.messages[conv.messages.length - 1];
    if (isRecord(lastMsg)) {
      lastMessage = String(lastMsg.content || lastMsg.text || t('conversations.noMessages', { defaultValue: 'No messages yet' }));
    }
  }

  let lastMessageAt = new Date().toISOString();
  const rawDate = conv.lastMessageAt || conv.last_message_at || conv.updatedAt || conv.updated_at || conv.createdAt || conv.created_at;
  if (typeof rawDate === 'string' || typeof rawDate === 'number') {
    try {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        lastMessageAt = parsedDate.toISOString();
      }
    } catch {
      // Keep default
    }
  }

  const getString = (val: unknown): string => typeof val === 'string' ? val : '';
  const getNumber = (val: unknown): number => typeof val === 'number' ? val : 0;

  return {
    id: getString(conv.id),
    externalId: getString(conv.externalId || conv.external_id),
    channelId: getString(conv.channelId || conv.channel_id),
    channelType: getString(conv.channelType || conv.channel_type || 'web'),
    channelName: getString(conv.channelName || conv.channel_name || conv.channelType || t('conversations.unknown', { defaultValue: 'Unknown' })),
    customerName: getString(conv.customerName || conv.contactName || conv.contact_name || t('conversations.unknown', { defaultValue: 'Unknown' })),
    customerAvatar: getString(conv.customerAvatar || conv.contactAvatar || conv.contact_avatar),
    lastMessage,
    lastMessageAt,
    unreadCount: getNumber(conv.unreadCount || conv.unread_count),
    status: (['open', 'closed', 'pending'] as const).includes(conv.status as any) ? (conv.status as 'open' | 'closed' | 'pending') : 'open',
    assignedTo: getString(conv.assignedTo || conv.assigned_to),
    metadata: isRecord(conv.metadata) ? conv.metadata : {},
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<ChatListSkeleton />}>
      <ConversationsPageContent />
    </Suspense>
  );
}

function ConversationsPageContent() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const { syncConversations, isSyncing: syncing } = useBotConversations();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { showNotification, playSound, permission } = useNotifications();
  const notificationPrefs = useNotificationPreferences();

  const selectedId = selectedConversationId;

  const { currentWorkspace } = useWorkspace();

  const { channels: rawChannels, isLoading: channelsLoading } = useChannels(currentWorkspace?.id);

  const channels: Channel[] = useMemo(() => {
    return (rawChannels || []).map((channel) => ({
      id: channel.id,
      name: channel.name || (channel as any).channelName || 'Unknown',
      type: channel.type || (channel as any).channelType || 'unknown',
      icon: getChannelIcon(channel.type || (channel as any).channelType || 'unknown'),
      color: getChannelColor(channel.type || (channel as any).channelType || 'unknown'),
      unreadCount: 0,
    }));
  }, [rawChannels]);

  const conversationsParams = useMemo(() => ({
    source: 'channel' as const,
    channelId: selectedChannel !== 'all' ? selectedChannel : undefined,
    channelType: selectedChannel !== 'all' ? channels.find((c: any) => c.id === selectedChannel)?.type : undefined,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter === 'active' ? 'active' : statusFilter) as any : undefined,
    page: currentPage,
    limit: pageSize,
  }), [selectedChannel, channels, debouncedSearch, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedChannel, statusFilter]);

  const conversationsQueryKey = useMemo(() => botConversationKeys.list(conversationsParams), [conversationsParams]);

  const {
    data: infiniteData,
    isLoading: conversationsLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch: refetchConversations,
  } = useInfiniteQuery({
    queryKey: ['infinite-conversations', conversationsParams],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const data: any = await getBotConversations({
        ...conversationsParams,
        page: pageParam as number,
      });

      let items = [];
      let total = 0;

      if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data?.items) {
        items = data.items;
        total = data.total || data.items.length;
      } else if (data?.data) {
        items = data.data;
        total = data.total || data.data.length;
      }

      return { items: items.map((conv: any) => mapConversation(conv, t)), total };
    },
    getNextPageParam: (lastPage: any, allPages: any[]) => {
      const currentTotal = allPages.reduce((acc, p) => acc + p.items.length, 0);
      if (currentTotal < lastPage.total) {
        return allPages.length + 1;
      }
      return undefined;
    },
    enabled: !!currentWorkspace?.id,
  });

  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const conversations = useMemo(() => {
    return infiniteData?.pages.flatMap(page => page.items) || [];
  }, [infiniteData]);

  const refreshing = false;

  const handleConversationUpdate = useCallback((updatedConversation: SocketConversation) => {
    queryClient.setQueryData<{ items: Conversation[]; total: number }>(conversationsQueryKey, (oldData: any) => {
      const prev = oldData?.items || [];
      const exists = prev.find((c: Conversation) => c.id === updatedConversation.id);

      const mappedUpdated = mapConversation(updatedConversation as unknown as Record<string, unknown>, t);
      let newData: Conversation[];

      if (exists) {
        newData = prev.map((c: Conversation) =>
          c.id === updatedConversation.id
            ? { ...c, ...mappedUpdated, lastMessageAt: updatedConversation.updatedAt || c.lastMessageAt }
            : c
        );
      } else {
        newData = [mappedUpdated, ...prev];
      }

      const sortedData = newData.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      return { ...oldData, items: sortedData, total: oldData?.total || sortedData.length };
    });

    const isCurrentlyViewing = selectedId === updatedConversation.id;
    const isWindowFocused = typeof document !== 'undefined' && document.hasFocus();

    if (notificationPrefs.doNotDisturb) return;
    if (notificationPrefs.onlyWhenInactive && isWindowFocused) return;

    if (!isCurrentlyViewing) {
      const newMessage = mapConversation(updatedConversation as unknown as Record<string, unknown>, t);
      if (newMessage.lastMessage && newMessage.lastMessage !== t('conversations.noMessages', { defaultValue: 'No messages yet' })) {
        const customerName = newMessage.customerName || t('conversations.unknown', { defaultValue: 'Customer' });
        const messagePreview = notificationPrefs.messagePreview
          ? (newMessage.lastMessage.length > 50
            ? newMessage.lastMessage.substring(0, 50) + '...'
            : newMessage.lastMessage)
          : t('conversations.newMessageReceived', { defaultValue: 'New message received' });

        if (notificationPrefs.sound) playSound('message');

        if (notificationPrefs.desktop && permission === 'granted') {
          showNotification({
            title: `💬 ${customerName}`,
            body: messagePreview,
            icon: newMessage.customerAvatar || '/logo.png',
            tag: `conversation-${newMessage.id}`,
            data: { conversationId: newMessage.id },
          });
        } else {
          toast(`💬 ${customerName}`, {
            description: messagePreview,
            duration: 4000,
          });
        }
      }
    }
  }, [selectedId, notificationPrefs, permission, showNotification, playSound, queryClient, conversationsQueryKey, t]);

  const handleNewMessage = useCallback((message: SocketMessage) => {
    queryClient.setQueryData<{ items: Conversation[]; total: number }>(conversationsQueryKey, (oldData: any) => {
      const prev = oldData?.items || [];
      const conversationId = message.conversationId;
      const conversation = prev.find((c: Conversation) => c.id === conversationId);

      if (conversation) {
        const updated = [
          {
            ...conversation,
            lastMessage: String(message.content || ''),
            lastMessageAt: String(message.sentAt || message.createdAt || new Date().toISOString()),
            unreadCount: (conversation.unreadCount || 0) + 1,
          },
          ...prev.filter((c: Conversation) => c.id !== conversationId),
        ];
        const sorted = updated.sort((a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        return { ...oldData, items: sorted };
      }
      return oldData;
    });
  }, [queryClient, conversationsQueryKey]);

  const { isConnected } = useConversationsSocket({
    onConversationUpdate: handleConversationUpdate,
    onNewMessage: handleNewMessage,
    enabled: true,
  });

  const handleSync = async () => {
    if (selectedChannel === 'all') {
      toast.error(t('conversations.selectChannelToSync', { defaultValue: 'Please select a specific channel to sync' }));
      return;
    }

    const channel = channels.find(c => c.id === selectedChannel);
    if (!channel || (channel.type !== 'facebook' && channel.type !== 'instagram')) {
      toast.error(t('conversations.selectSyncableChannel', { defaultValue: 'Please select a syncable channel (Facebook or Instagram)' }));
      return;
    }

    try {
      await syncConversations({
        channelId: channel.id,
        channelType: channel.type,
        syncParams: {
          conversationLimit: 25,
          messageLimit: 50,
        }
      });
      await refetchConversations();
    } catch (error: any) {
    }
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const channelsWithCounts = useMemo(() =>
    channels.map((channel: any) => ({
      ...channel,
      unreadCount: conversations.filter(
        (conv: ChannelConversation) => conv.channelType === channel.type && conv.unreadCount > 0
      ).length,
    })),
    [channels, conversations]
  );

  const totalUnread = useMemo(() =>
    conversations.filter((conv: Conversation) => conv.unreadCount > 0).length,
    [conversations]
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <div className="w-72 border-r border-border/50 flex flex-col bg-card/30">
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground" suppressHydrationWarning>{t('conversations.channels', { defaultValue: 'Channels' })}</h2>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>{t('conversations.selectChannel', { defaultValue: 'Select a channel to view messages' })}</p>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <ChannelList
              channels={channelsWithCounts}
              selectedChannel={selectedChannel}
              onSelect={setSelectedChannel}
              totalUnread={totalUnread}
              loading={channelsLoading}
            />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground" suppressHydrationWarning>{t('conversations.totalConversations', { defaultValue: 'Total Conversations' })}</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{conversations.length}</span>
          </div>
        </div>
      </div>

      <div className="w-[420px] border-r border-border/50 flex flex-col bg-background">
        <div className="px-6 py-5 border-b border-border/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight flex items-center gap-2" suppressHydrationWarning>
                  <MessageSquare className="w-5 h-5 text-primary opacity-80" />
                  {selectedChannel === 'all'
                    ? t('conversations.inbox', { defaultValue: 'Inbox' })
                    : channels.find(c => c.id === selectedChannel)?.name || t('conversations.messages', { defaultValue: 'Messages' })}
                </h1>
                <div className="flex items-center gap-1.5 ml-1">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isConnected ? 'bg-success animate-pulse shadow-[0_0_8px_rgba(var(--success),0.4)]' : 'bg-muted-foreground/30'
                    )}
                    title={isConnected ? t('conversations.connected', { defaultValue: 'Connected (Real-time)' }) : t('conversations.disconnected', { defaultValue: 'Disconnected' })}
                    suppressHydrationWarning
                  />
                  {isConnected && (
                    <span className="text-[10px] font-black text-success uppercase tracking-widest opacity-80" suppressHydrationWarning>
                      {t('conversations.live', { defaultValue: 'Live' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/settings?tab=notifications')}
                className="h-9 w-9 rounded-xl hover:bg-muted/80 relative"
                title={t('conversations.notificationSettings', { defaultValue: 'Notification settings' })}
                suppressHydrationWarning
              >
                <Bell className="w-4 h-4" />
                {permission !== 'granted' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-warning rounded-full border border-background" />
                )}
              </Button>

              {selectedChannel !== 'all' && ['facebook', 'instagram'].includes(channels.find(c => c.id === selectedChannel)?.type || '') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  className="h-9 gap-2 rounded-xl border-border/60 hover:bg-muted/80"
                  loading={syncing}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-bold" suppressHydrationWarning>{t('conversations.sync', { defaultValue: 'Sync' })}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetchConversations()}
                className="h-9 w-9 rounded-xl hover:bg-muted/80"
                loading={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="relative group p-0">
            <Search
              placeholder={t('conversations.search', { defaultValue: 'Search conversations...' })}
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              className="w-full"
              loading={conversationsLoading && searchQuery !== debouncedSearch}
              suppressHydrationWarning
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList variant="pills" className="w-full justify-between">
              <TabsTrigger value="active" variant="pills" className="flex-1" suppressHydrationWarning>{t('conversations.active', { defaultValue: 'Active' })}</TabsTrigger>
              <TabsTrigger value="closed" variant="pills" className="flex-1" suppressHydrationWarning>{t('conversations.closed', { defaultValue: 'Closed' })}</TabsTrigger>
              <TabsTrigger value="all" variant="pills" className="flex-1" suppressHydrationWarning>{t('conversations.all', { defaultValue: 'All' })}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="py-0">
              <ChatListSkeleton />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-2" suppressHydrationWarning>{t('conversations.noConversations', { defaultValue: 'No conversations yet' })}</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4" suppressHydrationWarning>
                {selectedChannel === 'all'
                  ? t('conversations.noConversationsDesc', { defaultValue: 'Conversations from your channels will appear here' })
                  : t('conversations.noConversationsFromChannel', { channel: channels.find(c => c.id === selectedChannel)?.name || 'this channel', defaultValue: `No conversations from ${channels.find(c => c.id === selectedChannel)?.name || 'this channel'} yet` })}
              </p>
              {selectedChannel !== 'all' && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span suppressHydrationWarning>{syncing ? t('conversations.syncing', { defaultValue: 'Syncing...' }) : t('conversations.syncNow', { defaultValue: 'Sync Now' })}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <ChannelConversationList
                conversations={conversations}
                selectedId={selectedId}
                onSelect={handleSelectConversation}
              />
              <div ref={loadMoreRef} className="h-12 flex items-center justify-center border-t border-border/10">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2 text-muted-foreground animate-in fade-in duration-300">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-wider" suppressHydrationWarning>{t('conversations.loadingMore', { defaultValue: 'Loading more...' })}</span>
                  </div>
                )}
                {!hasNextPage && conversations.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-bold" suppressHydrationWarning>{t('conversations.endOfList', { defaultValue: 'End of list' })}</span>
                )}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col bg-muted/10">
        {selectedId ? (
          <ConversationChat conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/5">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground" suppressHydrationWarning>{t('conversations.selectConversation', { defaultValue: 'Select a conversation' })}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed" suppressHydrationWarning>
                {t('conversations.selectConversationDesc', { defaultValue: 'Choose a conversation from the list to view messages and reply to your customers' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const config = {
    open: {
      icon: Circle,
      label: t('conversations.open', { defaultValue: 'Open' }),
      className: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
    },
    pending: {
      icon: Clock,
      label: t('conversations.pending', { defaultValue: 'Pending' }),
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400'
    },
    closed: {
      icon: CheckCircle2,
      label: t('conversations.closed', { defaultValue: 'Closed' }),
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400'
    },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.open;

  return (
    <Badge variant="outline" className={cn('h-6 px-2.5 gap-1.5 rounded-full', className)}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium" suppressHydrationWarning>{label}</span>
    </Badge>
  );
}

function ConversationChat({
  conversationId
}: {
  conversationId: string;
}) {
  const { t, i18n } = useTranslation();
  const {
    conversation: rawConversation,
    isLoading: loading,
    sendMessage,
    takeoverConversation,
    handbackConversation
  } = useBotConversation(conversationId);

  const conversation = useMemo(() => {
    if (!rawConversation) return undefined;
    const data: any = rawConversation;

    return {
      id: data.id,
      externalId: data.externalId || data.external_id || '',
      channelId: data.channelId || data.channel_id || '',
      channelType: data.channelType || data.channel_type || 'web',
      channelName: data.channelName || data.channel_name || data.channelType || t('conversations.unknown', { defaultValue: 'Unknown' }),
      customerName: data.customerName || data.contactName || data.contact_name || t('conversations.unknown', { defaultValue: 'Unknown' }),
      customerAvatar: data.customerAvatar || data.contactAvatar || data.contact_avatar,
      lastMessage: data.metadata?.lastMessage || t('conversations.noMessages', { defaultValue: 'No messages yet' }),
      lastMessageAt: data.lastMessageAt || data.last_message_at || new Date().toISOString(),
      unreadCount: data.unreadCount || data.unread_count || 0,
      status: data.status === 'active' ? 'open' : data.status || 'open',
      assignedTo: data.assignedTo || data.assigned_to,
      metadata: data.metadata || {},
    };
  }, [rawConversation, t]);

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage({
        content,
        role: MessageRole.ASSISTANT
      });
    } catch (err) {
      throw err;
    }
  };

  const handleTakeover = async () => {
    try {
      await takeoverConversation();
    } catch (error) {
    }
  };

  const handleHandBack = async () => {
    try {
      await handbackConversation();
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-hidden p-6">
        <ChatListSkeleton />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground" suppressHydrationWarning>{t('conversations.notFound', { defaultValue: 'Conversation not found' })}</p>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-border/50 px-6 py-4 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
              <AvatarImage src={conversation.customerAvatar} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 font-semibold">
                {(conversation.customerName || t('conversations.unknown', { defaultValue: 'User' })).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground leading-none">{conversation.customerName}</h3>
                <StatusBadge status={conversation.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-current/20", getChannelColor(conversation.channelType), getChannelBgColor(conversation.channelType))}>
                  {getChannelIcon(conversation.channelType, "w-3 h-3")}
                  <span className="font-bold uppercase tracking-wider text-[9px]">{conversation.channelName}</span>
                </div>
                <span className="opacity-40">•</span>
                <span className="font-medium" suppressHydrationWarning>{formatRelativeTime(conversation.lastMessageAt, t, i18n)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {conversation.status === 'open' ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleTakeover}
                className="h-9 gap-2 shadow-sm"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="text-xs font-bold" suppressHydrationWarning>{t('conversations.takeover', { defaultValue: 'Takeover' })}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleHandBack}
                className="h-9 gap-2 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-xs font-bold" suppressHydrationWarning>{t('conversations.handback', { defaultValue: 'Return to Bot' })}</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ChatInterface
          conversationId={conversation.id}
          onSendMessage={handleSendMessage}
        />
      </div>
    </>
  );
}
