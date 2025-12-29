"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Grid, List, Search, RefreshCw, Plus, FolderPlus, Upload, Globe, Trash2 } from 'lucide-react';

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
  selectedCount = 0,
  onDeleteSelected
}: KbToolbarProps) {

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 border-b">
      {/* Search */}
      <div className="relative flex-1 w-full max-w-sm group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary w-4 h-4" />
        <Input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border-border/50 bg-muted/20 focus:bg-background transition-all outline-none h-auto"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>

        {/* Quick Actions Dropdown */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateFolder}
            className="rounded-lg h-9 font-bold"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            Folder
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateDocument}
            className="rounded-lg h-9 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Doc
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onUploadFile}
            className="rounded-lg h-9 font-bold"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCrawlWebsite}
            className="rounded-lg h-9 font-bold"
          >
            <Globe className="w-4 h-4 mr-2" />
            Crawl
          </Button>
          <div className="bg-muted/50 p-1 rounded-xl flex shadow-sm border border-border/40">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg h-9 w-9 transition-all ${viewMode === 'grid' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              title="Grid View"
            >
              <Grid className="w-5 h-5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('table')}
              className={`rounded-lg h-9 w-9 transition-all ${viewMode === 'table' ? 'bg-background text-primary shadow-sm border border-border/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
              title="List View"
            >
              <List className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
