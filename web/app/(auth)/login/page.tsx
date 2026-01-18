'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Card } from '@/components/ui/Card'
import { Sparkles, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, Facebook, Chrome } from 'lucide-react'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useTranslation } from 'react-i18next'
import { signIn, useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
// Removed react-icons
import { LoadingLogo } from '@/components/shared/LoadingLogo'
import Link from 'next/link'
import { logger } from '@/lib/logger'

const loginSchema = (t: any) => z.object({
    email: z.string().email(t('validation.invalid')),
    password: z.string().min(1, t('validation.required')),
})

type LoginFormValues = z.infer<ReturnType<typeof loginSchema>>

function LoginPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useTranslation()
    const { data: session, status } = useSession()
    const [loginError, setLoginError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema(t))
    })

    useEffect(() => {
        // Only redirect if fully authenticated with a token
        if (status === 'authenticated' && session?.accessToken) {
            setIsRedirecting(true)
            const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
            // Ensure callbackUrl is a relative path to prevent open redirect vulnerabilities
            const safeRedirect = (callbackUrl.startsWith('/') ? callbackUrl : '/dashboard') as Route
            router.push(safeRedirect)
        }
    }, [status, session, router, searchParams])

    useEffect(() => {
        const error = searchParams.get('error')
        if (error) {
            if (error === 'OAuthAccountNotLinked') {
                setLoginError(t('login.errors.accountNotLinked'))
            } else {
                setLoginError(t('login.errors.generic'))
            }
        }
    }, [searchParams, t])

    if (status === 'loading' || isRedirecting) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background">
                <LoadingLogo size="lg" text={isRedirecting ? t('login.redirecting') : t('login.pleaseWait')} />
            </div>
        )
    }

    const onSubmit = async (data: LoginFormValues) => {
        setIsLoading(true)
        setLoginError(null)
        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                setLoginError(t('login.errors.invalidCredentials'))
                setIsLoading(false)
            } else {
                logger.info('[Login] Success, prefetching dashboard...')
                setIsRedirecting(true)
                router.prefetch('/dashboard')
                const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
                const safeRedirect = (callbackUrl.startsWith('/') ? callbackUrl : '/dashboard') as Route
                router.push(safeRedirect)
            }
        } catch (error) {
            setLoginError(t('login.errors.generic'))
            setIsLoading(false)
        }
    }

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        setIsLoading(true)
        signIn(provider, { callbackUrl: '/dashboard' })
    }

    return (
        <div className="w-full h-full flex items-center justify-center font-sans selection:bg-primary/30 p-6">

            <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-700">
                <Card className="p-8 md:p-10 bg-card/40 backdrop-blur-2xl border-none shadow-2xl rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 shadow-inner ring-2 ring-primary/5 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
                        </div>
                        <h1 className="text-3xl font-black mb-3 tracking-tighter">
                            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent uppercase tracking-tight">{t('login.welcomeBack')}</span>
                        </h1>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">
                            {t('login.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                        <Button
                            variant="secondary"
                            className="h-12 bg-muted/20 hover:bg-muted/40 border-border/10 font-bold text-xs rounded-xl"
                            onClick={() => handleSocialLogin('google')}
                            disabled={isLoading}
                        >
                            <Chrome className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                    </div>

                    <div className="relative mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/10" />
                        </div>
                        <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                            <span className="bg-card px-4 text-muted-foreground/60 rounded-full border border-border/10">
                                {t('login.or')}
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('login.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 font-bold"
                                {...register('email')}
                                disabled={isLoading}
                            />
                            {errors.email && <p className="text-[10px] font-bold text-destructive ml-1">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('login.password')}</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline hover:opacity-80 transition-all"
                                >
                                    {t('login.forgotPassword')}
                                </Link>
                            </div>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="h-12 bg-muted/20 border-border/10 rounded-xl focus:ring-primary/20 pr-12 font-bold"
                                    {...register('password')}
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-primary transition-colors hover:bg-transparent"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-[10px] font-bold text-destructive ml-1">{errors.password.message}</p>}
                        </div>

                        {loginError && (
                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {loginError}
                            </div>
                        )}

                        <div className="relative group/btn pt-2">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-30 group-hover/btn:opacity-60 transition duration-500"></div>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="relative w-full h-12 font-bold shadow-lg transition-all active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {t('login.signIn')}
                            </Button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-10 text-center text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">
                        {t('login.noAccount')}{' '}
                        <Link href="/register" className="text-primary hover:text-primary/80 transition-colors">
                            {t('login.signUp')}
                        </Link>
                    </div>

                    <div className="mt-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 hover:text-primary transition-all group/back">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {t('login.backToHome')}
                        </Link>
                    </div>
                </Card>
            </div >
        </div >
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="md" />
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
