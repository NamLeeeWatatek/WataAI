"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/Form';
import { Separator } from '@/components/ui/Separator';
import { Camera, Mail, Save, Loader2, KeyRound, Eye, EyeOff, User as UserIcon, ShieldCheck } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { useAuth } from '@/lib/hooks/useAuth';
import { fileUploadService } from '@/lib/api/files';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  avatarUrl: z.string().optional().nullable(),
  oldPassword: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function AccountTab() {
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await authApi.me();
      return response as any;
    },
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      avatarUrl: '',
      oldPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const avatarUrl = form.watch('avatarUrl');
  const { user: sessionUser } = useAuth();

  useEffect(() => {
    const sourceUser = user || sessionUser;
    if (sourceUser) {
      form.reset({
        firstName: sourceUser.firstName || sourceUser.name?.split(' ')[0] || '',
        lastName: sourceUser.lastName || sourceUser.name?.split(' ').slice(1).join(' ') || '',
        email: sourceUser.email || '',
        avatarUrl: sourceUser.avatarUrl || '',
        oldPassword: '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, sessionUser, form]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormValues) => {
      const { confirmPassword, ...updateData } = data;
      const payload = { ...updateData };
      if (!payload.password) {
        delete payload.password;
        delete payload.oldPassword;
      }
      return authApi.updateMe(payload);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      await updateSession({
        user: {
          ...sessionUser,
          name: `${form.getValues('firstName')} ${form.getValues('lastName')}`,
          image: form.getValues('avatarUrl'),
          avatarUrl: form.getValues('avatarUrl'),
        }
      });
      toast.success('Successfully updated your profile.');
      form.reset({
        ...form.getValues(),
        oldPassword: '',
        password: '',
        confirmPassword: '',
      }, { keepDirty: false });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = fileUploadService.validateFile(file, { maxSize: 2 * 1024 * 1024 });
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    try {
      const result = await fileUploadService.uploadFile(file, { bucket: 'avatars' });
      const url = fileUploadService.getFileUrl(result.file.path, 'avatars');
      form.setValue('avatarUrl', url, { shouldDirty: true });
      toast.success('Profile picture uploaded.');
    } catch (error) {
      toast.error('Could not upload your profile picture.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userInitial = user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="w-full animate-in fade-in duration-500">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Main Content Layout */}
          <div className="flex flex-col lg:flex-row gap-12">

            {/* Left Column: Profile & Identity */}
            <div className="flex-1 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold tracking-tight text-foreground">Personal Information</h3>
                    <p className="text-sm text-muted-foreground">Modify your basic account details and identity.</p>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-8 pt-2">
                  {/* Avatar upload */}
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <Avatar className="h-28 w-28 ring-4 ring-border/30 ring-offset-4 ring-offset-background transition-all group-hover:ring-primary/20">
                        <AvatarImage src={avatarUrl || ''} className="object-cover" />
                        <AvatarFallback className="text-2xl font-black bg-muted text-muted-foreground/60">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-full">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 font-bold shadow-sm"
                          disabled={uploading}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Camera className="mr-2 h-4 w-4 opacity-70" />
                          Update photo
                        </Button>
                        {avatarUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-9 text-destructive hover:bg-destructive/10 font-bold"
                            onClick={() => form.setValue('avatarUrl', null, { shouldDirty: true })}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[200px]">
                        Square JPG, PNG or WebP recommended. Maximum file size: 2MB.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  {/* Identity fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] font-bold">First name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} className="h-11 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] font-bold">Last name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} className="h-11 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-bold">Email address</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Input {...field} disabled className="h-11 rounded-xl bg-muted/40 pr-10 opacity-80 cursor-not-allowed" />
                            <Mail className="absolute right-3.5 top-3.5 h-4 w-4 text-muted-foreground opacity-40" />
                          </div>
                        </FormControl>
                        <FormDescription className="text-[11px] opacity-60">
                          Your email is verified and cannot be changed here.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Security */}
            <div className="flex-1 space-y-10">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold tracking-tight text-foreground">Password & Security</h3>
                    <p className="text-sm text-muted-foreground">Keep your account secure with a strong password.</p>
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[13px] font-bold">Current password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showOldPassword ? "text" : "password"}
                              placeholder="••••••••"
                              {...field}
                              className="h-11 rounded-xl pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOldPassword(!showOldPassword)}
                              className="absolute right-3.5 top-3.5 text-muted-foreground/60 hover:text-foreground transition-all"
                            >
                              {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] font-bold">New password</FormLabel>
                          <FormControl>
                            <div className="relative transition-all">
                              <Input
                                type={showNewPassword ? "text" : "password"}
                                placeholder="Enter min. 6 characters"
                                {...field}
                                className="h-11 rounded-xl pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3.5 top-3.5 text-muted-foreground/60 hover:text-foreground transition-all"
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
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
                          <FormLabel className="text-[13px] font-bold">Confirm new password</FormLabel>
                          <FormControl>
                            <div className="relative transition-all">
                              <Input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repeat your new password"
                                {...field}
                                className="h-11 rounded-xl pr-10"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3.5 top-3.5 text-muted-foreground/60 hover:text-foreground transition-all"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between p-6 bg-card/40 border border-border/40 rounded-3xl backdrop-blur-sm">
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Ensure all changes are correct before saving.</p>
            </div>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || !form.formState.isDirty}
              className="px-10 h-12 font-black rounded-2xl shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {updateProfileMutation.isPending && (
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              )}
              <Save className="mr-3 h-5 w-5" />
              Save Professional Profile
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
