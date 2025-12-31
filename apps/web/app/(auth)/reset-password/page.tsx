'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { authApi } from '@/lib/api/auth'
import Link from 'next/link'

import { useTranslation } from 'react-i18next'

const resetSchema = (t: any) => z.object({
    password: z.string().min(8, t('validation.tooShort')),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: t('resetPassword.errors.passwordsDontMatch'),
    path: ["confirmPassword"],
})

type ResetFormValues = z.infer<ReturnType<typeof resetSchema>>

function ResetPasswordPageContent() {
    const { t } = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()
    const hash = searchParams.get('hash')

    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const { register, handleSubmit, formState: { errors } } = useForm<ResetFormValues>({
        resolver: zodResolver(resetSchema(t))
    })

    useEffect(() => {
        if (!hash) {
            router.push('/login')
        }
    }, [hash, router])

    const onSubmit = async (data: ResetFormValues) => {
        if (!hash) return

        setIsLoading(true)
        setError(null)
        try {
            await authApi.resetPassword({
                hash,
                password: data.password
            })
            setIsSuccess(true)
        } catch (err: any) {
            setError(err.response?.data?.message || t('resetPassword.errors.generic'))
        } finally {
            setIsLoading(false)
        }
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-6">
                <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="glass p-10 bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[3rem] text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-8 ring-1 ring-green-500/20">
                            <CheckCircle2 className="w-10 h-10 text-green-500" />
                        </div>
                        <h1 className="text-3xl font-black mb-4 tracking-tighter">{t('resetPassword.success.title')}</h1>
                        <p className="text-muted-foreground mb-8 leading-relaxed">
                            {t('resetPassword.success.description')}
                        </p>
                        <Button asChild className="w-full h-14 font-bold rounded-2xl shadow-xl bg-primary hover:bg-primary/90">
                            <Link href="/login">{t('resetPassword.success.returnToLogin')}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans py-12 px-6">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[140px]" />
                <div className="absolute bottom-[20%] left-[10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[140px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="glass p-10 bg-card/40 backdrop-blur-2xl border border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] rounded-[3rem] relative overflow-hidden group">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 shadow-inner ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                        </div>
                        <h1 className="text-3xl font-black mb-3 tracking-tighter">
                            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{t('resetPassword.title')}</span>
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                            {t('resetPassword.subtitle')}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-14 bg-background/50 border-border/50 text-lg rounded-2xl focus:ring-primary/20 transition-all pr-12"
                                    {...register('password')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5 py-0.5" /> : <Eye className="h-5 w-5 py-0.5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive font-medium">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">{t('resetPassword.confirmNewPassword')}</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="h-14 bg-background/50 border-border/50 text-lg rounded-2xl focus:ring-primary/20 transition-all pr-12"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5 py-0.5" /> : <Eye className="h-5 w-5 py-0.5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>}
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive text-sm font-medium animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
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
                                    {t('resetPassword.updatePassword')}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-all group/back">
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            {t('resetPassword.backToLogin')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    const { t } = useTranslation()

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text={t('resetPassword.securing')} />
            </div>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    )
}
