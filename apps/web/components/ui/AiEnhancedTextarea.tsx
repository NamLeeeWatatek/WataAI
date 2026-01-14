import React, { useState } from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Sparkles, Loader2, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiProvidersApi } from '@/lib/api/ai-providers';
import { toast } from '@/lib/toast';

interface AiEnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value?: string;
    onValueChange?: (value: string) => void;
    type?: 'image' | 'text' | 'code' | 'general';
    containerClassName?: string;
}

export function AiEnhancedTextarea({
    value,
    onValueChange,
    type = 'general',
    containerClassName,
    className,
    onChange, // capture native onChange to proxy if needed
    ...props
}: AiEnhancedTextareaProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [enhancedPreview, setEnhancedPreview] = useState<string | null>(null);

    const handleEnhance = async () => {
        const text = value?.toString() || '';
        if (!text || text.length < 3) {
            toast.error('Please enter some text to enhance');
            return;
        }

        setIsEnhancing(true);
        try {
            const result = await aiProvidersApi.enhancePrompt(text, type);
            if (result && result.enhancedPrompt) {
                setEnhancedPreview(result.enhancedPrompt);
                toast.success('Prompt enhanced!');
            }
        } catch (error) {
            toast.error('Failed to enhance prompt. Check your AI settings.');
            console.error(error);
        } finally {
            setIsEnhancing(false);
        }
    };

    const applyEnhancement = () => {
        if (enhancedPreview && onValueChange) {
            onValueChange(enhancedPreview);
            setEnhancedPreview(null);
        }
    };

    const discardEnhancement = () => {
        setEnhancedPreview(null);
    };

    return (
        <div className={cn("relative group transition-all duration-300", containerClassName)}>
            <div className={cn(
                "absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-500",
                enhancedPreview ? "opacity-100" : "group-hover:opacity-30"
            )} />

            <Textarea
                value={enhancedPreview || value}
                onChange={(e) => {
                    // correct typing for onChange
                    if (onValueChange) onValueChange(e.target.value);
                    if (onChange) onChange(e);
                    if (enhancedPreview) setEnhancedPreview(null); // Clear preview on edit
                }}
                className={cn(
                    "min-h-[100px] pr-10 transition-all duration-300 backdrop-blur-sm",
                    enhancedPreview
                        ? "border-purple-500/50 bg-background/50 text-foreground shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]"
                        : "bg-card/30 focus:bg-card/50",
                    className
                )}
                {...props}
            />

            <div className="absolute bottom-2.5 right-2.5 flex gap-1 z-10">
                {enhancedPreview ? (
                    <div className="flex items-center bg-background/90 backdrop-blur-md border border-purple-200/20 rounded-full shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 scale-100 origin-bottom-right">
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors"
                            onClick={discardEnhancement}
                            title="Discard enhancement"
                        >
                            <X className="size-3.5" />
                        </Button>
                        <div className="w-[1px] h-4 bg-border/50" />
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-3 text-purple-600 hover:text-purple-700 hover:bg-purple-500/10 font-medium text-[10px] uppercase tracking-wide gap-1.5 rounded-none transition-colors"
                            onClick={applyEnhancement}
                        >
                            Apply
                            <ArrowRight className="size-3" />
                        </Button>
                    </div>
                ) : (
                    <div className={cn(
                        "transition-all duration-300 ease-out",
                        (value?.toString().length || 0) > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
                    )}>
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "h-7 w-7 rounded-full transition-all duration-300 shadow-sm",
                                isEnhancing
                                    ? "bg-purple-50 text-purple-600"
                                    : "bg-background/80 hover:bg-purple-500 hover:text-white text-muted-foreground border border-border/50"
                            )}
                            onClick={handleEnhance}
                            disabled={isEnhancing || !value}
                            title="Enhance with AI"
                        >
                            {isEnhancing ? (
                                <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="size-3.5" />
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
