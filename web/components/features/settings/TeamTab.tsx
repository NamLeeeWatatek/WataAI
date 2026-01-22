"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspacesApi, WorkspaceRole } from '@/lib/api/workspaces';
import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Loader2, MoreVertical, Plus, UserPlus, Shield, Clock, Crown, Mail, Eye } from 'lucide-react';
import { InviteMemberDialog } from './InviteMemberDialog';
import { toast } from 'sonner';
import { AlertDialogConfirm } from '@/components/ui/AlertDialogConfirm';

export function TeamTab() {
    const queryClient = useQueryClient();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

    // 1. Get current workspace
    const { data: workspace, isLoading: loadingWorkspace } = useQuery({
        queryKey: ['workspace-current'],
        queryFn: workspacesApi.getCurrent,
    });

    // 2. Get members
    const { data: members = [], isLoading: loadingMembers } = useQuery({
        queryKey: ['workspace-members', workspace?.id],
        queryFn: () => workspacesApi.getMembers(workspace!.id),
        enabled: !!workspace?.id,
    });

    // 3. Get pending invitations
    const { data: invitations = [], isLoading: loadingInvitations } = useQuery({
        queryKey: ['workspace-invitations', workspace?.id],
        queryFn: () => workspacesApi.getPendingInvitations(workspace!.id),
        enabled: !!workspace?.id,
    });

    // Mutations
    const removeMemberMutation = useMutation({
        mutationFn: (userId: string) => workspacesApi.removeMember(workspace!.id, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
            toast.success('Member removed');
            setDeleteConfirmOpen(false);
            setMemberToDelete(null);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove member');
        },
    });

    const updateRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: WorkspaceRole }) =>
            workspacesApi.updateMemberRole(workspace!.id, userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace-members'] });
            toast.success('Role updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update role');
        },
    });

    const handleRemoveClick = (userId: string) => {
        setMemberToDelete(userId);
        setDeleteConfirmOpen(true);
    };

    if (loadingWorkspace) {
        return <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mt-10" />;
    }

    if (!workspace) {
        return (
            <div className="text-center p-10 text-muted-foreground">
                No workspace found. You should have at least one workspace.
            </div>
        );
    }

    const owner = members.find(m => m.role?.name?.toLowerCase() === 'owner');
    const otherMembers = members.filter(m => m.role?.name?.toLowerCase() !== 'owner');

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Team Members</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your team structure and access rights.
                    </p>
                </div>
                <Button onClick={() => setInviteOpen(true)} variant="default" size="lg" className="font-bold">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
            </div>

            {loadingMembers ? (
                <div className="p-12 flex justify-center bg-muted/10 rounded-3xl border border-dashed border-border/50">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
            ) : (
                <div className="grid gap-8">
                    {/* Owner Section */}
                    {owner && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-warning fill-warning/20" />
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Workspace Owner</h4>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-5">
                                    <div className="relative">
                                        <Avatar className="h-16 w-16 border-2 border-background ring-2 ring-primary/20 shadow-xl">
                                            <AvatarImage src={owner.user.avatarUrl} />
                                            <AvatarFallback className="text-xl font-black bg-primary/10 text-primary">
                                                {owner.user.firstName?.charAt(0) || owner.user.email?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-warning text-warning-foreground p-1 rounded-full ring-2 ring-background">
                                            <Crown className="w-3 h-3 fill-current" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold">{owner.user.firstName} {owner.user.lastName}</h3>
                                            <Badge variant="default" className="px-1.5 py-0.5">
                                                Owner
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            {owner.user.email}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Pending Invitations Section */}
                    {invitations.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                    Pending Invitations ({invitations.length})
                                </h4>
                            </div>

                            <Card className="overflow-hidden border-dashed">
                                <div className="divide-y divide-border/40">
                                    {invitations.map((invitation) => (
                                        <div
                                            key={invitation.id}
                                            className="flex items-center justify-between p-5 hover:bg-muted/30 transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200 text-orange-600 font-bold dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-400">
                                                    <Mail className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm">
                                                            {invitation.email}
                                                        </p>
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/10 dark:text-orange-400 dark:border-orange-800">
                                                            Pending
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        <span>Expires on {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Optional: Add Revoke button here if API supported it */}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Other Members List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                                Active Members ({otherMembers.length})
                            </h4>
                        </div>

                        <Card className="overflow-hidden">
                            {otherMembers.length === 0 ? (
                                <div className="p-12 text-center flex flex-col items-center justify-center text-muted-foreground gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                                        <UserPlus className="w-5 h-5 opacity-50" />
                                    </div>
                                    <p>No other active members yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {otherMembers.map((member) => (
                                        <div
                                            key={member.userId}
                                            className="flex items-center justify-between p-5 hover:bg-muted/30 transition-all group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border border-border/40">
                                                    <AvatarImage src={member.user.avatarUrl} />
                                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                        {member.user.firstName?.charAt(0) || member.user.email?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-sm">
                                                            {member.user.firstName} {member.user.lastName}
                                                        </p>
                                                        {member.role?.name?.toLowerCase() === 'admin' && (
                                                            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                                                Admin
                                                            </Badge>
                                                        )}
                                                        {member.role?.name?.toLowerCase() === 'viewer' && (
                                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                                                Viewer
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{member.user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                        <DropdownMenuItem
                                                            className="font-medium cursor-pointer"
                                                            onClick={() =>
                                                                updateRoleMutation.mutate({
                                                                    userId: member.userId,
                                                                    role: WorkspaceRole.ADMIN,
                                                                })
                                                            }
                                                        >
                                                            <Shield className="w-4 h-4 mr-2" />
                                                            Make Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="font-medium cursor-pointer"
                                                            onClick={() =>
                                                                updateRoleMutation.mutate({
                                                                    userId: member.userId,
                                                                    role: WorkspaceRole.MEMBER,
                                                                })
                                                            }
                                                        >
                                                            <UserPlus className="w-4 h-4 mr-2" />
                                                            Make Member
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="font-medium cursor-pointer"
                                                            onClick={() =>
                                                                updateRoleMutation.mutate({
                                                                    userId: member.userId,
                                                                    role: WorkspaceRole.VIEWER,
                                                                })
                                                            }
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Make Viewer
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive font-medium cursor-pointer"
                                                            onClick={() => handleRemoveClick(member.userId)}
                                                        >
                                                            Remove Member
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            )}
            <InviteMemberDialog
                workspaceId={workspace.id}
                open={inviteOpen}
                onOpenChange={setInviteOpen}
            />

            <AlertDialogConfirm
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                title="Remove Team Member"
                description="Are you sure you want to remove this member from the workspace? They will lose access to all resources immediately."
                confirmText="Remove Member"
                variant="destructive"
                onConfirm={() => {
                    if (memberToDelete) removeMemberMutation.mutate(memberToDelete);
                }}
            />
        </div>
    );
}
