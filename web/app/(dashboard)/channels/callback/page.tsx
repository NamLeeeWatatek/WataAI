'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { facebookCallback } from '@/lib/api/channels';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function ChannelCallbackContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing connection...');
  const [processed, setProcessed] = useState(false);
  const [isPopup, setIsPopup] = useState(true);

  const callbackMutation = useMutation({
    mutationFn: facebookCallback,
    onSuccess: (response) => {
      if (response.success && response.pages && response.pages.length > 0) {
        setStatus('success');
        setMessage(`Successfully found ${response.pages.length} page(s)`);

        const data = {
          pages: response.pages,
          tempToken: response.tempToken,
          workspaceId: response.workspaceId,
        };

        if (window.opener) {
          notifyParent('success', 'facebook', data);
        } else {
          sessionStorage.setItem('fb_oauth_result', JSON.stringify({
            status: 'success',
            channel: 'facebook',
            ...data
          }));

          setTimeout(() => {
            router.push('/channels');
          }, 2000);
        }
      } else {
        setStatus('error');
        setMessage('No pages found or permission denied');
        notifyParent('error', 'No pages found');
      }
    },
    onError: (error: any) => {
      setStatus('error');
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process callback';
      setMessage(errorMessage);
      notifyParent('error', errorMessage);
    }
  });

  useEffect(() => {
    // Detect if this is a popup or a main window
    setIsPopup(!!window.opener);

    if (processed) return;

    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state') || '';
    const provider = (params?.provider as string) || searchParams.get('provider') || 'facebook';

    if (error) {
      setStatus('error');
      setMessage(error === 'access_denied' ? 'Authorization denied by user' : error);
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
    if (provider === 'facebook') {
      const redirectUri = `${window.location.origin}/channels/callback/facebook`;
      callbackMutation.mutate({
        code,
        state,
        redirect_uri: redirectUri
      });
    } else {
      setStatus('success');
      setMessage('Connected successfully');
      notifyParent('success', provider);

      if (!window.opener) {
        setTimeout(() => router.push('/channels'), 2000);
      }
    }
  };

  const notifyParent = (status: string, channel?: string, data?: any) => {
    if (window.opener) {
      window.opener.postMessage(
        { status, channel, ...data },
        window.location.origin
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-2xl p-10 text-center border border-border/50 animate-in fade-in zoom-in duration-300">
        <div className="mb-8">
          {status === 'loading' && (
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-6" />
              <h2 className="text-2xl font-black tracking-tight mb-2">Connecting...</h2>
              <p className="text-muted-foreground font-medium">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2 text-green-500">Perfect!</h2>
              <p className="text-foreground font-bold">{message}</p>
              {!isPopup && (
                <p className="text-sm text-muted-foreground mt-4 italic">Redirecting you back to dashboard...</p>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/20">
                <X className="w-10 h-10 text-destructive" />
              </div>
              <h2 className="text-2xl font-black tracking-tight mb-2 text-destructive">Connection Failed</h2>
              <p className="text-muted-foreground font-medium">{message}</p>
            </div>
          )}
        </div>

        {!isPopup && (
          <Button
            onClick={() => router.push('/channels')}
            className="w-full h-12 font-black uppercase tracking-widest text-xs"
            variant={status === 'error' ? 'destructive' : 'primary'}
          >
            {status === 'success' ? 'Go to Dashboard' : 'Try Again'}
          </Button>
        )}

        {isPopup && (
          <div className="pt-4 border-t border-border/50 mt-8">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              Safe to close this window
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChannelCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <ChannelCallbackContent />
    </Suspense>
  );
}
