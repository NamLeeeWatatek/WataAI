"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/Separator';
import { Brain, Sparkles, MessageSquare, Settings2, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface BotFormData {
  name: string;
  description: string;
  systemPrompt: string;
  aiProviderId: string | undefined;
  aiModelName: string;
  aiParameters: {
    temperature: number;
    max_tokens: number;
  };
  enableAutoLearn: boolean;
  isActive: boolean;
}

interface BotConfigurationTabProps {
  formData: BotFormData;
  onChange: (updates: Partial<BotFormData>) => void;
}

export function BotConfigurationTab({ formData, onChange }: BotConfigurationTabProps) {
  return (
    <div className="space-y-6">

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Identity Section */}
        <Card className="lg:col-span-2 rounded-2xl border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 group-hover:via-primary/70 transition-all duration-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner">
                <Settings2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Bot Identity</CardTitle>
                <CardDescription className="text-xs font-medium">Define how your bot appears to users</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-8 pt-2">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Bot Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => onChange({ name: e.target.value })}
                  placeholder="e.g. Customer Support Agent"
                  className="font-bold rounded-xl border-border/60 bg-muted/20 focus:bg-background transition-all h-11"
                />
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="isActive" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Status</Label>
                  <Badge variant={formData.isActive ? "default" : "secondary"} className={formData.isActive ? "bg-green-500 hover:bg-green-600 px-2.5 font-bold" : "px-2.5 font-bold"}>
                    {formData.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3.5 border border-border/60 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold tracking-tight">Enable Bot</span>
                    <p className="text-[10px] font-medium text-muted-foreground">Make this bot accessible to users</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => onChange({ isActive: checked })}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="Briefly describe what this bot does..."
                className="resize-none rounded-xl border-border/60 bg-muted/20 focus:bg-background transition-all min-h-[100px] leading-relaxed"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* System Prompt Section */}
        <Card className="flex flex-col rounded-2xl border-border/40 shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500/50 via-blue-500 to-blue-500/50 group-hover:via-blue-500/70 transition-all duration-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl shadow-inner">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">System Prompt</CardTitle>
                <CardDescription className="text-xs font-medium">Core personality & behavior</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col pt-2 min-h-[300px]">
            <Textarea
              value={formData.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              placeholder="You are a helpful AI assistant tasked with..."
              className="flex-1 resize-none rounded-xl border-border/60 bg-muted/20 focus:bg-background transition-all font-mono text-xs leading-relaxed p-4"
            />
          </CardContent>
        </Card>

        {/* Intelligence Section */}
        <Card className="lg:col-span-3 rounded-2xl border-border/40 shadow-xl shadow-purple-500/5 bg-card/50 backdrop-blur-sm overflow-hidden group">
          <div className="h-1.5 w-full bg-gradient-to-r from-purple-500/50 via-purple-500 to-purple-500/50 group-hover:via-purple-500/70 transition-all duration-500" />
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl shadow-inner">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Model Intelligence</CardTitle>
                <CardDescription className="text-xs font-medium">Configure the AI model and reasoning parameters</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 pt-2">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">AI Provider</Label>
                    <Select value={formData.aiProviderId} onValueChange={(value) => onChange({ aiProviderId: value })}>
                      <SelectTrigger className="rounded-xl border-border/60 bg-muted/20 h-11 transition-all focus:ring-purple-500/20">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Model</Label>
                    <Select value={formData.aiModelName} onValueChange={(value) => onChange({ aiModelName: value })}>
                      <SelectTrigger className="rounded-xl border-border/60 bg-muted/20 h-11 transition-all focus:ring-purple-500/20">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="gpt-4">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3.5 p-4 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold tracking-tight">Performance Boosters</span>
                  </div>
                  <Separator className="bg-border/60" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold">Auto-Learning</span>
                      <p className="text-[10px] text-muted-foreground">Improve responses from conversations</p>
                    </div>
                    <Switch
                      checked={formData.enableAutoLearn}
                      onCheckedChange={(checked) => onChange({ enableAutoLearn: checked })}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-8 p-6 rounded-2xl border border-border/60 bg-purple-500/[0.03]">
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                      Creativity (Temperature)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-3.5 h-3.5 text-muted-foreground/60 hover:text-purple-500 transition-colors" />
                          </TooltipTrigger>
                          <TooltipContent className="rounded-xl p-3 border-border/40 max-w-[240px]">
                            <p className="text-xs font-medium leading-relaxed">
                              Lower values (0.0) make the model more <span className="text-purple-500 font-bold underline">precise</span>. Higher values (1.0+) make it more <span className="text-pink-500 font-bold underline">creative</span>.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Badge variant="outline" className="font-mono font-bold border-purple-500/20 text-purple-600 bg-purple-500/5">
                      {formData.aiParameters.temperature}
                    </Badge>
                  </div>
                  <Slider
                    value={[formData.aiParameters.temperature]}
                    min={0}
                    max={2}
                    step={0.1}
                    onValueChange={([value]) => onChange({ aiParameters: { ...formData.aiParameters, temperature: value } })}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1 opacity-60">
                    <span>Precise</span>
                    <span>Balanced</span>
                    <span>Creative</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Max Tokens</Label>
                    <Badge variant="outline" className="font-mono font-bold">
                      {formData.aiParameters.max_tokens.toLocaleString()}
                    </Badge>
                  </div>
                  <Input
                    type="number"
                    value={formData.aiParameters.max_tokens}
                    onChange={(e) => onChange({ aiParameters: { ...formData.aiParameters, max_tokens: parseInt(e.target.value) } })}
                    max={128000}
                    min={1}
                    className="rounded-xl border-border/60 bg-muted/20 focus:bg-background h-11 transition-all"
                  />
                  <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 px-1">
                    <Info className="w-3 h-3" />
                    Limits length of generated responses
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
