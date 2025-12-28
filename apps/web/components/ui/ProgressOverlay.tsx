'use client'

import { useProgressOverlay } from '@/lib/hooks/useProgressOverlay'
import { Dialog, DialogContent } from '@/components/ui/Dialog'
import { Progress } from '@/components/ui/Progress'
import { LoadingLogo } from '@/components/ui/LoadingLogo'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProgressOverlay() {
    const {
        open,
        title,
        description,
        steps,
        currentStep,
        progress,
        cancelProgress
    } = useProgressOverlay()

    const animatedProgress = progress !== undefined
        ? progress
        : steps.length > 0
            ? ((currentStep + 1) / steps.length) * 100
            : 0

    if (!open) return null

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className={cn(
                'max-w-lg border-border/50',
                'bg-gradient-to-br from-card/95 via-card/90 to-card/95 backdrop-blur-xl',
                'shadow-2xl'
            )}>
                <div className="space-y-6 relative">
                    {/* Gradient glow background */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-2xl blur-2xl opacity-50" />

                    {/* Header */}
                    <div className="text-center relative z-10">
                        <LoadingLogo size="lg" className="mb-4" showGlow />
                        <h3 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                            {title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">{description}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3 relative z-10">
                        <Progress value={animatedProgress} className="w-full h-2" />
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground font-medium">
                                {Math.round(animatedProgress)}% complete
                            </p>
                            {steps.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Current Step Highlight */}
                    {steps.length > 0 && (
                        <div className="space-y-2 relative z-10">
                            <p className="text-sm font-semibold text-foreground/90">Current step:</p>
                            <div className={cn(
                                'flex items-center gap-3 p-4 rounded-xl',
                                'bg-gradient-to-r from-primary/10 to-primary/5',
                                'border border-primary/20',
                                'shadow-lg shadow-primary/5',
                                'animate-in slide-in-from-left duration-300'
                            )}>
                                <div className="flex-shrink-0">
                                    <LoadingLogo size="sm" showGlow={false} />
                                </div>
                                <span className="text-sm font-medium">
                                    {steps[currentStep] || steps[steps.length - 1]}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Steps List */}
                    {steps.length > 1 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent relative z-10">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                All Steps
                            </p>
                            {steps.map((step, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                                        index <= currentStep && 'bg-muted/30',
                                        index === currentStep && 'ring-2 ring-primary/30'
                                    )}
                                >
                                    {index < currentStep ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 animate-in zoom-in duration-300" />
                                    ) : index === currentStep ? (
                                        <div className="flex-shrink-0">
                                            <div className="w-4 h-4 rounded-full border-2 border-primary animate-pulse" />
                                        </div>
                                    ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground/30 flex-shrink-0" />
                                    )}
                                    <span className={cn(
                                        'text-sm transition-colors',
                                        index < currentStep ? 'text-foreground font-medium line-through decoration-green-500/50' :
                                            index === currentStep ? 'text-foreground font-semibold' :
                                                'text-muted-foreground'
                                    )}>
                                        {step}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Cancel Button */}
                    <div className="flex justify-center pt-2 relative z-10 border-t border-border/50">
                        <button
                            onClick={cancelProgress}
                            className={cn(
                                'mt-2 px-4 py-2 text-sm rounded-lg',
                                'text-muted-foreground hover:text-destructive',
                                'hover:bg-destructive/10',
                                'transition-all duration-200',
                                'border border-transparent hover:border-destructive/30'
                            )}
                        >
                            Cancel operation
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// Re-export functions from hook for convenience
export {
    showProgressOverlay,
    hideProgressOverlay,
    updateProgressOverlay,
    completeProgressOverlay,
    failProgressOverlay
} from '@/lib/hooks/useProgressOverlay'

