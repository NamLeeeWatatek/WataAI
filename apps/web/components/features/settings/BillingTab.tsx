"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CreditCard, Zap, History, ExternalLink, ShieldCheck } from 'lucide-react';

export function BillingTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Subscription Intelligence</CardTitle>
                <CardDescription>Enterprise capacity and resource orchestration</CardDescription>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1">Professional Plan</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Compute Tokens</p>
              <p className="text-2xl font-black">750k <span className="text-sm font-medium text-muted-foreground">/ 1M</span></p>
              <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[75%]" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Knowledge Units</p>
              <p className="text-2xl font-black">12 <span className="text-sm font-medium text-muted-foreground">/ 50</span></p>
              <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[24%]" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">Bot Active Agents</p>
              <p className="text-2xl font-black">5 <span className="text-sm font-medium text-muted-foreground">/ 10</span></p>
              <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[50%]" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <Button className="rounded-full px-8 py-6 font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all bg-primary hover:bg-primary/90 flex-1 md:flex-none">
              <Zap className="w-4 h-4 mr-2" />
              Upgrade Protocol
            </Button>
            <Button variant="outline" className="rounded-full px-8 py-6 font-bold active:scale-95 transition-all flex-1 md:flex-none">
              <History className="w-4 h-4 mr-2" />
              Usage Ledger
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Financial Interface</CardTitle>
              <CardDescription>Payment gateway and transaction history</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground italic opacity-50" />
            </div>
            <h3 className="text-lg font-bold">No Payment Methods</h3>
            <p className="text-muted-foreground max-w-xs mt-2 mb-6">Secure your subscription with a primary payment instrument.</p>
            <Button variant="outline" className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary">
              <Plus className="w-4 h-4 mr-2" />
              Configure Gateway
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Add missing Plus icon if not imported
import { Plus } from 'lucide-react';
