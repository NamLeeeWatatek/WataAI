'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2, ShieldCheck, Zap, Sparkles, Bot, Cloud, Cpu, Settings, Stars, Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { AIProviderDialog } from './AIProviderDialog';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { Search } from '@/components/shared/Search';
import { CardGridSkeleton } from '@/components/shared/Skeletons';
import { useAiProviders, type EnhancedUserConfig } from '@/lib/hooks/features/useAiProviders';
import { ColumnDef } from '@tanstack/react-table';

import type { LucideIcon } from 'lucide-react';

const getProviderIcon = (iconName?: string): LucideIcon => {
  const icons: Record<string, LucideIcon> = {
    openai: Sparkles,
    anthropic: Bot,
    google: Stars,
    gemini: Stars,
    azure: Cloud,
    ollama: Cpu,
    custom: Settings,
  };
  if (typeof iconName !== 'string') return Settings;
  return icons[(iconName || '').toLowerCase()] || Settings;
};

export function AIProvidersTab() {
  const {
    userConfigs,
    availableProviders,
    isLoading,
    deleteConfig,
    updateConfig,
    activeMutationId
  } = useAiProviders();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<EnhancedUserConfig | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleOpenDialog = (config?: EnhancedUserConfig) => {
    setSelectedConfig(config || null);
    setDialogOpen(true);
  };

  const filteredConfigs = React.useMemo(() => {
    return userConfigs.filter(config =>
      config.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [userConfigs, searchQuery]);

  const paginatedConfigs = React.useMemo(() => {
    return filteredConfigs.slice((page - 1) * pageSize, page * pageSize);
  }, [filteredConfigs, page, pageSize]);

  const columns = React.useMemo<ColumnDef<EnhancedUserConfig>[]>(() => [
    {
      id: 'displayName',
      header: 'Provider Name',
      accessorKey: 'displayName',
      cell: ({ row, getValue }) => {
        const provider = row.original;
        const Icon = getProviderIcon(provider.providerMetadata?.id || provider.providerId);
        return (
          <div className="flex items-center gap-3 py-1">
            <div className="size-10 rounded-lg bg-muted/50 flex items-center justify-center border">
              <Icon className="text-primary size-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{getValue() as string}</div>
              <div className="text-xs text-muted-foreground">{provider.providerMetadata?.label || provider.providerId}</div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'isActive',
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
            isActive ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground border-border"
          )}>
            <div className={cn("size-1.5 rounded-full", isActive ? "bg-green-500" : "bg-muted-foreground")} />
            {isActive ? 'Active' : 'Inactive'}
          </div>
        );
      }
    },
    {
      id: 'modelList',
      header: 'Models',
      accessorKey: 'modelList',
      cell: ({ getValue }) => {
        const list = getValue() as string[];
        return (
          <div className="flex flex-wrap gap-1 max-w-[300px]">
            {list?.slice(0, 3).map((m: string) => (
              <Badge key={m} variant="secondary" className="text-[10px] font-mono">{m}</Badge>
            ))}
            {(list?.length || 0) > 3 && (
              <Badge variant="outline" className="text-[10px]">+{list.length - 3}</Badge>
            )}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(row.original)}><Settings className="size-4" /></Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(row.original.id)}><Trash2 className="size-4" /></Button>
        </div>
      )
    }
  ], []);

  if (isLoading) return <CardGridSkeleton />;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-muted/50 border-border/50">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardDescription className="uppercase text-xs font-semibold tracking-wider">Total Providers</CardDescription>
            <CardTitle className="text-4xl font-bold mt-1">{userConfigs.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span>{userConfigs.filter(p => p.isActive).length} Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-dashed border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => handleOpenDialog()}>
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardDescription className="text-primary font-bold uppercase text-xs tracking-wider">Add Provider</CardDescription>
            <Plus className="size-5 text-primary" />
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-center py-6">
            <div className="size-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg mb-4">
              <Plus className="size-6" />
            </div>
            <p className="font-semibold text-sm text-primary">Connect New Provider</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-background/95 backdrop-blur-md py-4 border-b">
        <Search
          placeholder="Filter providers..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          className="max-w-md"
        />

        <div className="bg-muted p-1 rounded-lg flex border shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-2",
              viewMode === 'grid' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'
            )}
          >
            <Grid className="size-3.5" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "px-3 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-2",
              viewMode === 'list' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:bg-background/50'
            )}
          >
            <List className="size-3.5" />
            List
          </button>
        </div>
      </div>

      {/* Grid/List View */}
      {filteredConfigs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border border-dashed rounded-xl bg-muted/20">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Cloud className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Providers Connected</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-8 text-sm">
            Connect an AI provider to start using AI features in your application.
          </p>
          <Button onClick={() => handleOpenDialog()} size="lg" className="px-8">
            Connect Provider
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedConfigs.map((provider) => {
                const IconComponent = getProviderIcon(provider.providerMetadata?.id || provider.providerId);
                return (
                  <Card key={provider.id} className="group flex flex-col hover:shadow-lg transition-all duration-300">
                    <CardHeader className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-14 rounded-xl bg-muted/50 flex items-center justify-center border shadow-sm">
                            <IconComponent className="text-primary size-7" />
                          </div>
                          <div className="space-y-1">
                            <CardTitle className="text-lg font-bold">{provider.displayName}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px] uppercase">{provider.providerMetadata?.label || provider.providerId}</Badge>
                              {provider.config.isVerified && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-200 text-[10px]"><ShieldCheck className="size-3 mr-1" /> Verified</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border",
                          provider.isActive ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground border-border"
                        )}>
                          <div className={cn("size-1.5 rounded-full", provider.isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                          {provider.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6 pt-0 flex-1 flex flex-col space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Stars className="size-3.5 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Models</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.modelList?.slice(0, 4).map((model: string) => (
                            <Badge key={model} variant="secondary" className="font-mono text-[10px]">
                              {model}
                            </Badge>
                          ))}
                          {(provider.modelList?.length || 0) > 4 && (
                            <Badge variant="outline" className="text-[10px]">+{provider.modelList!.length - 4}</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-4 mt-auto border-t">
                        <Button
                          variant={provider.isActive ? "outline" : "default"}
                          onClick={() => updateConfig({ id: provider.id, data: { isActive: !provider.isActive } })}
                          disabled={activeMutationId === 'update'}
                          className="w-full"
                        >
                          {provider.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleOpenDialog(provider)}
                            className="flex-1"
                          >
                            <Settings className="size-4 mr-2" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setDeleteId(provider.id)}
                            className="px-3 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <DataTable
                data={paginatedConfigs}
                columns={columns}
                searchable={false}
              />
            </Card>
          )}

          {filteredConfigs.length > pageSize && (
            <div className="pt-6 flex items-center justify-between border-t">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{Math.min(page * pageSize, filteredConfigs.length)}</span> of <span className="font-medium text-foreground">{filteredConfigs.length}</span> providers
              </p>
              <Pagination
                pagination={{
                  page: page,
                  limit: pageSize,
                  total: filteredConfigs.length,
                  hasNextPage: page * pageSize < filteredConfigs.length,
                  totalPages: Math.ceil(filteredConfigs.length / pageSize)
                }}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}

      <AIProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableProviders={availableProviders}
        config={selectedConfig}
      />

      <AlertDialogConfirm
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="Delete Provider"
        description="Are you sure you want to remove this AI provider? This action cannot be undone and may affect active bots using this provider."
        confirmText="Delete Provider"
        variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            await deleteConfig(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </div>
  );
}
