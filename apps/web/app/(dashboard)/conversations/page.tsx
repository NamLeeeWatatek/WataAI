'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useConversationsSocket } from '@/lib/hooks/useConversationsSocket';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { useNotificationPreferences } from '@/components/features/notifications/NotificationSettings';
import {
  MessageSquare,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  MoreVertical,
  Archive,
  Trash2,
  Inbox,
  Users,
  User,
  Hash,
  ChevronRight,
  RefreshCw,
  Bell,
  Settings,
  Bot,
  UserPlus,
  Mail,
  Instagram,
  Facebook,
  MessageCircle,
  Send,
  Phone
} from 'lucide-react';
import { FaWhatsapp, FaTelegram, FaFacebookMessenger } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { NotificationSettings } from '@/components/features/notifications/NotificationSettings';
import axiosClient from '@/lib/axios-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ChannelConversation } from '@/components/features/conversations/ChannelConversationList';
import { Badge } from '@/components/ui/Badge';
import { MessageRole } from '@/lib/types/conversations';


type Conversation = ChannelConversation;

interface Channel {
  id: string;
  name: string;
  type: string;
  icon: JSX.Element;
  color: string;
  unreadCount: number;
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

function ConversationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  // ✅ FIX: Use local state instead of URL params for selected conversation
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Enterprise features
  const { showNotification, playSound, permission } = useNotifications();
  const notificationPrefs = useNotificationPreferences();

  const selectedId = selectedConversationId;

