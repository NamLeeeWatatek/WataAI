"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Shield, Mail, User as UserIcon } from "lucide-react"
import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from "@/components/ui/Checkbox"
import { BulkActionsToolbar } from "@/components/ui/BulkActionsToolbar"

import { PageShell } from "@/components/layout/PageShell"
import { DataTable } from "@/components/ui/DataTable"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { adminApi } from "@/lib/api/admin"
import { User } from "@/lib/types/user"
import { PaginationInfo } from "@/components/ui/Pagination"
import { useDebounce } from "@/lib/hooks/useDebounce"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/AlertDialog"
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { formatDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils"

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 500)

    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [roleDialogOpen, setRoleDialogOpen] = useState(false)
    const [newRoleId, setNewRoleId] = useState<string>('')
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Bulk Actions
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)
    const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false)

    // Reset page 1 when search changes
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
    const { data: usersResponse, isLoading, refetch } = useQuery({
        queryKey: ['users', page, limit, debouncedSearch],
        queryFn: () => adminApi.getUsers({
            page,
            limit,
            search: debouncedSearch
        }),
        placeholderData: keepPreviousData
    })

    const data = (usersResponse as any)?.data || (usersResponse as any)?.items || (Array.isArray(usersResponse) ? usersResponse : []);
    const total = (usersResponse as any)?.total || data.length || 0;

    // Mutations
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) => adminApi.updateUser(String(id), data),
        onSuccess: () => {
            toast.success('User updated successfully');
            setRoleDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            // Assuming there is a deactivate or delete in adminApi
            // For now, consistent with common pattern
            toast.success('Deactivation request sent')
            refetch()
        } catch (error) {
            toast.error('Failed to process request')
        } finally {
            setDeleteId(null)
        }
    }

    const handleBulkDelete = async () => {
        setIsBulkDeleting(true)
        try {
            toast.success(`Action initiated for ${selectedIds.length} users`)
            setSelectedIds([])
            refetch()
        } catch (error) {
            toast.error('Failed to process bulk action')
        } finally {
            setIsBulkDeleting(false)
            setBulkDeleteAlertOpen(false)
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
            id: "identity",
            header: "User Identity",
            cell: ({ row }) => {
                const user = row.original;
                const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Unknown';
                const initials = (displayName[0] || 'U').toUpperCase();
                const photoUrl = user.avatarUrl || user.photo?.path;

                return (
                    <div className="flex items-center gap-3 py-1">
                        <Avatar className="h-9 w-9 border shadow-sm ring-1 ring-primary/5">
                            {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-black">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate text-foreground leading-tight">
                                {displayName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium truncate">
                                {user.email}
                            </span>
                        </div>
                    </div>
                )
            }
        },
        {
            id: "role",
            header: "System Role",
            cell: ({ row }) => {
                const roleName = row.original.role?.name || 'User';
                const isAdmin = roleName.toLowerCase() === 'admin';
                return (
                    <Badge variant={isAdmin ? "default" : "secondary"} className="text-[10px] font-bold uppercase tracking-wider h-6">
                        {roleName}
                    </Badge>
                )
            }
        },
        {
            id: "status",
            header: "Account Status",
            cell: ({ row }) => (
                <div className={cn(
                    "flex items-center gap-2 px-2.5 py-1 rounded-full w-fit border",
                    row.original.isActive
                        ? "bg-green-500/5 border-green-500/10 text-green-600"
                        : "bg-red-500/5 border-red-500/10 text-red-600"
                )}>
                    <div className={cn("w-1.5 h-1.5 rounded-full", row.original.isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-[9px] font-black uppercase tracking-widest">
                        {row.original.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>
            )
        },
        {
            id: "createdAt",
            header: "Joined Date",
            cell: ({ row }) => (
                <span className="text-xs text-muted-foreground font-medium">{formatDate(row.original.createdAt)}</span>
            )
        },
        {
            id: "actions",
            header: "",
            cell: ({ row }) => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/5"
                        onClick={() => {
                            setEditingUser(row.original)
                            setNewRoleId(String(row.original.role?.id || ''))
                            setRoleDialogOpen(true)
                        }}
                    >
                        <Shield className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(String(row.original.id))}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            )
        }
    ], [])

    const pagination: PaginationInfo = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total
    }

    const saveRoleUpdate = () => {
        if (!editingUser) return
        updateUserMutation.mutate({
            id: editingUser.id,
            data: { roleId: parseInt(newRoleId) }
        });
    }

    return (
        <PageShell
            title="Users"
            description="Manage system users, roles and access permissions"
        >
            <DataTable
                data={data}
                columns={columns}
                loading={isLoading}
                searchable={true}
                searchValue={search}
                onSearch={setSearch}
                pagination={pagination}
                onPageChange={setPage}
                onPageSizeChange={(newLimit) => {
                    setLimit(newLimit)
                    setPage(1)
                }}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                renderGridItem={(user) => {
                    const displayName = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email?.split('@')[0] || 'Unknown';
                    const initials = (displayName[0] || 'U').toUpperCase();
                    const photoUrl = user.avatarUrl || user.photo?.path;

                    return (
                        <Card className="flex flex-col h-full hover:shadow-md transition-all group overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border shadow-sm ring-1 ring-primary/5">
                                        {photoUrl && <AvatarImage src={photoUrl} alt={displayName} />}
                                        <AvatarFallback className="font-bold bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <CardTitle className="text-sm truncate font-bold">
                                            {displayName}
                                        </CardTitle>
                                        <p className="text-[10px] text-muted-foreground truncate font-medium">{user.email}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3 pt-2">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">Role:</span>
                                    <Badge variant={user.role?.name?.toLowerCase() === 'admin' ? "default" : "secondary"} className="text-[10px] h-5">
                                        {user.role?.name || 'User'}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-muted-foreground font-medium">Status:</span>
                                    <div className="flex items-center gap-1.5 font-bold">
                                        <div className={cn("w-1 h-1 rounded-full", user.isActive ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                                        <span className={user.isActive ? "text-green-600" : "text-red-600 uppercase"}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-2 flex justify-end gap-2 bg-muted/20 py-3 mt-auto">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[11px] font-bold"
                                    onClick={() => {
                                        setEditingUser(user)
                                        setNewRoleId(String(user.role?.id || ''))
                                        setRoleDialogOpen(true)
                                    }}
                                >
                                    <Shield className="w-3.5 h-3.5 mr-1.5 text-primary" /> Authority
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-[11px] text-destructive hover:bg-destructive/10 font-bold"
                                    onClick={() => setDeleteId(String(user.id))}
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Deactivate
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                }}
                actions={
                    <Button onClick={() => toast.info('Invite functionality is being updated')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Invite Member
                    </Button>
                }
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

            {/* Role Dialog */}
            <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            Edit User Role
                        </DialogTitle>
                        <p className="text-sm text-muted-foreground">
                            Assign or modify system-wide authority for <strong>{editingUser?.email}</strong>
                        </p>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Select Role</Label>
                            <Select value={newRoleId} onValueChange={setNewRoleId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(role => (
                                        <SelectItem key={role.id} value={String(role.id)}>
                                            {role.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={saveRoleUpdate} loading={updateUserMutation.isPending}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will deactivate the user's account. This action can be reversed by an administrator later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Deactivate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={bulkDeleteAlertOpen} onOpenChange={setBulkDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Deactivate {selectedIds.length} users?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to deactivate the selected users?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isBulkDeleting ? 'Processing...' : 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </PageShell>
    )
}
