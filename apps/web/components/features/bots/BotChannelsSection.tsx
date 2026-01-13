'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import {
    Plus,
    Trash2,
    Globe,
    Settings,
    Share2,
    Copy,
    Check,
    Link as LinkIcon,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import { getChannels, updateChannel } from '@/lib/api/channels';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChannelIcon, getChannelColor, MESSAGING_CHANNELS } from '@/lib/constants/channels';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

interface Props {
    botId: string;
    botChannels: any[]; // These are current bot channels
    onRefresh: () => void;
    workspaceId?: string;
}

export function BotChannelsSection({ botId, botChannels, onRefresh, workspaceId }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [activeModalTab, setActiveModalTab] = useState<'link' | 'create'>('link');

    // Create state
    const [channelName, setChannelName] = useState('');

    // Link state
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');

    const [isActionLoading, setIsActionLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [disconnectId, setDisconnectId] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const queryKey = ['channels', 'connected', workspaceId];

    // Fetch all connected channels in the workspace
    const { data: allChannelsData } = useQuery({
        queryKey,
        queryFn: () => getChannels({ limit: 100 }),
        enabled: !!workspaceId
    });

    const allChannels = allChannelsData?.data || [];

    // Start action state
    const handleCreateWebChannel = async () => {
        if (!channelName.trim()) {
            toast.error('Channel name is required');
            return;
        }

        try {
            setIsActionLoading(true);
            await botsApi.createChannel(botId, { type: 'web', name: channelName });
            toast.success('Web channel created successfully');
            setShowModal(false);
            setChannelName('');
            onRefresh();
            queryClient.invalidateQueries({ queryKey });
        } catch {
            toast.error('Failed to create channel');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleLinkChannel = async () => {
        if (!selectedChannelId) return;

        try {
            setIsActionLoading(true);
            const channel = allChannels.find(c => c.id === selectedChannelId);
            if (!channel) return;

            // Link by updating the channel's metadata with botId
            await updateChannel(selectedChannelId, {
                metadata: {
                    ...channel.metadata,
                    botId: botId
                }
            });

            toast.success('Channel connected successfully');
            setShowModal(false);
            setSelectedChannelId('');
            onRefresh();
            queryClient.invalidateQueries({ queryKey });
        } catch {
            toast.error('Failed to connect channel');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleUnlink = (channelId: string) => {
        setDisconnectId(channelId);
    };

    const confirmUnlink = async () => {
        if (!disconnectId) return;

        try {
            // Check if it's a web channel (created via bot) or a linked channel
            const channel = botChannels.find(c => c.id === disconnectId)
                || allChannels.find(c => c.id === disconnectId);

            if (channel?.type === 'web') {
                // Delete web channels
                await botsApi.deleteChannel(botId, disconnectId);
                toast.success('Channel deleted');
            } else {
                // Unlink other channels by removing botId
                const fullChannel = allChannels.find(c => c.id === disconnectId);
                if (fullChannel) {
                    await updateChannel(disconnectId, {
                        metadata: {
                            ...fullChannel.metadata,
                            botId: null as any // Force null to clear the value in DB
                        }
                    });
                    toast.success('Channel disconnected');
                } else {
                    // Fallback if not found in global list
                    await botsApi.deleteChannel(botId, disconnectId);
                }
            }

            onRefresh();
            queryClient.invalidateQueries({ queryKey });
        } catch (error) {
            console.error(error);
            toast.error('Failed to disconnect');
        } finally {
            setDisconnectId(null);
        }
    };

    const handleToggle = async (channelId: string, isActive: boolean) => {
        try {
            await botsApi.toggleChannel(botId, channelId, !isActive);
            toast.success(isActive ? 'Channel deactivated' : 'Channel activated');
            onRefresh();
        } catch {
            toast.error('Failed to update channel');
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Merge channels: Web widgets come from botChannels, Linked integrations come from allChannelsData
    const webChannels = botChannels.filter(c => c.type === 'web');
    const linkedChannels = (allChannelsData?.data || []).filter(c => c.metadata?.botId === botId);
    const connectedChannels = [...webChannels, ...linkedChannels];

    const availableChannels = (allChannelsData?.data || []).filter(c => c.type !== 'web');

    return (
        <div className="space-y-8">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
                <CardHeader className="pb-4 border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">Connected Channels</span>
                                <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none text-[10px] font-black tracking-widest px-2.5 py-0.5">
                                    {connectedChannels.length}
                                </Badge>
                            </CardTitle>
                            <CardDescription className="font-medium mt-1">
                                Manage the communication endpoints for this neural core
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setShowModal(true)}
                            className="font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Connect Channel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {connectedChannels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="p-6 bg-primary/5 rounded-3xl mb-6 ring-8 ring-primary/5">
                                <Share2 className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">No Channels Connected</h3>
                            <p className="max-w-xs text-sm font-medium text-muted-foreground mt-2 mb-8">
                                Your bot is not connected to any external platforms. Link a configured channel to start interacting.
                            </p>
                            <Button
                                onClick={() => setShowModal(true)}
                                className="px-8 font-bold border-primary/20 transition-all active:scale-95 shadow-lg shadow-primary/10"
                            >
                                <LinkIcon className="w-4 h-4 mr-2" />
                                Connect Channel
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {connectedChannels.map((channel) => {
                                const isWeb = channel.type === 'web';
                                const isActive = isWeb ? channel.isActive : channel.status === 'active';

                                return (
                                    <Card key={channel.id} className="relative p-6 flex flex-col min-h-[220px]">
                                        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", getChannelColor(channel.type).split(' ')[0])} />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className={cn("p-3 rounded-xl shadow-inner", getChannelColor(channel.type))}>
                                                {getChannelIcon(channel.type)}
                                            </div>
                                            {isWeb && (
                                                <Switch
                                                    checked={isActive}
                                                    onCheckedChange={() => handleToggle(channel.id, isActive)}
                                                    className="scale-90 data-[state=checked]:bg-primary"
                                                />
                                            )}
                                        </div>

                                        <div className="mb-6 relative z-10">
                                            <h4 className="font-bold text-lg tracking-tight line-clamp-1 group-hover:text-primary transition-colors" title={channel.name}>
                                                {channel.metadata?.pageName || channel.name}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="capitalize text-[10px] font-black tracking-widest px-2 py-0 border-transparent bg-muted/60">
                                                    {channel.type}
                                                </Badge>
                                                {isActive ? (
                                                    <Badge variant="default" className="text-[10px] uppercase tracking-widest px-2">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-muted-foreground text-[10px] uppercase tracking-widest px-2">Offline</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border/40 mt-auto relative z-10">
                                            {channel.type !== 'web' && (
                                                <div className="text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-border/40">
                                                    Connected as <span className="font-semibold text-foreground">{channel.metadata?.connectedBy || 'Admin'}</span>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => handleUnlink(channel.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    {channel.type === 'web' ? 'Delete' : 'Disconnect'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Connect Channel</DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            Link an existing integration or create a new web widget.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeModalTab} onValueChange={(v) => setActiveModalTab(v as 'link' | 'create')} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full mb-6">
                            <TabsTrigger value="link" className="font-bold">Link Existing</TabsTrigger>
                            <TabsTrigger value="create" className="font-bold">Web Widget</TabsTrigger>
                        </TabsList>

                        <TabsContent value="link" className="space-y-4">
                            <div className="space-y-2.5">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Select Channel</Label>
                                <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                                    <SelectTrigger className="h-11 font-bold">
                                        <SelectValue placeholder="Choose a channel..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[200px]">
                                        {allChannelsData === undefined ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                Loading channels...
                                            </div>
                                        ) : availableChannels.filter(c => c.type !== 'web' && c.metadata?.botId !== botId).length === 0 ? (
                                            <div className="p-4 text-center text-sm text-muted-foreground">
                                                No available channels found. <br />
                                                <a href="/channels" className="text-primary hover:underline">Configure Integrations</a> first.
                                            </div>
                                        ) : (
                                            availableChannels
                                                .filter(c => c.type !== 'web' && c.metadata?.botId !== botId)
                                                .map(channel => (
                                                    <SelectItem key={channel.id} value={channel.id}>
                                                        <div className="flex items-center gap-2">
                                                            {getChannelIcon(channel.type)}
                                                            <span>{channel.metadata?.pageName || channel.name} <span className="text-muted-foreground text-xs">({channel.type})</span></span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start">
                                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                                    <p className="font-bold mb-1">Don't see your channel?</p>
                                    <p>Go to <a href="/channels" className="underline hover:text-yellow-500">Integrations</a> to connect new accounts (Facebook, Telegram, etc.)</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleLinkChannel}
                                disabled={!selectedChannelId || isActionLoading}
                                className="w-full font-bold h-10 mt-2"
                            >
                                {isActionLoading ? 'Connecting...' : 'Link Channel'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="create" className="space-y-4">
                            <div className="space-y-2.5">
                                <Label htmlFor="channel-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Widget Name</Label>
                                <Input
                                    id="channel-name"
                                    placeholder="e.g. Website Customer Support"
                                    value={channelName}
                                    onChange={(e) => setChannelName(e.target.value)}
                                    className="h-11 font-bold"
                                />
                            </div>
                            <Button
                                onClick={handleCreateWebChannel}
                                disabled={!channelName.trim() || isActionLoading}
                                className="w-full font-bold h-10 mt-2"
                            >
                                {isActionLoading ? 'Creating...' : 'Create Web Widget'}
                            </Button>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <AlertDialogConfirm
                open={!!disconnectId}
                onOpenChange={(open) => !open && setDisconnectId(null)}
                title="Disconnect Channel"
                description="Are you sure you want to disconnect this channel? The channel configuration will remain in your workspace."
                onConfirm={confirmUnlink}
                variant="destructive"
                confirmText="Disconnect"
            />
        </div>
    );
}

