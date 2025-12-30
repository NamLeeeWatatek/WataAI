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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Advanced Controls</CardTitle>
              <CardDescription className="text-xs font-medium">Fine-tune your bot's advanced behavior</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8 pt-2">
          <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/10 group-hover:bg-muted/20 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <Label className="text-sm font-bold tracking-tight">Autonomous Learning</Label>
              </div>
              <p className="text-xs font-medium text-muted-foreground ml-6">Enable continuous refinement from user interactions</p>
            </div>
            <Switch
              checked={enableAutoLearn}
              onCheckedChange={onChange}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-destructive/[0.02] border-destructive/20 transition-all hover:bg-destructive/[0.04]">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-destructive/10 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight text-destructive">Termination Zone</CardTitle>
              <CardDescription className="text-xs font-medium text-destructive/60">High-risk actions that cannot be reversed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border border-destructive/20 rounded-xl bg-destructive/5 relative overflow-hidden group/zone">
            <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent pointer-events-none opacity-0 group-hover/zone:opacity-100 transition-opacity" />
            <div className="space-y-1 relative">
              <h4 className="text-sm font-black uppercase tracking-widest text-destructive">Destroy Bot Instance</h4>
              <p className="text-xs font-bold text-destructive/60 max-w-sm">
                Permanently remove this bot and all associated configurations. This action is irreversible.
              </p>
            </div>
            {onDelete && (
              <Button
                variant="destructive"
                onClick={onDelete}
                className="px-8 font-black shadow-lg shadow-destructive/20 h-11 transition-all active:scale-95 flex items-center gap-2 relative"
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