  const handleConversationUpdate = useCallback((updatedConversation: any) => {
    setConversations((prev) => {
      const exists = prev.find((c) => c.id === updatedConversation.id);
      const isNewConversation = !exists;
      const hasNewMessage = exists && updatedConversation.lastMessageAt !== exists.lastMessageAt;

      if (exists) {
        return prev.map((c) =>
          c.id === updatedConversation.id
            ? {
              ...c,
              ...mapConversation(updatedConversation),
              lastMessageAt: updatedConversation.lastMessageAt || c.lastMessageAt,
            }
            : c
        ).sort((a, b) =>
          new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
      } else {
        return [mapConversation(updatedConversation), ...prev];
      }
    });

    // 🏢 ENTERPRISE NOTIFICATIONS - Slack/Teams/Intercom style
    const isCurrentlyViewing = selectedId === updatedConversation.id;
    const isWindowFocused = typeof document !== 'undefined' && document.hasFocus();

    // Respect notification preferences
    if (notificationPrefs.doNotDisturb) return;
    if (notificationPrefs.onlyWhenInactive && isWindowFocused) return;

    if (!isCurrentlyViewing) {
      const newMessage = mapConversation(updatedConversation);

      // Only notify for new messages from customers
      if (newMessage.lastMessage && newMessage.lastMessage !== 'No messages yet') {
        const customerName = newMessage.customerName || 'Customer';
        const messagePreview = notificationPrefs.messagePreview
          ? (newMessage.lastMessage.length > 50
            ? newMessage.lastMessage.substring(0, 50) + '...'
            : newMessage.lastMessage)
          : 'New message received';

        // Play sound notification (if enabled)
        if (notificationPrefs.sound) {
          playSound('message');
        }

        // Desktop notification (if enabled and granted)
        if (notificationPrefs.desktop && permission === 'granted') {
          showNotification({
            title: `💬 ${customerName}`,
            body: messagePreview,
            icon: newMessage.customerAvatar || '/logo.png',
            tag: `conversation-${newMessage.id}`,
            data: { conversationId: newMessage.id },
          });
        } else {
          // Fallback to toast notification
          toast(`💬 ${customerName}`, {
            description: messagePreview,
            duration: 4000,
          });
        }
      }
    }
  }, [selectedId, notificationPrefs, permission, showNotification, playSound]);

  const handleNewMessage = useCallback((message: any) => {

    // Update conversation's last message and move to top
    setConversations((prev) => {
      const conversationId = message.conversationId;
      const conversation = prev.find(c => c.id === conversationId);

      if (!conversation) {
        return prev;
      }

      // Update conversation with new message
      const updated = prev.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            lastMessage: message.content,
            lastMessageAt: message.sentAt || message.createdAt || new Date().toISOString(),
          };
        }
        return c;
      });

      // Sort by lastMessageAt (newest first)
      return updated.sort((a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    });
  }, []);

  const { isConnected } = useConversationsSocket({
    onConversationUpdate: handleConversationUpdate,
    onNewMessage: handleNewMessage,
    enabled: true,
  });

  const loadConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      const params = new URLSearchParams();

      params.set('source', 'channel');

      if (selectedChannel !== 'all') {
        const channel = channels.find(c => c.id === selectedChannel);
        if (channel) {
          params.set('channelId', channel.id);
          params.set('channelType', channel.type);
        }
      }

      const data: any = await axiosClient.get(`/conversations?${params.toString()}`);



      let rawConversations: any[] = [];
      if (Array.isArray(data)) {
        rawConversations = data;
      } else if (data?.items && Array.isArray(data.items)) {
        rawConversations = data.items;
      } else if (data?.conversations && Array.isArray(data.conversations)) {
        rawConversations = data.conversations;
      } else if (data?.data && Array.isArray(data.data)) {
        rawConversations = data.data;
      }

      const mappedConversations = rawConversations.map(mapConversation);


      setConversations(mappedConversations);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to load conversations');
      }
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChannel, channels, statusFilter]);

  const loadChannels = async () => {
    try {
      setChannelsLoading(true);
      const data: any = await axiosClient.get('/channels');

      const mappedChannels: Channel[] = (data?.items || data || []).map((channel: any) => ({
        id: channel.id,
        name: channel.name || channel.channelName || 'Unknown',
        type: channel.type || channel.channelType || 'unknown',
        icon: getChannelIcon(channel.type || channel.channelType || 'unknown'),
        color: getChannelColor(channel.type || channel.channelType || 'unknown'),
        unreadCount: 0,
      }));

      setChannels(mappedChannels);
    } catch (error) {
      toast.error('Failed to load channels');
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  useEffect(() => {
    loadConversations(false);
    const interval = setInterval(() => {
      if (!isConnected) {
        loadConversations(true);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [statusFilter, selectedChannel, isConnected, loadConversations]);

  const handleSync = async () => {
    if (selectedChannel === 'all') {
      toast.error('Please select a specific Facebook channel to sync');
      return;
    }

    const channel = channels.find(c => c.id === selectedChannel);
    if (!channel || channel.type !== 'facebook') {
      toast.error('Please select a Facebook channel to sync');
      return;
    }

    try {
      setSyncing(true);
      toast.info('Syncing conversations from Facebook...');

      const data: any = await axiosClient.post(
        `/channels/facebook/connections/${channel.id}/sync-to-db`,
        {
          conversationLimit: 25,
          messageLimit: 50,
        }
      );

      if (data.success) {
        toast.success(`Synced ${data.synced} conversation(s) from Facebook`);
        // Reload conversations to show synced data
        await loadConversations(false);
      } else {
        toast.error('Failed to sync conversations');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to sync conversations';
      toast.error(errorMessage);
    } finally {
      setSyncing(false);
    }
  };

  const mapConversation = (conv: any): Conversation => {
    // ✅ Try multiple sources for last message
    let lastMessage = 'No messages yet';

    if (conv.lastMessage) {
      lastMessage = conv.lastMessage;
    } else if (conv.last_message) {
      lastMessage = conv.last_message;
    } else if (conv.metadata?.lastMessage) {
      lastMessage = conv.metadata.lastMessage;
    } else if (conv.messages && conv.messages.length > 0) {
      const lastMsg = conv.messages[conv.messages.length - 1];
      lastMessage = lastMsg.content || lastMsg.text || 'No messages yet';
    }


    // ✅ FIX: Ensure valid date
    let lastMessageAt = new Date().toISOString();
    const rawDate = conv.lastMessageAt || conv.last_message_at || conv.updatedAt || conv.updated_at || conv.createdAt || conv.created_at;
    if (rawDate) {
      try {
        const parsedDate = new Date(rawDate);
        if (!isNaN(parsedDate.getTime())) {
          lastMessageAt = parsedDate.toISOString();
        }
      } catch {
        // Keep default
      }
    }

    return {
      id: conv.id,
      externalId: conv.externalId || conv.external_id || '',
      channelId: conv.channelId || conv.channel_id || '',
      channelType: conv.channelType || conv.channel_type || 'web',
      channelName: conv.channelName || conv.channel_name || conv.channelType || 'Unknown',
      customerName: conv.customerName || conv.contactName || conv.contact_name || 'Unknown',
      customerAvatar: conv.customerAvatar || conv.contactAvatar || conv.contact_avatar,
      lastMessage,
      lastMessageAt,
      unreadCount: conv.unreadCount || conv.unread_count || 0,
      status: conv.status === 'active' ? 'open' : conv.status || 'open',
      assignedTo: conv.assignedTo || conv.assigned_to,
      metadata: conv.metadata || {},
    };
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

  const filteredConversations = Array.isArray(conversations)
    ? conversations.filter(conv =>
      conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : [];

  // ✅ FIX: Select conversation without navigation
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const channelsWithCounts = useMemo(() =>
    channels.map(channel => ({
      ...channel,
      unreadCount: conversations.filter(
        conv => conv.channelType === channel.type && conv.unreadCount > 0
      ).length,
    })),
    [channels, conversations]
  );

  const totalUnread = useMemo(() =>
    conversations.filter(conv => conv.unreadCount > 0).length,
    [conversations]
  );

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <div className="w-72 border-r border-border/50 flex flex-col bg-card/30">
        <div className="px-6 py-5 border-b border-border/50">
          <h2 className="text-base font-semibold text-foreground">Channels</h2>
          <p className="text-xs text-muted-foreground mt-1">Select a channel to view messages</p>
        </div>
        <ScrollArea className="flex-1 px-3 py-4">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedChannel('all')}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group',
                selectedChannel === 'all'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/50'
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
                  className="h-6 min-w-[24px] px-2 rounded-full font-bold shadow-sm"
                >
                  {totalUnread}
                </Badge>
              )}
            </button>

            <div className="py-3 px-4">
              <div className="h-px bg-border/50" />
            </div>

            {channelsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingLogo size="sm" />
              </div>
            ) : channelsWithCounts.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Hash className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No channels yet</p>
                <p className="text-xs text-muted-foreground">Connect a channel to get started</p>
              </div>
            ) : (
              channelsWithCounts.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 group',
                    selectedChannel === channel.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/50'
                      : 'hover:bg-muted/60 text-foreground/80 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'p-2.5 rounded-xl transition-colors shrink-0',
                      selectedChannel === channel.id
                        ? 'bg-primary-foreground/20'
                        : 'bg-card border border-border/50 group-hover:bg-muted group-hover:border-border transition-all'
                    )}>
                      <div className={cn(
                        "transition-transform group-hover:scale-110 duration-300",
                        selectedChannel === channel.id ? 'text-primary-foreground' : channel.color
                      )}>
                        {channel.icon}
                      </div>
                    </div>
                    <span className="font-bold text-sm truncate tracking-tight">{channel.name}</span>
                  </div>
                  {channel.unreadCount > 0 && (
                    <Badge
                      variant={selectedChannel === channel.id ? 'secondary' : 'default'}
                      className="h-6 min-w-[24px] px-2 rounded-full shrink-0 ml-2 font-bold shadow-sm"
                    >
                      {channel.unreadCount}
                    </Badge>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>


        <div className="px-6 py-4 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Users className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Total Conversations</span>
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
                <h1 className="text-xl font-black bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent tracking-tight">
                  {selectedChannel === 'all'
                    ? 'Inbox'
                    : channels.find(c => c.id === selectedChannel)?.name || 'Messages'}
                </h1>
                <div className="flex items-center gap-1.5 ml-1">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]',
                      isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    )}
                    title={isConnected ? 'Connected (Real-time)' : 'Disconnected'}
                  />
                  {isConnected && (
                    <span className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest opacity-80">
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotificationSettings(true)}
                className="h-9 w-9 rounded-xl hover:bg-muted/80 relative"
                title="Notification settings"
              >
                <Bell className="w-4 h-4" />
                {permission !== 'granted' && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 rounded-full border border-background" />
                )}
              </Button>

              {selectedChannel !== 'all' && channels.find(c => c.id === selectedChannel)?.type === 'facebook' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  className="h-9 gap-2 rounded-xl border-border/60 hover:bg-muted/80"
                  loading={syncing}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-xs font-bold">Sync</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadConversations(false)}
                className="h-9 w-9 rounded-xl hover:bg-muted/80"
                loading={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/30 border-border/40 rounded-xl focus:bg-background transition-all"
            />
          </div>

          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/30 border border-border/40 rounded-xl p-1">
              <TabsTrigger value="active" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Active</TabsTrigger>
              <TabsTrigger value="closed" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">Closed</TabsTrigger>
              <TabsTrigger value="all" className="text-xs font-bold rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">All</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>


        <ScrollArea className="flex-1">
          {loading ? (
            <div
              className="flex items-center justify-center py-20"
            >
              <LoadingLogo size="md" text="Loading conversations..." />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 px-6 text-center"
            >
              <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-4">
                {selectedChannel === 'all'
                  ? 'Conversations from your channels will appear here'
                  : `No conversations from ${channels.find(c => c.id === selectedChannel)?.name || 'this channel'} yet`}
              </p>
              {selectedChannel !== 'all' && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
              )}
            </div>
          ) : (
            <div
              className="divide-y divide-border/50"
            >
              {filteredConversations.map((conv, index) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    'w-full px-4 py-3 text-left transition-all duration-200 relative group',
                    'hover:bg-muted/60',
                    selectedId === conv.id && 'bg-primary/5 border-l-2 border-primary'
                  )}
                >
                  <div className="flex gap-3 items-start">
                    {/* Avatar with channel badge - Compact */}
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11 ring-1 ring-border">
                        <AvatarImage src={conv.customerAvatar} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-sm font-semibold">
                          {(conv.customerName || 'User').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {/* Channel icon badge - Smaller */}
                      <div className={cn(
                        'absolute -bottom-0.5 -right-0.5 p-1 rounded-full bg-background border border-background shadow-sm',
                        getChannelColor(conv.channelType)
                      )}>
                        <div className="w-3 h-3 flex items-center justify-center">
                          {getChannelIcon(conv.channelType)}
                        </div>
                      </div>
                    </div>

                    {/* Content - Cleaner layout */}
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

                      {/* Badge row - Like image */}
                      <div className="flex items-center gap-2 mb-1.5">
                        {conv.metadata?.tags?.includes('VIP') && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-amber-500/10 text-amber-700 border-amber-500/20">
                            🔒 VIP Lead
                          </Badge>
                        )}
                        {conv.metadata?.tags?.includes('Hot') && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-red-500/10 text-red-700 border-red-500/20">
                            🔥 Hot Lead
                          </Badge>
                        )}
                        {conv.metadata?.tags?.includes('Payment') && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-green-500/10 text-green-700 border-green-500/20">
                            💳 Payments
                          </Badge>
                        )}
                        {!conv.metadata?.tags?.length && (
                          <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium">
                            {conv.channelName}
                          </Badge>
                        )}
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

                        {/* Unread badge - Compact */}
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
          )}
        </ScrollArea>
      </div>


      <div className="flex-1 flex flex-col bg-muted/10">
        {selectedId ? (
          <ConversationChat conversationId={selectedId} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div
              className="text-center max-w-md"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">Select a conversation</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Choose a conversation from the list to view messages and reply to your customers
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    open: {
      icon: Circle,
      label: 'Open',
      className: 'bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400'
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30 dark:text-yellow-400'
    },
    closed: {
      icon: CheckCircle2,
      label: 'Closed',
      className: 'bg-gray-500/10 text-gray-600 border-gray-500/30 dark:text-gray-400'
    },
  };

  const { icon: Icon, label, className } = config[status as keyof typeof config] || config.open;

  return (
    <Badge variant="outline" className={cn('h-6 px-2.5 gap-1.5 rounded-full', className)}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{label}</span>
    </Badge>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;

  return date.toLocaleDateString();
}

function ConversationChat({
  conversationId
}: {
  conversationId: string;
}) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      setLoading(true);
      const data: any = await axiosClient.get(`/conversations/${conversationId}`);

      const mappedConversation = {
        id: data.id,
        externalId: data.externalId || data.external_id || '',
        channelId: data.channelId || data.channel_id || '',
        channelType: data.channelType || data.channel_type || 'web',
        channelName: data.channelName || data.channel_name || data.channelType || 'Unknown',
        customerName: data.customerName || data.contactName || data.contact_name || 'Unknown',
        customerAvatar: data.customerAvatar || data.contactAvatar || data.contact_avatar,
        lastMessage: data.metadata?.lastMessage || 'No messages yet',
        lastMessageAt: data.lastMessageAt || data.last_message_at || new Date().toISOString(),
        unreadCount: data.unreadCount || data.unread_count || 0,
        status: data.status === 'active' ? 'open' : data.status || 'open',
        assignedTo: data.assignedTo || data.assigned_to,
        metadata: data.metadata || {},
      };

      setConversation(mappedConversation);
    } catch (error) {
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      // ✅ FIX: Backend requires 'role' not 'sender'
      await axiosClient.post(`/conversations/${conversationId}/messages`, {
        content,
        role: MessageRole.ASSISTANT // Agent/Bot message
      });
    } catch (err) {
      toast.error('Failed to send message');
      throw err;
    }
  };

  // 🤖 → 👤 Human Handoff: Agent takes over
  const handleTakeover = async () => {
    try {
      await axiosClient.post(`/conversations/${conversationId}/takeover`);
      toast.success('You are now handling this conversation');
      await loadConversation();
    } catch (error) {
      toast.error('Failed to take over conversation');
    }
  };

  // 👤 → 🤖 Hand Back: Return to bot
  const handleHandBack = async () => {
    try {
      await axiosClient.post(`/conversations/${conversationId}/handback`);
      toast.success('Bot will resume auto-reply');
      await loadConversation();
    } catch (error) {
      toast.error('Failed to hand back conversation');
    }
  };

  const getChannelIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
      facebook: <Facebook className="w-5 h-5" />,
      messenger: <FaFacebookMessenger className="w-5 h-5" />,
      instagram: <Instagram className="w-5 h-5" />,
      whatsapp: <FaWhatsapp className="w-5 h-5" />,
      telegram: <FaTelegram className="w-5 h-5" />,
      email: <Mail className="w-5 h-5" />,
      webchat: <MessageCircle className="w-5 h-5" />,
    };
    return icons[type] || <MessageSquare className="w-5 h-5" />;
  };

  const getChannelColor = (type: string) => {
    const colors: Record<string, string> = {
      facebook: 'text-blue-500 bg-blue-500/10',
      messenger: 'text-blue-500 bg-blue-500/10',
      instagram: 'text-pink-500 bg-pink-500/10',
      whatsapp: 'text-green-500 bg-green-500/10',
      telegram: 'text-sky-500 bg-sky-500/10',
      email: 'text-red-500 bg-red-500/10',
      webchat: 'text-cyan-500 bg-cyan-500/10',
    };
    return colors[type] || 'text-gray-500 bg-gray-500/10';
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingLogo size="md" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Conversation not found</p>
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
                {(conversation.customerName || 'User').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="font-semibold text-base text-foreground">{conversation.customerName}</h2>
                <div className={cn('p-1.5 rounded-lg shadow-sm', getChannelColor(conversation.channelType))}>
                  {getChannelIcon(conversation.channelType)}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {conversation.channelName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={conversation.status} />

            {/* 🤖/👤 Human Handoff Indicator */}
            {conversation.metadata?.humanTakeover ? (
              <Badge variant="default" className="gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 h-6 px-2.5">
                <User className="w-3 h-3" />
                <span className="text-xs font-medium">Human Agent</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 h-6 px-2.5">
                <Bot className="w-3 h-3" />
                <span className="text-xs font-medium">AI Assistant</span>
              </Badge>
            )}

            {/* Takeover / Hand Back Buttons */}
            {conversation.metadata?.humanTakeover ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHandBack}
                className="h-8 gap-2 text-xs"
              >
                <Bot className="w-3.5 h-3.5" />
                Hand Back to Bot
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleTakeover}
                className="h-8 gap-2 text-xs bg-gradient-to-r from-primary to-primary/80"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Take Over
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>


      <div className="flex-1 overflow-hidden bg-background">
        {/* Chat Interface - Full Width */}
        <ChatInterface
          conversationId={conversationId}
          customerName={conversation.customerName}
          isChannelConversation={true}
          onSendMessage={handleSendMessage}
          senderRole={MessageRole.ASSISTANT} // ✅ Agent/Bot sending to customer
        />
      </div>
    </>
  );
}

export default function ConversationsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
      <ConversationsPageContent />
    </Suspense>
  );
}
