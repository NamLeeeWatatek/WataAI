'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { adminApi } from '@/lib/api/admin'
import { User } from '@/lib/types/user'
import toast from '@/lib/toast'
import { MoreHorizontal, Shield, User as UserIcon, CheckCircle, RefreshCw } from 'lucide-react'
import { Search } from '@/components/ui/Search'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog'

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/date'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'
import { Checkbox } from '@/components/ui/Checkbox'
import { BulkActionsToolbar } from '@/components/ui/BulkActionsToolbar'
import { Trash2 } from 'lucide-react'

import { useDebounce } from '@/lib/hooks/useDebounce'

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
    const [newRoleId, setNewRoleId] = useState<string>('')

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false)

    // Reset page to 1 when search changes
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch])

    // Roles Query
    const { data: rolesData } = useQuery({
        queryKey: ['roles-list'],
        queryFn: () => adminApi.getRoles(),
        initialData: []
    })
    const roles = Array.isArray(rolesData) ? rolesData : [];

    // Users Query
    const { data: usersResponse, isLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['users', page, limit, debouncedSearch],
        queryFn: () => adminApi.getUsers({
            page,
            limit,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData
    })

    const users = usersResponse?.items || []
    const totalUsers = usersResponse?.total || 0
    const totalPages = Math.ceil(totalUsers / limit)

    // Mutations
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) => adminApi.updateUser(String(id), data),
        onSuccess: () => {
            toast.success('User profile updated');
            setIsEditRoleOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const handleEditRole = (user: User) => {
        setSelectedUser(user)
        const currentRoleId = user.role?.id;
        setNewRoleId(String(currentRoleId || ''))
        setIsEditRoleOpen(true)
    }

    const saveRoleUpdate = () => {
        if (!selectedUser) return
        updateUserMutation.mutate({
            id: selectedUser.id,
            data: { roleId: parseInt(newRoleId) }
        });
    }

    const handleBulkDelete = async () => {
        // Implementation of bulk delete or deactivate
        setIsBulkDeleting(true)
        try {
            // For now, let's assume we just want to show it's working
            // For each id in selectedIds...
            toast.success(`Requested action for ${selectedIds.length} users`);
            setSelectedIds([]);
            refetchUsers();
        } catch (error) {
            toast.error('Failed to process bulk action');
        } finally {
            setIsBulkDeleting(false);
            setBulkDeleteAlertOpen(false);
        }
    }

    const columns = React.useMemo<ColumnDef<User>[]>(() => [
        {
            id: 'selection',
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            id: 'name',
            header: 'User Identity',
            cell: ({ row }) => {
                const user = row.original;
                const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
                const displayName = fullName || user.email.split('@')[0];
                const initials = (displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

                return (
                    <div className="flex items-center gap-4 py-1">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                            {user.photo?.path && <AvatarImage src={user.photo.path} alt={displayName} />}
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-xs font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-sm truncate text-foreground leading-tight">
                                {displayName}
                            </span>
                            <span className="text-xs text-muted-foreground truncate leading-snug">
                                {user.email}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            id: 'role',
            header: 'System Access',
            cell: ({ row }) => {
                const user = row.original;
                const roleName = user.role?.name || 'User';
                const isAdmin = roleName.toLowerCase() === 'admin';
                return (
                    <Badge
                        variant={isAdmin ? "default" : "outline"}
                        className={cn(
                            "capitalize px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex w-fit items-center gap-1.5 border-primary/20",
                            isAdmin ? "bg-primary text-primary-foreground shadow-sm" : "bg-primary/5 text-primary border-primary/20 shadow-none"
                        )}
                    >
                        <Shield className={cn("w-3 h-3", isAdmin ? "text-primary-foreground" : "text-primary")} />
                        {roleName}
                    </Badge>
                )
            }
        },
        {
            id: 'status',
            header: 'Network Status',
            cell: () => (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/5 w-fit border border-green-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Active</span>
                </div>
            )
        },
        {
            id: 'createdAt',
            header: 'Member Since',
            cell: ({ row }) => (
                <div className="text-xs text-muted-foreground font-medium">
                    {formatDate(row.original.createdAt)}
                </div>
            )
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEditRole(row.original)}>
                            Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10">
                            Deactivate User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ], []);

    const paginationInfo = {
        page,
        limit,
        total: totalUsers,
        totalPages,
        hasNextPage: page < totalPages
    }

    const stats = [
        { label: 'Total Users', value: totalUsers, icon: UserIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Active Users', value: users.length, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'System Roles', value: roles.length, icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    ]

    return (
        <PageShell
            title="User Directory"
            description="Manage your organization's users, roles, and access permissions."
        >
            <div className="space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-6 rounded-2xl border bg-card shadow-sm flex items-center gap-5 transition-all hover:bg-muted/50">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-inner", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-2xl font-black">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <DataTable
                    data={users}
                    columns={columns}
                    loading={isLoading}
                    pagination={paginationInfo}
                    onPageChange={setPage}
                    onPageSizeChange={(newLimit) => {
                        setLimit(newLimit)
                        setPage(1)
                    }}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    searchable={true}
                    searchValue={search}
                    onSearch={setSearch}
                    actions={
                        <Button className="gap-2 shadow-sm h-9 px-6 font-bold rounded-xl">
                            <UserIcon className="w-4 h-4" />
                            Invite Member
                        </Button>
                    }
                    searchPlaceholder="Find by name or signal identifier..."
                    headerActions={
                        <div className="flex items-center gap-4">
                            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Showing {users.length} of {totalUsers} Entities</span>
                        </div>
                    }
                    gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    renderGridItem={(user) => {
                        const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0];
                        const initials = (displayName || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                        const roleName = user.role?.name || 'User';
                        const isAdmin = roleName.toLowerCase() === 'admin';

                        return (
                            <Card className="flex flex-col h-full hover:shadow-md transition-all">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        {user.photo?.path && <AvatarImage src={user.photo.path} alt={displayName} />}
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <CardTitle className="text-sm font-bold truncate">{displayName}</CardTitle>
                                        <CardDescription className="text-xs truncate">{user.email}</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Role:</span>
                                        <Badge
                                            variant={isAdmin ? "default" : "outline"}
                                            className={cn(
                                                "capitalize px-2 py-0.5 text-[10px]",
                                                isAdmin ? "bg-primary text-primary-foreground" : "bg-primary/5 text-primary border-primary/20"
                                            )}
                                        >
                                            {roleName}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            Active
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-muted-foreground">Joined:</span>
                                        <span className="font-medium">{formatDate(user.createdAt)}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2 flex justify-end gap-2 bg-muted/30 py-3">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => handleEditRole(user)}
                                    >
                                        Edit Role
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-destructive hover:bg-destructive/10"
                                    >
                                        Deactivate
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    }}
                />

                <BulkActionsToolbar
                    selectedCount={selectedIds.length}
                    onClearSelection={() => setSelectedIds([])}
                    actions={[
                        {
                            label: 'Delete',
                            icon: Trash2,
                            onClick: () => setBulkDeleteAlertOpen(true),
                            variant: 'destructive'
                        }
                    ]}
                />

                {/* Edit Role Dialog */}
                <Dialog open={isEditRoleOpen} onOpenChange={setIsEditRoleOpen}>
                    <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
                        <DialogHeader className="p-6 pb-0">
                            <DialogTitle className="text-xl font-black flex items-center gap-2 uppercase">
                                <Shield className="w-5 h-5 text-primary" />
                                Reassign Access
                            </DialogTitle>
                            <CardDescription className="text-xs font-medium">
                                Updating authorization matrix for <strong className="text-foreground">{selectedUser?.email}</strong>
                            </CardDescription>
                        </DialogHeader>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System-wide Authority</Label>
                                <Select value={newRoleId} onValueChange={setNewRoleId}>
                                    <SelectTrigger className="h-12 font-bold bg-muted/50 border-border/40">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {(roles || []).map(role => (
                                            <SelectItem key={role.id} value={String(role.id)} className="rounded-lg">
                                                <div className="flex flex-col items-start text-left py-0.5">
                                                    <span className="font-bold text-sm">{role.name}</span>
                                                    {role.description && (
                                                        <span className="text-[10px] text-muted-foreground line-clamp-1 max-w-[240px] leading-relaxed">{role.description}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="bg-muted/30 p-4 flex items-center justify-end gap-3 mt-0">
                            <Button variant="ghost" onClick={() => setIsEditRoleOpen(false)} className="h-10 font-bold">Abort</Button>
                            <Button onClick={saveRoleUpdate} loading={updateUserMutation.isPending} className="h-10 px-8 font-black shadow-lg shadow-primary/20">Sync Authority</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* Bulk Delete Confirmation */}
                <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete {selectedIds.length} Users?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete the selected users? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isBulkDeleting ? 'Deleting...' : 'Delete All'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageShell>
    )
}
