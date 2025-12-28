'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingLogo } from '@/components/ui/LoadingLogo';
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
import { Label } from '@/components/ui/Label';
import { Bot, CheckCircle2 } from 'lucide-react';
import axiosClient from '@/lib/axios-client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';

interface AssignBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: {
    id: string;
    name: string;
    type: string;
    botId?: string | null;
  } | null;
  workspaceId: string;
  onSuccess?: () => void;
}

interface BotOption {
  id: string;
  name: string;
  status: string;
  aiModelName?: string;
}

export function AssignBotDialog({
  open,
  onOpenChange,
  channel,
  workspaceId,
  onSuccess,
}: AssignBotDialogProps) {
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && workspaceId) {
      loadBots();
    }
  }, [open, workspaceId]);

  useEffect(() => {
    if (channel?.botId) {
      setSelectedBotId(channel.botId);
    } else {
      setSelectedBotId('');
    }
  }, [channel]);

  const loadBots = async () => {
    try {
      setLoading(true);
      const response: any = await axiosClient.get(`/bots?workspaceId=${workspaceId}`);

      let botsList: BotOption[] = [];
      if (Array.isArray(response)) {
        botsList = response;
      } else if (response?.items) {
        botsList = response.items;
      }

      // Filter active bots
      const activeBots = botsList.filter((b: any) => b.status === 'active' || b.isActive);
      setBots(activeBots);

    } catch (error) {
      console.error('Failed to load bots:', error);
      toast.error('Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!channel || !selectedBotId) {
      toast.error('Please select a bot');
      return;
    }

    setSaving(true);

    // Create the API promise
    const assignPromise = axiosClient.patch(`/channels/${channel.id}`, {
      botId: selectedBotId,
    });

    // Use toast.promise - toast will show AFTER API responds
    toast.promise(assignPromise, {
      loading: 'Assigning bot...',
      success: 'Bot assigned successfully',
      error: (err) => err.response?.data?.message || 'Failed to assign bot'
    });

    try {
      await assignPromise;
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to assign bot:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!channel) return;

    setSaving(true);

    // Create the API promise
    const removePromise = axiosClient.patch(`/channels/${channel.id}`, {
      botId: null,
    });

    // Use toast.promise - toast will show AFTER API responds
    toast.promise(removePromise, {
      loading: 'Removing bot...',
      success: 'Bot removed successfully',
      error: (err) => err.response?.data?.message || 'Failed to remove bot'
    });

    try {
      await removePromise;
      setSelectedBotId('');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to remove bot:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!channel) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-white/5 bg-background shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transform -rotate-3">
                <Bot className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight">Assign AI Agent</DialogTitle>
                <DialogDescription className="text-sm font-medium opacity-70">
                  Select a target bot for <strong>{channel.name}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Channel Info */}
            <div className="rounded-2xl border border-white/5 p-5 bg-muted/10 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Bot className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-lg font-black tracking-tight">{channel.name}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{channel.type} Connection</p>
                </div>
                {channel.botId && (
                  <Badge variant="outline" rounded="lg" className="gap-1.5 text-success border-success/30 bg-success/10 font-bold py-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    AUTHORIZED
                  </Badge>
                )}
              </div>
            </div>

            {/* Bot Selector */}
            <div className="space-y-3">
              <Label htmlFor="bot-select" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Agent Selection</Label>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 glass rounded-2xl border border-white/5">
                  <LoadingLogo size="sm" text="Synchronizing agents..." />
                </div>
              ) : bots.length === 0 ? (
                <div className="text-center py-10 glass rounded-2xl border border-white/5 shadow-inner">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-muted-foreground">No active agents recovered</p>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-50 mt-1.5">Initialize a bot in the central hub</p>
                </div>
              ) : (
                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                  <SelectTrigger id="bot-select" className="h-14 glass rounded-xl border-white/5 pl-4 hover:border-primary/40 focus:ring-primary/40 transition-all font-bold">
                    <SelectValue placeholder="Select an AI agent..." />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-xl shadow-2xl">
                    {bots.map((bot) => (
                      <SelectItem key={bot.id} value={bot.id} className="rounded-lg m-1 font-bold focus:bg-primary focus:text-primary-foreground">
                        <div className="flex items-center gap-3">
                          <Bot className="w-4 h-4 opacity-60" />
                          <span>{bot.name}</span>
                          {bot.aiModelName && (
                            <Badge variant="outline" rounded="lg" className="text-[9px] uppercase font-black tracking-tighter opacity-70">
                              {bot.aiModelName}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Info */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-pulse flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed text-foreground/70">
                Deployment Protocol: the selected bot will immediately begin processing and responding to incoming traffic from this connection point.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 mt-10">
            {channel.botId && (
              <Button
                variant="ghost"
                rounded="xl"
                className="h-12 flex-1 font-black uppercase tracking-widest text-[10px] text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleRemove}
                disabled={saving}
              >
                Sever Link
              </Button>
            )}
            <Button
              variant="outline"
              rounded="xl"
              className="h-12 flex-1 font-black uppercase tracking-widest text-[10px] glass border-white/10"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              loading={saving}
              rounded="xl"
              className="h-12 flex-[2] font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 active:scale-95 transition-all"
              onClick={handleSave}
              disabled={!selectedBotId || loading}
            >
              Confirm Deployment
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
