'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { CheckCircle, XCircle } from 'lucide-react'

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const provider = window.location.pathname.split('/').pop()

        if (error) {
            setStatus('error')
            setMessage(`OAuth error: ${error}`)
            notifyAndClose('error', `OAuth error: ${error}`)
            return
        }

        if (!code) {
            setStatus('error')
            setMessage('No authorization code received')
            notifyAndClose('error', 'No authorization code received')
            return
        }

        const handleCallback = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

                const { getSession } = await import('next-auth/react')
                const session = await getSession()
                const token = session?.accessToken

                const res = await fetch(`${apiUrl}/oauth/callback/${provider}?code=${code}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })

                const data = await res.json()

                if (data.status === 'success') {
                    setStatus('success')
                    setMessage(data.message || 'Channel connected successfully!')
                    notifyAndClose('success', data.message, data.data)
                } else {
                    setStatus('error')
                    setMessage(data.message || 'Failed to connect channel')
                    notifyAndClose('error', data.message)
                }
            } catch (err) {
                setStatus('error')
                setMessage('An error occurred while connecting the channel')

                notifyAndClose('error', 'An error occurred while connecting the channel')
            }
        }

        handleCallback()
    }, [searchParams, router])

    const notifyAndClose = (status: 'success' | 'error', message: string, data?: any) => {
        if (window.opener) {
            window.opener.postMessage({
                status,
                message,
                ...data
            }, '*')
        }

        setTimeout(() => {
            window.close()
        }, 2000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="glass rounded-xl p-8 max-w-md w-full text-center">
                {status === 'loading' && (
                    <>
                        <LoadingLogo size="lg" className="mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Connecting Channel...</h2>
                        <p className="text-muted-foreground">Please wait while we complete the connection</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                        <h2 className="text-2xl font-bold mb-2 text-green-500">Success!</h2>
                        <p className="text-muted-foreground">{message}</p>
                        <p className="text-sm text-muted-foreground mt-2">Closing window...</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                        <h2 className="text-2xl font-bold mb-2 text-red-500">Connection Failed</h2>
                        <p className="text-muted-foreground mb-4">{message}</p>
                        <p className="text-sm text-muted-foreground mt-2">Closing window...</p>
                    </>
                )}
            </div>
        </div>
    )
}
