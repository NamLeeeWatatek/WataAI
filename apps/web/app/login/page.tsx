'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Sparkles, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Route } from 'next'
import { useTranslation } from 'react-i18next'
import { signIn, useSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FaGoogle, FaFacebook } from 'react-icons/fa6'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import Link from 'next/link'

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
                console.log('[Login] Success, prefetching dashboard...')
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
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-[10%] -left-[10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_70%)]" />
            </div>

            <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="glass p-10 bg-card/40 backdrop-blur-2xl border border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                            <Sparkles className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        </div>
                        <h1 className="text-3xl font-black mb-2 tracking-tighter">
                            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{t('login.welcomeBack')}</span>
                        </h1>
                        <p className="text-muted-foreground text-sm" suppressHydrationWarning>
                            {t('login.subtitle')}
                        </p>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <Button
                            variant="outline"
                            className="h-12 bg-background/50 hover:bg-background border-border/50"
                            onClick={() => handleSocialLogin('google')}
                            disabled={isLoading}
                        >
                            <FaGoogle className="mr-2 h-4 w-4" />
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            className="h-12 bg-background/50 hover:bg-background border-border/50"
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={isLoading}
                        >
                            <FaFacebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                            Facebook
                        </Button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground rounded-full border border-border/50">
                                {t('login.or')}
                            </span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">{t('login.email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                className="h-12 bg-background/50 border-border/50"
                                {...register('email')}
                                disabled={isLoading}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">{t('login.password')}</Label>
                                <Link
                                    href={"/forgot-password" as any}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {t('login.forgotPassword')}
                                </Link>
                            </div>

                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="h-12 bg-background/50 border-border/50 pr-10"
                                    {...register('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5 py-0.5" /> : <Eye className="h-5 w-5 py-0.5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
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
                                suppressHydrationWarning
                            >
                                {isLoading ? (
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                ) : null}
                                {t('login.signIn')}
                            </Button>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        {t('login.noAccount')}{' '}
                        <Link href={"/register" as any} className="font-bold text-primary hover:underline">
                            {t('login.signUp')}
                        </Link>
                    </div>

                    <div className="mt-6 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group/back" suppressHydrationWarning>
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {t('login.backToHome')}
                        </Link>
                    </div>
                </div>
            </div >
        </div >
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div />}>
            <LoginPageContent />
        </Suspense>
    )
}
