"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Bell, Mail, MessageSquare, Terminal, ShieldCheck, Zap } from 'lucide-react';

export function NotificationsTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Alert Synchronization</CardTitle>
              <CardDescription>Manage real-time event dissemination across channels</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="space-y-4">
            <h3 className="font-black text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Terminal className="w-3 h-3" /> System Integration
            </h3>

            <div className="grid gap-4">
              {[
                { title: 'Security Protocol Alerts', desc: 'Critical unauthorized access or infrastructure events', icon: ShieldCheck, default: true },
                { title: 'AI Logic Updates', desc: 'Notifications when models are retrained or parameters shift', icon: Zap, default: false },
                { title: 'Data Ingestion Events', desc: 'Real-time status of large knowledge base imports', icon: MessageSquare, default: true },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40 transition-all hover:border-primary/30 group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border/50 group-hover:border-primary/20 transition-all">
                      <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch defaultChecked={item.default} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-border/40">
            <h3 className="font-black text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Mail className="w-3 h-3" /> Communication Channels
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Email Summaries</Label>
                  <p className="text-xs text-muted-foreground">Weekly diagnostic reports</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold">Push Protocols</Label>
                  <p className="text-xs text-muted-foreground">Immediate browser assertions</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
