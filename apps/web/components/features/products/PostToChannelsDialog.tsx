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
import { Loader2, Share2 } from 'lucide-react';
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
    const [isPosting, setIsPosting] = useState(false);

    const handlePost = async () => {
        if (!jobId) return;
        if (selectedChannels.length === 0) {
            toast.error("Please select at least one channel");
            return;
        }

        setIsPosting(true);
        try {
            // Mock API call since we don't have the real endpoint yet
            // In production this would be: await axiosClient.post(`/jobs/${jobId}/post`, { channels: selectedChannels });

            // Simulating API delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Posting job', jobId, 'to channels', selectedChannels);

            toast.success("Content scheduled for posting successfully!");
            onOpenChange(false);
            setSelectedChannels([]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to post content");
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

                <div className="py-4">
                    <FieldChannelSelector
                        field={{
                            name: 'channels',
                            type: 'channel-selector',
                            label: 'Channels',
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
