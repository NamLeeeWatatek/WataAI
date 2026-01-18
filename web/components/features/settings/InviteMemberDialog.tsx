"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/Form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { workspacesApi, WorkspaceRole } from '@/lib/api/workspaces';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

const invitationSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.nativeEnum(WorkspaceRole),
});

type InvitationFormValues = z.infer<typeof invitationSchema>;

interface InviteMemberDialogProps {
    workspaceId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ workspaceId, open, onOpenChange }: InviteMemberDialogProps) {
    const queryClient = useQueryClient();
    const form = useForm<InvitationFormValues>({
        resolver: zodResolver(invitationSchema),
        defaultValues: {
            email: '',
            role: WorkspaceRole.MEMBER,
        },
    });

    const inviteMutation = useMutation({
        mutationFn: (data: InvitationFormValues) => {
            return workspacesApi.inviteMember(workspaceId, data);
        },
        onSuccess: () => {
            toast.success('Invitation sent successfully');
            form.reset();
            onOpenChange(false);
            // Optional: Refetch pending invitations if we had a list
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to send invitation');
        },
    });

    const onSubmit = (data: InvitationFormValues) => {
        inviteMutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <DialogDescription>
                        Send an email invitation to join your workspace.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input placeholder="colleague@example.com" {...field} className="pl-10" />
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a role" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={WorkspaceRole.MEMBER}>Member</SelectItem>
                                            <SelectItem value={WorkspaceRole.ADMIN}>Admin</SelectItem>
                                            <SelectItem value={WorkspaceRole.VIEWER}>Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={inviteMutation.isPending}>
                                {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Send Invitation
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
