"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Share2, Users, Lock, Shield, Globe, ExternalLink, Plus } from 'lucide-react';

export function SharingTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Collaborative Orchestration</CardTitle>
              <CardDescription>Manage multi-agent access and workspace permissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
            <div className="size-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 ring-8 ring-primary/5">
              <Share2 className="size-8 text-primary opacity-40" />
            </div>
            <h3 className="text-lg font-bold">No Active Collaborations</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-8 text-sm">Expand your workspace by synchronizing with additional specialized agents or collaborators.</p>
            <Button size="lg" className="rounded-full font-bold px-10 shadow-xl shadow-primary/20 active:scale-95 transition-all">
              <Plus className="mr-2 size-5" />
              Invite Orchestrator
            </Button>
          </div>

          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/20 border-border/40">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center border border-border/50">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold">Public Knowledge Link</p>
                  <p className="text-xs text-muted-foreground">Allow read-only indexing for verified entities</p>
                </div>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Security Protocols</CardTitle>
              <CardDescription>Authentication standards and domain restriction lists</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-8 text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto opacity-20 mb-4" />
          <p className="text-muted-foreground text-sm font-medium">Advanced security configurations are currently being provisioned.</p>
          <Button variant="link" className="text-primary gap-1">
            Read Security Ledger <ExternalLink className="size-3" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
