'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Calendar } from "@/components/ui/Calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Switch } from "@/components/ui/Switch"
import { FieldChannelSelector } from '@/components/ui/form-fields/FieldChannelSelector';
import { toast } from 'sonner';
import { Loader2, Share2, Sparkles, BrainCircuit, Calendar as CalendarIcon, Clock, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import axiosClient from '@/lib/axios-client';
import { useBots } from '@/lib/hooks/features/useBots';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

interface PostDraft {
    id: string;
    content: string;
    imageUrl?: string;
    channelIds: string[];
    scheduledAt?: Date;
}

export default function PublishingStudioPage(props: { params: Promise<{ jobId: string }> }) {
    const params = use(props.params);
    const { jobId } = params;
    const router = useRouter();
    const { t } = useTranslation();
    const { workspaceId } = useWorkspace();
    const { data: bots } = useBots(workspaceId || undefined);

    const [productName, QPsetName] = useState<string>('');
    const [isLoadingJob, setIsLoadingJob] = useState(true);

    // Drafts State
    const [posts, setPosts] = useState<PostDraft[]>([
        { id: '1', content: '', channelIds: [] }
    ]);
    const [activePostId, setActivePostId] = useState<string>('1');

    // UI State
    const [isPosting, setIsPosting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [selectedBotId, setSelectedBotId] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('');

    const activePost = posts.find(p => p.id === activePostId) || posts[0];
    const selectedChannels = activePost.channelIds;
    const setSelectedChannels = (val: string[]) => updateActivePost({ channelIds: val });

    // Fetch Job Info
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const job = await axiosClient.get(`/creation-jobs/${jobId}`) as any;
                if (job) {
                    const tool = await axiosClient.get(`/creation-tools/${job.creationToolId}`) as any;
                    QPsetName(tool?.name || 'Content');

                    // Pre-fill content from job output if available and empty
                    if (job.outputData && posts[0].content === '') {
                        let content = '';
                        if (typeof job.outputData.content === 'string') content = job.outputData.content;
                        else if (typeof job.outputData.text === 'string') content = job.outputData.text;
                        else if (typeof job.outputData.result === 'string' && job.outputData.result !== 'Success') content = job.outputData.result;

                        let imageUrl = '';
                        if (typeof job.outputData.imageUrl === 'string') imageUrl = job.outputData.imageUrl;
                        else if (typeof job.outputData.image === 'string') imageUrl = job.outputData.image;
                        else if (typeof job.outputData.url === 'string') imageUrl = job.outputData.url;
                        else if (Array.isArray(job.outputData.images) && job.outputData.images[0]) imageUrl = job.outputData.images[0];

                        if (content || imageUrl) {
                            setPosts([{ id: '1', content, imageUrl, channelIds: [] }]);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch job", error);
                toast.error("Could not load job details");
            } finally {
                setIsLoadingJob(false);
            }
        };
        fetchJob();
    }, [jobId]);

    const updateActivePost = (data: Partial<PostDraft>) => {
        setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, ...data } : p));
    };

    const addNewPost = () => {
        const newId = Date.now().toString();
        // Inherit channels from previous post for convenience
        const lastChannels = posts[posts.length - 1]?.channelIds || [];
        setPosts(prev => [...prev, { id: newId, content: '', channelIds: lastChannels, imageUrl: activePost.imageUrl }]);
        setActivePostId(newId);
    };

    const removePost = (id: string) => {
        if (posts.length <= 1) return;
        const newPosts = posts.filter(p => p.id !== id);
        setPosts(newPosts);
        if (activePostId === id) {
            setActivePostId(newPosts[newPosts.length - 1].id);
        }
    };

    const handleGenerateDraft = async () => {
        if (!jobId || !selectedBotId) {
            toast.error("Please select a Bot and a Writing Style first");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await axiosClient.post(`/creation-jobs/${jobId}/post-draft`, {
                message: activePost.content,
                botId: selectedBotId,
                writingStyle: selectedStyle
            }) as any;

            if (response && response.draft) {
                updateActivePost({ content: response.draft });
                toast.success("Content reinforced by AI!");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to generate");
        } finally {
            setIsGenerating(false);
        }
    };

    const handlePost = async () => {
        if (!jobId) return;
        if (selectedChannels.length === 0) {
            toast.error("Please select at least one channel");
            return;
        }

        setIsPosting(true);
        try {
            const promises = posts.map(post =>
                axiosClient.post(`/creation-jobs/${jobId}/post`, {
                    channels: selectedChannels,
                    message: post.content,
                    botId: selectedBotId,
                    writingStyle: selectedStyle,
                    scheduledTime: isScheduled ? post.scheduledAt : undefined
                })
            );

            await Promise.all(promises);

            toast.success(`Successfully queued ${posts.length} post(s)!`);
            router.back();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to post content";
            toast.error(message);
        } finally {
            setIsPosting(false);
        }
    };

    if (isLoadingJob) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background selection:bg-primary/20">
            {/* Header */}
            <header className="h-16 border-b border-border/40 flex items-center px-6 gap-4 bg-background/80 backdrop-blur-md z-30">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted/80">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-base font-bold flex items-center gap-2.5 tracking-tight">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                            <Share2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            {t('Creation Studio')}
                        </span>
                    </h1>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50 ml-9 -mt-0.5">{productName}</p>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* LEFT COLUMN: Configuration */}
                <div
                    className="w-[380px] border-r border-border/40 bg-card/30 backdrop-blur-sm flex flex-col shadow-[1px_0_10px_rgba(0,0,0,0.02)] z-20"
                >
                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-10">
                            {/* Channels */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Destinations</Label>
                                    <span className="text-[10px] font-bold text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{selectedChannels.length} Selected</span>
                                </div>
                                <div className="p-1 rounded-2xl bg-muted/20 border border-border/10">
                                    <FieldChannelSelector
                                        field={{ name: 'channels', type: 'channel-selector', label: '' } as any}
                                        value={selectedChannels}
                                        onChange={(_, val) => setSelectedChannels(val as string[])}
                                        allValues={{}}
                                    />
                                </div>
                            </div>

                            {/* AI Config */}
                            <div className="space-y-5">
                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 flex items-center gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5 text-primary/70" />
                                    AI Writer Config
                                </Label>

                                <div className="space-y-3">
                                    <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                                        <SelectTrigger className="bg-background/50 border-border/40 rounded-xl h-11">
                                            <SelectValue placeholder="Select a Bot..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bots?.data?.map((bot) => (
                                                <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                                        <SelectTrigger className="bg-background/50 border-border/40 rounded-xl h-11">
                                            <SelectValue placeholder="Select Writing Style..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[
                                                { label: t('writingStyle.professional'), value: 'Professional' },
                                                { label: t('writingStyle.friendly'), value: 'Friendly' },
                                                { label: t('writingStyle.humorous'), value: 'Humorous' },
                                                { label: t('writingStyle.persuasive'), value: 'Persuasive' },
                                                { label: t('writingStyle.inspirational'), value: 'Inspirational' },
                                                { label: t('writingStyle.trendy'), value: 'Trendy' },
                                                { label: t('writingStyle.storytelling'), value: 'Storytelling' },
                                                { label: t('writingStyle.concise'), value: 'Concise' },
                                                { label: t('writingStyle.saleHard'), value: 'Sale Hard' }
                                            ].map((style) => (
                                                <SelectItem key={style.value} value={style.value}>
                                                    {style.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Multi-Post Manager (Mini List) */}
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Post Queue</Label>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={addNewPost}
                                        className="h-7 w-7 rounded-lg border-primary/20 text-primary hover:bg-primary/5"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {posts.map((p, index) => (
                                        <div
                                            key={p.id}
                                            className={cn(
                                                "p-4 rounded-[20px] border transition-all duration-300 cursor-pointer group relative",
                                                activePostId === p.id
                                                    ? "bg-primary/[0.03] border-primary/30 shadow-[0_4px_20px_rgba(var(--primary-rgb),0.05)]"
                                                    : "bg-background/40 border-border/40 hover:border-border hover:bg-background/60"
                                            )}
                                            onClick={() => setActivePostId(p.id)}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black",
                                                        activePostId === p.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground/60"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-bold text-[11px] tracking-tight">Draft #{index + 1}</span>
                                                </div>
                                                {posts.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive/50 hover:text-destructive hover:bg-destructive/5"
                                                        onClick={(e) => { e.stopPropagation(); removePost(p.id); }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground line-clamp-2 leading-relaxed opacity-60 italic">
                                                <span>{p.content || "Click to start writing..."}</span>
                                                {p.channelIds.length > 0 && (
                                                    <span className="text-[9px] font-black text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">{p.channelIds.length} Ch.</span>
                                                )}
                                            </div>

                                            {activePostId === p.id && (
                                                <div
                                                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-full"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>

                {/* RIGHT COLUMN: Editor */}
                <div className="flex-1 flex flex-col min-w-0 bg-background/30 relative">
                    {/* Toolbar */}
                    <div className="h-16 border-b border-border/40 flex items-center justify-between px-10 bg-card/20 backdrop-blur-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-xs font-black uppercase tracking-[0.15em] text-foreground/80">Editor</span>
                            </div>

                            {activePost.scheduledAt && isScheduled && (
                                <div
                                    className="text-[10px] font-bold bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center gap-1.5 border border-primary/20"
                                >
                                    <Clock className="w-3 h-3" />
                                    Scheduled: {format(activePost.scheduledAt, "MMM d, HH:mm")}
                                </div>
                            )}
                        </div>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleGenerateDraft}
                            disabled={isGenerating || !selectedBotId}
                            className="h-9 px-4 rounded-full text-[11px] font-bold uppercase tracking-wider bg-background border-border/60 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-primary" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 mr-2 text-primary group-hover:animate-pulse" />
                            )}
                            AI Magic Refine
                        </Button>
                    </div>

                    {/* Text Area Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <ScrollArea className="h-full">
                            <div className="max-w-[1400px] mx-auto p-8 lg:p-12 min-h-full">
                                <div key={activePostId} className="flex gap-10 items-start">
                                    {/* Image Preview Side */}
                                    {activePost.imageUrl && (
                                        <div className="w-1/2 sticky top-0 aspect-square rounded-[32px] overflow-hidden border border-border/40 bg-card/60 shadow-[0_20px_50px_rgba(0,0,0,0.1)] group">
                                            <img
                                                src={activePost.imageUrl}
                                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                                                alt="Generated preview"
                                            />
                                            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="sm" variant="secondary" className="w-full rounded-xl backdrop-blur-md" onClick={() => window.open(activePost.imageUrl, '_blank')}>
                                                    View Full Resolution
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editor Side */}
                                    <div className={cn("flex flex-col gap-8", activePost.imageUrl ? "w-1/2" : "w-full max-w-4xl mx-auto")}>
                                        <Textarea
                                            placeholder="Start writing your amazing post here..."
                                            value={activePost.content}
                                            onChange={(e) => updateActivePost({ content: e.target.value })}
                                            className="min-h-[60vh] resize-none border-none focus-visible:ring-0 text-xl leading-[1.8] p-0 shadow-none font-medium bg-transparent selection:bg-primary/20 placeholder:text-muted-foreground/30 placeholder:italic transition-all"
                                        />

                                        <div className="pt-8 border-t border-border/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                                            <div className="flex items-center gap-4">
                                                <span>Words: {activePost.content.trim().split(/\s+/).filter(Boolean).length}</span>
                                                <span>Characters: {activePost.content.length}</span>
                                            </div>
                                            <span>Session ID: {jobId.slice(-6)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer / Actions Bar */}
                    <div className="p-8 border-t border-border/40 bg-card/40 backdrop-blur-md">
                        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center space-x-3 group">
                                    <Switch
                                        id="schedule-mode"
                                        checked={isScheduled}
                                        onCheckedChange={setIsScheduled}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                    <Label htmlFor="schedule-mode" className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors cursor-pointer">
                                        Queue for Schedule
                                    </Label>
                                </div>

                                {isScheduled && (
                                    <div
                                        className="flex items-center gap-2"
                                    >
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className={cn(
                                                        "w-[180px] h-9 justify-start text-left font-bold text-[10px] uppercase tracking-wider rounded-xl border-border/40 bg-background/50",
                                                        !activePost.scheduledAt && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-primary/60" />
                                                    {activePost.scheduledAt ? format(activePost.scheduledAt, "PPP") : <span>Select Date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 rounded-[24px] border-border/40 overflow-hidden shadow-2xl" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={activePost.scheduledAt}
                                                    onSelect={(date) => {
                                                        if (!date) {
                                                            updateActivePost({ scheduledAt: undefined });
                                                            return;
                                                        }
                                                        const newDate = new Date(date);
                                                        if (activePost.scheduledAt) {
                                                            newDate.setHours(activePost.scheduledAt.getHours());
                                                            newDate.setMinutes(activePost.scheduledAt.getMinutes());
                                                        }
                                                        updateActivePost({ scheduledAt: newDate });
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>

                                        <Select
                                            value={activePost.scheduledAt ? format(activePost.scheduledAt, "HH:mm") : undefined}
                                            onValueChange={(time) => {
                                                if (!time) return;
                                                const [hours, minutes] = time.split(':').map(Number);
                                                const newDate = activePost.scheduledAt ? new Date(activePost.scheduledAt) : new Date();
                                                newDate.setHours(hours);
                                                newDate.setMinutes(minutes);
                                                updateActivePost({ scheduledAt: newDate });
                                            }}
                                        >
                                            <SelectTrigger className="w-[90px] h-9 text-[10px] font-bold rounded-xl border-border/40 bg-background/50">
                                                <SelectValue placeholder="Time" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/40">
                                                {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                    const h = Math.floor(i / 2);
                                                    const m = i % 2 === 0 ? '00' : '30';
                                                    const time = `${h.toString().padStart(2, '0')}:${m}`;
                                                    return <SelectItem key={time} value={time} className="text-[10px] font-bold">{time}</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    onClick={() => router.back()}
                                    className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={isPosting || selectedChannels.length === 0 || !activePost.content}
                                    className="px-10 h-12 rounded-full font-black uppercase tracking-[0.1em] text-xs shadow-[0_10px_30px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_15px_40px_rgba(var(--primary-rgb),0.35)] transition-all active:scale-95"
                                >
                                    {isPosting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            {isScheduled ? <CalendarIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                            {isScheduled ? 'Schedule Campaign' : 'Blast Content'}
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
