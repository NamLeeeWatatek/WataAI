"use client";

import React from 'react';
import { DataTable } from '@/components/shared/DataTable';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edit2, Trash2, Eye, Download, MoreVertical, RotateCcw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { KbFileIcon } from './KbFileIcon';
import type { SortDirection } from '@/components/shared/DataTable';
import type { PaginationInfo } from '@/components/shared/Pagination';
import { ColumnDef } from '@tanstack/react-table';

interface KbItem {
  id: string;
  name: string;
  type: 'folder' | 'document';
  description?: string;
  fileSize?: string | number;
  processingStatus?: string;
  updatedAt: string;
  icon?: string;
  sourceUrl?: string | null;
  content?: string | null;
}

interface KbTableViewProps {
  items: KbItem[];
  pagination?: PaginationInfo;
  selectedIds: string[];
  sortColumn: string;
  sortDirection: SortDirection;
  isLoading: boolean;
  onItemClick?: (item: KbItem) => void;
  onToggleSelection: (id: string) => void;
  onSort: (column: string, direction: SortDirection) => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onEditItem: (item: KbItem) => void;
  onDeleteItem: (item: KbItem) => void;
  onReloadItem?: (item: KbItem) => void;
  onPreviewDocument?: (documentId: string) => void;
  onDownloadDocument?: (documentId: string, filename: string) => void;
  onDragStart?: (item: KbItem) => void;
  onDragOver?: (folderId: string | null) => void;
  onDrop?: (targetFolderId: string | null) => void;
  onToggleSelectAll?: (checked: boolean) => void;
  headerActions?: React.ReactNode;
  actions?: React.ReactNode;
  searchable?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  renderGridItem?: (item: KbItem) => React.ReactNode;
  viewMode?: 'table' | 'grid';
  onViewModeChange?: (mode: 'table' | 'grid') => void;
}

