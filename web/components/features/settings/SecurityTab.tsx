"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/Form';
import { ShieldCheck, Lock, Key, Loader2, AlertCircle } from 'lucide-react';
import { axiosClient } from '@/lib/axios-client';
import { toast } from 'sonner';

const securitySchema = z.object({
    oldPassword: z.string().min(6, 'Old password is required'),
    password: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type SecurityFormValues = z.infer<typeof securitySchema>;

export function SecurityTab() {
    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            oldPassword: '',
            password: '',
            confirmPassword: '',
        },
    });

    const changePasswordMutation = useMutation({
        mutationFn: (data: SecurityFormValues) => axiosClient.patch('/auth/me', {
            oldPassword: data.oldPassword,
            password: data.password,
        }),
        onSuccess: () => {
            form.reset();
            toast.success('Password updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update password. Check your old password.');
        },
    });

    const onSubmit = (data: SecurityFormValues) => {
        changePasswordMutation.mutate(data);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <Card >
                        <CardHeader className="border-b border-border/40 bg-muted/5 p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shadow-inner ring-1 ring-amber-500/20">
                                    <ShieldCheck className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold tracking-tight">Access Control</CardTitle>
                                    <CardDescription className="text-sm">Manage your authentication credentials and security protocols</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-200/80 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0 text-amber-500" />
                                <p>Changing your password will terminate all other active diagnostic sessions for security synchronization.</p>
                            </div>

                            <div className="grid gap-6">
                                <FormField
                                    control={form.control}
                                    name="oldPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Current Password
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="password"
                                                    placeholder="••••••••"

                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <Key className="w-3 h-3" /> New Password
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"

                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                                    <ShieldCheck className="w-3 h-3" /> Confirm Protocol
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="password"
                                                        placeholder="••••••••"

                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    type="submit"
                                    disabled={changePasswordMutation.isPending}
                                    className="px-10 h-14 font-bold shadow-xl shadow-amber-500/20 active:scale-95 transition-all text-base bg-amber-600 hover:bg-amber-500"
                                >
                                    {changePasswordMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                        <ShieldCheck className="w-5 h-5 mr-2" />
                                    )}
                                    Update Security Credentials
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </Form>
        </div>
    );
}
