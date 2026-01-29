'use client'

import { ReactNode, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import i18n from '../../lib/i18n/i18n'
import { LoadingLogo } from '../shared/LoadingLogo'
import { motion, AnimatePresence } from 'framer-motion'

interface I18nProviderProps {
  children: ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const pathname = usePathname();

  const isMarketing = !pathname?.startsWith('/dashboard') &&
    !pathname?.startsWith('/admin') &&
    !pathname?.includes('publishing') &&
    !pathname?.includes('conversations');

  useEffect(() => {
    setMounted(true);
    const handleInitialized = () => {
      setIsReady(true);
    };

    if (i18n.isInitialized) {
      handleInitialized();
    } else {
      i18n.on('initialized', handleInitialized);
    }

    return () => {
      i18n.off('initialized', handleInitialized);
    };
  }, []);

  // Hydration Safety: We only render the translated children after the client-side mount.
  // To avoid the 'xoay xoay' (spinning) feeling, we use a 'Branded Intro' reveal transition.

  if (isMarketing) {
    return (
      <div className="relative min-h-screen bg-background">
        <AnimatePresence mode="wait">
          {(!mounted || !isReady) ? (
            <motion.div
              key="intro-overlay"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[10000] bg-background flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Abstract Branded Background - No Spinner */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/30 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse [animation-delay:1s]" />
              </div>

              {/* Minimal Animated Signature */}
              <div className="relative z-10 flex flex-col items-center gap-6">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-2xl shadow-primary/20 flex items-center justify-center"
                >
                  <div className="w-6 h-6 rounded-full border-4 border-white/30 border-t-white animate-[spin_1.5s_linear_infinite]" />
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.4, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-black uppercase tracking-[0.4em] text-foreground"
                >
                  Initializing
                </motion.p>
              </div>

              {/* Progress Line */}
              <div className="fixed top-0 left-0 right-0 h-[3px] bg-muted/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                  className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.6)]"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content-reveal"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Dashboard Stays Secure
  if (!isReady) {
    return <LoadingLogo fullPage text="Initializing Intelligence" />;
  }

  return <>{children}</>;
}
