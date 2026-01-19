'use client';

import { useState, useEffect } from 'react';
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
    Save,
    Trash2,
    Search as SearchIcon,
    Settings,
    Lock,
    Key
} from 'lucide-react';
import { Search } from '@/components/shared/Search';
import { Input } from '@/components/ui/Input';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { cn } from '@/lib/utils';
import { adminApi, CreateRoleDto, UpdateRoleDto, CreatePermissionDto } from '@/lib/api/admin';
import { RoleEntity, PermissionEntity } from '@/lib/types/permissions';
import toast from '@/lib/toast';
import { Checkbox } from '@/components/ui/Checkbox';
import { Label } from '@/components/ui/Label';
import { useDebounce } from '@/lib/hooks/useDebounce';
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
    const debouncedRoleSearch = useDebounce(search, 500);

    const [rolePermissions, setRolePermissions] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [roleToEdit, setRoleToEdit] = useState<{ name: string, description: string } | null>(null);
    const [roleToDeleteId, setRoleToDeleteId] = useState<number | null>(null);

    // Permission Management States
    const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
    const [isDeletePermissionOpen, setIsDeletePermissionOpen] = useState(false);
    const [permissionToDeleteId, setPermissionToDeleteId] = useState<string | null>(null);
    const [permissionToEdit, setPermissionToEdit] = useState<{ resource: string, action: string, description: string }>({ resource: '', action: '', description: '' });
    const [permissionSearch, setPermissionSearch] = useState('');
    const debouncedPermissionSearch = useDebounce(permissionSearch, 500);

    const { data: rolesData, isLoading: loadingRoles } = useQuery({
        queryKey: ['roles', debouncedRoleSearch],
        queryFn: async () => {
            const rolesRes = await adminApi.getRoles({ search: debouncedRoleSearch });
            return rolesRes || [];
        },
        placeholderData: keepPreviousData
    });

    const roles = Array.isArray(rolesData) ? rolesData : [];

    const { data: permissionsData } = useQuery({
        queryKey: ['permissions', debouncedPermissionSearch],
        queryFn: async () => {
            const permissionsRes = await adminApi.getPermissions({ search: debouncedPermissionSearch });
            return permissionsRes || [];
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
        mutationFn: ({ id, data }: { id?: number; data: CreateRoleDto | UpdateRoleDto }) =>
            id ? adminApi.updateRole(id, data) : adminApi.createRole(data as CreateRoleDto),
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
        mutationFn: (data: CreatePermissionDto) => adminApi.createPermission(data),
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
            title="Identity & Access Management"
            description="Manage system access control via Roles and Permissions."
            contentClassName="overflow-hidden" // Prevent double scrollbars
            actions={
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setIsPermissionDialogOpen(true)}
                        className="gap-2 h-9"
                    >
                        <Lock className="w-4 h-4" />
                        New Permission
                    </Button>
                    <Button onClick={handleOpenCreateDialog} className="gap-2 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground h-9 font-bold">
                        <Plus className="w-4 h-4" />
                        Create Role
                    </Button>
                </div>
            }
            className="h-[calc(100vh-4rem)]" // Adjust for navbar height
        >
            <div className="grid grid-cols-12 gap-6 h-full pt-2 pb-6">

                {/* Left Sidebar: Roles List */}
                <div className="col-span-12 md:col-span-4 lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <Card className="flex flex-col h-full glass border-none shadow-xl overflow-hidden">
                        <CardHeader className="p-4 border-b border-white/5 bg-white/5 shrink-0 space-y-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-primary" />
                                    Roles
                                </CardTitle>
                                <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
                                    {roles.length}
                                </Badge>
                            </div>
                            <div className="relative">
                                <Search
                                    placeholder="Find role..."
                                    value={search}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                    onClear={() => setSearch('')}
                                    className="h-9 bg-black/20 border-white/10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 flex-1 overflow-hidden relative">
                            <ScrollArea className="h-full">
                                <div className="p-3 space-y-2">
                                    {roles.map(role => (
                                        <div
                                            key={role.id}
                                            onClick={() => setSelectedRole(role)}
                                            className={cn(
                                                "group p-3 rounded-xl cursor-pointer transition-all relative flex flex-col gap-1 border",
                                                selectedRole?.id === role.id
                                                    ? "bg-primary/10 border-primary/40 shadow-inner"
                                                    : "hover:bg-white/5 border-transparent hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                                        selectedRole?.id === role.id ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"
                                                    )}>
                                                        {role.name.toLowerCase() === 'admin' ? <Key className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={cn(
                                                            "font-bold text-sm truncate",
                                                            selectedRole?.id === role.id ? "text-primary" : "text-foreground"
                                                        )}>
                                                            {role.name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground truncate">
                                                            {role.permissions.length} permissions
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className={cn(
                                                    "flex items-center gap-1 transition-opacity",
                                                    selectedRole?.id === role.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                                )}>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                        onClick={(e) => { e.stopPropagation(); handleOpenEditDialog(role); }}
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Content: Permissions Matrix */}
                <div className="col-span-12 md:col-span-8 lg:col-span-9 flex flex-col h-full overflow-hidden">
                    {selectedRole ? (
                        <div className="flex flex-col h-full space-y-4">
                            {/* Header Panel */}
                            <div className="glass-card p-6 flex items-start justify-between shrink-0">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                                        {selectedRole.name}
                                        {hasChanges && (
                                            <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 bg-yellow-500/10 animate-pulse">
                                                Unsaved Changes
                                            </Badge>
                                        )}
                                    </h2>
                                    <p className="text-muted-foreground max-w-2xl">
                                        {selectedRole.description || 'No description provided for this role.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {(selectedRole.name !== 'Super Admin') && (
                                        <Button
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setRoleToDeleteId(selectedRole.id);
                                                setIsDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Role
                                        </Button>
                                    )}
                                    <Button
                                        onClick={handleSaveRole}
                                        disabled={!hasChanges}
                                        loading={updateRolePermissionsMutation.isPending}
                                        className={cn(
                                            "gap-2 font-bold transition-all",
                                            hasChanges ? "bg-primary shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>

                            {/* Permissions Grid */}
                            <Card className="flex-1 glass border-none shadow-none overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-64">
                                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search permissions..."
                                                value={permissionSearch}
                                                onChange={(e) => setPermissionSearch(e.target.value)}
                                                className="pl-9 bg-black/20 border-white/10 focus:bg-black/40 transition-colors h-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Showing {permissions.length} permissions across {Object.keys(groupedPermissions).length} resources
                                    </div>
                                </div>

                                <CardContent className="p-0 flex-1 overflow-hidden bg-black/5">
                                    <ScrollArea className="h-full">
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {(Object.entries(groupedPermissions) as [string, PermissionEntity[]][]).map(([resource, perms]) => (
                                                <div key={resource} className="bg-card/50 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-colors">
                                                    <div className="px-4 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            <span className="font-semibold capitalize text-sm">{resource}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-black/20 text-muted-foreground">
                                                            {perms.length}
                                                        </Badge>
                                                    </div>
                                                    <div className="p-2 space-y-0.5">
                                                        {perms.map(perm => (
                                                            <div
                                                                key={perm.id}
                                                                className={cn(
                                                                    "group flex items-start space-x-3 p-2 rounded-lg transition-all",
                                                                    rolePermissions.includes(perm.id)
                                                                        ? "bg-primary/10 hover:bg-primary/15"
                                                                        : "hover:bg-white/5"
                                                                )}
                                                            >
                                                                <Checkbox
                                                                    id={`perm-${perm.id}`}
                                                                    checked={rolePermissions.includes(perm.id)}
                                                                    onCheckedChange={() => handlePermissionToggle(perm.id)}
                                                                    disabled={selectedRole.name.toLowerCase() === 'admin' && resource === 'all'}
                                                                    className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                                />
                                                                <div className="space-y-0.5 flex-1 cursor-pointer" onClick={() => handlePermissionToggle(perm.id)}>
                                                                    <div className="flex items-center justify-between">
                                                                        <Label
                                                                            htmlFor={`perm-${perm.id}`}
                                                                            className="text-sm font-medium cursor-pointer leading-none text-foreground"
                                                                        >
                                                                            {perm.action}
                                                                        </Label>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPermissionToDeleteId(perm.id);
                                                                                setIsDeletePermissionOpen(true);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-3 h-3" />
                                                                        </Button>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground line-clamp-2">{perm.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-3xl bg-white/5 m-4">
                            <Shield className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-lg font-medium">Select a role to manage permissions</p>
                            <p className="text-sm">Choose a role from the sidebar to view and edit its access rights.</p>
                        </div>
                    )}
                </div>
            </div>

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
                                className="glass-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                placeholder="Briefly describe this role's access..."
                                value={roleToEdit?.description || ''}
                                onChange={(e) => setRoleToEdit(prev => ({ ...prev!, description: e.target.value }))}
                                className="glass-input"
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

            {/* Delete Role Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="glass-modal">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Role?</AlertDialogTitle>
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
                                    placeholder="e.g. users"
                                    value={permissionToEdit.resource}
                                    onChange={(e) => setPermissionToEdit(prev => ({ ...prev, resource: e.target.value }))}
                                    className="glass-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="action">Action</Label>
                                <Input
                                    id="action"
                                    placeholder="e.g. read"
                                    value={permissionToEdit.action}
                                    onChange={(e) => setPermissionToEdit(prev => ({ ...prev, action: e.target.value }))}
                                    className="glass-input"
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
                                className="glass-input"
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
                <AlertDialogContent className="glass-modal">
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
        </PageShell>
    );
}
