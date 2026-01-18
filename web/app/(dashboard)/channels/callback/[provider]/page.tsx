'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import axiosClient from '@/lib/axios-client';
import { Check, X } from 'lucide-react';

function ChannelCallbackContent() {
    const searchParams = useSearchParams();
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing...');
    const [processed, setProcessed] = useState(false);

    useEffect(() => {
        if (processed) return;

        const code = searchParams.get('code');
        const error = searchParams.get('error');
        const state = searchParams.get('state') || '';

        // Get provider from params (URL path) or fallback to search params or default
        const provider = (params?.provider as string) || searchParams.get('provider') || 'facebook';

        if (error) {
            setStatus('error');
            setMessage('OAuth cancelled or failed');
            notifyParent('error', error);
            setProcessed(true);
            return;
        }

        if (!code) {
            setStatus('error');
            setMessage('No authorization code received');
            notifyParent('error', 'No code');
            setProcessed(true);
            return;
        }

        setProcessed(true);
        handleCallback(code, provider, state);
    }, [searchParams, params, processed]);

    const handleCallback = async (code: string, provider: string, state: string) => {
        try {
            if (provider === 'facebook') {
                const redirectUri = `${window.location.origin}/channels/callback/facebook`;
                const res: any = await axiosClient.get(
                    `/channels/facebook/oauth/callback?code=${code}&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}`
                );
                const response = res.data || res;

                if (response.success && response.pages && response.pages.length > 0) {
                    if (!response.tempToken) {
                        setStatus('error');
                        setMessage('Failed to get access token. Please try again.');
                        notifyParent('error', 'No access token received');
                        return;
                    }

                    setStatus('success');
                    setMessage(`Found ${response.pages.length} page(s)`);

                    notifyParent('success', 'facebook', {
                        pages: response.pages,
                        tempToken: response.tempToken,
                        workspaceId: response.workspaceId,
                    });
                } else {
                    setStatus('error');
                    setMessage('No pages found');
                    notifyParent('error', 'No pages found');
                }
            } else {
                setStatus('success');
                setMessage('Connected successfully');
                notifyParent('success', provider);
            }
        } catch (error: any) {
            setStatus('error');

            let errorMessage = 'Failed to process callback';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            if (errorMessage.includes('already been used')) {
                errorMessage = 'Authorization code expired. Please close this window and try connecting again.';
            }

            setMessage(errorMessage);
            notifyParent('error', errorMessage);
        }
    };

    const notifyParent = (status: string, channel?: string, data?: any) => {
        if (window.opener) {
            window.opener.postMessage(
                {
                    status,
                    channel,
                    ...data,
                },
                window.location.origin
            );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
            <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-white/10">
                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                            <Check className="w-8 h-8 text-green-400" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-green-400">Success!</h2>
                        <p className="text-gray-400">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">You can close this window</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                            <X className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2 text-red-400">Error</h2>
                        <p className="text-gray-400">{message}</p>
                        <p className="text-sm text-gray-500 mt-4">You can close this window</p>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ChannelCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>}>
            <ChannelCallbackContent />
        </Suspense>
    );
}
