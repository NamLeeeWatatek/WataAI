'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { MessageSquare, Palette, Settings2, Save, Send, X, Monitor, Smartphone, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface WidgetAppearanceSettings {
    primaryColor?: string;
    backgroundColor?: string;
    botMessageColor?: string;
    botMessageTextColor?: string;
    fontFamily?: string;
    widgetPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    widgetButtonSize?: 'small' | 'medium' | 'large';
    welcomeMessage?: string;
    placeholderText?: string;
    showAvatar?: boolean;
    showTimestamp?: boolean;
}

interface Props {
    botId: string;
    currentSettings?: WidgetAppearanceSettings;
    onSave: (settings: WidgetAppearanceSettings) => Promise<void>;
}

export function WidgetAppearanceSettings({ botId, currentSettings, onSave }: Props) {
    // Default State
    const [settings, setSettings] = useState<WidgetAppearanceSettings>({
        primaryColor: '#667eea',
        backgroundColor: '#ffffff',
        botMessageColor: '#f3f4f6',
        botMessageTextColor: '#1f2937',
        fontFamily: 'Inter',
        widgetPosition: 'bottom-right',
        widgetButtonSize: 'medium',
        welcomeMessage: 'Hello! How can I help you today?',
        placeholderText: 'Type your message...',
        showAvatar: true,
        showTimestamp: true,
    });

    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(true); // Toggle chat window in preview
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with props
    useEffect(() => {
        if (currentSettings) {
            setSettings(prev => ({ ...prev, ...currentSettings }));
        }
    }, [currentSettings]);

    // Detect Changes
    useEffect(() => {
        if (!currentSettings) return;
        const keys = Object.keys(settings) as (keyof WidgetAppearanceSettings)[];
        const changed = keys.some(key => settings[key] !== currentSettings[key as keyof WidgetAppearanceSettings] && settings[key] !== undefined);
        setHasChanges(changed);
    }, [settings, currentSettings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(settings);
            // toast handled by parent usually, but redundant safety
            setHasChanges(false);
        } catch {
            // error handled by parent
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof WidgetAppearanceSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-250px)] min-h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Column: Editor */}
            <div className="lg:col-span-5 flex flex-col h-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/30 backdrop-blur-sm p-1 rounded-2xl border border-border/50 shadow-sm">
                        <TabsTrigger
                            value="design"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xl font-bold transition-all"
                        >
                            <Palette className="w-4 h-4 mr-2" /> Design
                        </TabsTrigger>
                        <TabsTrigger
                            value="messaging"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xl font-bold transition-all"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Messaging
                        </TabsTrigger>
                        <TabsTrigger
                            value="behavior"
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-xl font-bold transition-all"
                        >
                            <Settings2 className="w-4 h-4 mr-2" /> Behavior
                        </TabsTrigger>
                    </TabsList>

                    <Card className="flex-1 flex flex-col overflow-hidden border border-border/40 shadow-xl shadow-primary/5 bg-card/40 backdrop-blur-md rounded-3xl group">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 group-hover:via-primary/70 transition-all duration-500 shrink-0" />
                        <ScrollArea className="flex-1">
                            <div className="p-6 space-y-8">
                                <TabsContent value="design" className="mt-0 space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Palette className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Brand Aesthetics</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Primary Signature Color</Label>
                                            <div className="flex gap-3">
                                                <div className="relative group/color">
                                                    <Input
                                                        type="color"
                                                        className="w-14 p-1 h-12 cursor-pointer rounded-xl border-border/40 bg-muted/20 hover:scale-105 transition-transform"
                                                        value={settings.primaryColor}
                                                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                                    />
                                                </div>
                                                <Input
                                                    value={settings.primaryColor}
                                                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                                    className="uppercase font-mono text-sm font-bold tracking-widest rounded-xl bg-muted/20 border-border/40 h-12 focus:bg-background"
                                                />
                                            </div>
                                            <p className="text-[10px] font-medium text-muted-foreground/60 px-1">Applied to triggers, buttons, and user message bubbles.</p>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Canvas Background</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    type="color"
                                                    className="w-14 p-1 h-12 cursor-pointer rounded-xl border-border/40 bg-muted/20 hover:scale-105 transition-transform"
                                                    value={settings.backgroundColor}
                                                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                                />
                                                <Input
                                                    value={settings.backgroundColor}
                                                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                                    className="uppercase font-mono text-sm font-bold tracking-widest rounded-xl bg-muted/20 border-border/40 h-12 focus:bg-background"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-border/40">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Message Styling</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Bot Bubble</Label>
                                                <Input
                                                    type="color"
                                                    className="w-full h-10 p-1 cursor-pointer rounded-xl border-border/40 bg-muted/20"
                                                    value={settings.botMessageColor}
                                                    onChange={(e) => updateSetting('botMessageColor', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Bot Text</Label>
                                                <Input
                                                    type="color"
                                                    className="w-full h-10 p-1 cursor-pointer rounded-xl border-border/40 bg-muted/20"
                                                    value={settings.botMessageTextColor}
                                                    onChange={(e) => updateSetting('botMessageTextColor', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-border/40">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                <Palette className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Typography</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Font Atmosphere</Label>
                                            <Select value={settings.fontFamily} onValueChange={(val) => updateSetting('fontFamily', val)}>
                                                <SelectTrigger className="rounded-xl h-11 border-border/40 bg-muted/20 font-bold">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl shadow-2xl p-1">
                                                    <SelectItem value="Inter" className="rounded-lg py-3 font-bold">Inter (Modern & Clean)</SelectItem>
                                                    <SelectItem value="Arial" className="rounded-lg py-3 font-medium">Arial (Classic Efficiency)</SelectItem>
                                                    <SelectItem value="'Courier New'" className="rounded-lg py-3 font-mono">Monospace (Technical)</SelectItem>
                                                    <SelectItem value="Georgia" className="rounded-lg py-3">Georgia (Academic Serif)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="messaging" className="mt-0 space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Send className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Content Strategy</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Onboarding Greeting</Label>
                                            <Input
                                                value={settings.welcomeMessage}
                                                onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                                                placeholder="e.g. Protocol initialized. How can I assist?"
                                                className="rounded-xl h-11 border-border/40 bg-muted/20 focus:bg-background font-medium"
                                            />
                                            <p className="text-[10px] font-medium text-muted-foreground/60 px-1">First impression content shown when users open the widget.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Input Placeholder</Label>
                                            <Input
                                                value={settings.placeholderText}
                                                onChange={(e) => updateSetting('placeholderText', e.target.value)}
                                                placeholder="e.g. Transmit your query..."
                                                className="rounded-xl h-11 border-border/40 bg-muted/20 focus:bg-background font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-border/40 space-y-6">
                                        <div className="flex items-center justify-between p-4 border border-border/30 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold tracking-tight">Identity Visualization</Label>
                                                <p className="text-[11px] font-medium text-muted-foreground">Display bot avatar next to responses</p>
                                            </div>
                                            <Switch
                                                checked={settings.showAvatar}
                                                onCheckedChange={(checked) => updateSetting('showAvatar', checked)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 border border-border/30 rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold tracking-tight">Temporal Awareness</Label>
                                                <p className="text-[11px] font-medium text-muted-foreground">Show precise timestamps for audit</p>
                                            </div>
                                            <Switch
                                                checked={settings.showTimestamp}
                                                onCheckedChange={(checked) => updateSetting('showTimestamp', checked)}
                                                className="data-[state=checked]:bg-primary"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="behavior" className="mt-0 space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Settings2 className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Spatial Positioning</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                                                <button
                                                    key={pos}
                                                    onClick={() => updateSetting('widgetPosition', pos)}
                                                    className={cn(
                                                        "group/pos cursor-pointer border-2 rounded-2xl p-4 transition-all flex flex-col items-center gap-3 overflow-hidden",
                                                        settings.widgetPosition === pos
                                                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                                            : "border-border/40 bg-muted/5 hover:border-border/80"
                                                    )}
                                                >
                                                    <div className="w-full h-16 bg-muted/40 rounded-xl relative border border-border/20 overflow-hidden">
                                                        <div className={cn(
                                                            "w-4 h-4 bg-primary rounded-full absolute transition-all group-hover/pos:scale-125",
                                                            pos.includes('bottom') ? 'bottom-2' : 'top-2',
                                                            pos.includes('right') ? 'right-2' : 'left-2'
                                                        )} />
                                                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] bg-[size:10px_10px]" />
                                                    </div>
                                                    <span className={cn(
                                                        "text-[10px] uppercase font-black tracking-widest transition-colors",
                                                        settings.widgetPosition === pos ? "text-primary" : "text-muted-foreground/60"
                                                    )}>
                                                        {pos.replace('-', ' ')}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-8 border-t border-border/40">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Palette className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Trigger Scale</h3>
                                        </div>
                                        <Select value={settings.widgetButtonSize} onValueChange={(val) => updateSetting('widgetButtonSize', val)}>
                                            <SelectTrigger className="h-12 rounded-xl border-border/40 bg-muted/20 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl p-1">
                                                <SelectItem value="small" className="rounded-lg py-3 font-bold">Compact (48px)</SelectItem>
                                                <SelectItem value="medium" className="rounded-lg py-3 font-bold">Standard (56px)</SelectItem>
                                                <SelectItem value="large" className="rounded-lg py-3 font-bold">Prominent (64px)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>

                        <div className="p-6 border-t border-border/40 bg-card/80 backdrop-blur-xl">
                            <Button
                                className="w-full h-12 rounded-2xl font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Deploying...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save & Sync Deployment
                                    </span>
                                )}
                            </Button>
                        </div>
                    </Card>
                </Tabs>
            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-7 bg-muted/30 rounded-3xl border border-border/40 p-8 lg:p-12 relative overflow-hidden flex items-center justify-center group/preview">
                {/* Visual Enhancers */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -mr-64 -mt-64 transition-all duration-1000 group-hover/preview:bg-primary/10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] -ml-64 -mb-64 transition-all duration-1000 group-hover/preview:bg-blue-500/10" />
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                {/* Status Bar */}
                <div className="absolute top-6 left-6 flex items-center gap-3">
                    <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-400/40" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
                        <div className="w-2 h-2 rounded-full bg-green-400/40" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Production Simulator</span>
                </div>

                {/* Device Frame */}
                <div className="relative w-full h-full max-w-[380px] max-h-[680px] border-[12px] border-slate-950 rounded-[3rem] bg-white shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col scale-90 lg:scale-100 transition-all duration-500 group-hover/preview:shadow-[0_0_120px_rgba(var(--primary-rgb),0.05)]">
                    {/* Device Header/Notch */}
                    <div className="h-4 bg-slate-950 w-full flex justify-center items-start shrink-0">
                        <div className="w-24 h-4 bg-slate-950 rounded-b-2xl relative">
                            <div className="absolute bottom-1 left-1.5 w-1 h-1 rounded-full bg-white/10" />
                            <div className="absolute bottom-1 right-1.5 w-3 h-1 rounded-full bg-white/10" />
                        </div>
                    </div>

                    {/* Screen Content */}
                    <div className="flex-1 relative bg-[#F8FAFC] flex flex-col overflow-hidden">
                        {/* Fake Website Mock */}
                        <div className="p-8 space-y-6 opacity-5 animate-pulse">
                            <div className="h-6 bg-slate-900 w-1/3 rounded-full" />
                            <div className="space-y-4">
                                <div className="h-10 bg-slate-900 w-full rounded-2xl" />
                                <div className="h-4 bg-slate-900 w-full rounded-full" />
                                <div className="h-4 bg-slate-900 w-5/6 rounded-full" />
                                <div className="h-4 bg-slate-900 w-4/6 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-32 bg-slate-900 w-full rounded-3xl" />
                                <div className="h-32 bg-slate-900 w-full rounded-3xl" />
                            </div>
                            <div className="h-12 bg-slate-900 w-2/3 rounded-2xl" />
                        </div>

                        {/* Widget: Chat Window Overflow Container */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {/* Widget: Chat Window */}
                            <div
                                className={cn(
                                    "absolute flex flex-col shadow-2xl overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) pointer-events-auto",
                                    isPreviewOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
                                )}
                                style={{
                                    bottom: settings.widgetPosition?.includes('top') ? 'auto' : '88px',
                                    top: settings.widgetPosition?.includes('top') ? '88px' : 'auto',
                                    right: settings.widgetPosition?.includes('left') ? 'auto' : '20px',
                                    left: settings.widgetPosition?.includes('left') ? '20px' : 'auto',
                                    width: '310px',
                                    height: '420px',
                                    fontFamily: settings.fontFamily,
                                    backgroundColor: settings.backgroundColor,
                                    borderRadius: '24px',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}
                            >
                                {/* Header */}
                                <div className="px-5 py-4 flex items-center justify-between text-white shrink-0 shadow-lg relative z-20" style={{ backgroundColor: settings.primaryColor }}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            {settings.showAvatar && (
                                                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-sm font-black border border-white/20">
                                                    AI
                                                </div>
                                            )}
                                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-primary ring-2 ring-black/5" />
                                        </div>
                                        <div>
                                            <div className="font-black text-sm tracking-tight leading-none mb-1">AI Assistant</div>
                                            <div className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Always Active</div>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsPreviewOpen(false)} className="w-8 h-8 rounded-xl bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Messages View */}
                                <div className="flex-1 p-5 space-y-5 overflow-y-auto scrollbar-hide relative bg-[radial-gradient(circle_at_top_right,rgba(0,0,0,0.02),transparent)]">
                                    {/* Bot Message */}
                                    <div className="flex gap-3 animate-in slide-in-from-left duration-300">
                                        {settings.showAvatar && (
                                            <div
                                                className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-lg"
                                                style={{ backgroundColor: settings.primaryColor }}
                                            >
                                                AI
                                            </div>
                                        )}
                                        <div className="space-y-1.5 max-w-[85%]">
                                            <div
                                                className="p-3.5 rounded-2xl rounded-tl-none text-sm font-medium shadow-sm border border-black/[0.03]"
                                                style={{
                                                    backgroundColor: settings.botMessageColor,
                                                    color: settings.botMessageTextColor
                                                }}
                                            >
                                                {settings.welcomeMessage}
                                            </div>
                                            {settings.showTimestamp && (
                                                <div className="text-[10px] font-bold text-muted-foreground/50 ml-1.5 uppercase tracking-wider">Just Now</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Message Mock */}
                                    <div className="flex gap-3 flex-row-reverse animate-in slide-in-from-right duration-300 delay-150">
                                        <div className="space-y-1.5 max-w-[85%]">
                                            <div
                                                className="p-3.5 rounded-2xl rounded-tr-none text-sm font-bold text-white shadow-xl shadow-primary/20"
                                                style={{ backgroundColor: settings.primaryColor }}
                                            >
                                                How can you help my business?
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Input Composer */}
                                <div className="p-4 border-t border-black/[0.05] bg-white/80 backdrop-blur-md shrink-0 relative z-20">
                                    <div className="relative group/input">
                                        <input
                                            placeholder={settings.placeholderText}
                                            className="w-full pl-5 pr-12 py-3.5 rounded-2xl border border-black/[0.05] bg-[#F1F5F9] text-sm font-medium focus:outline-none focus:ring-2 ring-primary/10 transition-all focus:bg-white focus:border-primary/20"
                                            readOnly
                                        />
                                        <div
                                            className="absolute right-1.5 top-1.5 bottom-1.5 w-10 flex items-center justify-center transition-all opacity-80 group-focus-within/input:opacity-100 rounded-xl"
                                            style={{ backgroundColor: settings.primaryColor + '10' }}
                                        >
                                            <Send className="w-4 h-4" style={{ color: settings.primaryColor }} />
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
                                        <div className="flex gap-0.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified by OmniAI Protocol</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Widget: Trigger Button */}
                        <button
                            onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                            className="absolute shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 flex items-center justify-center group/btn hover:rotate-6 shadow-primary/20"
                            style={{
                                bottom: settings.widgetPosition?.includes('top') ? 'auto' : '20px',
                                top: settings.widgetPosition?.includes('top') ? '20px' : 'auto',
                                right: settings.widgetPosition?.includes('left') ? 'auto' : '20px',
                                left: settings.widgetPosition?.includes('left') ? '20px' : 'auto',
                                width: settings.widgetButtonSize === 'large' ? '68px' : settings.widgetButtonSize === 'small' ? '52px' : '60px',
                                height: settings.widgetButtonSize === 'large' ? '68px' : settings.widgetButtonSize === 'small' ? '52px' : '60px',
                                backgroundColor: settings.primaryColor,
                                borderRadius: '24px',
                                color: '#ffffff'
                            }}
                        >
                            <div className="relative">
                                {isPreviewOpen ? (
                                    <X className="w-7 h-7 animate-in fade-in zoom-in duration-300" />
                                ) : (
                                    <MessageSquare className="w-7 h-7 animate-in fade-in zoom-in duration-300" />
                                )}
                            </div>
                            <div className="absolute inset-0 rounded-[24px] ring-4 ring-white/20 scale-0 group-hover/btn:scale-100 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
