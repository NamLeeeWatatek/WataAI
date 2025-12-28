"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { Separator } from '@/components/ui/Separator';

interface BotSettingsTabProps {
  enableAutoLearn: boolean;
  onChange: (enableAutoLearn: boolean) => void;
  onDelete?: () => void;
}

import { Sparkles, Trash2, AlertTriangle, Settings2 } from 'lucide-react';

export function BotSettingsTab({ enableAutoLearn, onChange, onDelete }: BotSettingsTabProps) {
  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 group-hover:via-primary/70 transition-all duration-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Advanced Controls</CardTitle>
              <CardDescription className="text-xs font-medium">Fine-tune your bot's advanced behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <Label className="text-sm font-bold tracking-tight">Autonomous Learning</Label>
              </div>
              <p className="text-xs font-medium text-muted-foreground ml-6">Enable continuous refinement from user interactions</p>
            </div>
            <Switch
              checked={enableAutoLearn}
              onCheckedChange={onChange}
              className="data-[state=checked]:bg-purple-500"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-destructive/20 shadow-xl shadow-destructive/5 bg-destructive/[0.02] backdrop-blur-sm overflow-hidden group">
        <div className="h-1.5 w-full bg-gradient-to-r from-destructive/50 via-destructive to-destructive/50" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive/10 rounded-xl shadow-inner">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-destructive">Termination Zone</CardTitle>
              <CardDescription className="text-xs font-medium text-destructive/60">High-risk actions that cannot be reversed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-destructive/20 rounded-xl bg-destructive/5">
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase tracking-widest text-destructive">Destroy Bot Instance</h4>
              <p className="text-xs font-bold text-destructive/70 max-w-sm">
                Permanently remove this bot and all associated configurations. This action is irreversible.
              </p>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="rounded-xl px-8 font-black shadow-lg shadow-destructive/20 h-11 transition-all active:scale-95 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Execute Deletion
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
