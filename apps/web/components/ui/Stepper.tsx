'use client'

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
    id: string
    title: string
    description?: string
}

interface StepperProps {
    steps: Step[]
    currentStep: number
    className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("w-full py-6", className)}>
            <div className="flex items-center justify-center">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > index
                    const isActive = currentStep === index
                    const isLast = index === steps.length - 1

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative z-10 group shrink-0">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 z-10",
                                        isCompleted
                                            ? "bg-primary border-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] dark:shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                                            : isActive
                                                ? "border-primary text-primary bg-background ring-8 ring-primary/10 scale-110 shadow-lg"
                                                : "border-muted-foreground/30 text-muted-foreground bg-muted/20 dark:bg-zinc-800/50"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    ) : (
                                        <span className={cn(
                                            "text-sm font-bold transition-colors duration-300",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {index + 1}
                                        </span>
                                    )}
                                </div>
                                <div className="absolute top-12 whitespace-nowrap text-center">
                                    <p
                                        className={cn(
                                            "text-xs font-bold transition-all duration-300 tracking-tight",
                                            isActive ? "text-primary scale-110" : isCompleted ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {step.title}
                                    </p>
                                    {step.description && (
                                        <p className="text-[10px] text-muted-foreground/50 hidden md:block mt-0.5 max-w-[120px] line-clamp-1">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isLast && (
                                <div className="w-16 md:w-32 h-[3px] mx-2 -mb-0.5 bg-border dark:bg-zinc-700 relative overflow-hidden rounded-full shrink-0">
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-primary transition-transform duration-1000 ease-in-out origin-left",
                                            isCompleted ? "scale-x-100" : "scale-x-0"
                                        )}
                                    />
                                    {isActive && (
                                        <div className="absolute inset-0 bg-primary/20" />
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
