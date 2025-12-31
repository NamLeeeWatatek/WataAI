"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import axiosClient from '@/lib/axios-client';
import toast from '@/lib/toast';
import { loadChannelsData, disconnectChannelAsync, deleteConfigAsync, createConfigAsync, updateConfigAsync, loadBotsForFacebook } from '@/lib/store/slices/channelsSlice';
import {
    setConnecting,
    setFacebookPages,
    setFacebookTempToken,
    setConnectingPage,
    setSelectedBotId,
    setActiveTab,
    setDisconnectId,
    setDeleteConfigId,
    setAssignBotDialogOpen,
    setSelectedChannel,
    clearFacebookState
} from '@/lib/store/slices/channelsSlice';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import {
    RefreshCw,
    X,
    Facebook,
    LayoutGrid,
    List,
    Search,
    Settings,
    UserPlus,
    Activity,
    Globe
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { AssignBotDialog } from '@/components/features/channels/AssignBotDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { ConnectedChannelsTab, ChannelConfigurationsTab } from '@/components/features/channels';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { FiFacebook } from 'react-icons/fi';
import { cn } from '@/lib/utils';

export default function ChannelsPageRefactored() {
    const { user, accessToken } = useAuth();
    const session = { user: { id: user?.id, ...user }, accessToken };
    const { currentWorkspace } = useWorkspace();
    const dispatch = useAppDispatch();

    const {
        channels,
        configs,
        isLoading,
        facebookPages,
        facebookTempToken,
        connectingPage,
        bots,
        selectedBotId,
        loadingBots,
        activeTab,
        disconnectId,
        deleteConfigId,
        assignBotDialogOpen,
        selectedChannel
    } = useAppSelector(state => state.channels);

    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        dispatch(loadChannelsData());
    }, [dispatch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const loadData = () => {
        dispatch(loadChannelsData());
    };

    const handleConnect = async (provider: string, configId?: string) => {
        dispatch(setConnecting(provider));

        try {
            let oauthUrl: string;

            if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                const response = await axiosClient.get('/channels/facebook/oauth/url') as any;

                if (!response.url) {
                    toast.error('Please configure Facebook App settings first');
                    dispatch(setConnecting(null));
                    return;
                }

                oauthUrl = response.url;
            } else {
                const config = configId ? configs.find(c => c.id === configId) : configs.find(c => c.provider === provider);
                if (!config) {
                    toast.error(`Please configure ${provider} settings first`);
                    dispatch(setConnecting(null));
                    return;
                }

                const response = await axiosClient.get(`/channels/oauth/${provider}/url`, { params: { configId } }) as any;
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
                toast.error('Popup blocked! Please allow popups for this site.');
                dispatch(setConnecting(null));
                return;
            }

            const messageHandler = (event: MessageEvent) => {
                if (event.data?.status === 'success') {
                    if ((provider === 'facebook' || provider === 'messenger' || provider === 'instagram') && event.data.pages) {
                        dispatch(setFacebookPages(event.data.pages));
                        dispatch(setFacebookTempToken(event.data.tempToken));
                        toast.success(`Found ${event.data.pages.length} Facebook page(s)`);

                        const wsId = currentWorkspace?.id || event.data.workspaceId || (session as any)?.user?.workspaceId;
                        if (wsId) {
                            dispatch(loadBotsForFacebook(wsId));
                        }

                        popup?.close();
                        window.removeEventListener('message', messageHandler);
                        dispatch(setConnecting(null));
                    } else {
                        toast.success(`Connected to ${event.data.channel || provider}`);
                        popup?.close();
                        window.removeEventListener('message', messageHandler);

                        setTimeout(async () => {
                            dispatch(loadChannelsData());
                            dispatch(setConnecting(null));
                        }, 1000);
                    }
                } else if (event.data?.status === 'error') {
                    toast.error(`Connection failed: ${event.data.message || event.data.channel || 'Unknown error'}`);

                    if (provider === 'facebook' || provider === 'messenger' || provider === 'instagram') {
                        dispatch(clearFacebookState());
                    }

                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    dispatch(setConnecting(null));
                }
            };

            window.addEventListener('message', messageHandler);

            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed);
                    dispatch(setConnecting(null));
                    window.removeEventListener('message', messageHandler);
                }
            }, 1000);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to start connection: ${message}`);
            dispatch(setConnecting(null));
        }
    };

    const handleDisconnect = (id: string) => {
        dispatch(setDisconnectId(id));
    };

    const confirmDisconnect = () => {
        if (disconnectId) {
            dispatch(disconnectChannelAsync(disconnectId));
        }
    };

    const handleConnectFacebookPage = async (page: any) => {
        if (!selectedBotId) {
            toast.error('Please select a bot first');
            return;
        }

        if (!facebookTempToken) {
            toast.error('Session expired. Please reconnect Facebook again.');
            dispatch(setFacebookPages([]));
            return;
        }

        dispatch(setConnectingPage(true));

        try {
            await axiosClient.post('/channels/facebook/connect', {
                pageId: page.id,
                pageName: page.name,
                userAccessToken: facebookTempToken,
                category: page.category,
                botId: selectedBotId
            });

            const selectedBot = bots.find(b => b.id === selectedBotId);
            toast.success(`Connected ${page.name} to bot "${selectedBot?.name}"`);

            dispatch(setFacebookPages(facebookPages.filter(p => p.id !== page.id)));
            dispatch(loadChannelsData());
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to connect page';
            toast.error(errorMessage);

            if (errorMessage.includes('authorization') || errorMessage.includes('token')) {
                dispatch(clearFacebookState());
                toast.info('Please reconnect Facebook to continue');
            }
        } finally {
            dispatch(setConnectingPage(false));
        }
    };

    const handleDeleteConfig = () => {
        if (deleteConfigId) {
            dispatch(deleteConfigAsync(deleteConfigId));
        }
    };

    const handleSaveConfig = async (config: any) => {
        try {
            if (config.id) {
                await dispatch(updateConfigAsync({ id: config.id, data: config }));
            } else {
                await dispatch(createConfigAsync(config));
            }
            toast.success('Configuration saved successfully!');
            dispatch(loadChannelsData());
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save configuration';
            toast.error(message);
        }
    };

    const handleAssignBot = (channel: any) => {
        dispatch(setSelectedChannel(channel));
        dispatch(setAssignBotDialogOpen(true));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <PageHeader
                title="Channels & Integrations"
                description="Connect and orchestrate your communication channels with centralized AI control."
                onRefresh={loadData}
                refreshing={isLoading}
                className="px-1"
            />

            <Tabs value={activeTab} onValueChange={(value) => dispatch(setActiveTab(value as 'connected' | 'configurations'))} className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="connected">
                        Connections ({channels.length})
                    </TabsTrigger>
                    <TabsTrigger value="configurations">
                        Configurations ({configs.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="connected" className="mt-6">
                    <ConnectedChannelsTab
                        channels={channels.map(c => ({ ...c, createdAt: c.connected_at }))}
                        searchQuery={searchQuery}
                        viewMode={viewMode}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalCount={channels.length}
                        selectedIds={selectedIds}
                        onSearchChange={setSearchQuery}
                        onViewModeChange={setViewMode}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                        onToggleSelection={(id) => {
                            setSelectedIds(prev =>
                                prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                            );
                        }}
                        onClearSelection={() => setSelectedIds([])}
                        onAssignBot={handleAssignBot}
                        onDisconnect={handleDisconnect}
                        onLoadData={() => dispatch(setActiveTab('configurations'))}
                        isLoading={isLoading}
                    />
                </TabsContent>

                <TabsContent value="configurations" className="mt-6">
                    <ChannelConfigurationsTab
                        configs={configs.map(c => ({ ...c, name: c.name || '' }))}
                        isLoading={isLoading}
                        onSaveConfig={handleSaveConfig}
                        onDeleteConfig={(id) => dispatch(setDeleteConfigId(id))}
                        onConnect={handleConnect}
                    />
                </TabsContent>
            </Tabs>

            {facebookPages.length > 0 && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in zoom-in duration-300">
                    <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-border/40 flex items-center justify-between bg-card/50">
                            <div>
                                <h3 className="text-2xl font-black tracking-tight">Connect Facebook Pages</h3>
                                <p className="text-sm text-muted-foreground mt-1 font-medium">
                                    Select a target bot and link your available pages
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => dispatch(clearFacebookState())}
                                className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-8">
                                <AlertBanner variant="info" title="Select Bot Gateway" className="rounded-xl border-primary/20 bg-primary/5">
                                    {loadingBots ? (
                                        <div className="flex items-center gap-3 py-2 font-bold text-primary">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Synchronizing bots...</span>
                                        </div>
                                    ) : bots.length === 0 ? (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <p className="font-bold opacity-80 text-muted-foreground">No active AI agents found in this workspace.</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open('/bots', '_blank')}
                                                className="bg-background"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Create Your First Bot
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-1">
                                            <select
                                                value={selectedBotId}
                                                onChange={(e) => dispatch(setSelectedBotId(e.target.value))}
                                                className="w-full bg-background/50 rounded-xl px-4 py-3 border border-border/40 focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3 font-bold transition-all"
                                            >
                                                {bots.map((bot) => (
                                                    <option key={bot.id} value={bot.id} className="bg-card">
                                                        {bot.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs font-semibold text-muted-foreground opacity-80">
                                                All incoming messages from linked pages will be processed by this agent.
                                            </p>
                                        </div>
                                    )}
                                </AlertBanner>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Available Direct Connections ({facebookPages.length})</h4>
                                    </div>
                                    <div className="grid gap-4">
                                        {facebookPages.map((page) => (
                                            <div
                                                key={page.id}
                                                className="flex items-center justify-between p-4 bg-muted/5 border border-border/40 rounded-2xl hover:bg-muted/10 transition-all duration-300 group"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 rounded-xl bg-primary/10 text-primary shadow-inner group-hover:rotate-6 transition-transform duration-500">
                                                        <Facebook className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-lg tracking-tight">{page.name}</h4>
                                                        <p className="text-sm font-semibold text-muted-foreground opacity-70">{page.category}</p>
                                                        {page.tasks && page.tasks.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                                {page.tasks.slice(0, 3).map((task: string) => (
                                                                    <Badge key={task} variant="outline" className="text-[9px] uppercase font-bold tracking-wider py-0 px-2 opacity-60">
                                                                        {task}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button
                                                    size="lg"
                                                    onClick={() => handleConnectFacebookPage(page)}
                                                    disabled={connectingPage || !selectedBotId || bots.length === 0}
                                                    className="px-8 font-black transition-all"
                                                >
                                                    {connectingPage ? 'Connecting...' : 'Link Page'}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </Card>
                </div>
            )}

            <AlertDialogConfirm
                open={disconnectId !== null}
                onOpenChange={(open) => !open && dispatch(setDisconnectId(null))}
                title="Disconnect Channel"
                description="Are you sure you want to disconnect this channel? This action cannot be undone."
                confirmText="Disconnect"
                cancelText="Cancel"
                onConfirm={confirmDisconnect}
                variant="destructive"
            />

            <AlertDialogConfirm
                open={deleteConfigId !== null}
                onOpenChange={(open) => !open && dispatch(setDeleteConfigId(null))}
                title="Delete Configuration"
                description="Are you sure you want to delete this configuration? All connected channels using this config will be disconnected."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDeleteConfig}
                variant="destructive"
            />

            {currentWorkspace && (
                <AssignBotDialog
                    open={assignBotDialogOpen}
                    onOpenChange={(open) => dispatch(setAssignBotDialogOpen(open))}
                    channel={selectedChannel}
                    workspaceId={currentWorkspace.id}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
}
