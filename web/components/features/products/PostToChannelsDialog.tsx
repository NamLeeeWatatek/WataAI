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
import { FieldChannelSelector } from '@/components/ui/form-fields/FieldChannelSelector';
import { toast } from 'sonner';
import { Loader2, Share2, Sparkles, BrainCircuit } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import axiosClient from '@/lib/axios-client';
import { useBots } from '@/lib/hooks/features/useBots';
import { useWorkspace } from '@/lib/hooks/useWorkspace';
import { botsApi } from '@/lib/api/bots';

interface PostToChannelsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    jobId: string | null;
    productName?: string;
}

export function PostToChannelsDialog({
    open,
    onOpenChange,
    jobId,
    productName
}: PostToChannelsDialogProps) {
    const { workspaceId } = useWorkspace();
    const { data: bots } = useBots(workspaceId || undefined);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [selectedBotId, setSelectedBotId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [writingStyleOptions, setWritingStyleOptions] = useState<any[]>([]);
    const [styleLabel, setStyleLabel] = useState('Writing Style');
    const [selectedStyle, setSelectedStyle] = useState<string>('');

    // Fetch tool config to find writing styles
    useEffect(() => {
        const fetchToolConfig = async () => {
            if (!jobId) return;
            try {
                // We need to fetch the job first to get the creationToolId
                const job = await axiosClient.get(`/creation-jobs/${jobId}`) as any;
                if (job && job.creationToolId) {
                    const tool = await axiosClient.get(`/creation-tools/${job.creationToolId}`) as any;

                    // Look for fields that are flagged for Post Generation logic
                    // Fallback to name matching if no flag is set (backward compatibility)
                    const flaggedStyleField = tool.formConfig?.fields?.find((f: any) => f.useForPostGen === true);

                    const possibleStyleFields = ['writing_style', 'style', 'tone', 'voice'];
                    const styleField = flaggedStyleField || tool.formConfig?.fields?.find((f: any) => possibleStyleFields.includes(f.name));

                    if (styleField && styleField.options) {
                        setWritingStyleOptions(styleField.options);
                        if (styleField.label) {
                            setStyleLabel(styleField.label);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to fetch tool config for options", error);
            }
        };
        fetchToolConfig();
    }, [jobId]);

    // Generation logic: call the backend draft endpoint
    const handleGenerateDraft = async () => {
        if (!jobId || !selectedBotId) {
            toast.error("Please select a Bot and a Writing Style first");
            return;
        }

        setIsGenerating(true);
        try {
            // Send current message as 'instructions' to the bot
            const response = await axiosClient.post(`/creation-jobs/${jobId}/post-draft`, {
                message: message, // Current user input as refinement instructions
                botId: selectedBotId,
                writingStyle: selectedStyle
            }) as any;

            if (response && response.draft) {
                setMessage(response.draft);
                toast.success("AI has crafted a professional post for you!");
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to generate AI draft");
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
            await axiosClient.post(`/creation-jobs/${jobId}/post`, {
                channels: selectedChannels,
                message,
                botId: selectedBotId,
                writingStyle: selectedStyle,
                // We'll support scheduling in the future, for now it's immediate
            });

            toast.success("Content posted successfully!");
            onOpenChange(false);
            setSelectedChannels([]);
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || "Failed to post content";
            toast.error(message);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Post to Channels
                    </DialogTitle>
                    <DialogDescription>
                        Select the channels where you want to publish "{productName || 'this content'}".
                    </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-4">
                    {/* Bot selection for generation */}
                    <div className="space-y-2 px-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Writing Bot</Label>
                            {selectedBotId && (
                                <span className="text-[10px] text-primary flex items-center gap-1">
                                    <BrainCircuit className="w-3 h-3" />
                                    Knowledge Enabled
                                </span>
                            )}
                        </div>
                        <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                            <SelectTrigger className="w-full bg-secondary/20">
                                <SelectValue placeholder="Choose a bot to write..." />
                            </SelectTrigger>
                            <SelectContent>
                                {bots?.data?.map((bot) => (
                                    <SelectItem key={bot.id} value={bot.id}>
                                        <div className="flex items-center gap-2">
                                            {bot.name}
                                        </div>
                                    </SelectItem>
                                ))}
                                {(!bots?.data || bots.data.length === 0) && (
                                    <SelectItem value="none" disabled>No bots available</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dynamic Writing Style Selection from Tool Config */}
                    {writingStyleOptions.length > 0 && (
                        <div className="space-y-2 px-1">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{styleLabel}</Label>
                            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                                <SelectTrigger className="w-full bg-secondary/20 h-9 text-xs">
                                    <SelectValue placeholder={`Select ${styleLabel.toLowerCase()}...`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {writingStyleOptions.map((opt: any, idx: number) => {
                                        const val = typeof opt === 'string' ? opt : opt.value;
                                        const label = typeof opt === 'string' ? opt : opt.label;
                                        return (
                                            <SelectItem key={idx} value={val}>{label}</SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Caption / Message</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 transition-all"
                                onClick={handleGenerateDraft}
                                disabled={isGenerating || !selectedBotId}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                )}
                                {selectedBotId ? 'Refine with Bot' : 'Select Bot to Refine'}
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Write a caption for your post..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            className="resize-none text-sm leading-relaxed"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Select Destination Channels</Label>
                        <FieldChannelSelector
                            field={{
                                name: 'channels',
                                type: 'channel-selector',
                                label: 'Select Channels',
                            } as any}
                            value={selectedChannels}
                            onChange={(_, val) => setSelectedChannels(val as string[])}
                            allValues={{}}
                        />
                    </div>
                </div>

                <DialogFooter className="mt-2 border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPosting}>
                        Cancel
                    </Button>
                    <Button onClick={handlePost} disabled={isPosting || selectedChannels.length === 0}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPosting ? 'Posting...' : 'Post Content Now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
