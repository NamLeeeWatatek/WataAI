"use client";

import React, { useState } from 'react';
import axiosClient from '@/lib/axios-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Check, Grid, List, Search, Key, Activity, ShieldCheck, Zap, Sparkles, Bot, Cloud, Cpu, Settings, Stars, Terminal, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { DataTable } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';
import { AIProviderDialog } from './AIProviderDialog';

// Icon mapping utility
const getProviderIcon = (iconName?: string) => {
  const icons: Record<string, any> = {
    AiOutlineOpenAI: Sparkles,
    SiClaude: Bot,
    RiGeminiLine: Stars,
    VscAzure: Cloud,
    SiOllama: Cpu,
    MdDashboardCustomize: Settings,
  };

  return icons[iconName as string] || Settings;
};

interface AiProvider {
  id: string;
  key: string;
  label: string;
  icon?: string;
  description?: string;
  requiredFields: string[];
  optionalFields: string[];
  defaultValues: Record<string, any>;
  isActive: boolean;
}

interface UserAiProviderConfig {
  id: string;
  userId: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProviderDisplayData {
  id: string;
  userId?: string;
  workspaceId?: string;
  providerId: string;
  provider?: AiProvider;
  displayName: string;
  config: Record<string, any>;
  modelList?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  quotaUsed: number;
  lastUsedAt: string;
  isVerified: boolean;
  apiKeyMasked: string | null;
}

interface AIProvidersTabProps {
  userConfigs: UserAiProviderConfig[];
  availableProviders: AiProvider[];
  loading: boolean;
  onDataChange: () => void;
}

export function AIProvidersTab({ userConfigs, availableProviders, loading, onDataChange }: AIProvidersTabProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);

  const handleOpenDialog = (config?: UserAiProviderConfig | ProviderDisplayData) => {
    setSelectedConfig(config || null);
    setDialogOpen(true);
  };

  const handleVerify = async (id: string) => {
    try {
      await axiosClient.post(`/ai-providers/user/configs/${id}/verify`);
      toast.success('API key verified successfully');
      onDataChange();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to verify API key');
    }
  };

