'use client';

import { useState, useEffect, useRef } from 'react';
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '@/components/layout/PageShell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
    Shield,
    ShieldCheck,
    Plus,
    Edit2,
    Boxes,
    Save,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { Search } from '@/components/ui/Search';
import { Input } from '@/components/ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';
import { adminApi } from '@/lib/api/admin';
import { RoleEntity, PermissionEntity } from '@/lib/types/permissions';
import toast from '@/lib/toast';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/Dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/AlertDialog';

export default function RolesPermissionsPage() {
    const queryClient = useQueryClient();
    const [selectedRole, setSelectedRole] = useState<RoleEntity | null>(null);
    const [search, setSearch] = useState('');

    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<{ name: string, description: string } | null>(null);
    const [roleToDeleteId, setRoleToDeleteId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState('roles');
    const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
    const [isDeletePermissionOpen, setIsDeletePermissionOpen] = useState(false);
    const [permissionToDeleteId, setPermissionToDeleteId] = useState<string | null>(null);
    const [permissionToEdit, setPermissionToEdit] = useState<{ resource: string, action: string, description: string }>({ resource: '', action: '', description: '' });
    const [permissionSearch, setPermissionSearch] = useState('');

    const [querySearch, setQuerySearch] = useState('')
    const [queryPermissionSearch, setQueryPermissionSearch] = useState('')

    const roleSearchTimerRef = useRef<NodeJS.Timeout>()
    const permissionSearchTimerRef = useRef<NodeJS.Timeout>()

    // Cleanup timers
    useEffect(() => {
        return () => {
            if (roleSearchTimerRef.current) clearTimeout(roleSearchTimerRef.current)
            if (permissionSearchTimerRef.current) clearTimeout(permissionSearchTimerRef.current)
        }
    }, [])

    const { data: rolesData, isLoading: loadingRoles, refetch: refetchRoles } = useQuery({
        queryKey: ['roles', querySearch],
        queryFn: async () => {
            const rolesRes = await adminApi.getRoles({ search: querySearch });
            return (rolesRes as any).data || rolesRes;
        },
        placeholderData: keepPreviousData
    });

    const roles = Array.isArray(rolesData) ? rolesData : [];

    const { data: permissionsData, isLoading: loadingPermissions, refetch: refetchPermissions } = useQuery({
        queryKey: ['permissions', queryPermissionSearch],
        queryFn: async () => {
            const permissionsRes = await adminApi.getPermissions({ search: queryPermissionSearch });
            return (permissionsRes as any).data || permissionsRes;
        },
        placeholderData: keepPreviousData
    });

    const permissions = Array.isArray(permissionsData) ? permissionsData : [];

    useEffect(() => {
        if (roles.length > 0 && !selectedRole && !search) {
            setSelectedRole(roles[0]);
        }
    }, [roles, selectedRole, search]);

    useEffect(() => {
        if (selectedRole) {
            setRolePermissions(selectedRole.permissions.map(p => p.id));
            setHasChanges(false);
        }
    }, [selectedRole]);

    // Mutations
    const updateRolePermissionsMutation = useMutation({
        mutationFn: ({ id, permissionIds }: { id: number; permissionIds: string[] }) =>
            adminApi.updateRole(id, { permissionIds }),
        onSuccess: () => {
            toast.success('Role permissions updated');
            setHasChanges(false);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
        onError: () => toast.error('Failed to update role permissions'),
    });

    const saveRoleMutation = useMutation({
        mutationFn: ({ id, data }: { id?: number; data: any }) =>
            id ? adminApi.updateRole(id, data) : adminApi.createRole(data),
        onSuccess: () => {
            toast.success('Role saved successfully');
            setIsRoleDialogOpen(false);
            setRoleToEdit(null);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
        onError: () => toast.error('Failed to save role'),
    });

    const deleteRoleMutation = useMutation({
        mutationFn: (id: number) => adminApi.deleteRole(id),
        onSuccess: (_, id) => {
            toast.success('Role deleted');
            setIsDeleteDialogOpen(false);
            setRoleToDeleteId(null);
            if (selectedRole?.id === id) setSelectedRole(null);
            queryClient.invalidateQueries({ queryKey: ['roles'] });
        },
        onError: () => toast.error('Failed to delete role'),
    });

    const createPermissionMutation = useMutation({
        mutationFn: (data: any) => adminApi.createPermission(data),
        onSuccess: () => {
            toast.success('Permission created');
            setIsPermissionDialogOpen(false);
            setPermissionToEdit({ resource: '', action: '', description: '' });
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        },
        onError: () => toast.error('Failed to create permission'),
    });

    const deletePermissionMutation = useMutation({
        mutationFn: (id: string) => adminApi.deletePermission(id),
        onSuccess: () => {
            toast.success('Permission deleted');
            setIsDeletePermissionOpen(false);
            setPermissionToDeleteId(null);
            queryClient.invalidateQueries({ queryKey: ['permissions'] });
        },
        onError: () => toast.error('Failed to delete permission'),
    });

    const handlePermissionToggle = (permId: string) => {
        const newSetup = rolePermissions.includes(permId)
            ? rolePermissions.filter(id => id !== permId)
            : [...rolePermissions, permId];

        setRolePermissions(newSetup);
        setHasChanges(true);
    };

    const handleSaveRole = () => {
        if (!selectedRole) return;
        updateRolePermissionsMutation.mutate({
            id: selectedRole.id as number,
            permissionIds: rolePermissions
        });
    };

    const handleCreateOrUpdateRole = () => {
        if (!roleToEdit) return;
        saveRoleMutation.mutate({
            id: selectedRole && roleToEdit.name === selectedRole.name ? (selectedRole.id as number) : undefined,
            data: roleToEdit
        });
    };

    const handleOpenCreateDialog = () => {
        setRoleToEdit({ name: '', description: '' });
        setIsRoleDialogOpen(true);
    };

    const handleOpenEditDialog = (role: RoleEntity) => {
        setSelectedRole(role);
        setRoleToEdit({ name: role.name, description: role.description || '' });
        setIsRoleDialogOpen(true);
    };

    const handleDeleteRole = () => {
        if (!roleToDeleteId) return;
        deleteRoleMutation.mutate(roleToDeleteId);
    };

    const handleCreatePermission = () => {
        createPermissionMutation.mutate(permissionToEdit);
    };

    const handleDeletePermission = () => {
        if (!permissionToDeleteId) return;
        deletePermissionMutation.mutate(permissionToDeleteId);
    };

    // Group permissions
    const groupedPermissions = permissions.reduce((acc, perm: PermissionEntity) => {
        if (!acc[perm.resource]) acc[perm.resource] = [];
        acc[perm.resource].push(perm);
        return acc;
    }, {} as Record<string, PermissionEntity[]>);

    return (
        <PageShell
            title="IAM - Identity & Access Management"
            description="Manage system access control via Roles and Permissions."
            actions={
                activeTab === 'roles' ? (
                    <Button onClick={handleOpenCreateDialog} className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 font-bold rounded-xl">
                        <Plus className="w-4 h-4" />
                        Create Role
                    </Button>
                ) : (
                    <Button
                        onClick={() => setIsPermissionDialogOpen(true)}
                        className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-6 font-bold rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        New Permission
                    </Button>
                )
            }
            className="h-full"
        >
            <div className="h-full flex flex-col space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                    <div className="flex items-center justify-between border-b pb-4 shrink-0">
                        <TabsList>
                            <TabsTrigger value="roles" className="gap-2">
                                <Shield className="w-4 h-4" />
                                Roles
                            </TabsTrigger>
                            <TabsTrigger value="permissions" className="gap-2">
                                <Boxes className="w-4 h-4" />
                                Permissions Library
                            </TabsTrigger>
                        </TabsList>
                        {(loadingRoles || loadingPermissions) && <RefreshCw className="w-4 h-4 animate-spin text-primary" />}
                    </div>

                    <TabsContent value="roles" className="m-0 flex-1 overflow-hidden pt-4">
                        <div className="grid grid-cols-12 gap-6 h-full">
                            {/* Roles List */}
                            <div className="col-span-12 md:col-span-4 lg:col-span-3 space-y-4 flex flex-col h-full">
                                <Card className="flex flex-col h-full border-muted-foreground/20 shadow-sm">
                                    <CardHeader className="p-4 border-b bg-muted/20 shrink-0">
                                        <div className="relative">
                                            <Search
                                                placeholder="Find role..."
                                                value={search}
                                                onChange={(e: any) => {
                                                    const val = e.target.value
                                                    setSearch(val)
                                                    if (roleSearchTimerRef.current) clearTimeout(roleSearchTimerRef.current)
                                                    roleSearchTimerRef.current = setTimeout(() => {
                                                        setQuerySearch(val)
                                                    }, 500)
                                                }}
                                                onClear={() => {
                                                    setSearch('')
                                                    setQuerySearch('')
                                                }}
                                                className="h-9"
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0 flex-1 overflow-hidden">
                                        <ScrollArea className="h-full">
                                            <div className="p-2 space-y-1">
                                                {roles.map(role => (
                                                    <div
                                                        key={role.id}
                                                        className={cn(
                                                            "group p-3 rounded-lg cursor-pointer transition-all relative",
                                                            selectedRole?.id === role.id ? "bg-primary/10 border-primary/20 border" : "hover:bg-muted/50 border border-transparent"
                                                        )}
                                                        onClick={() => setSelectedRole(role)}
                                                    >
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <ShieldCheck className={cn("w-4 h-4", selectedRole?.id === role.id ? "text-primary" : "text-muted-foreground")} />
                                                                <span className="font-bold text-sm">{role.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(role); }}
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                                {(role.name.toLowerCase() !== 'admin' && role.name.toLowerCase() !== 'user') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setRoleToDeleteId(role.id);
                                                                            setIsDeleteDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground truncate pr-14">{role.description || 'No description'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Role Details & Permissions */}
                            <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col h-full">
                                {selectedRole ? (
                                    <Card className="border-border/60 shadow-xl overflow-hidden h-full flex flex-col">
                                        <CardHeader className="bg-muted/30 border-b border-border/50 py-4 shrink-0">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <Shield className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-xl">{selectedRole.name}</CardTitle>
                                                        <CardDescription className="text-xs">{selectedRole.description}</CardDescription>
                                                    </div>
                                                </div>
                                                {hasChanges && (
                                                    <Button onClick={handleSaveRole} loading={updateRolePermissionsMutation.isPending} className="gap-2 font-bold">
                                                        <Save className="w-4 h-4" />
                                                        Save Changes
                                                    </Button>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-0 flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-950/20">
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {(Object.entries(groupedPermissions) as [string, PermissionEntity[]][]).map(([resource, perms]) => (
                                                        <div key={resource} className="space-y-3 p-4 rounded-xl border bg-card shadow-sm">
                                                            <h4 className="font-semibold capitalize flex items-center gap-2 border-b pb-2">
                                                                <div className="w-2 h-2 rounded-full bg-primary" />
                                                                {resource}
                                                            </h4>
                                                            <div className="space-y-2">
                                                                {perms.map(perm => (
                                                                    <div key={perm.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                                                        <Checkbox
                                                                            id={`perm-${perm.id}`}
                                                                            checked={rolePermissions.includes(perm.id)}
                                                                            onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                                            disabled={selectedRole.name.toLowerCase() === 'admin' && resource === 'all'} // Prevent locking out admin
                                                                        />
                                                                        <div className="space-y-1">
                                                                            <Label
                                                                                htmlFor={`perm-${perm.id}`}
                                                                                className="text-sm font-medium cursor-pointer leading-none"
                                                                            >
                                                                                {perm.action}
                                                                            </Label>
                                                                            <p className="text-[10px] text-muted-foreground">{perm.description}</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground border rounded-lg border-dashed">
                                        <div className="text-center">
                                            <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                            <p>Select a role to view permissions</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="permissions" className="m-0 h-full pt-4">
                        <Card className="h-full border-muted-foreground/20 shadow-sm flex flex-col">
                            <CardHeader className="shrink-0 flex flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle>System Permissions Library</CardTitle>
                                    <CardDescription>
                                        Reference list of all available permissions in the system.
                                    </CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search
                                        placeholder="Search permissions..."
                                        value={permissionSearch}
                                        onChange={(e: any) => {
                                            const val = e.target.value
                                            setPermissionSearch(val)
                                            if (permissionSearchTimerRef.current) clearTimeout(permissionSearchTimerRef.current)
                                            permissionSearchTimerRef.current = setTimeout(() => {
                                                setQueryPermissionSearch(val)
                                            }, 500)
                                        }}
                                        onClear={() => {
                                            setPermissionSearch('')
                                            setQueryPermissionSearch('')
                                        }}
                                        className="h-9"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-hidden p-0">
                                <ScrollArea className="h-full">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {permissions.map(perm => (
                                            <div key={perm.id} className="group p-3 border rounded-lg flex flex-col gap-1 bg-card hover:bg-muted/30 transition-colors h-fit relative">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-mono text-xs font-bold text-primary flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">{perm.resource}</Badge>
                                                        {perm.action}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                                        onClick={() => {
                                                            setPermissionToDeleteId(perm.id);
                                                            setIsDeletePermissionOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 w-3" />
                                                    </Button>
                                                </div>
                                                <span className="text-xs text-muted-foreground line-clamp-2">{perm.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Role Create/Edit Dialog */}
                <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{roleToEdit?.name && selectedRole && roleToEdit.name === selectedRole.name ? 'Edit Role' : 'Create New Role'}</DialogTitle>
                            <DialogDescription>
                                Enter the role name and a brief description of its purpose.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Content Manager"
                                    value={roleToEdit?.name || ''}
                                    onChange={(e) => setRoleToEdit(prev => ({ ...prev!, name: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    placeholder="Briefly describe this role's access..."
                                    value={roleToEdit?.description || ''}
                                    onChange={(e) => setRoleToEdit(prev => ({ ...prev!, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateOrUpdateRole} loading={saveRoleMutation.isPending} disabled={!roleToEdit?.name}>
                                {roleToEdit?.name && selectedRole && roleToEdit.name === selectedRole.name ? 'Save Changes' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the role
                                and remove it from all assigned users.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setRoleToDeleteId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteRole}
                                disabled={deleteRoleMutation.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Permission Create Dialog */}
                <Dialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New System Permission</DialogTitle>
                            <DialogDescription>
                                Register a new action/resource pair in the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="resource">Resource</Label>
                                    <Input
                                        id="resource"
                                        placeholder="e.g. users, bots"
                                        value={permissionToEdit.resource}
                                        onChange={(e) => setPermissionToEdit(prev => ({ ...prev, resource: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="action">Action</Label>
                                    <Input
                                        id="action"
                                        placeholder="e.g. read, write, *"
                                        value={permissionToEdit.action}
                                        onChange={(e) => setPermissionToEdit(prev => ({ ...prev, action: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="perm-desc">Description</Label>
                                <Input
                                    id="perm-desc"
                                    placeholder="What does this permission allow?"
                                    value={permissionToEdit.description}
                                    onChange={(e) => setPermissionToEdit(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsPermissionDialogOpen(false)}>Cancel</Button>
                            <Button
                                onClick={handleCreatePermission}
                                loading={createPermissionMutation.isPending}
                                disabled={!permissionToEdit.resource || !permissionToEdit.action}
                            >
                                Create Permission
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Permission Confirmation */}
                <AlertDialog open={isDeletePermissionOpen} onOpenChange={setIsDeletePermissionOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Permission?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove the permission definition from the library.
                                Any roles currently using this permission will lose access to it.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setPermissionToDeleteId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeletePermission}
                                disabled={deletePermissionMutation.isPending}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {deletePermissionMutation.isPending ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PageShell>
    );
}
