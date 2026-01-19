'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import toast from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
    setConnecting,
    setFacebookPages,
    setFacebookTempToken,
    setConnectingPage,
    setSelectedBotId,
    clearFacebookState,
} from '@/lib/store/slices/channelsSlice';
import {
    X,
    Facebook,
    Settings,
    RefreshCw,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/shared/PageHeader';
import { PageShell } from '@/components/layout/PageShell';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { ManagePagesDialog } from '@/components/features/channels/ManagePagesDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent, TabsHeader } from '@/components/ui/Tabs';
import { ConnectedChannelsTab, ChannelConfigurationsTab } from '@/components/features/channels';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useChannels } from '@/lib/hooks/features/useChannels';
import { getOAuthUrl } from '@/lib/api/channels';
import { useBots } from '@/lib/hooks/features/useBots';
import { type Bot } from '@/lib/api/bots';
import { AgentCard } from '@/components/shared/AgentCard';
import type { Channel, ChannelPage, IntegrationConfig } from '@/lib/types/channel';


export default function ChannelsPage() {
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.id;
    const dispatch = useAppDispatch();

    // Redux state for Facebook OAuth flow specifically
    const {
        facebookPages,
        facebookTempToken,
        connectingPage,
        selectedBotId,
        isConnecting
    } = useAppSelector(state => state.channels);

    // Local UI State
    const [activeTab, setActiveTab] = useState<'connected' | 'configurations' | 'discovery'>('connected');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [disconnectId, setDisconnectId] = useState<string | null>(null);
    const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
    const [managePagesDialogOpen, setManagePagesDialogOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([]);

    // TanStack Query Hooks
    const {
        channels,
        meta,
        integrations: configs,
        isLoading,
        refetch,
        disconnect,
        deleteIntegration,
        saveIntegration,
        connectFacebook,
        isMutating
    } = useChannels(workspaceId, {
        page,
        limit: pageSize,
        search: searchQuery
    });

    const handleConnect = async (provider: string, configId?: string) => {
        dispatch(setConnecting(provider));

        try {
            let oauthUrl: string;

            if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                const redirectUri = `${window.location.origin}/channels/callback/facebook`;
                const response = await getOAuthUrl('facebook', configId, workspaceId, redirectUri);
                oauthUrl = response.url;
            } else {
                const config = configId ? configs.find(c => String(c.id) === String(configId)) : configs.find(c => c.provider === provider);
                if (!config) {
                    toast.error(`Please configure ${provider} settings first`);
                    dispatch(setConnecting(null));
                    return;
                }
                const response = await getOAuthUrl(provider, configId, workspaceId);
                oauthUrl = response.url;
            }

            const width = 600;
            const height = 700;
            const left = window.screen.width / 2 - width / 2;
            const top = window.screen.height / 2 - height / 2;

            const popup = window.open(
                oauthUrl,
                `Connect ${provider}`,
                `width=${width},height=${height},left=${left},top=${top}`
            );

            if (!popup) {
                toast.error('Popup blocked!');
                dispatch(setConnecting(null));
                return;
            }

            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    const hasPages = Array.isArray(event.data.pages) && event.data.pages.length > 0;

                    if ((provider === 'facebook' || provider === 'messenger' || provider === 'instagram') && hasPages) {
                        dispatch(setFacebookPages(event.data.pages));
                        dispatch(setFacebookTempToken(event.data.tempToken));
                        toast.success(`Discovered ${event.data.pages.length} terminals`);
                        refetch();
                        setActiveTab('discovery');
                    } else {
                        toast.success(event.data.message || `Connected to ${event.data.channel || provider}`);
                        refetch();
                        dispatch(setConnecting(null));
                    }
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message || 'Unknown protocol error'}`);
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    dispatch(setConnecting(null));
                }
            };

            window.addEventListener('message', messageHandler);
        } catch (error) {
            toast.error('Failed to get connection URL');
            dispatch(setConnecting(null));
        }
    };

    const handleConnectFacebookPage = async (page: any) => {
        try {
            dispatch(setConnectingPage(page.id));
            await connectFacebook({
                pageId: page.id,
                pageName: page.name,
                category: page.category,
                userAccessToken: facebookTempToken,
                pageAccessToken: page.access_token,
                botId: selectedBotId,
            });

            toast.success(`Connected ${page.name}`);
            dispatch(setFacebookPages(facebookPages.filter(p => p.id !== page.id)));
            setSelectedPageIds(prev => prev.filter(id => id !== page.id));
            refetch();
        } catch (error: any) {
            toast.error(`Failed to connect ${page.name}`);
        } finally {
            dispatch(setConnectingPage(null));
        }
    };

    const handleBulkConnectPages = async () => {
        const pagesToConnect = facebookPages.filter(p => selectedPageIds.includes(p.id));
        if (pagesToConnect.length === 0) return;

        dispatch(setConnectingPage('bulk'));
        let successCount = 0;

        for (const page of pagesToConnect) {
            try {
                await connectFacebook({
                    pageId: page.id,
                    pageName: page.name,
                    category: page.category,
                    userAccessToken: facebookTempToken,
                    pageAccessToken: page.access_token,
                    botId: selectedBotId,
                });
                successCount++;
            } catch (error) {
                console.error(`Failed to connect ${page.name}`, error);
            }
        }

        toast.success(`Connected ${successCount} page(s)`);
        dispatch(setFacebookPages(facebookPages.filter(p => !selectedPageIds.includes(p.id))));
        setSelectedPageIds([]);
        dispatch(setConnectingPage(null));
        refetch();
    };

    const togglePageSelection = (id: string) => {
        setSelectedPageIds(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const toggleSelectAllPages = () => {
        if (selectedPageIds.length === facebookPages.length) {
            setSelectedPageIds([]);
        } else {
            setSelectedPageIds(facebookPages.map(p => p.id));
        }
    };

    const handleDisconnect = async () => {
        if (!disconnectId) return;
        try {
            await disconnect(disconnectId);
        } catch (error) {
        } finally {
            setDisconnectId(null);
        }
    };

    const handleDeleteConfig = async () => {
        if (!deleteConfigId) return;
        try {
            await deleteIntegration(deleteConfigId);
        } catch (error) {
        } finally {
            setDeleteConfigId(null);
        }
    };

    const handleSaveConfig = async (data: any) => {
        try {
            const { id, ...payload } = data;
            await saveIntegration({ id: id || undefined, data: payload });
        } catch (error) {
        }
    };

    return (
        <PageShell
            title="Channels"
            description="Manage your communication channels and integrations"
        >
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col pt-2">
                <TabsHeader>
                    <TabsList variant="pills" className="w-full justify-start overflow-x-auto no-scrollbar">
                        <TabsTrigger value="connected" variant="pills">
                            <Activity className="w-4 h-4 mr-2" />
                            <span>Connected Terminals</span>
                            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px]">
                                {channels.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="configurations" variant="pills">
                            <Settings className="w-4 h-4 mr-2" />
                            <span>Configurations</span>
                            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px]">
                                {configs.length}
                            </Badge>
                        </TabsTrigger>
                        {facebookPages.length > 0 && (
                            <TabsTrigger value="discovery" variant="pills" className="animate-in fade-in slide-in-from-left-4">
                                <Facebook className="w-4 h-4 mr-2" />
                                <span>Discovered Pages</span>
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px]">
                                    {facebookPages.length}
                                </Badge>
                            </TabsTrigger>
                        )}
                    </TabsList>
                </TabsHeader>

                <div className="flex-1 mt-6">
                    <TabsContent value="discovery" className="m-0 focus-visible:outline-none h-full">
                        <div className="flex flex-col gap-6 h-full">
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                                <div>
                                    <h3 className="font-semibold flex items-center gap-2 text-lg">
                                        <Facebook className="w-5 h-5 text-blue-600" />
                                        Connect Facebook Pages
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Select the pages you want to connect to WataAI.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSelectAllPages}
                                        className="font-bold"
                                    >
                                        {selectedPageIds.length === facebookPages.length ? 'Deselect All' : 'Select All'}
                                    </Button>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={selectedPageIds.length === 0 || connectingPage === 'bulk'}
                                        loading={connectingPage === 'bulk'}
                                        onClick={handleBulkConnectPages}
                                        className="font-bold"
                                    >
                                        Connect {selectedPageIds.length} Selected
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        dispatch(clearFacebookState());
                                        setSelectedPageIds([]);
                                        setActiveTab('connected');
                                    }}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 overflow-y-auto">
                                {facebookPages.map((page: ChannelPage) => (
                                    <AgentCard
                                        key={page.id}
                                        name={page.name}
                                        description={`ID: ${page.id}`}
                                        icon={page.picture?.data?.url}
                                        status="online"
                                        tags={[page.category || 'Facebook Page']}
                                        onClick={() => togglePageSelection(page.id)}
                                        className={cn(
                                            "cursor-pointer transition-all",
                                            selectedPageIds.includes(page.id) ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                                        )}
                                    >
                                        <div className="flex items-center justify-between mt-4 gap-3">
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleConnectFacebookPage(page);
                                                }}
                                                disabled={connectingPage === page.id || connectingPage === 'bulk'}
                                                loading={connectingPage === page.id}
                                                className="flex-1 font-bold"
                                                variant={selectedPageIds.includes(page.id) ? "primary" : "outline"}
                                            >
                                                Connect Now
                                            </Button>
                                        </div>
                                    </AgentCard>
                                ))}
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="connected" className="m-0 focus-visible:outline-none">
                        <ConnectedChannelsTab
                            channels={channels}
                            searchQuery={searchQuery}
                            viewMode={viewMode}
                            currentPage={page}
                            pageSize={pageSize}
                            totalCount={meta?.total || 0}
                            selectedIds={[]}
                            onSearchChange={setSearchQuery}
                            onViewModeChange={setViewMode}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                            onToggleSelection={() => { }}
                            onClearSelection={() => { }}
                            isLoading={isLoading}
                            onDisconnect={(id: string) => setDisconnectId(id)}
                            onManagePages={(channel: Channel) => {
                                setSelectedChannel(channel);
                                dispatch(setSelectedBotId(channel.metadata?.botId || ''));
                                setManagePagesDialogOpen(true);
                            }}
                            onLoadData={refetch}
                        />
                    </TabsContent>

                    <TabsContent value="configurations" className="m-0">
                        <ChannelConfigurationsTab
                            configs={configs.filter((c: IntegrationConfig) =>
                                c.provider?.toLowerCase().includes(searchQuery.toLowerCase())
                            )}
                            isLoading={isLoading}
                            onConnect={handleConnect}
                            onDeleteConfig={(id: string) => setDeleteConfigId(id)}
                            onSaveConfig={(config: Partial<IntegrationConfig>) => handleSaveConfig(config)}
                        />
                    </TabsContent>
                </div>
            </Tabs>

            <AlertDialogConfirm
                open={!!disconnectId}
                onOpenChange={(o: boolean) => !o && setDisconnectId(null)}
                title="Disconnect Terminal"
                description="Are you sure you want to disconnect this terminal? You will no longer receive messages from this channel until you reconnect."
                onConfirm={handleDisconnect}
                variant="destructive"
            />

            <AlertDialogConfirm
                open={!!deleteConfigId}
                onOpenChange={(o: boolean) => !o && setDeleteConfigId(null)}
                title="Delete Configuration"
                description="Are you sure you want to delete this configuration? This will permanently remove the credentials and settings."
                onConfirm={handleDeleteConfig}
                variant="destructive"
            />

            <ManagePagesDialog
                open={managePagesDialogOpen}
                onOpenChange={setManagePagesDialogOpen}
                channel={selectedChannel}
                workspaceId={workspaceId!}
                onSuccess={() => {
                    dispatch(setSelectedBotId(''));
                    setManagePagesDialogOpen(false);
                    refetch();
                }}
            />
        </PageShell>
    );
}
