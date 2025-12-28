"use client";

import React from 'react';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Folder, FileText, Edit2, Trash2, Eye, Download, MoreVertical, ArrowLeft } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { cn } from '@/lib/utils';
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
  onItemClick: (item: KbItem) => void;
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

  const columns = [
    {
      key: 'selection',
      label: (
        <Checkbox
          checked={items.length > 0 && items.every(item => selectedIds.includes(item.id))}
          onCheckedChange={(checked) => onToggleSelectAll?.(!!checked)}
          aria-label="Select all"
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
        <div
          className="flex items-center gap-3 cursor-pointer py-1 group"
          onClick={() => onItemClick(row)}
        >
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            row.type === 'folder' ? "bg-blue-500/10 text-blue-500" : "bg-muted/50 text-muted-foreground"
          )}>
            {row.type === 'folder' ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{value}</div>
            {row.description && <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 font-medium">{row.description}</div>}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      width: 100,
      render: (_: any, row: KbItem) => (
        <Badge variant={row.type === 'folder' ? 'outline' : 'secondary'} className="font-black text-[10px] py-0.5 px-2 rounded-lg uppercase">
          {row.type === 'folder' ? 'Folder' : 'Document'}
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
          <span className="text-[10px] font-bold capitalize">{value}</span>
        </div>
      ) : <span className="text-muted-foreground/30">—</span>
    },
    {
      key: 'fileSize',
      label: 'Size',
      width: 100,
      render: (value: any, row: KbItem) => row.type === 'document' ? (
        <span className="text-xs font-bold text-muted-foreground">{formatSize(value)}</span>
      ) : <span className="text-muted-foreground/30">—</span>
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      sortable: true,
      width: 120,
      render: (value: any) => <span className="text-xs font-medium text-muted-foreground">{new Date(value).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      label: '',
      width: 60,
      sortable: false,
      render: (_: any, row: KbItem) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted font-bold">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-premium border-border/50 bg-card/90 backdrop-blur-xl">
              {row.type === 'document' && onPreviewDocument && (
                <>
                  <DropdownMenuItem
                    className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3"
                    onClick={() => onPreviewDocument(row.id)}
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3"
                    onClick={() => onDownloadDocument?.(row.id, row.name)}
                  >
                    <Download className="w-4 h-4" /> Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50 my-1" />
                </>
              )}
              <DropdownMenuItem
                className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3"
                onClick={() => onEditItem(row)}
              >
                <Edit2 className="w-4 h-4 text-primary" /> Edit Properties
              </DropdownMenuItem>
              <DropdownMenuItem
                className="rounded-xl flex items-center gap-2 font-bold cursor-pointer p-3 text-destructive focus:text-destructive focus:bg-destructive/10"
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
    <div className="space-y-4">
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
        emptyMessage="No files found"
        isTree={true}
        treeColumnKey="name"
        className="w-full"
        tableClassName="border-border/50 bg-card/50 backdrop-blur-sm"
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
