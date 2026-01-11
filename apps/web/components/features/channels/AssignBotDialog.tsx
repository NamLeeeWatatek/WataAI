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
import { Bot, CheckCircle2, Link2Off } from 'lucide-react';
import axiosClient from '@/lib/axios-client';
import { toast } from '@/lib/toast';
import { Badge } from '@/components/ui/Badge';
import { useBots } from '@/lib/hooks/features/useBots';
import type { Bot as BotType } from '@/lib/api/bots';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { channelKeys } from '@/lib/hooks/features/useChannels';

interface AssignBotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: {
    id: string;
    name: string;
    type: string;
    botId?: string | null;
    metadata?: any;
  } | null;
  workspaceId: string;
  onSuccess?: () => void;
}

export function AssignBotDialog({
  open,
  onOpenChange,
  channel,
  workspaceId,
  onSuccess,
}: AssignBotDialogProps) {
  const queryClient = useQueryClient();
  const { data: botsResponse, isLoading: loadingBots } = useBots(workspaceId);
  const botsData = botsResponse?.data || [];
  const [selectedBotId, setSelectedBotId] = useState<string>('');

  useEffect(() => {
    if (channel?.botId) {
      setSelectedBotId(channel.botId);
    } else {
      setSelectedBotId('');
    }
  }, [channel]);

  const activeBots = (botsData || []).filter((b: any) => b.isActive || b.status === 'active');

  const assignMutation = useMutation({
    mutationFn: ({ botId, pageId, parentId }: { botId: string | null, pageId?: string, parentId?: string }) => {
      if (parentId && pageId) {
        return axiosClient.patch(`/channels/${parentId}`, { botId, pageId });
      }
      return axiosClient.patch(`/channels/${channel?.id}`, { botId });
    },
    onSuccess: () => {
      toast.success(selectedBotId ? 'Đã kết nối bot thành công' : 'Đã hủy kết nối bot');
      queryClient.invalidateQueries({ queryKey: channelKeys.channels(workspaceId) });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu cấu hình');
    }
  });

  const handleSave = () => {
    if (!channel || (!selectedBotId && selectedBotId !== null)) return;

    if (channel.metadata?.isPage && channel.metadata?.parentId) {
      assignMutation.mutate({
        botId: selectedBotId,
        pageId: channel.metadata.id,
        parentId: channel.metadata.parentId
      });
    } else {
      assignMutation.mutate({ botId: selectedBotId });
    }
  };

  const handleRemove = () => {
    if (!channel) return;
    if (channel.metadata?.isPage && channel.metadata?.parentId) {
      assignMutation.mutate({
        botId: null,
        pageId: channel.metadata.id,
        parentId: channel.metadata.parentId
      });
    } else {
      assignMutation.mutate({ botId: null });
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
                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Kết Nối AI Bot</DialogTitle>
                <DialogDescription className="text-sm font-medium opacity-70">
                  Chọn AI Bot để tự động phản hồi trên kênh <strong>{channel.name}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/5 p-5 bg-muted/10 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <Bot className="w-16 h-16 transform group-hover:scale-110 transition-transform duration-700" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-lg font-black tracking-tight">{channel.name}</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">{channel.type} Channel</p>
                </div>
                {channel.botId && (
                  <Badge variant="outline" className="gap-1.5 text-primary border-primary/30 bg-primary/10 font-black py-1 tracking-widest text-[9px]">
                    <CheckCircle2 className="w-3 h-3" />
                    ĐÃ KẾT NỐI
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="bot-select" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Chọn Bot</Label>
              {loadingBots ? (
                <div className="flex flex-col items-center justify-center py-10 glass rounded-2xl border border-white/5">
                  <LoadingLogo size="sm" text="Đang tải danh sách bot..." />
                </div>
              ) : activeBots.length === 0 ? (
                <div className="text-center py-10 glass rounded-2xl border border-white/5 shadow-inner">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-muted-foreground">Không tìm thấy bot nào đang hoạt động</p>
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-50 mt-1.5">Vui lòng tạo bot mới trong menu Bot</p>
                </div>
              ) : (
                <Select value={selectedBotId || 'none'} onValueChange={(val) => setSelectedBotId(val === 'none' ? '' : val)}>
                  <SelectTrigger id="bot-select" className="h-14 glass rounded-xl border-white/5 pl-4 hover:border-primary/40 focus:ring-primary/40 transition-all font-bold">
                    <SelectValue placeholder="Chọn bot để kết nối..." />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10 rounded-xl shadow-2xl">
                    <SelectItem value="none" className="rounded-lg m-1 font-bold text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <Link2Off className="w-4 h-4 opacity-60" />
                        <span>Không chọn Bot (Ngắt kết nối)</span>
                      </div>
                    </SelectItem>
                    {activeBots.map((bot: BotType) => (
                      <SelectItem key={bot.id} value={bot.id} className="rounded-lg m-1 font-bold focus:bg-primary focus:text-primary-foreground">
                        <div className="flex items-center gap-3">
                          <Bot className="w-4 h-4 opacity-60" />
                          <span>{bot.name}</span>
                          {bot.aiModelName && (
                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-tighter opacity-70">
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

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1 animate-pulse flex-shrink-0" />
              <p className="text-xs font-bold leading-relaxed text-foreground/70">
                Lưu ý: Bot được chọn sẽ tự động xử lý tất cả tin nhắn và tương tác trên kênh này ngay lập tức.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-3 mt-10">
            <Button
              variant="outline"
              className="h-12 flex-1 font-black uppercase tracking-widest text-[9px] glass"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Đóng
            </Button>
            <Button
              loading={assignMutation.isPending}
              className="h-12 flex-[2] font-black uppercase tracking-widest text-[9px] shadow-xl shadow-primary/20"
              onClick={handleSave}
              disabled={loadingBots}
            >
              Lưu kết nối
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
