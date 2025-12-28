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
        <div className={cn("w-full py-4", className)}>
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isCompleted = currentStep > index
                    const isActive = currentStep === index
                    const isLast = index === steps.length - 1

                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center relative group">
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10",
                                        isCompleted
                                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                            : isActive
                                                ? "border-primary text-primary bg-background ring-4 ring-primary/10"
                                                : "border-muted text-muted-foreground bg-background"
                                    )}
                                >
                                    {isCompleted ? (
                                        <Check className="w-5 h-5 stroke-[3]" />
                                    ) : (
                                        <span className="text-sm font-bold">{index + 1}</span>
                                    )}
                                </div>
                                <div className="absolute top-12 whitespace-nowrap text-center">
                                    <p
                                        className={cn(
                                            "text-xs font-bold transition-colors",
                                            isActive ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {step.title}
                                    </p>
                                    {step.description && (
                                        <p className="text-[10px] text-muted-foreground/60 hidden md:block">
                                            {step.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!isLast && (
                                <div className="flex-1 h-[2px] mx-4 -mt-6 bg-muted relative overflow-hidden">
                                    <div
                                        className={cn(
                                            "absolute inset-0 bg-primary transition-transform duration-500 ease-in-out origin-left",
                                            isCompleted ? "scale-x-100" : "scale-x-0"
                                        )}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    )
}
