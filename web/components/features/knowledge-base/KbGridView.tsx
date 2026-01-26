"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Pagination, PaginationInfo } from '@/components/shared/Pagination';
import { Folder, MoreVertical, Eye, Download, Edit2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { KbFileIcon } from './KbFileIcon';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';

interface KbItem {
  id: string;
  name: string;
  type: 'folder' | 'document';
  description?: string;
  fileSize?: string | number;
  processingStatus?: string;
  updatedAt: string;
  icon?: string;
}

interface KbGridViewProps {
  items: KbItem[];
  selectedIds: string[];
  draggedItem: { type: string; id: string } | null;
  dragOverFolder: string | null;
  isLoading: boolean;
  onItemClick: (item: KbItem) => void;
  onToggleSelection: (id: string) => void;
  onDragStart: (item: KbItem) => void;
  onDragOver: (folderId: string | null) => void;
  onDrop: (targetFolderId: string | null) => void;
  onEditItem: (item: KbItem) => void;
  onDeleteItem: (item: KbItem) => void;
  onPreviewDocument?: (documentId: string) => void;
  onDownloadDocument?: (documentId: string, filename: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function KbGridView({
  items,
  selectedIds,
  draggedItem,
  dragOverFolder,
  isLoading,
  onItemClick,
  onToggleSelection,
  onDragStart,
  onDragOver,
  onDrop,
  onEditItem,
  onDeleteItem,
  onPreviewDocument,
  onDownloadDocument,
  onToggleSelectAll,
  pagination,
  onPageChange,
  onPageSizeChange
}: KbGridViewProps) {
  const { t } = useTranslation();
  const formatSize = (bytes: string | number) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size) || size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    const statusInfo = {
      completed: { color: 'bg-emerald-500', shadow: 'shadow-emerald-500/40' },
      processing: { color: 'bg-blue-500', shadow: 'shadow-blue-500/40', animate: 'animate-pulse' },
      failed: { color: 'bg-rose-500', shadow: 'shadow-rose-500/40' }
    }
    const info = statusInfo[status as keyof typeof statusInfo] as { color: string; shadow: string; animate?: string } | undefined || { color: 'bg-muted-foreground/30', shadow: '' };

    return (
      <div className={cn(
        "w-2 h-2 rounded-full",
        info.color,
        info.shadow,
        info.animate
      )} />
    )
  };



  if (isLoading) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex justify-end px-1">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-5 flex flex-col items-center text-center bg-muted/5 border border-border/50">
              <Skeleton className="w-20 h-20 rounded-2xl mb-5" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex items-center justify-between w-full mt-4">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="py-20 text-center flex flex-col items-center border-2 border-dashed border-border/30 bg-muted/5">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
          <Folder className="w-10 h-10 text-primary opacity-40" />
        </div>
        <h3 className="text-xl font-bold">{t('kb_config.empty_collection')}</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">{t('kb_config.empty_desc')}</p>
      </Card>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex justify-end px-1">
        <label className="flex items-center gap-2 cursor-pointer group select-none">
          <Checkbox
            checked={items.length > 0 && items.every(item => selectedIds.includes(item.id))}
            onCheckedChange={(checked) => {
              onToggleSelectAll?.(!!checked);
            }}
            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-wider">{t('kb_config.select_all')}</span>
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {items.map((item) => (
          <Card
            key={item.id}
            draggable
            onDragStart={() => onDragStart(item)}
            onDragOver={(e) => {
              e.preventDefault();
              if (item.type === 'folder') onDragOver(item.id);
            }}
            onDragLeave={() => onDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              if (item.type === 'folder') onDrop(item.id);
            }}
            className={cn(
              "group p-5 cursor-pointer transition-all duration-500 relative overflow-hidden flex flex-col items-center text-center",
              "bg-card/40 backdrop-blur-md border border-border/50 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2",
              selectedIds.includes(item.id) && "ring-2 ring-primary border-primary bg-primary/5",
              dragOverFolder === item.id && "ring-2 ring-primary bg-primary/10 scale-105"
            )}
            onClick={() => onItemClick(item)}
          >
            <div className={cn(
              "absolute top-4 right-4 z-20 transition-all duration-300",
              selectedIds.includes(item.id) ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100"
            )}>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => onToggleSelection(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded-md border-primary/50"
              />
            </div>

            <div className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 shadow-premium border border-white/5",
              "group-hover:scale-110 group-hover:rotate-2",
              item.type === 'folder'
                ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}>
              <KbFileIcon name={item.name} type={item.type} className="w-8 h-8" />
            </div>

            <h3 className="font-bold text-sm truncate w-full px-2 group-hover:text-primary transition-colors leading-relaxed">
              {item.name}
            </h3>

            <div className="flex items-center justify-between w-full mt-4">
              <div className="flex items-center gap-1.5 min-w-0">
                {item.processingStatus && getStatusIcon(item.processingStatus)}
                <Badge
                  variant="secondary"
                  className="text-[9px] px-2 py-0 font-bold bg-primary/5 text-primary border-primary/10 tracking-widest uppercase truncate"
                >
                  {item.type === 'folder' ? t('kb_config.folder') : item.fileSize ? formatSize(item.fileSize) : t('kb_config.doc')}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-primary/10 hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-premium border-border/50 bg-card/95 backdrop-blur-xl">
                  {item.type === 'document' && onPreviewDocument && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewDocument(item.id);
                        }}
                        className="rounded-lg font-bold cursor-pointer p-3"
                      >
                        <Eye className="w-4 h-4 mr-2 text-primary" />
                        {t('kb_config.preview')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadDocument?.(item.id, item.name);
                        }}
                        className="rounded-lg font-bold cursor-pointer p-3"
                      >
                        <Download className="w-4 h-4 mr-2 text-primary" />
                        {t('kb_config.download')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditItem(item);
                    }}
                    className="rounded-lg font-bold cursor-pointer p-3"
                  >
                    <Edit2 className="w-4 h-4 mr-2 text-primary" />
                    {t('kb_config.edit_properties')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item);
                    }}
                    className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 font-bold cursor-pointer p-3"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('kb_config.delete_item')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Premium accent */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:blur-sm" />
          </Card>
        ))}
      </div>
      {pagination && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
