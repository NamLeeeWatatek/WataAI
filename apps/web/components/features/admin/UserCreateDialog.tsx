'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { usersApi } from '@/lib/api/users';
import { adminApi } from '@/lib/api/admin';
import { RoleEntity } from '@/lib/types/permissions';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

interface UserCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function UserCreateDialog({ open, onOpenChange, onSuccess }: UserCreateDialogProps) {
    const [roles, setRoles] = useState<RoleEntity[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: '2', // Default to User (2)
    });

    useEffect(() => {
        if (open) {
            fetchRoles();
        }
    }, [open]);

    const fetchRoles = async () => {
        try {
            const data = await adminApi.getRoles();
            setRoles(data);
            // Default to 'user' role if found, or first available
            const userRole = data.find(r => r.name.toLowerCase() === 'user');
            if (userRole) {
                setFormData(prev => ({ ...prev, roleId: String(userRole.id) }));
            }
        } catch (error) {
            console.error('Failed to fetch roles');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Email and password are required');
            return;
        }

        setLoading(true);
        try {
            await usersApi.create({
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                status: { id: 1 }, // Active by default
                roleId: parseInt(formData.roleId)
            } as any);
            toast.success('System user created successfully');
            onSuccess();
            onOpenChange(false);
            setFormData({ firstName: '', lastName: '', email: '', password: '', roleId: '2' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create system user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                        <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <DialogTitle>Create System User</DialogTitle>
                    <DialogDescription>
                        Register a new account directly into the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-firstName">First Name</Label>
                            <Input
                                id="create-firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-lastName">Last Name</Label>
                            <Input
                                id="create-lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="create-email" className="font-bold text-primary">Email address (Login Identity)</Label>
                        <Input
                            id="create-email"
                            type="email"
                            placeholder="user@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="create-password">Initial Password</Label>
                        <Input
                            id="create-password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="create-role">System Role</Label>
                        <Select
                            value={formData.roleId}
                            onValueChange={(value) => setFormData({ ...formData, roleId: value })}
                        >
                            <SelectTrigger id="create-role" className="w-full">
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
                        <p className="text-[10px] text-muted-foreground mt-1 px-1">
                            Roles define system-wide permissions.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create System Account
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
