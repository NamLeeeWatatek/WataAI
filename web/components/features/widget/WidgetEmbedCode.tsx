'use client';

import { useState } from 'react';
import { Copy, Check, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { toast } from 'sonner';

interface Props {
    botId: string;
    activeVersion?: {
        id: string;
        version: string;
        cdnUrl?: string;
    };
}

export function WidgetEmbedCode({ botId, activeVersion }: Props) {
    const [copiedScript, setCopiedScript] = useState(false);
    const [copiedIframe, setCopiedIframe] = useState(false);

    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    const widgetUrl = `${apiUrl}/public/widget/${botId}`;

    const scriptCode = `<script 
    src="${widgetUrl}/loader.js"
    data-bot-id="${botId}"
    data-api-url="${apiUrl}"
    async
></script>`;
    const publicBotUrl = `${baseUrl}/public/bots/${botId}`;
    const iframeCode = `<iframe
  src="${publicBotUrl}?mode=iframe"
  width="100%"
  height="100%"
  frameborder="0"
  style="border: none; min-height: 600px;"
></iframe>`;

    const copyToClipboard = async (text: string, type: 'script' | 'iframe') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'script') {
                setCopiedScript(true);
                setTimeout(() => setCopiedScript(false), 2000);
            } else if (type === 'iframe') {
                setCopiedIframe(true);
                setTimeout(() => setCopiedIframe(false), 2000);
            }
            toast.success('Copied to clipboard!');
        } catch {
            toast.error('Failed to copy');
        }
    };

    if (!activeVersion) {
        return (
            <Card className="border-dashed border-border/60">
                <CardHeader className="p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                        <Code className="w-8 h-8 text-primary/60" />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight mb-2">Initialize Deployment</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium max-w-xs mx-auto">
                        Your widget code will be generated once you publish the initial version of your agent.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Deployment Status Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl border border-primary/20">
                                    <Code className="w-6 h-6 text-primary" />
                                </div>
                                Deployment Integration
                            </CardTitle>
                            <CardDescription className="text-sm font-bold text-muted-foreground/60 uppercase tracking-widest pl-14">
                                Protocol: <span className="text-primary font-mono ml-1">v{activeVersion.version}</span>
                            </CardDescription>
                        </div>
                        <Badge variant="default" className="hidden md:flex rounded-full text-[10px] font-black uppercase tracking-[0.2em] border-none px-4 py-2">
                            <div className="size-2 rounded-full bg-current animate-pulse mr-2" />
                            Live & Transmitting
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="script" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="script">
                        Standard Script
                    </TabsTrigger>
                    <TabsTrigger value="iframe">
                        IFrame Proxy
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="script" className="mt-0 space-y-6">
                    <Card>
                        <div className="p-8 space-y-6">
                            <div className="flex items-start justify-between">
                                <div className="space-y-2">
                                    <h3 className="font-black text-lg tracking-tight">Direct Script Injection</h3>
                                    <p className="text-sm font-medium text-muted-foreground/70">
                                        Insert this snippet before the closing <code className="bg-muted px-1.5 py-0.5 rounded text-primary">&lt;/body&gt;</code> tag.
                                    </p>
                                </div>
                                <Badge variant="secondary" className="rounded-lg text-[9px] font-black uppercase tracking-widest border-none px-3 py-1">Recommended</Badge>
                            </div>

                            <div className="relative group/code">
                                <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                <pre className="bg-slate-950/90 text-slate-100 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed border border-white/5 shadow-2xl">
                                    <code>{scriptCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-4 right-4 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-xl"
                                    onClick={() => copyToClipboard(scriptCode, 'script')}
                                >
                                    {copiedScript ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="iframe" className="mt-0 space-y-6">
                    <Card>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <h3 className="font-black text-lg tracking-tight">Isolated IFrame</h3>
                                <p className="text-sm font-medium text-muted-foreground/70">
                                    Embed as a contained sandbox unit. Best for strictly governed environments.
                                </p>
                            </div>

                            <div className="relative group/code">
                                <div className="absolute inset-0 bg-primary/5 rounded-2xl opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                <pre className="bg-slate-950/90 text-slate-100 p-6 rounded-2xl overflow-x-auto font-mono text-sm leading-relaxed border border-white/5 shadow-2xl">
                                    <code>{iframeCode}</code>
                                </pre>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute top-4 right-4 h-10 w-10 p-0 bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/10 shadow-xl"
                                    onClick={() => copyToClipboard(iframeCode, 'iframe')}
                                >
                                    {copiedIframe ? (
                                        <Check className="w-4 h-4 text-green-400" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-black tracking-tight">Simulator Laboratory</CardTitle>
                    <CardDescription className="font-medium">
                        Validate your deployment across different rendering protocols.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-wrap gap-4">
                        <Button
                            variant="outline"
                            className="h-12 font-bold transition-all active:scale-95"
                            onClick={() => window.open(publicBotUrl, '_blank')}
                        >
                            <ExternalLink className="w-4 h-4 mr-2 text-primary" />
                            Launch Isolated Preview
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 font-bold transition-all active:scale-95"
                            onClick={() => {
                                const testHtml = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Protocol Verification</title>
    <style>body{background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0}</style>
</head>
<body>
    <h1 style="font-weight:900;letter-spacing:-0.05em">OMNI-AI <span style="color:#6366f1">SANDBOX</span></h1>
    <p style="opacity:0.6;font-weight:600">Protocol v${activeVersion.version} is currently initialized on this page.</p>
    ${scriptCode}
</body>
</html>`;
                                const blob = new Blob([testHtml], { type: 'text/html' });
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                            }}
                        >
                            <Code className="w-4 h-4 mr-2 text-primary" />
                            Test Injection Flow
                        </Button>
                    </div>
                    <div className="pt-4 border-t border-border/10">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            Hash: <span className="font-mono text-primary/60">{activeVersion.id.substring(0, 12)}...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
