"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, List, RefreshCw, Plus, FolderPlus, Upload, Globe, ChevronDown, FileText } from 'lucide-react';
import { Search } from '@/components/shared/Search';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/Separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useTranslation } from 'react-i18next';

interface KbToolbarProps {
  searchQuery: string;
  viewMode: 'grid' | 'table';
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  onViewModeChange: (mode: 'grid' | 'table') => void;
  onRefresh: () => void;
  onCreateFolder: () => void;
  onCreateDocument: () => void;
  onUploadFile: () => void;
  onCrawlWebsite: () => void;
  selectedCount?: number;
  onDeleteSelected?: () => void;
}

export function KbToolbar({
  searchQuery,
  viewMode,
  isLoading,
  onSearchChange,
  onViewModeChange,
  onRefresh,
  onCreateFolder,
  onCreateDocument,
  onUploadFile,
  onCrawlWebsite,
}: KbToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full">

      {/* Search & Refresh */}
      <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
        <Search
          placeholder={t('kb_explorer.toolbar.search_items')}
          value={searchQuery}
          onChange={(e: any) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          className="max-w-sm w-full"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
        >
          <RefreshCw className={cn("w-4 h-4")} />
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">

        {/* Create Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-9 gap-2 shadow-sm font-semibold pl-3 pr-4">
              <Plus className="w-4 h-4" />
              <span>{t('kb_explorer.toolbar.create_new')}</span>
              <ChevronDown className="w-3 h-3 opacity-50 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 p-2">
            <DropdownMenuLabel>{t('kb_explorer.toolbar.add_content')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateFolder} className="cursor-pointer font-medium p-2.5">
              <FolderPlus className="w-4 h-4 mr-2 text-blue-500" />
              {t('kb_explorer.toolbar.new_folder')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCreateDocument} className="cursor-pointer font-medium p-2.5">
              <FileText className="w-4 h-4 mr-2 text-green-500" />
              {t('kb_explorer.toolbar.new_document')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onUploadFile} className="cursor-pointer font-medium p-2.5">
              <Upload className="w-4 h-4 mr-2 text-orange-500" />
              {t('kb_explorer.toolbar.upload_files')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCrawlWebsite} className="cursor-pointer font-medium p-2.5">
              <Globe className="w-4 h-4 mr-2 text-teal-500" />
              {t('kb_explorer.toolbar.crawl_website')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        {/* View Toggle */}
        <div className="flex items-center bg-muted/20 p-1 rounded-lg border border-border/40 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "h-8 w-8 rounded-md transition-all",
              viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('common.grid_view', 'Grid View')}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onViewModeChange('table')}
            className={cn(
              "h-8 w-8 rounded-md transition-all",
              viewMode === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            title={t('common.list_view', 'Table View')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

