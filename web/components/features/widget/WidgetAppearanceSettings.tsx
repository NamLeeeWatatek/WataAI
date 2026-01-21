'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { MessageSquare, Palette, Settings2, Save, Send, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { BotWidgetPosition, BotWidgetButtonSize } from '@/lib/types/bots';
import { Slider } from '@/components/ui/Slider';

interface WidgetAppearanceSettingsData {
    primaryColor?: string | null;
    welcomeMessage?: string | null;
    placeholderText?: string | null;
    widgetPosition?: BotWidgetPosition;
    widgetButtonSize?: BotWidgetButtonSize;
    showAvatar?: boolean;
    showTimestamp?: boolean;
    widgetEnabled?: boolean;
    // UI specific & Extended
    backgroundColor?: string;
    botMessageColor?: string;
    botMessageTextColor?: string;
    fontFamily?: string;
    borderRadius?: number;
    glassmorphism?: boolean;
    headerStyle?: 'solid' | 'minimal' | 'gradient';
}

interface Props {
    botId: string;
    currentSettings?: Partial<WidgetAppearanceSettingsData>;
    onSave: (settings: Partial<WidgetAppearanceSettingsData>) => void;
}

export function WidgetAppearanceSettings({ botId, currentSettings, onSave }: Props) {
    // Default State
    const [settings, setSettings] = useState<WidgetAppearanceSettingsData>({
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
        borderRadius: 16,
        glassmorphism: true,
        headerStyle: 'solid',
        widgetEnabled: true,
    });

    const [activeTab, setActiveTab] = useState('design');
    const [saving, setSaving] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    // Sync with props
    useEffect(() => {
        if (currentSettings) {
            setSettings(prev => ({
                ...prev,
                ...currentSettings,
                // Ensure we handle nulls from backend
                primaryColor: currentSettings.primaryColor || prev.primaryColor,
                welcomeMessage: currentSettings.welcomeMessage || prev.welcomeMessage,
                placeholderText: currentSettings.placeholderText || prev.placeholderText,
            }));
        }
    }, [currentSettings]);

    // Detect Changes
    useEffect(() => {
        if (!currentSettings) return;
        const keys = Object.keys(settings) as (keyof WidgetAppearanceSettingsData)[];
        const changed = keys.some(key => settings[key] !== (currentSettings as any)[key] && settings[key] !== undefined);
        setHasChanges(changed);
    }, [settings, currentSettings]);

    const handleSaveLocal = async () => {
        setSaving(true);
        try {
            onSave(settings);
            setHasChanges(false);
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key: keyof WidgetAppearanceSettingsData, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        onSave(newSettings);
    };

    return (
        <div className="flex flex-col xl:flex-row gap-10 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Column: Editor */}
            <div className="w-full xl:w-[480px] 2xl:w-[540px] flex-shrink-0 space-y-6 lg:sticky lg:top-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
                    <TabsList variant="dashboard" className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger
                            value="design"
                            variant="dashboard"
                            className="justify-start px-2"
                        >
                            <Palette className="w-4 h-4 mr-2" /> Design
                        </TabsTrigger>
                        <TabsTrigger
                            value="messaging"
                            variant="dashboard"
                            className="justify-start px-2"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Messaging
                        </TabsTrigger>
                        <TabsTrigger
                            value="behavior"
                            variant="dashboard"
                            className="justify-start px-2"
                        >
                            <Settings2 className="w-4 h-4 mr-2" /> Behavior
                        </TabsTrigger>
                    </TabsList>

                    <Card className="flex flex-col shadow-none border-none bg-background/50 backdrop-blur-sm rounded-3xl overflow-hidden">
                        <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40 shrink-0" />
                        <ScrollArea className="h-[500px] 2xl:h-[600px]">
                            <div className="p-8 space-y-8">
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
                                                        className="w-14 p-1 h-12 cursor-pointer hover:scale-105 transition-transform bg-transparent"
                                                        value={settings.primaryColor || '#667eea'}
                                                        onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                                    />
                                                </div>
                                                <Input
                                                    value={settings.primaryColor || '#667eea'}
                                                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                                                    className="uppercase font-mono text-sm tracking-widest h-12 bg-background/50"
                                                />
                                            </div>
                                            <p className="text-[10px] font-medium text-muted-foreground/60 px-1 uppercase tracking-tight">Applied to triggers, buttons, and user message bubbles.</p>
                                        </div>

                                        <div className="space-y-4 pt-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Canvas Background</Label>
                                            <div className="flex gap-3">
                                                <Input
                                                    type="color"
                                                    className="w-14 p-1 h-12 cursor-pointer bg-transparent"
                                                    value={settings.backgroundColor}
                                                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                                />
                                                <Input
                                                    value={settings.backgroundColor}
                                                    onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                                    className="uppercase font-mono text-sm tracking-widest h-12 bg-background/50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-border/10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <MessageSquare className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Message Styling</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Bot Bubble</Label>
                                                <Input
                                                    type="color"
                                                    className="w-full h-10 p-1 cursor-pointer bg-transparent"
                                                    value={settings.botMessageColor}
                                                    onChange={(e) => updateSetting('botMessageColor', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Bot Text</Label>
                                                <Input
                                                    type="color"
                                                    className="w-full h-10 p-1 cursor-pointer bg-transparent"
                                                    value={settings.botMessageTextColor}
                                                    onChange={(e) => updateSetting('botMessageTextColor', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-6 border-t border-border/10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Palette className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Container Styling</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Glassmorphism Effect</Label>
                                                <Switch
                                                    checked={settings.glassmorphism}
                                                    onCheckedChange={(val) => updateSetting('glassmorphism', val)}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Edge Roundness ({settings.borderRadius}px)</Label>
                                            <Slider
                                                value={[settings.borderRadius || 16]}
                                                min={0}
                                                max={32}
                                                step={4}
                                                onValueChange={(val) => updateSetting('borderRadius', val[0])}
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Header Layout</Label>
                                            <Select value={settings.headerStyle || 'solid'} onValueChange={(val) => updateSetting('headerStyle', val)}>
                                                <SelectTrigger className="h-10 bg-background/50">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                    <SelectItem value="solid" className="font-bold">Classic Solid</SelectItem>
                                                    <SelectItem value="minimal" className="font-bold">Minimalist</SelectItem>
                                                    <SelectItem value="gradient" className="font-bold">Futuristic Gradient</SelectItem>
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
                                                value={settings.welcomeMessage || ''}
                                                onChange={(e) => updateSetting('welcomeMessage', e.target.value)}
                                                placeholder="e.g. Protocol initialized. How can I assist?"
                                                className="h-11 font-medium bg-background/50"
                                            />
                                            <p className="text-[10px] font-medium text-muted-foreground/60 px-1">First impression content shown when users open the widget.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Input Placeholder</Label>
                                            <Input
                                                value={settings.placeholderText || ''}
                                                onChange={(e) => updateSetting('placeholderText', e.target.value)}
                                                placeholder="e.g. Transmit your query..."
                                                className="h-11 bg-background/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-border/10 space-y-6">
                                        <div className="flex items-center justify-between p-5 border border-border/30 rounded-2xl bg-muted/10">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold tracking-tight uppercase">Identity Visualization</Label>
                                                <p className="text-[10px] font-medium text-muted-foreground/70">Display bot avatar next to responses</p>
                                            </div>
                                            <Switch
                                                checked={settings.showAvatar}
                                                onCheckedChange={(checked) => updateSetting('showAvatar', checked)}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-5 border border-border/30 rounded-2xl bg-muted/10">
                                            <div className="space-y-1">
                                                <Label className="text-sm font-bold tracking-tight uppercase">Temporal Awareness</Label>
                                                <p className="text-[10px] font-medium text-muted-foreground/70">Show precise timestamps for audit</p>
                                            </div>
                                            <Switch
                                                checked={settings.showTimestamp}
                                                onCheckedChange={(checked) => updateSetting('showTimestamp', checked)}
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
                                        <div className="grid grid-cols-2 gap-4">
                                            {['bottom-right', 'bottom-left', 'top-right', 'top-left'].map((pos) => (
                                                <button
                                                    key={pos}
                                                    onClick={() => updateSetting('widgetPosition', pos)}
                                                    className={cn(
                                                        "group/pos cursor-pointer border border-border/20 rounded-2xl p-4 transition-all flex flex-col items-center gap-3",
                                                        settings.widgetPosition === pos
                                                            ? "bg-primary/10 border-primary shadow-lg shadow-primary/5"
                                                            : "bg-muted/5 hover:bg-muted/10 border-transparent"
                                                    )}
                                                >
                                                    <div className="w-full h-16 bg-background/40 rounded-xl relative border border-border/10">
                                                        <div className={cn(
                                                            "w-4 h-4 bg-primary rounded-full absolute transition-all group-hover/pos:scale-125 shadow-lg",
                                                            pos.includes('bottom') ? 'bottom-2' : 'top-2',
                                                            pos.includes('right') ? 'right-2' : 'left-2'
                                                        )} />
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

                                    <div className="space-y-6 pt-8 border-t border-border/10">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                                <Palette className="w-4 h-4 text-primary" />
                                            </div>
                                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-muted-foreground/80">Trigger Scale</h3>
                                        </div>
                                        <Select value={settings.widgetButtonSize} onValueChange={(val) => updateSetting('widgetButtonSize', val)}>
                                            <SelectTrigger className="h-12 bg-background/50 rounded-2xl">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                                <SelectItem value="small" className="font-bold">Compact (48px)</SelectItem>
                                                <SelectItem value="medium" className="font-bold">Standard (56px)</SelectItem>
                                                <SelectItem value="large" className="font-bold">Prominent (64px)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </Card>
                </Tabs>
            </div>

            {/* Right Column: Preview */}
            <div className="flex-1 w-full xl:sticky xl:top-8 space-y-8">
                <Card className="p-12 relative overflow-hidden flex items-center justify-center group/preview border-none shadow-2xl min-h-[600px] 2xl:min-h-[750px] bg-muted/5 rounded-[3rem]">
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            <div className="w-2 h-2 rounded-full bg-yellow-400" />
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Universal Emulator</span>
                    </div>

                    {/* Device Frame */}
                    <div className="relative w-full h-full max-w-[380px] border-[12px] border-slate-950 rounded-[3rem] bg-slate-50 shadow-2xl overflow-hidden flex flex-col scale-90 lg:scale-100 transition-all duration-700 aspect-[9/16]">
                        {/* Screen Content */}
                        <div className="flex-1 relative bg-[#F8FAFC] flex flex-col overflow-hidden">
                            {/* Fake Website Mock */}
                            <div className="p-8 space-y-6 opacity-[0.05]">
                                <div className="h-6 bg-slate-900 w-1/3 rounded-full" />
                                <div className="space-y-4">
                                    <div className="h-10 bg-slate-900 w-full rounded-2xl" />
                                    <div className="h-4 bg-slate-900 w-full rounded-full" />
                                    <div className="h-4 bg-slate-900 w-4/6 rounded-full" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-slate-900 w-full rounded-3xl" />
                                    <div className="h-32 bg-slate-900 w-full rounded-3xl" />
                                </div>
                            </div>

                            {/* Widget: Chat window (UI only) */}
                            <div
                                className={cn(
                                    "absolute flex flex-col shadow-2xl overflow-hidden transition-all duration-500",
                                    isPreviewOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 translate-y-4 shadow-none pointer-events-none"
                                )}
                                style={{
                                    bottom: settings.widgetPosition?.includes('top') ? 'auto' : '88px',
                                    top: settings.widgetPosition?.includes('top') ? '88px' : 'auto',
                                    right: settings.widgetPosition?.includes('left') ? 'auto' : '20px',
                                    left: settings.widgetPosition?.includes('left') ? '20px' : 'auto',
                                    width: '310px',
                                    height: '420px',
                                    borderRadius: `${settings.borderRadius}px`,
                                    backgroundColor: settings.glassmorphism ? `${settings.backgroundColor}cc` : settings.backgroundColor,
                                    border: settings.glassmorphism ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                                    zIndex: 100,
                                    backdropFilter: settings.glassmorphism ? 'blur(16px)' : 'none',
                                }}
                            >
                                <div
                                    className={cn(
                                        "px-5 py-4 flex items-center justify-between transition-all",
                                        settings.headerStyle === 'minimal' ? "text-foreground bg-white border-b" : "text-white shadow-xl"
                                    )}
                                    style={{
                                        backgroundColor: settings.headerStyle === 'minimal' ? 'white' : (settings.headerStyle === 'gradient' ? 'transparent' : (settings.primaryColor || '#667eea')),
                                        backgroundImage: settings.headerStyle === 'gradient' ? `linear-gradient(135deg, ${settings.primaryColor}, #805ad5)` : 'none'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase", settings.headerStyle === 'minimal' ? "bg-primary/10 text-primary" : "bg-white/20")}>AI</div>
                                        <div className="text-sm font-black tracking-tight">AI Protocol</div>
                                    </div>
                                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer", settings.headerStyle === 'minimal' ? "bg-muted hover:bg-muted/80 text-foreground" : "bg-black/10 hover:bg-black/20")} onClick={() => setIsPreviewOpen(false)}>
                                        <X className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="flex-1 p-5 space-y-4">
                                    <div className="flex gap-3">
                                        {settings.showAvatar && <div className="w-8 h-8 rounded-xl bg-slate-100 border flex items-center justify-center text-[8px] font-black uppercase">AI</div>}
                                        <div className="p-3.5 rounded-2xl rounded-tl-none text-[13px] font-medium leading-relaxed max-w-[85%]" style={{ backgroundColor: settings.botMessageColor, color: settings.botMessageTextColor }}>
                                            {settings.welcomeMessage}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t bg-white">
                                    <div className="h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center px-4">
                                        <span className="text-[11px] font-medium text-slate-400">{settings.placeholderText}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Trigger */}
                            <button
                                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                className="absolute shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 z-[101]"
                                style={{
                                    bottom: settings.widgetPosition?.includes('top') ? 'auto' : '20px',
                                    top: settings.widgetPosition?.includes('top') ? '20px' : 'auto',
                                    right: settings.widgetPosition?.includes('left') ? 'auto' : '20px',
                                    left: settings.widgetPosition?.includes('left') ? '20px' : 'auto',
                                    width: settings.widgetButtonSize === 'large' ? '68px' : settings.widgetButtonSize === 'small' ? '50px' : '60px',
                                    height: settings.widgetButtonSize === 'large' ? '68px' : settings.widgetButtonSize === 'small' ? '50px' : '60px',
                                    backgroundColor: settings.primaryColor || '#667eea',
                                    borderRadius: '24px',
                                    color: '#ffffff',
                                }}
                            >
                                <MessageSquare size={settings.widgetButtonSize === 'large' ? 32 : settings.widgetButtonSize === 'small' ? 24 : 28} />
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
