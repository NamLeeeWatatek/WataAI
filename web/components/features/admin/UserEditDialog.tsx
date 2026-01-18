'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { usersApi } from '@/lib/api/users';
import { adminApi } from '@/lib/api/admin';
import { User } from '@/lib/types/user';
import { RoleEntity } from '@/lib/types/permissions';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface UserEditDialogProps {
    user: User | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function UserEditDialog({ user, open, onOpenChange, onSuccess }: UserEditDialogProps) {
    const [roles, setRoles] = useState<RoleEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        roleId: '',
        password: '',
    });

    useEffect(() => {
        if (open) {
            fetchRoles();
        }
    }, [open]);

    useEffect(() => {
        if (user) {
            const currentRoleId = typeof user.role === 'object' ? user.role!.id : user.roleId;
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                roleId: currentRoleId ? String(currentRoleId) : '',
                password: '',
            });
        }
    }, [user]);

    const fetchRoles = async () => {
        try {
            const data = await adminApi.getRoles();
            setRoles(data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const updateData: any = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
            };

            if (formData.password) {
                updateData.password = formData.password;
            }

            if (formData.roleId) {
                updateData.roleId = parseInt(formData.roleId);
            }

            await usersApi.update(user.id, updateData);
            toast.success('User updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update user details and access role.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {user && (
                        <div className="flex items-center gap-2 px-1 pb-2">
                            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-200">
                                SYSTEM IDENTITY
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">ID: {user.id}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="font-bold">Primary Email address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground">Changing this will update the user's login identity.</p>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                        <Label htmlFor="role" className="font-bold">System-wide Role</Label>
                        <Select
                            value={formData.roleId}
                            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                        >
                            <SelectTrigger id="role" className="w-full h-10">
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map((role) => (
                                    <SelectItem key={role.id} value={String(role.id)}>
                                        <div className="flex flex-col items-start gap-1 py-1">
                                            <span className="font-medium">{role.name}</span>
                                            {role.description && (
                                                <span className="text-xs text-muted-foreground">{role.description}</span>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-dashed">
                        <Label htmlFor="passwordUpdate">Reset Password (Admin Override)</Label>
                        <Input
                            id="passwordUpdate"
                            type="password"
                            placeholder="Enter new password to reset"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <p className="text-[10px] text-muted-foreground">Leave blank to keep current password.</p>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
