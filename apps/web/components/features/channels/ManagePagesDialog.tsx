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
import { Label } from '@/components/ui/Label';
import { Bot, CheckCircle2, Link2Off, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

interface ManagePagesDialogProps {
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

export function ManagePagesDialog({
  open,
  onOpenChange,
  channel,
  workspaceId,
  onSuccess,
}: ManagePagesDialogProps) {
  if (!channel) return null;

  const pages = channel.metadata?.pages || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-white/5 bg-background shadow-2xl rounded-2xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
          <DialogHeader className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transform -rotate-3">
                <Facebook className="w-8 h-8" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight uppercase">Manage Pages</DialogTitle>
                <DialogDescription className="text-sm font-medium opacity-70">
                  Manage Facebook Pages connected to <strong>{channel.name}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Page Info */}
            <div className="rounded-2xl border border-white/5 p-5 bg-muted/10 backdrop-blur-md shadow-sm relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">Current Connected Page</p>
                  <p className="text-lg font-black tracking-tight mt-1">{channel.metadata?.pageName || channel.name}</p>
                </div>
                <Badge variant="default" className="gap-1.5 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  ACTIVE
                </Badge>
              </div>
            </div>

            {/* Other Pages List */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pl-1">Available Pages</Label>
              {pages.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {pages.map((page: any) => {
                    const isCurrent = page.id === channel.metadata?.pageId;
                    return (
                      <div key={page.id} className={cn(
                        "flex items-center justify-between p-3 rounded-xl border border-white/5 transition-all",
                        isCurrent ? "bg-primary/10 border-primary/20" : "bg-muted/5 hover:bg-muted/10"
                      )}>
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", isCurrent ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                            <Facebook className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm leading-none">{page.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{page.category || 'Page'}</p>
                          </div>
                        </div>
                        {isCurrent ? (
                          <Badge variant="secondary" className="text-[9px] font-black">CURRENT</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] uppercase font-black" disabled>Connected</Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <p className="text-sm text-muted-foreground">No other pages found for this account.</p>
                </div>
              )}
            </div>

          </div>

          <DialogFooter className="gap-3 mt-8">
            <Button
              variant="outline"
              className="h-12 w-full font-black uppercase tracking-widest text-[9px] glass"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
