"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { BotStatus } from '@/lib/types/bots';
import { Sparkles, Trash2, AlertTriangle, Settings2, ShieldAlert } from 'lucide-react';

interface BotSettingsTabProps {
  enableAutoLearn: boolean;
  status: BotStatus;
  onChange: (updates: { enableAutoLearn?: boolean, status?: BotStatus }) => void;
  onDelete?: () => void;
}

export function BotSettingsTab({ enableAutoLearn, status, onChange, onDelete }: BotSettingsTabProps) {
  return (
    <div className="space-y-8">
      <Card className="border-none shadow-xl bg-background/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">System Settings</CardTitle>
              <CardDescription className="text-xs font-medium text-muted-foreground/60">Configure execution status and neural parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          {/* Status Control */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border border-border/40 rounded-2xl bg-muted/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-primary" />
                <Label className="text-sm font-bold tracking-tight uppercase">Operational Status</Label>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground/70 ml-6">Determine the current execution mode of the agent</p>
            </div>
            <div className="w-full md:w-48">
              <Select value={status} onValueChange={(val) => onChange({ status: val as BotStatus })}>
                <SelectTrigger className="bg-background/50 font-black text-xs h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="active" className="text-green-500 font-bold">ACTIVE</SelectItem>
                  <SelectItem value="paused" className="text-amber-500 font-bold">PAUSED</SelectItem>
                  <SelectItem value="draft" className="text-muted-foreground font-bold">DRAFT</SelectItem>
                  <SelectItem value="archived" className="text-destructive font-bold">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Auto Learn Toggle */}
          <div className="flex items-center justify-between p-5 border border-border/40 rounded-2xl bg-muted/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label className="text-sm font-bold tracking-tight uppercase">Autonomous Feedback Loop</Label>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground/70 ml-6">Allow the agent to refine its neural weights from interactions</p>
            </div>
            <Switch
              checked={enableAutoLearn}
              onCheckedChange={(checked) => onChange({ enableAutoLearn: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-destructive/[0.02] transition-all hover:bg-destructive/[0.04]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive/10 rounded-xl">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-destructive">Termination Zone</CardTitle>
              <CardDescription className="text-xs font-medium text-destructive/60">Destructive actions affecting the neural entity</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-destructive/10 rounded-2xl bg-destructive/[0.03] relative overflow-hidden group/zone">
            <div className="space-y-1 relative z-10">
              <h4 className="text-sm font-black uppercase tracking-[0.2em] text-destructive">Deallocate Instance</h4>
              <p className="text-[11px] font-medium text-destructive/60 max-w-sm leading-relaxed">
                Permanently decouple this agent from the fleet. This will purge all associated weights and conversation history.
              </p>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="px-8 font-black shadow-lg shadow-destructive/20 h-11 transition-all active:scale-95 flex items-center gap-2 relative z-10 rounded-xl"
              >
                <Trash2 className="w-3.5 h-3.5" />
                EXECUTE PURGE
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
