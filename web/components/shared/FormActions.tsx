'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const formActionsVariants = cva(
    "flex items-center justify-between p-6 rounded-3xl backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2",
    {
        variants: {
            variant: {
                default: "bg-card/40 border border-border/40",
                ghost: "bg-transparent border-none p-0",
                floating: "sticky bottom-6 shadow-xl bg-card/80 border border-white/10"
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof formActionsVariants> {
    onSave?: () => void;
    loading?: boolean;
    disabled?: boolean;
    saveLabel?: string;
    description?: string;
    type?: 'button' | 'submit' | 'reset';
    icon?: React.ReactNode;
}

export function FormActions({
    className,
    variant,
    onSave,
    loading = false,
    disabled = false,
    saveLabel = 'Save Changes',
    description = 'Ensure all changes are correct before saving.',
    type = 'submit',
    icon = <Save className="mr-3 h-5 w-5" />,
    children,
    ...props
}: FormActionsProps) {
    return (
        <div className={cn(formActionsVariants({ variant, className }))} {...props}>
            <div className="hidden sm:block">
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-3 ml-auto">
                {children}
                <Button
                    type={type}
                    onClick={onSave}
                    disabled={disabled || loading}
                    size="xl"
                    className={cn(
                        "px-10 font-black transition-all",
                        (disabled || loading) && "opacity-70 cursor-not-allowed"
                    )}
                >
                    {loading ? (
                        <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    ) : (
                        icon
                    )}
                    {saveLabel}
                </Button>
            </div>
        </div>
    );
}
