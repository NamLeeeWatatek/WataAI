
import { DynamicFormFieldProps } from "./types"
import { Eye, Info, Sparkles, FileText, Layout, RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMemo } from "react"
import { Media } from "@/components/shared/Media"
import { Button } from "@/components/ui/Button"
import { isImageUrl, isVideoUrl } from "@/lib/utils/media"

export function FieldResultPreview({ field, value, allValues = {} }: DynamicFormFieldProps) {
    // 1. Resolve Content Source
    // Priority: Explicit Step Mapping -> 'preview' prop (from logic) -> 'prev' (step history)
    const contentData = useMemo(() => {
        const values = allValues as any;

        // A. Configured mapping (e.g., config: { sourceStep: 'step_1' })
        if (field.config?.sourceStep) {
            return values.prev?.[field.config.sourceStep];
        }

        // B. Preview Data (from GridFormRenderer preview logic)
        if (values.preview) return values.preview;

        // C. Fallback: Search in latest step result
        const stepKeys = Object.keys(values.prev || {});
        if (stepKeys.length > 0) {
            const lastStep = stepKeys[stepKeys.length - 1];
            return values.prev[lastStep];
        }

        return null;
    }, [allValues, field.config]);

    // 2. Parse Content
    const { mediaUrl, textContent, rawData } = useMemo(() => {
        if (!contentData) return { mediaUrl: null, textContent: null, rawData: null };

        const data = contentData;

        // Image detection
        const url = data.url || data.imageUrl || data.videoUrl || data.image || (Array.isArray(data.images) && data.images[0]?.url);
        const isMedia = url && (isImageUrl(url) || isVideoUrl(url) || String(url).startsWith('http'));

        // Text detection
        const text = data.text || data.message || data.content || data.response || (typeof data === 'string' ? data : null);

        return {
            mediaUrl: isMedia ? url : null,
            textContent: text,
            rawData: data
        }
    }, [contentData]);

    const iconMap: Record<string, any> = {
        'sparkles': Sparkles,
        'file': FileText,
        'layout': Layout,
        'eye': Eye
    }

    const Icon = iconMap[field.icon || 'eye'] || Eye

    // No content state
    if (!contentData) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1 px-1">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary/70">{field.label || 'Result Preview'}</span>
                </div>
                <div className="p-8 rounded-2xl border-2 border-dashed border-muted-foreground/10 bg-muted/5 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                        <Layout className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">No result generated yet</p>
                        <p className="text-xs text-muted-foreground max-w-[200px]">
                            {field.placeholder || "Complete the previous steps to see the generated result here."}
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-green-500/10">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">{field.label || 'Generated Result'}</span>
                </div>
                {/* Optional Status Badge */}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium border border-primary/10">
                    Ready to Use
                </span>
            </div>

            <div className={cn(
                "rounded-2xl overflow-hidden border border-border shadow-lg bg-card transition-all group",
                "hover:shadow-xl hover:border-primary/20"
            )}>
                {/* MEDIA PREVIEW */}
                {mediaUrl && (
                    <div className="relative w-full bg-black/5 dark:bg-black/20">
                        {/* Aspect Ratio Container - roughly 16:9 or auto */}
                        <div className="relative w-full min-h-[200px] max-h-[500px] flex items-center justify-center p-2">
                            <Media
                                src={mediaUrl}
                                alt="Result"
                                className="w-full h-full max-w-full max-h-[500px] object-contain mx-auto"
                                objectFit="contain" // Explicit prop for Media component support
                                controls
                                ambient
                            />
                        </div>
                    </div>
                )}

                {/* TEXT CONTENT */}
                {(textContent || (!mediaUrl && rawData)) && (
                    <div className="p-5 space-y-3">
                        {textContent && (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <p className="leading-relaxed whitespace-pre-wrap text-foreground/90 font-medium">
                                    {typeof textContent === 'string' ? textContent : JSON.stringify(textContent)}
                                </p>
                            </div>
                        )}

                        {/* JSON Fallback for complex data without obvious text/image */}
                        {!mediaUrl && !textContent && rawData && (
                            <div className="bg-muted/50 rounded-lg p-3 overflow-hidden">
                                <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto">
                                    {JSON.stringify(rawData, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                    <Info className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground italic">
                        Not satisfied? Go back to modify inputs.
                    </p>
                </div>
            </div>
        </div>
    )
}
