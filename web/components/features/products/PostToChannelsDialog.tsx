import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/Tabs"
import { Calendar } from "@/components/ui/Calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/Popover"
import { Switch } from "@/components/ui/Switch"
import { FieldChannelSelector } from '@/components/ui/form-fields/FieldChannelSelector';
import { toast } from 'sonner';
import { Loader2, Share2, Sparkles, BrainCircuit, Calendar as CalendarIcon, Clock, Plus, Trash2, Copy } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import axiosClient from '@/lib/axios-client';
import { useBots } from '@/lib/hooks/features/useBots';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { Card } from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";

interface PostToChannelsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string | null;
    productName?: string;
}

interface PostDraft {
    id: string;
    content: string;
    scheduledAt?: Date;
}

export function PostToChannelsDialog({
    open,
    onOpenChange,
    jobId,
    productName
}: PostToChannelsDialogProps) {
    const { workspaceId } = useWorkspace();
    const { data: bots } = useBots(workspaceId || undefined);

    // Core selections
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>('');
    const [selectedStyle, setSelectedStyle] = useState<string>('');

    // Drafts State (Supports multiple posts)
    const [posts, setPosts] = useState<PostDraft[]>([
        { id: '1', content: '' }
    ]);
    const [activePostId, setActivePostId] = useState<string>('1');

    // UI State
    const [isPosting, setIsPosting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [writingStyleOptions, setWritingStyleOptions] = useState<any[]>([]);
    const [styleLabel, setStyleLabel] = useState('Writing Style');
    const [isScheduled, setIsScheduled] = useState(false);

    const activePost = posts.find(p => p.id === activePostId) || posts[0];

    // Helpers to update active post
    const updateActivePost = (data: Partial<PostDraft>) => {
        setPosts(prev => prev.map(p => p.id === activePostId ? { ...p, ...data } : p));
    };

    const addNewPost = () => {
        const newId = Date.now().toString();
        setPosts(prev => [...prev, { id: newId, content: '' }]);
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

    // Fetch tool config
    useEffect(() => {
        const fetchToolConfig = async () => {
            if (!jobId) return;
            try {
                const job = await axiosClient.get(`/creation-jobs/${jobId}`) as any;
                if (job && job.creationToolId) {
                    const tool = await axiosClient.get(`/creation-tools/${job.creationToolId}`) as any;
                    const flaggedStyleField = tool.formConfig?.fields?.find((f: any) => f.useForPostGen === true);
                    const possibleStyleFields = ['writing_style', 'style', 'tone', 'voice'];
                    const styleField = flaggedStyleField || tool.formConfig?.fields?.find((f: any) => possibleStyleFields.includes(f.name));

                    if (styleField && styleField.options) {
                        setWritingStyleOptions(styleField.options);
                        if (styleField.label) setStyleLabel(styleField.label);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tool config", error);
            }
        };
        fetchToolConfig();
    }, [jobId]);

    const handleGenerateDraft = async () => {
        if (!jobId || !selectedBotId) {
            toast.error("Please select a Bot and a Writing Style first");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await axiosClient.post(`/creation-jobs/${jobId}/post-draft`, {
                message: activePost.content, // Context/Refinement
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
            // Post items one by one or batch endpoint? 
            // For now, let's assume we iterate if multiple
            // But realistically, user might want to post specific content to specific channels.
            // Simplified: All posts go to all selected channels.

            const promises = posts.map(post =>
                axiosClient.post(`/creation-jobs/${jobId}/post`, {
                    channels: selectedChannels,
                    message: post.content,
                    botId: selectedBotId,
                    writingStyle: selectedStyle,
                    scheduledAt: isScheduled ? post.scheduledAt : undefined
                })
            );

            await Promise.all(promises);

            toast.success(`Successfully queued ${posts.length} post(s)!`);
            onOpenChange(false);
            setPosts([{ id: '1', content: '' }]);
            setSelectedChannels([]);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to post content";
            toast.error(message);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[950px] p-0 gap-0 overflow-hidden bg-background">
                <div className="flex h-[85vh] max-h-[700px]">
                    {/* LEFT COLUMN: Configuration */}
                    <div className="w-[320px] border-r bg-muted/10 flex flex-col">
                        <DialogHeader className="p-6 border-b bg-background">
                            <DialogTitle className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                Publishing Studio
                            </DialogTitle>
                            <DialogDescription className="line-clamp-1">
                                {productName}
                            </DialogDescription>
                        </DialogHeader>

                        <ScrollArea className="flex-1 p-6 space-y-6">
                            {/* Channels */}
                            <div className="space-y-3 mb-6">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Destinations</Label>
                                <FieldChannelSelector
                                    field={{ name: 'channels', type: 'channel-selector', label: '' } as any}
                                    value={selectedChannels}
                                    onChange={(_, val) => setSelectedChannels(val as string[])}
                                    allValues={{}}
                                />
                            </div>

                            <Separator className="my-6" />

                            {/* AI Config */}
                            <div className="space-y-4 mb-6">
                                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <BrainCircuit className="w-3.5 h-3.5" />
                                    AI Writer Config
                                </Label>

                                <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select a Bot..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bots?.data?.map((bot) => (
                                            <SelectItem key={bot.id} value={bot.id}>{bot.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {writingStyleOptions.length > 0 && (
                                    <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder={`Select ${styleLabel}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {writingStyleOptions.map((opt: any, idx: number) => (
                                                <SelectItem key={idx} value={typeof opt === 'string' ? opt : opt.value}>
                                                    {typeof opt === 'string' ? opt : opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {/* Multi-Post Manager (Mini List) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Post Queue</Label>
                                    <Button variant="ghost" size="sm" onClick={addNewPost} className="h-6 w-6 p-0">
                                        <Plus className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {posts.map((p, index) => (
                                        <div
                                            key={p.id}
                                            className={cn(
                                                "p-3 rounded-lg border text-sm cursor-pointer transition-all hover:bg-accent/50",
                                                activePostId === p.id ? "bg-accent border-primary/50 shadow-sm" : "bg-background border-transparent hover:border-border"
                                            )}
                                            onClick={() => setActivePostId(p.id)}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-xs truncate">Post #{index + 1}</span>
                                                {posts.length > 1 && (
                                                    <Trash2
                                                        className="w-3 h-3 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => { e.stopPropagation(); removePost(p.id); }}
                                                    />
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate opacity-70">
                                                {p.content || "Empty content..."}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* RIGHT COLUMN: Editor */}
                    <div className="flex-1 flex flex-col min-w-0 bg-background">
                        {/* Toolbar */}
                        <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">Post Editor</span>
                                {activePost.scheduledAt && isScheduled && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {format(activePost.scheduledAt, "MMM d, HH:mm")}
                                    </span>
                                )}
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleGenerateDraft}
                                disabled={isGenerating || !selectedBotId}
                                className="h-8 text-xs bg-white border shadow-sm hover:bg-gray-50"
                            >
                                {isGenerating ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2 text-purple-500" />}
                                AI Generate / Refine
                            </Button>
                        </div>

                        {/* Text Area */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <Textarea
                                placeholder="Start writing your amazing post here..."
                                value={activePost.content}
                                onChange={(e) => updateActivePost({ content: e.target.value })}
                                className="min-h-[300px] h-full resize-none border-none focus-visible:ring-0 text-base leading-relaxed p-0 shadow-none"
                            />
                        </div>

                        {/* Footer / Scheduling */}
                        <div className="p-6 border-t bg-muted/5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Switch id="schedule-mode" checked={isScheduled} onCheckedChange={setIsScheduled} />
                                    <Label htmlFor="schedule-mode" className="text-sm font-medium">Schedule for later</Label>
                                </div>

                                {isScheduled && (
                                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-5">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "w-[240px] justify-start text-left font-normal",
                                                        !activePost.scheduledAt && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {activePost.scheduledAt ? format(activePost.scheduledAt, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={activePost.scheduledAt}
                                                    onSelect={(date) => updateActivePost({ scheduledAt: date })}
                                                    initialFocus
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
                                            <SelectTrigger className="w-[100px] h-9">
                                                <SelectValue placeholder="Time" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                    const h = Math.floor(i / 2);
                                                    const m = i % 2 === 0 ? '00' : '30';
                                                    const time = `${h.toString().padStart(2, '0')}:${m}`;
                                                    return <SelectItem key={time} value={time}>{time}</SelectItem>
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <Button
                                    onClick={handlePost}
                                    disabled={isPosting || selectedChannels.length === 0 || !activePost.content}
                                    className="px-8 font-bold"
                                >
                                    {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isScheduled ? 'Schedule Campaign' : 'Publish Now'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
