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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/Dialog';
import { PageHeader } from '@/components/ui/PageHeader';
// import { PageShell } from '@/components/layout/PageShell';
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
    const [activeTab, setActiveTab] = useState<'connected' | 'configurations'>('connected');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(12);
    const [disconnectId, setDisconnectId] = useState<string | null>(null);
    const [deleteConfigId, setDeleteConfigId] = useState<string | null>(null);
    const [managePagesDialogOpen, setManagePagesDialogOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

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
                        // We intentionally DON'T clear setConnecting(null) here 
                        // so the selection list stays visible in the toast card
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

    const handleConnectFacebookPage = async (page: any) => {
        console.log('[DEBUG] Connecting Facebook Page:', {
            pageId: page.id,
            pageName: page.name,
            tokenExists: !!facebookTempToken,
            tokenType: typeof facebookTempToken,
            tokenPrefix: typeof facebookTempToken === 'string' ? facebookTempToken.substring(0, 10) : 'N/A'
        });
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

            toast.success('Facebook page connected successfully');
            dispatch(setFacebookPages(facebookPages.filter(p => p.id !== page.id)));
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

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'connected' | 'configurations')} className="flex-1 flex flex-col">
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
                    </TabsList>
                </TabsHeader>

                <div className="flex-1">
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

            <Dialog
                open={!!isConnecting}
                onOpenChange={(open) => {
                    if (!open) dispatch(clearFacebookState());
                }}
            >
                <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
                                <Facebook className="w-5 h-5" />
                            </div>
                            Connect Facebook Pages
                        </DialogTitle>
                        <DialogDescription>
                            Select the Facebook Pages you want to connect to WataAI. You can manage multiple pages from a single account.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
                        {facebookPages.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {facebookPages.map((page: ChannelPage) => (
                                    <div
                                        key={page.id}
                                        className="group flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-200"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-background shadow-sm">
                                            {page.picture?.data?.url ? (
                                                <img src={page.picture.data.url} alt={page.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Facebook className="w-6 h-6 text-primary" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-semibold text-sm truncate leading-tight">{page.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="text-[10px] h-5 font-normal opacity-70">
                                                            {page.category || 'Page'}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-[10px] h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                                                            FB Terminal
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground line-clamp-2 pt-1">
                                                ID: {page.id}
                                            </p>
                                        </div>

                                        <div className="flex items-center ml-4">
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnectFacebookPage(page)}
                                                disabled={connectingPage === page.id}
                                                className={cn(
                                                    "rounded-lg shadow-sm transition-all",
                                                    connectingPage === page.id ? "w-24" : "w-auto"
                                                )}
                                            >
                                                {connectingPage === page.id ? (
                                                    <>
                                                        <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                                                        Connecting
                                                    </>
                                                ) : (
                                                    'Connect'
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4 text-center">
                                <div className="p-4 rounded-full bg-primary/5 border border-primary/10 animate-pulse">
                                    <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold">Waiting for Authorization</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                        Please complete the authorization process in the popup window.
                                        Once authorized, your pages will appear here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

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
        </div >
    );
}
