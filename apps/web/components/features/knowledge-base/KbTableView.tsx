"use client";

import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Edit2, Trash2, Eye, Download, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
import { KbFileIcon } from './KbFileIcon';
import type { SortDirection } from '@/components/ui/DataTable';
import type { PaginationInfo } from '@/components/ui/Pagination';

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
  onPreviewDocument?: (documentId: string) => void;
  onDownloadDocument?: (documentId: string, filename: string) => void;
  onDragStart?: (item: KbItem) => void;
  onDragOver?: (folderId: string) => void;
  onDrop?: (targetFolderId: string) => void;
  onToggleSelectAll?: (checked: boolean) => void;
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
  onPreviewDocument,
  onDownloadDocument,
  onDragStart,
  onDragOver,
  onDrop,
  onToggleSelectAll
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



  const columns = [
    {
      key: 'selection',
      label: (
        <Checkbox
          checked={items.length > 0 && items.every(item => selectedIds.includes(item.id))}
          onCheckedChange={(checked) => onToggleSelectAll?.(!!checked)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      width: 40,
      sortable: false,
      render: (_: any, row: KbItem) => (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.includes(row.id)}
            onCheckedChange={() => onToggleSelection(row.id)}
            aria-label="Select row"
          />
        </div>
      )
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: any, row: KbItem) => (
        <div className="flex items-center gap-4 py-1 group max-w-md">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
            "group-hover:scale-105 group-hover:shadow-md",
            row.type === 'folder'
              ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
              : "bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
          )}>
            {/* <KbFileIcon name={row.name} type={row.type} className="w-5 h-5" /> */}
            <KbFileIcon name={row.name} type={row.type} className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate leading-tight group-hover:text-primary transition-colors">{value}</div>
            {row.description && <div className="text-[10px] text-muted-foreground truncate font-medium mt-0.5">{row.description}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      width: 100,
      render: (_: any, row: KbItem) => (
        <Badge
          variant={row.type === 'folder' ? 'outline' : 'secondary'}
          className="font-bold text-[9px] px-2 py-0 border-primary/20 bg-primary/5 text-primary tracking-wider"
        >
          {row.type === 'folder' ? 'FOLDER' : 'DOC'}
        </Badge>
      )
    },
    {
      key: 'processingStatus',
      label: 'Status',
      width: 150,
      render: (value: any, row: KbItem) => row.type === 'document' ? (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/80">{value}</span>
        </div>
      ) : <span className="opacity-20">—</span>
    },
    {
      key: 'fileSize',
      label: 'Size',
      width: 100,
      render: (value: any, row: KbItem) => row.type === 'document' ? (
        <span className="text-xs font-bold text-muted-foreground/70">{formatSize(value)}</span>
      ) : <span className="opacity-20">—</span>
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      width: 120,
      render: (value: any) => <span className="text-xs font-medium text-muted-foreground/60">{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      sortable: false,
      render: (_: any, row: KbItem) => (
        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted font-bold transition-all">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-premium border-border/50 bg-card/95 backdrop-blur-xl">
              {row.type === 'document' && onPreviewDocument && (
                <>
                  <DropdownMenuItem
                    className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3"
                    onClick={() => onPreviewDocument(row.id)}
                  >
                    <Eye className="w-4 h-4 text-primary" /> Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3"
                    onClick={() => onDownloadDocument?.(row.id, row.name)}
                  >
                    <Download className="w-4 h-4 text-primary" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                </>
              )}
              <DropdownMenuItem
                className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3"
                onClick={() => onEditItem(row)}
              >
                <Edit2 className="w-4 h-4 text-primary" /> Edit Properties
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-lg flex items-center gap-2 font-bold cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => onDeleteItem(row)}
              >
                <Trash2 className="w-4 h-4" /> Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    }
  ];

  return (
    <div className="rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
      <DataTable
        data={items}
        columns={columns}
        loading={isLoading}
        searchable={false}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        emptyMessage="This collection is currently empty"
        onRowClick={onItemClick}
        className="w-full"
        tableClassName="bg-transparent border-0"
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
