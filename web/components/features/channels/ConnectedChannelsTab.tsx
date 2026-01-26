"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { Badge } from '@/components/ui/Badge';
import {
  LayoutGrid,
  List,
  CheckCircle2,
  Settings,
  Trash2,
  MoreVertical,
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getChannelIcon, getChannelColor } from '@/lib/constants/channels';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { formatDate } from '@/lib/utils/date';
import { Search } from '@/components/shared/Search';
import type { Channel } from '@/lib/types/channel';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';

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
  onManagePages: (channel: Channel) => void;
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
  onManagePages,
  onDisconnect,
  onLoadData,
  isLoading = false
}: ConnectedChannelsTabProps) {
  const { t } = useTranslation();




  // Server-side filtered and paginated
  const paginatedChannels = channels;

  const columns = React.useMemo<ColumnDef<Channel>[]>(() => [
    {
      id: 'name',
      header: t('channels_config.channel_name'),
      accessorKey: 'name',
      cell: ({ row, getValue }) => (
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", getChannelColor(row.original.type))}>
            {getChannelIcon(row.original.type)}
          </div>
          <div>
            <div className="font-semibold text-sm">{row.original.metadata?.pageName || (getValue() as React.ReactNode)}</div>
            <div className="text-xs text-muted-foreground capitalize">{row.original.type}</div>
          </div>
        </div>
      )
    },
    {
      id: 'status',
      header: t('channels_config.status'),
      cell: () => (
        <Badge variant="default" className="font-bold">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {t('channels_config.active')}
        </Badge>
      )
    },
    {
      id: 'bot',
      header: t('channels_config.bot_assigned'),
      cell: ({ row }) => row.original.metadata?.botId ? (
        <Badge variant="secondary">{t('channels_config.bot_assigned')}</Badge>
      ) : (
        <span className="text-xs text-muted-foreground">{t('channels_config.unassigned')}</span>
      )
    },
    {
      id: 'createdAt',
      header: t('channels_config.connected'),
      accessorKey: 'createdAt',
      cell: ({ getValue }) => <span className="text-xs font-medium text-muted-foreground">{formatDate(getValue() as string)}</span>
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onManagePages(row.original)}>
                <Settings className="w-3.5 h-3.5 mr-2" />
                {t('channels_config.manage_config')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDisconnect(row.original.id)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                {t('channels_config.disconnect')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [onManagePages, onDisconnect]);

  return (
    <div className="space-y-6">
      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between py-4 border-b border-border/40">
        <div className="relative flex-1 w-full max-w-sm group">
          <Search
            placeholder={t('channels_config.search_placeholder')}
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange("")}
            className="w-full"
          />
        </div>

        <div className="bg-muted/20 p-1 rounded-lg flex items-center gap-1 border border-border/40">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "h-8 w-8 rounded-md transition-all",
              viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('channels_config.grid_view')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('list')}
            className={cn(
              "h-8 w-8 rounded-md transition-all",
              viewMode === 'list' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('channels_config.list_view')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-[240px] border-border/50 bg-muted/5 animate-pulse rounded-2xl">
              <div className="p-6 space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted/20" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 bg-muted/20 rounded" />
                    <div className="h-3 w-1/2 bg-muted/20 rounded" />
                  </div>
                </div>
                <div className="h-20 bg-muted/10 rounded-xl" />
                <div className="h-9 w-full bg-muted/10 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border/40 rounded-3xl bg-muted/10">
          <h3 className="text-xl font-semibold mb-2">{t('channels_config.no_connections')}</h3>
          <p className="text-muted-foreground mb-8 mx-auto max-w-lg">
            {t('channels_config.no_connections_desc')}
          </p>
          <Button onClick={onLoadData} className="font-bold px-8">
            {t('channels_config.go_to_configs')}
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedChannels.map((channel) => {
                const sameTypeCount = channels.filter(c => c.type === channel.type).length;

                return (
                  <Card key={channel.id} className="group h-full flex flex-col border-border/50 hover:border-primary/20 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                      <div className="flex gap-4">
                        <div className={cn("p-2.5 rounded-xl border border-white/5 h-fit", getChannelColor(channel.type))}>
                          {getChannelIcon(channel.type)}
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-base font-bold line-clamp-1">
                            {channel.metadata?.pageName || channel.name}
                          </CardTitle>
                          <CardDescription className="capitalize text-xs font-medium flex items-center gap-2">
                            <span className="text-foreground/80">{channel.metadata?.pageId ? t('channels_config.facebook_page') : t('channels_config.generic_channel', { type: channel.type })}</span>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-green-500">{t('channels_config.active')}</span>
                          </CardDescription>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-2">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onManagePages(channel)}>
                            <Settings className="w-3.5 h-3.5 mr-2" />
                            {t('channels_config.manage_config')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDisconnect(channel.id)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            {t('channels_config.disconnect')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>

                    <CardContent className="flex-1 py-4 space-y-3">
                      {channel.metadata?.botId ? (
                        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                          <span className="text-muted-foreground font-medium">{t('channels_config.bot_assigned')}</span>
                          <Badge variant="outline" className="bg-background text-[10px] font-mono border-primary/20 text-primary">
                            {t('channels_config.active')}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-orange-500/5 border border-orange-500/10">
                          <span className="text-muted-foreground font-medium">{t('channels_config.status')}</span>
                          <Badge variant="outline" className="bg-background text-[10px] font-mono border-orange-500/20 text-orange-500">
                            {t('channels_config.unassigned')}
                          </Badge>
                        </div>
                      )}

                      {sameTypeCount > 1 && (
                        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-muted/40 border border-border/40">
                          <span className="text-muted-foreground font-medium">Account</span>
                          <span className="font-semibold text-foreground">
                            {channel.metadata?.accountName || `Account ${channels.findIndex(c => c.id === channel.id) % sameTypeCount + 1}`}
                          </span>
                        </div>
                      )}
                    </CardContent>

                    <CardFooter className="pt-0">
                      <Button
                        size="sm"
                        className="w-full font-bold shadow-sm"
                        variant="outline"
                        onClick={() => onManagePages(channel)}
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        {t('channels_config.manage_settings')}
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
                columns={columns}
                searchable={false}
                className="border-none"
                tableClassName="border-none shadow-none bg-transparent"
              />
            </Card>
          )}

          {/* Unified Pagination */}
          <div className="pt-8 border-t border-border/40 flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium" dangerouslySetInnerHTML={{
              __html: t('channels_config.showing_channels', {
                count: Math.min(paginatedChannels.length, pageSize),
                total: totalCount
              })
            }} />
            <Pagination
              pagination={{
                page: currentPage,
                limit: pageSize,
                total: totalCount,
                hasNextPage: currentPage * pageSize < totalCount,
                totalPages: Math.ceil(totalCount / pageSize)
              }}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
            />
          </div>
        </>
      )}
    </div>
  );
}
