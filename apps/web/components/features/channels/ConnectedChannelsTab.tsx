"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import {
  Grid,
  List,
  Search,
  CheckCircle2,
  Settings,
  Trash2,
  Facebook,
  MessageCircle,
  Instagram,
  Phone,
  Mail,
  Youtube,
  Twitter,
  Linkedin,
  Music,
  Hash,
  MessageSquare,
  Smartphone,
  Globe,
  ShoppingCart,
  Target,
  Cloud,
  Send,
  Book,
  BarChart,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils/date';

interface Channel {
  id: string;
  name: string;
  type: string;
  status: string;
  metadata?: any;
  createdAt: string;
}

interface ConnectedChannelsTabProps {
  channels: Channel[];
  searchQuery: string;
  viewMode: 'grid' | 'list';
  currentPage: number;
  pageSize: number;
  totalCount: number;
  selectedIds: string[];
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onAssignBot: (channel: Channel) => void;
  onDisconnect: (id: string) => void;
  onLoadData: () => void;
  isLoading?: boolean;
}

export function ConnectedChannelsTab({
  channels,
  searchQuery,
  viewMode,
  currentPage,
  pageSize,
  totalCount,
  selectedIds,
  onSearchChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onToggleSelection,
  onClearSelection,
  onAssignBot,
  onDisconnect,
  onLoadData,
  isLoading = false
}: ConnectedChannelsTabProps) {
  const getIcon = (type: string) => {
    const icons: Record<string, JSX.Element> = {
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
      'viber': <Phone className="w-5 h-5" />,
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
    return icons[type] || <Smartphone className="w-5 h-5" />;
  };

  const getColor = (type: string) => {
    const colors: Record<string, string> = {
      'facebook': 'text-blue-600 bg-blue-500/10 border-blue-500/20',
      'messenger': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'instagram': 'text-pink-500 bg-pink-500/10 border-pink-500/20',
      'whatsapp': 'text-green-500 bg-green-500/10 border-green-500/20',
      'telegram': 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      'youtube': 'text-red-500 bg-red-500/10 border-red-500/20',
      'twitter': 'text-sky-400 bg-sky-400/10 border-sky-400/20',
      'linkedin': 'text-blue-700 bg-blue-700/10 border-blue-700/20',
      'tiktok': 'text-black bg-black/10 border-black/20',
      'discord': 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      'slack': 'text-purple-600 bg-purple-600/10 border-purple-600/20',
      'zalo': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'line': 'text-green-500 bg-green-500/10 border-green-500/20',
      'viber': 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      'wechat': 'text-green-600 bg-green-600/10 border-green-600/20',
      'sms': 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      'email': 'text-red-500 bg-red-500/10 border-red-500/20',
      'webchat': 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
      'shopify': 'text-green-600 bg-green-600/10 border-green-600/20',
      'google': 'text-red-500 bg-red-500/10 border-red-500/20',
      'hubspot': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'salesforce': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'mailchimp': 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
      'intercom': 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      'zapier': 'text-orange-500 bg-orange-500/10 border-orange-500/20',
      'notion': 'text-gray-800 bg-gray-800/10 border-gray-800/20',
      'airtable': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    };
    return colors[type] || 'text-gray-600 bg-gray-600/10 border-gray-600/20';
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    channel.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedChannels = filteredChannels.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-xl py-4 border-b border-border/10">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search connected channels..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            rounded="xl"
            className="pl-10 h-11 bg-muted/20 focus:bg-background/50 border-border/40 shadow-sm"
          />
        </div>

        <div className="bg-muted/10 p-1 rounded-xl flex shadow-sm border border-white/5 backdrop-blur-md">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-muted/5">
          <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
          <p className="text-muted-foreground mb-8 mx-auto max-w-lg">
            Configure your first integration to start connecting channels and automating your workflow
          </p>
          <Button onClick={onLoadData} size="lg" className="rounded-xl font-bold px-8">
            Go to Configurations
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedChannels.map((channel) => {
                const sameTypeCount = channels.filter(c => c.type === channel.type).length;

                return (
                  <Card key={channel.id} variant="glass" rounded="xl" className="group relative overflow-hidden h-full flex flex-col hover:shadow-2xl transition-all duration-500 border-white/5 hover:-translate-y-1">
                    <div className={cn("h-1.5 w-full bg-gradient-to-r", channel.status === 'connected' ? "from-success/80 to-success/20" : "from-destructive/80 to-destructive/20")} />
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 pt-6">
                      <div className={cn("p-4 rounded-xl shadow-inner transform group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500", getColor(channel.type))}>
                        {getIcon(channel.type)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" rounded="lg" className="text-success border-success/30 bg-success/10 gap-1 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </Badge>
                        {channel.metadata?.botId && (
                          <Badge variant="secondary" rounded="lg" className="gap-1 text-[10px] bg-primary/10 text-primary border-primary/20 font-bold">
                            <Settings className="w-3 h-3" /> Linked
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 pb-6">
                      <CardTitle className="text-xl font-black mb-1 line-clamp-1 group-hover:text-primary transition-colors">{channel.name}</CardTitle>
                      <CardDescription className="capitalize font-bold text-xs tracking-widest opacity-70">
                        {channel.type} Proxy
                      </CardDescription>
                      {sameTypeCount > 1 && (
                        <p className="text-[10px] font-black text-muted-foreground uppercase mt-3 tracking-wider opacity-60">
                          Account {channels.findIndex(c => c.id === channel.id) % sameTypeCount + 1} of {sameTypeCount}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="grid grid-cols-2 gap-3 border-t border-white/5 bg-muted/5 p-4 mt-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        rounded="lg"
                        onClick={() => onAssignBot(channel)}
                        className="text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary border border-white/5 bg-background/50 shadow-sm"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        rounded="lg"
                        onClick={() => onDisconnect(channel.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 hover:text-destructive border border-white/5 bg-background/50 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Sever
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl overflow-hidden border border-border/40 shadow-xl">
              <DataTable
                data={paginatedChannels}
                columns={[
                  {
                    key: 'name',
                    label: 'Channel Name',
                    render: (value, row) => (
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getColor(row.type)}`}>
                          {getIcon(row.type)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{value}</div>
                          <div className="text-xs text-muted-foreground capitalize">{row.type}</div>
                        </div>
                      </div>
                    )
                  },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (_, row) => (
                      <Badge variant="outline" rounded="lg" className="text-success border-success/30 bg-success/10 gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </Badge>
                    )
                  },
                  {
                    key: 'bot',
                    label: 'Assigned Bot',
                    render: (_, row) => row.metadata?.botId ? (
                      <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-600">Bot Assigned</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">None</span>
                    )
                  },
                  {
                    key: 'createdAt',
                    label: 'Connected',
                    render: (value) => <span className="text-xs font-medium text-muted-foreground">{formatDate(value)}</span>
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: (_, row) => (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          rounded="lg"
                          onClick={() => onAssignBot(row)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          rounded="lg"
                          onClick={() => onDisconnect(row.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                searchable={false}
                className="border-none"
                tableClassName="border-none shadow-none bg-transparent"
              />
            </div>
          )}

          {/* Unified Pagination */}
          {filteredChannels.length > pageSize && (
            <div className="pt-8 border-t border-border/40 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground">{Math.min(currentPage * pageSize, filteredChannels.length)}</span> of <span className="text-foreground">{filteredChannels.length}</span> channels
              </p>
              <Pagination
                pagination={{
                  page: currentPage,
                  limit: pageSize,
                  total: filteredChannels.length,
                  hasNextPage: currentPage * pageSize < filteredChannels.length,
                  totalPages: Math.ceil(filteredChannels.length / pageSize)
                }}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
