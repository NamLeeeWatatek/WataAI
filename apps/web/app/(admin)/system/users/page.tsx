'use client'

import { useState, useEffect, useRef } from 'react'
import { PageShell } from '@/components/layout/PageShell'
import { CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { DataTable } from '@/components/ui/DataTable'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { adminApi } from '@/lib/api/admin'
import { User } from '@/lib/types/user'
import { RoleEntity } from '@/lib/types/permissions'
import toast from '@/lib/toast'
import { Search, MoreHorizontal, Shield, User as UserIcon, CheckCircle } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu"

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils/date'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/Avatar'

export default function AdminUsersPage() {
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



    const handleEditRole = (user: User) => {
        setSelectedUser(user)
        const currentRoleId = user.role?.id;
        setNewRoleId(String(currentRoleId || ''))
        setIsEditRoleOpen(true)
    }

    const saveRoleUpdate = async () => {
        if (!selectedUser) return

        try {
            await adminApi.updateUser(selectedUser.id, {
                roleId: parseInt(newRoleId)
            })
            toast.success('User role updated')
            setIsEditRoleOpen(false)
            refetchUsers()
        } catch (error) {
            toast.error('Failed to update user role')
        }
    }

    const columns = [
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
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditRole(user)}>
                            Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                            Deactivate User
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    ]

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
            icon={UserIcon}
            actions={
                <Button className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4">
                    <UserIcon className="w-4 h-4" />
                    Invite User
                </Button>
            }
        >
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat) => (
                        <div key={stat.label} className="p-4 rounded-xl border bg-card shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.bg)}>
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
                                <p className="text-xl font-bold">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Card */}
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-muted/20 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search users by name or email..."
                                className="pl-9 h-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/30"
                                value={search}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setSearch(value)

                                    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
                                    searchTimerRef.current = setTimeout(() => {
                                        setQuerySearch(value)
                                        setPage(1)
                                    }, 500)
                                }}
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Showing {users.length} of {totalUsers} users</span>
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
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Change User Role</DialogTitle>
                            <CardDescription className="text-xs">
                                Update system access level for <strong>{selectedUser?.email}</strong>
                            </CardDescription>
                        </DialogHeader>
                        <div className="py-6 space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System-wide Role</Label>
                                <Select value={newRoleId} onValueChange={setNewRoleId}>
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(roles || []).map(role => (
                                            <SelectItem key={role.id} value={String(role.id)}>
                                                <div className="flex flex-col items-start text-left py-0.5">
                                                    <span className="font-semibold text-sm">{role.name}</span>
                                                    {role.description && (
                                                        <span className="text-[10px] text-muted-foreground line-clamp-1">{role.description}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="bg-muted/30 p-4 -mx-6 -mb-6 mt-2">
                            <Button variant="ghost" onClick={() => setIsEditRoleOpen(false)} className="h-9">Cancel</Button>
                            <Button onClick={saveRoleUpdate} className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </PageShell>
    )
}
