'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Archive, Trash2, Clock, User, ChevronLeft } from 'lucide-react';
import { ChatInterface } from '@/components/features/chat/ChatInterface';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

import axiosClient from '@/lib/axios-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/PageLoading';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { Badge } from '@/components/ui/Badge';
import { MessageRole } from '@/lib/types/conversations';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';

interface ConversationDetails {
    id: string;
    contactName: string;      // Match backend field name
    contactAvatar?: string;   // Match backend field name
    channelType: string;
    channelName: string;
    status: string;
    channelId?: string;       // Detect if it's a channel conversation
}

export default function ConversationPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<ConversationDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showArchiveDialog, setShowArchiveDialog] = useState(false);

    useEffect(() => {
        loadConversation();
    }, [conversationId]);

    const loadConversation = async () => {
        try {
            setLoading(true);
            const data: any = await axiosClient.get(`/conversations/${conversationId}`);
            setConversation(data);
        } catch (error) {
            toast.error('Failed to load conversation');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (content: string) => {
        try {
            await axiosClient.post(`/conversations/${conversationId}/messages`, {
                content,
                role: MessageRole.ASSISTANT
            });
        } catch (err) {
            toast.error('Failed to send message');
            throw err;
        }
    };



    const handleArchive = async () => {
        setActionLoading(true);
        try {
            await axiosClient.post(`/conversations/${conversationId}/archive`);
            toast.success('Conversation archived');
            router.push('/conversations');
        } catch (error) {
            toast.error('Failed to archive conversation');
        } finally {
            setActionLoading(false);
            setShowArchiveDialog(false);
        }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await axiosClient.delete(`/conversations/${conversationId}`);
            toast.success('Conversation deleted');
            router.push('/conversations');
        } catch (error) {
            toast.error('Failed to delete conversation');
        } finally {
            setActionLoading(false);
            setShowDeleteDialog(false);
        }
    };

    if (loading) {
        return <PageLoading message="Loading conversation..." />
    }

    if (!conversation) {
        return (
            <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
                <p className="text-muted-foreground">Conversation not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-border/40 bg-card/30 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full h-9 w-9 shrink-0"
                        onClick={() => router.push('/conversations')}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0 border border-border/50 shadow-sm">
                            <AvatarImage src={conversation.contactAvatar} />
                            <AvatarFallback className="bg-primary/5 text-primary">
                                <User className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0">
                            <h2 className="text-sm font-semibold leading-none mb-1 truncate">
                                {conversation.contactName || 'Unknown Customer'}
                            </h2>
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={conversation.status === 'open' ? 'success' : 'secondary'}
                                    className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold"
                                >
                                    {conversation.status}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground hidden sm:flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                <MoreVertical className="w-5 h-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => setShowArchiveDialog(true)} className="gap-2 cursor-pointer">
                                <Archive className="w-4 h-4" />
                                Archive Conversation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-destructive focus:text-destructive gap-2 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Permanently
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden">
                {conversationId && (
                    <ChatInterface
                        conversationId={conversationId}
                        customerName={conversation.contactName}
                        isChannelConversation={!!conversation.channelType}
                        onSendMessage={handleSendMessage}
                        senderRole={MessageRole.ASSISTANT}
                        className="h-full"
                    />
                )}
            </div>

            {/* Dialogs */}
            <AlertDialogConfirm
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                title="Archive Conversation?"
                description="This will move the conversation to the archive. You can still access it later."
                onConfirm={handleArchive}
            />

            <AlertDialogConfirm
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Delete Permanently?"
                description="This action cannot be undone. All messages and data associated with this conversation will be lost."
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
}