  const handleDelete = async () => {
    if (!configToDelete) return;

    try {
      await axiosClient.delete(`/ai-providers/user/configs/${configToDelete}`);
      toast.success('API key deleted successfully');
      onDataChange();
    } catch {
      toast.error('Failed to delete API key');
    } finally {
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setConfigToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleToggleActive = async (provider: { id: string; isActive: boolean }) => {
    const originalUserConfig = userConfigs.find(c => c.id === provider.id);
    if (!originalUserConfig) {
      toast.error('Only user providers can be toggled here');
      return;
    }
    try {
      await axiosClient.patch(`/ai-providers/user/configs/${provider.id}`, {
        isActive: !provider.isActive,
      });
      toast.success(`Provider ${!provider.isActive ? 'activated' : 'deactivated'}`);
      onDataChange();
    } catch {
      toast.error('Failed to update provider status');
    }
  };

  // Calculate combined providers for display
  const allProviders = [...userConfigs].map(config => ({
    ...config,
    quotaUsed: config.config?.usage || 0,
    lastUsedAt: config.updatedAt,
    isVerified: config.config?.isVerified || false,
    apiKeyMasked: config.config?.apiKey
      ? '••••••••••••'
      : (config.config?.baseUrl ? '••••••••••••' : null),
  }));

  const totalUsage = allProviders.reduce((sum, p) => sum + p.quotaUsed, 0);
  const activeProviders = allProviders.filter(p => p.isActive).length;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden group border-border/40 shadow-xl bg-card/40 backdrop-blur-md rounded-3xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-500" />
          <CardHeader className="pb-3 border-b border-border/10">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Ecosystem Health</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter mt-1">{allProviders.length}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <div className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span>{activeProviders} Active Intelligence Nodes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-border/40 shadow-xl bg-card/40 backdrop-blur-md rounded-3xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-500" />
          <CardHeader className="pb-3 border-b border-border/10">
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Cumulative Throughput</CardDescription>
            <CardTitle className="text-4xl font-black tracking-tighter mt-1">{totalUsage.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <Activity className="size-3.5 text-blue-500" />
              <span>Processed Tokens / Requests</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden group border-primary/20 shadow-xl shadow-primary/5 bg-primary/5 backdrop-blur-md rounded-3xl border-2 border-dashed">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-3">
            <CardDescription className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">Scale Capability</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button onClick={() => handleOpenDialog()} className="w-full shadow-2xl shadow-primary/30 font-black rounded-2xl h-14 active:scale-[0.98] transition-all bg-primary hover:bg-primary text-sm tracking-tight group/btn overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <Plus className="mr-2 size-5 transition-transform group-hover/btn:rotate-90" />
              Integrate Intelligence
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between sticky top-0 z-10 bg-background/60 backdrop-blur-xl py-6 border-b border-border/40 group">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-all group-focus-within:text-primary group-focus-within:scale-110 w-4 h-4" />
          <Input
            placeholder="Search Intelligence Layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 rounded-[20px] bg-muted/20 focus:bg-background border-border/40 focus:border-primary/40 focus:ring-primary/10 h-12 transition-all font-medium text-sm"
          />
        </div>

        <div className="bg-muted/30 p-1.5 rounded-2xl flex shadow-inner border border-border/40 backdrop-blur-md">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              viewMode === 'grid' ? 'bg-background text-primary shadow-xl ring-1 ring-border/20 scale-100' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 scale-95'
            )}
            title="Grid Topology"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2.5 rounded-xl transition-all duration-300",
              viewMode === 'list' ? 'bg-background text-primary shadow-xl ring-1 ring-border/20 scale-100' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 scale-95'
            )}
            title="Sequential Table"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      {allProviders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5 glass">
          <div className="size-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 ring-8 ring-primary/5">
            <Key className="size-10 text-primary opacity-40" />
          </div>
          <h3 className="text-xl font-black tracking-tight">Access Control Required</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2 mb-10 font-medium">
            No intelligence engines are currently initialized. Secure your environment with an API provider to proceed.
          </p>
          <Button onClick={() => handleOpenDialog()} size="lg" className="rounded-full font-bold px-10 shadow-xl shadow-primary/20 active:scale-95 transition-all">
            <Plus className="mr-2 size-5" />
            Provision Intelligence
          </Button>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {allProviders
                .filter(p =>
                  p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.provider?.label.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((provider) => {
                  const providerData = provider.provider || availableProviders.find(p => p.id === provider.providerId);
                  const IconComponent = getProviderIcon(providerData?.icon);

                  return (
                    <div key={provider.id}>
                      <Card className="group h-full flex flex-col border border-border/40 bg-card/40 backdrop-blur-md shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 rounded-[32px] overflow-hidden hover:-translate-y-1">
                        <div className={cn(
                          "h-1.5 w-full bg-gradient-to-r transition-all duration-500",
                          provider.isActive ? "from-primary via-primary/80 to-primary/40" : "from-muted/40 via-muted/20 to-transparent"
                        )} />

                        <CardHeader className="p-6 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center text-3xl shadow-inner border border-border/10 group-hover:scale-110 transition-transform duration-500">
                                <IconComponent className="text-primary w-7 h-7" />
                              </div>
                              <div className="space-y-1">
                                <CardTitle className="text-lg font-black tracking-tight">{provider.displayName}</CardTitle>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{providerData?.label || 'Generic AI'}</span>
                                  {provider.isVerified && (
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[9px] font-black uppercase tracking-widest text-green-500">
                                      <ShieldCheck className="size-2.5" /> Trusted
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm flex items-center gap-1.5",
                              provider.isActive ? "bg-primary/10 text-primary border border-primary/20" : "bg-muted/30 text-muted-foreground border border-border/30"
                            )}>
                              <div className={cn("size-1.5 rounded-full", provider.isActive ? "bg-primary animate-pulse" : "bg-muted-foreground")} />
                              {provider.isActive ? 'Active' : 'Offline'}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="p-6 pt-0 space-y-6 flex-1 flex flex-col">
                          {provider.modelList && provider.modelList.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Intelligence Matrix</p>
                                <span className="text-[10px] font-bold text-muted-foreground/40">{provider.modelList.length} Nodes</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {provider.modelList.slice(0, 4).map((model) => (
                                  <Badge key={model} variant="secondary" className="font-mono text-[10px] px-2 py-1 bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors rounded-lg">
                                    {model}
                                  </Badge>
                                ))}
                                {provider.modelList.length > 4 && (
                                  <Badge variant="secondary" className="text-[10px] px-2 py-1 bg-muted/5 border-border/10 opacity-60 rounded-lg">
                                    +{provider.modelList.length - 4} More
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="py-6 flex flex-col items-center justify-center border border-dashed border-border/30 rounded-2xl bg-muted/5 group-hover:bg-muted/10 transition-colors">
                              <Terminal className="size-5 text-muted-foreground/20 mb-2" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">Dynamic Model Discovery</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-6 p-4 rounded-2xl bg-muted/10 border border-border/10 mt-auto">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Workload</p>
                              <div className="flex items-center gap-1.5">
                                <Zap className="size-3 text-primary/60" />
                                <p className="text-sm font-black font-mono tracking-tight">{provider.quotaUsed.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Pulse Check</p>
                              <p className="text-xs font-bold">{provider.lastUsedAt ? new Date(provider.lastUsedAt).toLocaleDateString() : 'Initial State'}</p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 pt-2">
                            <div className="flex gap-3">
                              {!provider.isVerified && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerify(provider.id)}
                                  className="flex-1 h-11 rounded-xl border-orange-500/20 bg-orange-500/5 text-orange-600 hover:bg-orange-500/10 hover:text-orange-700 font-bold text-xs group/verify"
                                >
                                  <RefreshCw className="mr-2 size-3.5 group-hover/verify:rotate-180 transition-transform duration-500" />
                                  Validate
                                </Button>
                              )}
                              <Button
                                variant={provider.isActive ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleToggleActive(provider)}
                                className={cn(
                                  "flex-1 h-11 rounded-xl font-bold text-xs transition-all active:scale-95",
                                  provider.isActive
                                    ? "border-primary/20 hover:bg-primary/5 hover:text-primary"
                                    : "bg-primary shadow-lg shadow-primary/20"
                                )}
                              >
                                {provider.isActive ? 'Decommission' : 'Synchronize'}
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(provider)}
                                className="flex-1 h-10 text-[10px] font-black uppercase tracking-widest bg-muted/20 hover:bg-muted/40 rounded-xl"
                              >
                                <Settings className="size-3.5 mr-2" /> Parameters
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(provider.id)}
                                className="h-10 w-10 px-0 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="bg-card/40 backdrop-blur-md rounded-[32px] overflow-hidden border border-border/40 shadow-xl">
              <DataTable
                data={allProviders
                  .filter(p =>
                    p.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.provider?.label.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                }
                columns={[
                  {
                    key: 'displayName',
                    label: 'Intelligence Node',
                    render: (value, row) => {
                      const providerData = row.provider || availableProviders.find(p => p.id === row.providerId);
                      const IconComponent = getProviderIcon(providerData?.icon);
                      return (
                        <div className="flex items-center gap-4 py-1">
                          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center border border-border/10">
                            <IconComponent className="text-primary w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-sm tracking-tight">{value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{providerData?.label}</div>
                          </div>
                        </div>
                      );
                    }
                  },
                  {
                    key: 'status',
                    label: 'State',
                    render: (_, row) => (
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border",
                        row.isActive
                          ? "bg-green-500/10 text-green-600 border-green-500/20"
                          : "bg-muted text-muted-foreground border-border/40"
                      )}>
                        <div className={cn("size-1 rounded-full", row.isActive ? "bg-green-500" : "bg-muted-foreground")} />
                        {row.isActive ? 'Active' : 'Offline'}
                      </div>
                    )
                  },
                  {
                    key: 'models',
                    label: 'Matrix Nodes',
                    render: (_, row) => (
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {row.modelList?.slice(0, 3).map((m: string) => (
                          <Badge key={m} variant="secondary" className="text-[9px] font-bold px-2 py-0.5 bg-muted/20 border-border/10 text-muted-foreground rounded-md">
                            {m}
                          </Badge>
                        ))}
                        {(row.modelList?.length || 0) > 3 && (
                          <span className="text-[9px] font-black text-muted-foreground/40 ml-1">+{row.modelList!.length - 3}</span>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'usage',
                    label: 'Throughput',
                    render: (_, row) => (
                      <div className="flex items-center gap-2">
                        <Zap className="size-3 text-primary/40" />
                        <span className="font-mono text-xs font-black">{row.quotaUsed.toLocaleString()}</span>
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    label: '',
                    render: (_, row) => (
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-95" onClick={() => handleOpenDialog(row)}>
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95" onClick={() => openDeleteDialog(row.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  }
                ]}
                searchable={false}
                className="border-none"
                tableClassName="border-none shadow-none bg-transparent"
              />
            </div>
          )}

          {/* Unified Pagination */}
          {allProviders.length > pageSize && (
            <div className="pt-8 border-t border-border/40 flex items-center justify-between">
              <p className="text-sm text-muted-foreground font-medium">
                Showing <span className="text-foreground">{Math.min(currentPage * pageSize, allProviders.length)}</span> of <span className="text-foreground">{allProviders.length}</span> providers
              </p>
              <Pagination
                pagination={{
                  page: currentPage,
                  limit: pageSize,
                  total: allProviders.length,
                  hasNextPage: currentPage * pageSize < allProviders.length,
                  totalPages: Math.ceil(allProviders.length / pageSize)
                }}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </>
      )}

      <AIProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        availableProviders={availableProviders}
        config={selectedConfig}
      />
    </div>
  );
}
