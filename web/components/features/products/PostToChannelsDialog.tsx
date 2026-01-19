'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import { FieldChannelSelector } from '@/components/ui/form-fields/FieldChannelSelector';
import { toast } from 'sonner';
import { Loader2, Share2, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import axiosClient from '@/lib/axios-client';

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
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateContent = async () => {
        setIsGenerating(true);
        try {
            // TODO: Replace with actual AI generation endpoint
            // For now, we simulate a generation based on product name
            await new Promise(resolve => setTimeout(resolve, 1500));

            const generatedContent = `🚀 Check out my new creation: ${productName || 'Amazing AI Art'}!\n\nCreate yours today with WataAI. #AI #GenerativeAI #Creativity`;
            setMessage(generatedContent);
            toast.success("Content generated!");
        } catch (error) {
            toast.error("Failed to generate content");
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
                    <DialogTitle>Post to Channels</DialogTitle>
                    <DialogDescription>
                        Select the channels where you want to publish "{productName || 'this content'}".
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Caption / Message</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-primary hover:text-primary/80"
                                onClick={handleGenerateContent}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-1" />
                                )}
                                Generate with AI
                            </Button>
                        </div>
                        <Textarea
                            placeholder="Write a caption for your post..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="resize-none"
                        />
                    </div>
                    <FieldChannelSelector
                        field={{
                            name: 'channels',
                            type: 'channel-selector',
                            label: 'Select Channels',
                            // The selector uses dynamic options internally based on type
                        } as any}
                        value={selectedChannels}
                        onChange={(_, val) => setSelectedChannels(val as string[])}
                        allValues={{}}
                    />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPosting}>
                        Cancel
                    </Button>
                    <Button onClick={handlePost} disabled={isPosting || selectedChannels.length === 0}>
                        {isPosting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isPosting ? 'Posting...' : 'Post Content'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
