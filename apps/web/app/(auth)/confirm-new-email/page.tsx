'use client'

import { Button } from '@/components/ui/Button'
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck } from 'lucide-react'
import { useState, Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { authApi } from '@/lib/api/auth'
import Link from 'next/link'

function ConfirmNewEmailPageContent() {
    const searchParams = useSearchParams()
    const hash = searchParams.get('hash')

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        const confirmEmail = async () => {
            if (!hash) {
                setStatus('error')
                setErrorMessage('Missing verification token.')
                return
            }

            try {
                await authApi.confirmNewEmail(hash)
                setStatus('success')
            } catch (err: any) {
                setStatus('error')
                setErrorMessage(err.response?.data?.message || 'Verification failed. Link may be expired.')
            }
        }

        confirmEmail()
    }, [hash])

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden font-sans p-6">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[10%] right-[10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
                <div className="glass p-10 bg-card/40 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[3rem] text-center">
                    {status === 'loading' && (
                        <div className="py-12">
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-primary" />
                            </div>
                            <h1 className="text-2xl font-black mb-2">Updating Email</h1>
                            <p className="text-muted-foreground">Confirming your new email address...</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8 animate-in slide-in-from-bottom-4">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-8 border border-green-500/20 shadow-[0_0_40px_-5px_rgba(34,197,94,0.3)]">
                                <CheckCircle2 className="w-12 h-12 text-green-500" />
                            </div>
                            <h1 className="text-3xl font-black mb-4 tracking-tighter">Updated!</h1>
                            <p className="text-muted-foreground mb-10 leading-relaxed">
                                Your email address has been successfully updated. You can now use your new email to sign in.
                            </p>
                            <Button asChild className="w-full h-14 font-bold rounded-2xl shadow-xl group/btn">
                                <Link href="/login">
                                    Return to Sign In
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-8 animate-in slide-in-from-bottom-4">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 mb-8 border border-destructive/20 shadow-[0_0_40px_-5px_rgba(239,68,68,0.3)]">
                                <XCircle className="w-12 h-12 text-destructive" />
                            </div>
                            <h1 className="text-3xl font-black mb-4 tracking-tighter italic">Update Failed</h1>
                            <p className="text-destructive mb-10 font-medium">
                                {errorMessage}
                            </p>
                            <Button asChild className="w-full h-14 font-bold rounded-2xl shadow-xl">
                                <Link href="/dashboard">Return to Dashboard</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ConfirmNewEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <LoadingLogo size="lg" text="Authenticating..." />
            </div>
        }>
            <ConfirmNewEmailPageContent />
        </Suspense>
    )
}
