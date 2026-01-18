'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { Sparkles, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState, Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
// Removed react-icons
import { LoadingLogo } from '@/components/shared/LoadingLogo'
import { authApi } from '@/lib/api/auth'
import Link from 'next/link'

import type { Route } from 'next'
import { AxiosError } from 'axios'

const registerSchema = (t: (key: string) => string) => z.object({
    firstName: z.string().min(2, t('validation.tooShort')),
    lastName: z.string().min(2, t('validation.tooShort')),
    email: z.string().email(t('validation.invalid')),
    password: z.string().min(8, t('validation.tooShort')),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: t('register.errors.passwordsDontMatch'),
    path: ["confirmPassword"],
})

type RegisterFormValues = z.infer<ReturnType<typeof registerSchema>>

function RegisterPageContent() {
    const router = useRouter()
    const { t } = useTranslation()
    const { status } = useSession()
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema(t))
    })

    useEffect(() => {
        if (status === 'authenticated') {
            router.push('/dashboard' as Route)
        }
    }, [status, router])

    const onSubmit = async (data: RegisterFormValues) => {
        setIsLoading(true)
        setError(null)
        try {
            await authApi.register({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            })
            setIsSuccess(true)
        } catch (err: unknown) {
            const axiosError = err as AxiosError<{ message?: string }>
            setError(axiosError.response?.data?.message || t('register.errors.generic'))
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
                <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="glass p-10 bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[2.5rem] text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6 ring-1 ring-green-500/20">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-black mb-4 tracking-tighter bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                            {t('register.success.title')}
                        </h1>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            {t('register.success.description')}
                        </p>
                        <Button asChild className="w-full h-12 font-bold rounded-full">
                            <Link href="/login">{t('register.success.returnToLogin')}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex items-center justify-center font-sans selection:bg-primary/30 p-6">

            <div className="w-full max-w-xl relative z-10 animate-in fade-in zoom-in duration-700">
                <Card className="p-10 md:p-12 bg-card/40 backdrop-blur-2xl border-none shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 shadow-inner ring-2 ring-primary/5 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tighter uppercase tracking-tight">
                            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{t('register.title')}</span>
                        </h1>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60 max-w-[280px] mx-auto leading-relaxed">
                            {t('register.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('register.firstName')}</Label>
                                <Input
                                    id="firstName"
                                    placeholder="John"
                                    className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 font-bold"
                                    {...register('firstName')}
                                    disabled={isLoading}
                                />
                                {errors.firstName && <p className="text-[10px] font-bold text-destructive ml-1">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('register.lastName')}</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 font-bold"
                                    {...register('lastName')}
                                    disabled={isLoading}
                                />
                                {errors.lastName && <p className="text-[10px] font-bold text-destructive ml-1">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('register.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 font-bold"
                                {...register('email')}
                                disabled={isLoading}
                            />
                            {errors.email && <p className="text-[10px] font-bold text-destructive ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('register.password')}</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 pr-12 font-bold"
                                        {...register('password')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-[10px] font-bold text-destructive ml-1">{errors.password.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('register.confirmPassword')}</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 pr-12 font-bold"
                                        {...register('confirmPassword')}
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-3.5 text-muted-foreground hover:text-primary transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-[10px] font-bold text-destructive ml-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium animate-shake">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <div className="relative group/btn">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-30 group-hover/btn:opacity-60 transition duration-500"></div>
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative w-full h-14 font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] bg-primary hover:bg-primary/90 text-primary-foreground text-lg"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                    ) : null}
                                    {t('register.signUp')}
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-10 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {t('register.alreadyHaveAccount')}{' '}
                        <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
                            {t('register.signIn')}
                        </Link>
                    </div>

                    <div className="mt-8 text-center border-t border-border/10 pt-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-all group/back">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {t('register.backToHome')}
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div />}>
            <RegisterPageContent />
        </Suspense>
    )
}
