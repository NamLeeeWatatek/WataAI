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
    MessageCircle,
    Send,
    MessageSquare,
    Hash,
    Gamepad2,
    Settings,
    Share2,
    Copy,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { botsApi } from '@/lib/api/bots';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface Props {
    botId: string;
    botChannels: any[];
    onRefresh: () => void;
}

const CHANNEL_ICONS: Record<string, any> = {
    web: Globe,
    facebook: MessageCircle,
    telegram: Send,
    whatsapp: MessageSquare,
    slack: Hash,
    discord: Gamepad2
};

const CHANNEL_COLORS: Record<string, string> = {
    web: 'text-blue-500 bg-blue-50 dark:bg-blue-900/10',
    facebook: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10',
    telegram: 'text-sky-500 bg-sky-50 dark:bg-sky-900/10',
    whatsapp: 'text-green-500 bg-green-50 dark:bg-green-900/10',
    slack: 'text-purple-500 bg-purple-50 dark:bg-purple-900/10',
    discord: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10',
};

export function BotChannelsSection({ botId, botChannels, onRefresh }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [channelType, setChannelType] = useState('web');
    const [channelName, setChannelName] = useState('');
    const [creating, setCreating] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!channelName.trim()) {
            toast.error('Channel name is required');
            return;
        }

        try {
            setCreating(true);
            await botsApi.createChannel(botId, { type: channelType, name: channelName });
            toast.success('Channel created successfully');
            setShowModal(false);
            setChannelName('');
            setChannelType('web');
            onRefresh();
        } catch {
            toast.error('Failed to create channel');
        } finally {
            setCreating(false);
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

    const handleDelete = async (channelId: string) => {
        if (!confirm('Are you sure you want to delete this channel? Only the configuration will be removed.')) return;

        try {
            await botsApi.deleteChannel(botId, channelId);
            toast.success('Channel deleted');
            onRefresh();
        } catch {
            toast.error('Failed to delete channel');
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <>
            <Card className="rounded-2xl border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 group-hover:via-primary/70 transition-all duration-500" />
                <CardHeader className="pb-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner">
                                <Share2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">Integration Channels</CardTitle>
                                <CardDescription className="text-xs font-medium">Connect your bot to external platforms</CardDescription>
                            </div>
                        </div>
                        <Button onClick={() => setShowModal(true)} className="rounded-xl shadow-lg shadow-primary/10 font-bold h-10 transition-all active:scale-95">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Channel
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {botChannels.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in duration-700">
                            <div className="p-6 bg-primary/5 rounded-3xl mb-6 ring-8 ring-primary/5 animate-pulse">
                                <Share2 className="w-10 h-10 text-primary opacity-40" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight">Isostated Environment</h3>
                            <p className="max-w-xs text-sm font-medium text-muted-foreground mt-2 mb-8">
                                Your bot is currently isolated. Connect it to external platforms to begin production interactions.
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => setShowModal(true)}
                                className="rounded-full px-8 font-bold border-primary/20 hover:bg-primary/5 hover:text-primary shadow-xl shadow-primary/5 transition-all active:scale-95"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Initialize First Channel
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {botChannels.map((channel) => {
                                const Icon = CHANNEL_ICONS[channel.type] || Globe;
                                const colorClass = CHANNEL_COLORS[channel.type] || 'text-muted-foreground bg-muted/20';

                                return (
                                    <div key={channel.id} className="relative group p-6 border border-border/50 rounded-2xl hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 bg-card/40 backdrop-blur-sm overflow-hidden flex flex-col">
                                        <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20", colorClass.split(' ')[0])} />

                                        <div className="flex justify-between items-start mb-6 relative z-10">
                                            <div className={cn("p-3 rounded-xl shadow-inner", colorClass)}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <Switch
                                                checked={channel.isActive}
                                                onCheckedChange={() => handleToggle(channel.id, channel.isActive)}
                                                className="scale-90 data-[state=checked]:bg-primary"
                                            />
                                        </div>

                                        <div className="mb-6 relative z-10">
                                            <h4 className="font-bold text-lg tracking-tight line-clamp-1 group-hover:text-primary transition-colors" title={channel.name}>{channel.name}</h4>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="secondary" className="capitalize text-[10px] font-black tracking-widest px-2 py-0 border-transparent bg-muted/60">
                                                    {channel.type}
                                                </Badge>
                                                {channel.isActive ? (
                                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] font-black uppercase tracking-widest py-0 px-2">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground border-border/60 text-[10px] font-black uppercase tracking-widest py-0 px-2 bg-muted/20">Offline</Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-border/40 mt-auto relative z-10">
                                            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-muted-foreground/60 bg-muted/20 px-3 py-1.5 rounded-lg border border-border/40">
                                                <span className="truncate mr-2 flex items-center gap-1.5">
                                                    <Hash className="w-3 h-3 text-primary opacity-50" />
                                                    {channel.id.substring(0, 12)}...
                                                </span>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                onClick={() => copyToClipboard(channel.id, channel.id)}
                                                                className="hover:text-primary p-1 bg-background/50 rounded transition-colors"
                                                            >
                                                                {copiedId === channel.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="rounded-lg p-2 font-bold text-xs">Copy Channel ID</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 font-bold bg-background/50 border-border/60 hover:bg-primary/5 hover:text-primary transition-all" disabled>
                                                    <Settings className="w-3.5 h-3.5 mr-2" />
                                                    Configure
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                                    onClick={() => handleDelete(channel.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="max-w-md rounded-3xl border-border/40 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Add Channel</DialogTitle>
                        <DialogDescription className="text-sm font-medium">
                            Enable user interactions through external messaging platforms.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2.5">
                            <Label htmlFor="channel-type" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Select Platform</Label>
                            <Select value={channelType} onValueChange={setChannelType}>
                                <SelectTrigger id="channel-type" className="h-12 rounded-xl border-border/60 bg-muted/20 transition-all font-bold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl p-1">
                                    <SelectItem value="web" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">Web Widget</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="facebook" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-blue-600/10 text-blue-600">
                                                <MessageCircle className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">Facebook Messenger</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="telegram" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-500">
                                                <Send className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">Telegram Bot</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="whatsapp" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">WhatsApp Business</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="slack" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                                                <Hash className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">Slack App</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="discord" className="rounded-lg py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500">
                                                <Gamepad2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold">Discord Bot</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="channel-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Connection Name</Label>
                            <Input
                                id="channel-name"
                                placeholder="e.g. Production Support, Dev Environment..."
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                className="h-11 rounded-xl border-border/60 bg-muted/20 focus:bg-background transition-all font-bold"
                            />
                            <p className="text-[10px] font-medium text-muted-foreground px-1">Used to identify this connection in your dashboard.</p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="rounded-xl font-bold">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={creating}
                            className="rounded-xl px-8 font-black shadow-lg shadow-primary/20 transition-all active:scale-95"
                        >
                            {creating ? 'Initializing...' : 'Add Channel'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