export function KbTableView({
  items,
  pagination,
  selectedIds,
  sortColumn,
  sortDirection,
  isLoading,
  onItemClick,
  onToggleSelection,
  onSort,
  onPageChange,
  onPageSizeChange,
  onEditItem,
  onDeleteItem,
  onReloadItem,
  onPreviewDocument,
  onDownloadDocument,
  onDragStart,
  onDragOver,
  onDrop,
  onToggleSelectAll,
  headerActions,
  actions,
  searchable,
  searchValue,
  onSearch,
  searchPlaceholder,
  renderGridItem,
  viewMode,
  onViewModeChange,
}: KbTableViewProps) {
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
      failed: { color: 'bg-rose-500', shadow: 'shadow-rose-500/40' },
      pending: { color: 'bg-amber-500', shadow: 'shadow-amber-500/40' }
    }
    const info = statusInfo[status as keyof typeof statusInfo] as { color: string; shadow: string; animate?: string } | undefined || { color: 'bg-muted-foreground/30', shadow: '' };

    return (
      <div className={cn(
        "w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
        info.color,
        info.shadow,
        info.animate
      )} />
    )
  };

  const columns = React.useMemo<ColumnDef<KbItem>[]>(() => [
    {
      id: 'selection',
      header: () => (
        <Checkbox
          checked={items.length > 0 && items.every(item => selectedIds.includes(item.id))}
          onCheckedChange={(checked) => onToggleSelectAll?.(!!checked)}
          aria-label="Select all"
          className="translate-y-[2px] border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
      ),
      size: 40,
      cell: ({ row }) => (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.includes(row.original.id)}
            onCheckedChange={() => onToggleSelection(row.original.id)}
            aria-label={`Select ${row.original.name}`}
            className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
      )
    },
    {
      id: 'name',
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row, getValue }) => {
        const isImage = (name: string) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(name);
        const isImageFile = row.original.type === 'document' && isImage(row.original.name);

        return (
          <div className="flex items-center gap-4 py-1 group max-w-md">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm overflow-hidden shrink-0",
              "group-hover:scale-105 group-hover:shadow-md",
              row.original.type === 'folder'
                ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
            )}>
              {isImageFile && row.original.sourceUrl ? (
                <img
                  src={row.original.sourceUrl}
                  alt={row.original.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <KbFileIcon name={row.original.name} type={row.original.type} className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {row.original.sourceUrl ? (
                <a
                  href={row.original.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-sm line-clamp-2 leading-tight hover:text-primary transition-colors hover:underline block break-words whitespace-normal"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${row.original.name} (opens in a new tab)`}
                >
                  {String(getValue())}
                </a>
              ) : (
                <div className="font-bold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors break-words whitespace-normal">{String(getValue())}</div>
              )}
              {row.original.description && <div className="text-[10px] text-muted-foreground line-clamp-2 font-medium mt-0.5 break-words whitespace-normal">{row.original.description}</div>}
            </div>
          </div>
        )
      }
    },
    {
      id: 'type',
      header: 'Type',
      accessorKey: 'type',
      size: 100,
      cell: ({ row }) => (
        <Badge
          variant={row.original.type === 'folder' ? 'outline' : 'secondary'}
          className="font-bold text-[9px] px-2 py-0 border-primary/20 bg-primary/5 text-primary tracking-wider"
        >
          {row.original.type === 'folder' ? 'FOLDER' : 'DOC'}
        </Badge>
      )
    },
    {
      id: 'processingStatus',
      header: 'Status',
      accessorKey: 'processingStatus',
      size: 150,
      cell: ({ row, getValue }) => row.original.type === 'document' ? (
        <div className="flex items-center gap-2">
          {getStatusIcon(String(getValue()))}
          <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{String(getValue())}</span>
        </div>
      ) : <span className="opacity-20">—</span>
    },
    {
      id: 'fileSize',
      header: 'Size',
      accessorKey: 'fileSize',
      size: 100,
      cell: ({ row, getValue }) => row.original.type === 'document' ? (
        <span className="text-xs font-bold text-muted-foreground/70">{formatSize(typeof getValue() === 'number' || typeof getValue() === 'string' ? getValue() as string | number : 0)}</span>
      ) : <span className="opacity-20">—</span>
    },
    {
      id: 'updatedAt',
      header: 'Updated',
      accessorKey: 'updatedAt',
      size: 120,
      cell: ({ getValue }) => <span className="text-xs font-medium text-muted-foreground/60">{new Date(String(getValue())).toLocaleDateString()}</span>
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-1" onClick={e => e.stopPropagation()}>
          {row.original.type === 'document' && onPreviewDocument && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onPreviewDocument(row.original.id);
              }}
              title="Preview & Edit"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {row.original.type === 'document' && onReloadItem && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onReloadItem(row.original);
              }}
              title="Reload/Re-train"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted font-bold transition-all">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-premium border-border/50 bg-card/95 backdrop-blur-xl">
              {row.original.type === 'document' && onDownloadDocument && (
                <>
                  <DropdownMenuItem
                    className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3"
                    onClick={() => onDownloadDocument(row.original.id, row.original.name)}
                  >
                    <Download className="w-4 h-4 text-primary" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                </>
              )}
              <DropdownMenuItem
                className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3"
                onClick={() => onEditItem(row.original)}
              >
                <Edit2 className="w-4 h-4 text-primary" /> Edit Properties
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDeleteItem(row.original)}
              >
                <Trash2 className="w-4 h-4" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ], [items, selectedIds, onToggleSelectAll, onToggleSelection, onPreviewDocument, onDownloadDocument, onEditItem, onDeleteItem, onReloadItem]);

  return (
    <div className="flex-1 min-h-0">
      <DataTable
        data={items}
        columns={columns}
        loading={isLoading}
        searchable={searchable}
        searchValue={searchValue}
        onSearch={onSearch}
        searchPlaceholder={searchPlaceholder}
        headerActions={headerActions}
        actions={actions}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage="This collection is currently empty"
        onRowClick={onItemClick}
        gridClassName="grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 p-6"
        renderGridItem={renderGridItem}
        onRowDragStart={(e, row) => {
          if (onDragStart) onDragStart(row);
        }}
        onRowDragOver={(e, row) => {
          e.preventDefault();
          if (row.type === 'folder' && onDragOver) {
            onDragOver(row.id);
          }
        }}
        onRowDrop={(e, row) => {
          e.preventDefault();
          if (row.type === 'folder' && onDrop) {
            onDrop(row.id);
          }
        }}
      />
    </div>
  );
}
