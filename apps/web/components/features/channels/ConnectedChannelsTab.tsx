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
import { Search } from '@/components/ui/Search';

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
    return colors[type] || 'text-muted-foreground bg-muted/50 border-border/40';
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
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4 border-b border-border/40">


        <div className="relative flex-1 w-full max-w-sm group">
          <Search
            placeholder="Search connected channels..."
            value={searchQuery}
            onChange={(e: any) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            className="w-full"

          />
        </div>

        <div className="bg-muted p-1 rounded-xl flex border border-border/40">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "p-2 rounded-lg transition-all duration-300",
              viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/40 rounded-3xl bg-muted/10">
          <h3 className="text-xl font-semibold mb-2">No connections yet</h3>
          <p className="text-muted-foreground mb-8 mx-auto max-w-lg">
            Configure your first integration to start connecting channels and automating your workflow
          </p>
          <Button onClick={onLoadData} className="font-bold px-8">
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
                  <Card key={channel.id} className="group h-full flex flex-col">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 pt-6">
                      <div className={cn("p-4 rounded-xl transition-all duration-500", getColor(channel.type))}>
                        {getIcon(channel.type)}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="default" className="font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                        </Badge>
                        {channel.metadata?.botId && (
                          <Badge variant="secondary" className="font-bold">
                            <Settings className="w-3 h-3 mr-1" /> Linked
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
                        variant="outline"
                        size="sm"
                        onClick={() => onAssignBot(channel)}
                        className="text-[10px] font-black uppercase tracking-widest"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDisconnect(channel.id)}
                        className="text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
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
            <Card className="overflow-hidden">
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
                      <Badge variant="default" className="font-bold">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                      </Badge>
                    )
                  },
                  {
                    key: 'bot',
                    label: 'Assigned Bot',
                    render: (_, row) => row.metadata?.botId ? (
                      <Badge variant="secondary">Bot Assigned</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Disconnected</span>
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
                          onClick={() => onAssignBot(row)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
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
            </Card>
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
