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
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
// import { PageShell } from '@/components/layout/PageShell';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { AssignBotDialog } from '@/components/features/channels/AssignBotDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ConnectedChannelsTab, ChannelConfigurationsTab } from '@/components/features/channels';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { useChannels } from '@/lib/hooks/features/useChannels';
import { getOAuthUrl } from '@/lib/api/channels';
import { useBots } from '@/lib/hooks/features/useBots';
import { type Bot } from '@/lib/api/bots';

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

    // TanStack Query Hooks
    const {
        channels,
        integrations: configs,
        isLoading,
        refetch,
        disconnect,
        deleteIntegration,
        saveIntegration,
        connectFacebook,
        isMutating
    } = useChannels(workspaceId);

    const { data: botsResponse, isLoading: loadingBots } = useBots(workspaceId);
    const bots = botsResponse?.data || [];

    // Local UI State
    const [activeTab, setActiveTab] = useState<'connected' | 'configurations'>('connected');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [disconnectId, setDisconnectId] = useState<string | null>(null);
    const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
    const [assignBotDialogOpen, setAssignBotDialogOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<any>(null);

    const handleConnect = async (provider: string, configId?: string) => {
        dispatch(setConnecting(provider));

        try {
            let oauthUrl: string;

            if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                const response = await getOAuthUrl('facebook', undefined, workspaceId);
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
                    if ((provider === 'facebook' || provider === 'messenger' || provider === 'instagram') && event.data.pages) {
                        dispatch(setFacebookPages(event.data.pages));
                        dispatch(setFacebookTempToken(event.data.tempToken));
                        toast.success(`Discovered ${event.data.pages.length} terminals`);
                    } else {
                        toast.success(`Connected to ${event.data.channel || provider}`);
                        refetch();
                    }
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    dispatch(setConnecting(null));
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
            await saveIntegration({ id: deleteConfigId || undefined, data });
        } catch (error) {
        }
    };

    const handleConnectFacebookPage = async (facebookPageId: string) => {
        try {
            dispatch(setConnectingPage(facebookPageId));
            await connectFacebook({
                facebookPageId,
                botId: selectedBotId,
                accessToken: facebookTempToken
            });

            toast.success('Facebook page connected successfully');
            dispatch(setFacebookPages(facebookPages.filter(p => p.id !== facebookPageId)));
            refetch();
        } catch (error: any) {
        } finally {
            dispatch(setConnectingPage(null));
        }
    };

    return (
        <div className="h-full flex flex-col space-y-8 p-8">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Channels</h2>
                    <p className="text-muted-foreground">Manage your communication channels and integrations</p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="connected">
                        <div className="flex items-center gap-2">
                            <span>Connected Terminals</span>
                            <Badge variant="secondary" className="ml-1 opacity-70">
                                {channels.length}
                            </Badge>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger value="configurations">
                        <div className="flex items-center gap-2">
                            <span>Configurations</span>
                            <Badge variant="secondary" className="ml-1 opacity-70">
                                {configs.length}
                            </Badge>
                        </div>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="connected" className="m-0 focus-visible:outline-none">
                    <ConnectedChannelsTab
                        channels={channels.filter((c: any) =>
                            c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.type?.toLowerCase().includes(searchQuery.toLowerCase())
                        ) as any[]}
                        searchQuery={searchQuery}
                        viewMode={viewMode}
                        currentPage={page}
                        pageSize={pageSize}
                        totalCount={channels.length}
                        selectedIds={[]}
                        onSearchChange={setSearchQuery}
                        onViewModeChange={setViewMode}
                        onPageChange={setPage}
                        onPageSizeChange={setPageSize}
                        onToggleSelection={() => { }}
                        onClearSelection={() => { }}
                        isLoading={isLoading}
                        onDisconnect={(id: string) => setDisconnectId(id)}
                        onAssignBot={(channel: any) => {
                            setSelectedChannel(channel);
                            dispatch(setSelectedBotId(channel.botId));
                            setAssignBotDialogOpen(true);
                        }}
                        onLoadData={refetch}
                    />
                </TabsContent>

                <TabsContent value="configurations" className="m-0">
                    <ChannelConfigurationsTab
                        configs={configs.filter((c: any) =>
                            c.provider?.toLowerCase().includes(searchQuery.toLowerCase())
                        ) as any[]}
                        isLoading={isLoading}
                        onConnect={handleConnect}
                        onDeleteConfig={(id: string) => setDeleteConfigId(id)}
                        onSaveConfig={(config: any) => handleSaveConfig(config)}
                    />
                </TabsContent>
            </Tabs>

            { }
            {isConnecting && (
                <Card className="fixed bottom-6 right-6 p-4 shadow-2xl border-primary/20 bg-background/95 backdrop-blur-md z-50 w-80 animate-in slide-in-from-bottom-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Connecting {isConnecting}</h4>
                                <p className="text-xs text-muted-foreground">Waiting for authentication...</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => dispatch(clearFacebookState())}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {facebookPages.length > 0 && (
                        <ScrollArea className="h-[300px] -mx-4 px-4">
                            <div className="space-y-2 py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-3 px-1 uppercase tracking-wider">Select a terminal to connect</p>
                                {facebookPages.map((page: any) => (
                                    <div key={page.id} className="group p-3 rounded-xl border bg-card/50 hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-background">
                                                    {page.picture?.data?.url ? (
                                                        <img src={page.picture.data.url} alt={page.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Facebook className="w-5 h-5 text-primary" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm truncate leading-tight mb-0.5">{page.name}</p>
                                                    <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal opacity-70">
                                                        FB Terminal
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnectFacebookPage(page.id)}
                                                disabled={connectingPage === page.id}
                                                className="rounded-lg h-8 px-3 shadow-sm hover:shadow-md transition-all active:scale-95"
                                            >
                                                {connectingPage === page.id ? (
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    'Connect'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </Card>
            )}

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

            <AssignBotDialog
                open={assignBotDialogOpen}
                onOpenChange={setAssignBotDialogOpen}
                channel={selectedChannel}
                workspaceId={workspaceId!}
                onSuccess={() => {
                    dispatch(setSelectedBotId(''));
                    setAssignBotDialogOpen(false);
                    refetch();
                }}
            />
        </div>
    );
}
