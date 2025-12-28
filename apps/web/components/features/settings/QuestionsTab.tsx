"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HelpCircle, Book, MessageCircle, FileText, Search, ExternalLink, Terminal } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function QuestionsTab() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 transition-colors group-focus-within:text-primary" />
        <Input
          placeholder="Query the system documentation..."
          className="pl-12 h-14 text-lg rounded-2xl border-border/50 bg-muted/20 focus:bg-background transition-all shadow-lg shadow-primary/5"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl group hover:border-primary/30 transition-all">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Book className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Core Directives</CardTitle>
            <CardDescription>Comprehensive system documentation and API specifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-xl gap-2 font-bold h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
              Initialize Repository <ExternalLink className="size-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl group hover:border-primary/30 transition-all">
          <CardHeader>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <CardTitle>Intelligence Support</CardTitle>
            <CardDescription>Direct interface with human cognitive support specialists</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-xl gap-2 font-bold h-11 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
              Initialize Uplink <Terminal className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden rounded-2xl">
        <CardHeader className="border-b border-border/40 bg-muted/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Frequently Asserted Questions</CardTitle>
              <CardDescription>Commonly encountered system states and resolution pathing</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border/40">
          {[
            "Logic synchronization patterns",
            "Authentication protocol failure states",
            "Knowledge base ingestion latency",
            "Multi-agent orchestration limits"
          ].map((q, i) => (
            <div key={i} className="py-4 first:pt-8 last:pb-2 group cursor-pointer flex items-center justify-between">
              <span className="font-medium text-sm group-hover:text-primary transition-colors flex items-center gap-3">
                <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                {q}
              </span>
              <ExternalLink className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
