"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Grid, List, Search, RefreshCw, Plus, FolderPlus, Upload, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/Separator';

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

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4 transition-all">
      {/* Search */}
      <div className="relative flex-1 w-full max-w-sm group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary w-4 h-4" />
        <Input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10 bg-muted/30 border-border/50 focus-visible:ring-primary focus-visible:bg-background transition-all"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="h-10 font-semibold px-4"
          >
            <FolderPlus className="w-4 h-4 mr-2 text-primary" />
            Folder
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCreateDocument}
            className="h-10 font-semibold px-4"
          >
            <Plus className="w-4 h-4 mr-2 text-primary" />
            Doc
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onUploadFile}
            className="h-10 font-semibold px-4"
          >
            <Upload className="w-4 h-4 mr-2 text-primary" />
            Upload
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCrawlWebsite}
            className="h-10 font-semibold px-4"
          >
            <Globe className="w-4 h-4 mr-2 text-primary" />
            Crawl
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2 hidden md:block" />

        <div className="flex items-center bg-muted/30 p-1 rounded-md border border-border/50">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "h-8 w-8 transition-all",
              viewMode === 'grid' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => onViewModeChange('table')}
            className={cn(
              "h-8 w-8 transition-all",
              viewMode === 'table' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
