'use client'

import * as React from 'react'
import { useState, useEffect, useRef } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { CardDescription } from '@/components/ui/Card'
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

import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/date'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [search, setSearch] = useState('')
    const [querySearch, setQuerySearch] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [isEditRoleOpen, setIsEditRoleOpen] = useState(false)
    const [newRoleId, setNewRoleId] = useState<string>('')

    const searchTimerRef = useRef<NodeJS.Timeout>()

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
        }
    }, [])

    // Roles Query
    const { data: rolesData } = useQuery({
        queryKey: ['roles-list'],
        queryFn: () => adminApi.getRoles(),
        initialData: []
    })
    const roles = Array.isArray(rolesData) ? rolesData : [];

    // Users Query
    const { data: usersResponse, isLoading, refetch: refetchUsers } = useQuery({
        queryKey: ['users', page, limit, querySearch],
        queryFn: () => adminApi.getUsers({
            page,
            limit,
            search: querySearch
        }),
        placeholderData: keepPreviousData
    })

    const users = usersResponse?.data || []
    const totalUsers = usersResponse?.total || 0
    const totalPages = Math.ceil(totalUsers / limit)

    // Mutations
    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string | number; data: any }) => adminApi.updateUser(String(id), data),
        onSuccess: () => {
            toast.success('User profile updated');
            setIsEditRoleOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
        onError: () => toast.error('Failed to update user'),
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

    const columns = React.useMemo(() => [
        {
            key: 'name',
            label: 'User Identity',
            render: (_: any, user: User) => {
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
            key: 'role',
            label: 'System Access',
            render: (_: any, user: User) => {
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
            key: 'status',
            label: 'Network Status',
            render: (_: any, user: User) => (
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/5 w-fit border border-green-500/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Active</span>
                </div>
            )
        },
        {
            key: 'createdAt',
            label: 'Member Since',
            render: (_: any, user: User) => (
                <div className="text-xs text-muted-foreground font-medium">
                    {formatDate(user.createdAt)}
                </div>
            )
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_: any, user: User) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEditRole(user)}>
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
            actions={
                <Button className="gap-2 shadow-sm h-9 px-6 font-bold rounded-xl">
                    <UserIcon className="w-4 h-4" />
                    Invite Member
                </Button>
            }
        >
            <div className="space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-6 rounded-2xl border bg-card shadow-sm flex items-center gap-5 transition-all hover:shadow-xl hover:shadow-primary/5">
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

                {/* Main Content Card */}
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col transition-all">
                    <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
                        <div className="max-w-sm flex-1">
                            <Search
                                placeholder="Find by name or signal identifier..."
                                className="h-10"
                                value={search}
                                onChange={(e: any) => {
                                    const value = e.target.value
                                    setSearch(value)

                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    searchTimerRef.current = setTimeout(() => {
                                        setQuerySearch(value)
                                        setPage(1)
                                    }, 500)
                                }}
                                onClear={() => {
                                    setSearch('')
                                    setQuerySearch('')
                                    setPage(1)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            {isLoading && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Showing {users.length} of {totalUsers} Entities</span>
                        </div>
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
                        searchable={false}
                        className="space-y-0"
                        tableClassName="rounded-none border-none shadow-none"
                    />
                </div>

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
            </div>
        </PageShell>
    )
}
