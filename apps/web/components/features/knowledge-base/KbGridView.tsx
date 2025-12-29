"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Folder, FileText, MoreVertical, Eye, Download, Edit2, Trash2, Database, Video, Music, Image as ImageIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { isImageUrl, isVideoUrl } from '@/lib/utils/media';

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
  onToggleSelectAll
}: KbGridViewProps) {
  const formatSize = (bytes: string | number) => {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    if (isNaN(size) || size === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return Math.round(size / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'processing':
        return <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>;
      case 'failed':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-500 rounded-full"></div>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card variant="flat" rounded="3xl" className="py-20 text-center flex flex-col items-center border-2 border-dashed border-border/40">
        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 ring-8 ring-primary/5">
          <Folder className="w-10 h-10 text-primary opacity-40" />
        </div>
        <h3 className="text-xl font-bold">No assets identified</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">Adjust your filters or initialize new intelligence assets to populate this collection.</p>
      </Card>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex justify-end px-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <Checkbox
            checked={items.length > 0 && items.every(item => selectedIds.includes(item.id))}
            onCheckedChange={(checked) => {
              // Note: KbGridView doesn't have onToggleSelectAll prop yet, adding it to props below
              (onToggleSelectAll as any)?.(!!checked);
            }}
          />
          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">Select All Current</span>
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            draggable
            onDragStart={(e) => {
              onDragStart(item);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (item.type === 'folder') {
                onDragOver(item.id);
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              onDragOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (item.type === 'folder') {
                onDrop(item.id);
              }
            }}
            className={cn(
              "group p-4 cursor-pointer transition-all duration-300 relative overflow-hidden",
              selectedIds.includes(item.id) ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-xl",
              dragOverFolder === item.id && "ring-2 ring-blue-500 bg-blue-500/10",
              item.type === 'folder' && draggedItem && "border-blue-500/50 bg-blue-500/5"
            )}
            variant={selectedIds.includes(item.id) ? "default" : "glass"}
            rounded="2xl"
            onClick={() => onItemClick(item)}
          >
            <div className={cn(
              "absolute top-3 right-3 z-10 transition-opacity",
              selectedIds.includes(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <Checkbox
                checked={selectedIds.includes(item.id)}
                onCheckedChange={() => onToggleSelection(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary/50"
              />
            </div>

            <div className="mt-2 flex flex-col items-center text-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-lg border border-white/5",
                item.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-muted/50 text-muted-foreground"
              )}>
                {item.type === 'folder' ? (
                  <Folder className="w-8 h-8" />
                ) : (
                  (() => {
                    if (isVideoUrl(item.name)) {
                      return <Video className="w-8 h-8" />;
                    }
                    if (isImageUrl(item.name)) {
                      return <ImageIcon className="w-8 h-8" />;
                    }
                    // Check for audio manually as it's not in general media.ts yet
                    const ext = item.name.split('.').pop()?.toLowerCase();
                    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext || '')) {
                      return <Music className="w-8 h-8" />;
                    }
                    return <FileText className="w-8 h-8" />;
                  })()
                )}
              </div>

              <h3 className="font-bold text-sm truncate w-full px-2">{item.name}</h3>

              <div className="flex items-center justify-between w-full mt-2 px-2">
                <div className="flex items-center gap-1">
                  {item.processingStatus && getStatusIcon(item.processingStatus)}
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1 scale-90"
                  >
                    {item.type === 'folder' ? 'Folder' : item.fileSize ? formatSize(item.fileSize) : 'Document'}
                  </Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all rounded-full hover:bg-muted/80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {item.type === 'document' && onPreviewDocument && (
                      <>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onPreviewDocument(item.id);
                          }}
                          className="font-bold cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownloadDocument?.(item.id, item.name);
                          }}
                          className="font-bold cursor-pointer"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditItem(item);
                      }}
                      className="font-bold cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 mr-2 text-primary" />
                      Edit Properties
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item);
                      }}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>
    </div>
  );
}
