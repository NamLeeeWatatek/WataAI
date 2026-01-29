import { DynamicFormFieldProps } from "./types"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Check, LayoutTemplate, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/Input"
import { templatesApi } from "@/lib/api/templates"
import { creationToolsApi } from "@/lib/api/creation-tools"
import { useFormContext } from "react-hook-form"

interface Template {
    id: string
    name: string
    description?: string
    thumbnailUrl?: string
    creationToolId?: string
    prefilledData?: Record<string, any>
}

interface CreationTool {
    id: string
    name: string
    slug: string
}

export function FieldTemplateSelector({ field, value, onChange, error }: DynamicFormFieldProps) {
    const params = useParams()
    const slug = params?.slug as string
    const { setValue } = useFormContext()

    // Local state for search
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    // Simple debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 300)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // 1. Resolve current tool ID from slug
    const { data: currentTool, isLoading: isLoadingTool } = useQuery({
        queryKey: ['current-tool', slug],
        queryFn: async () => {
            if (!slug) return null
            try {
                return await creationToolsApi.getBySlug(slug)
            } catch (error) {
                console.error("Error fetching current tool:", error)
                return null
            }
        },
        enabled: !!slug,
        staleTime: 5 * 60 * 1000
    })

    // 2. Fetch templates filtered by tool ID and search params
    const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
        queryKey: ['tool-templates', currentTool?.id, debouncedSearch],
        queryFn: async () => {
            if (!currentTool?.id) return []

            const filters = {
                creationToolId: currentTool.id,
                name: debouncedSearch || undefined
            }

            try {
                const response = await templatesApi.findAll({
                    filters,
                    limit: 100
                })
                return response.data || []
            } catch (error) {
                console.error("Error fetching templates:", error)
                return []
            }
        },
        enabled: !!currentTool?.id,
        placeholderData: (previousData) => previousData
    })

    const isLoading = isLoadingTool || isLoadingTemplates

    // Robust selection check for both string (legacy) and object values
    const getIsSelected = (opt: Template) => {
        if (!value) return false;
        if (typeof value === 'string') return value === opt.thumbnailUrl;
        if (typeof value === 'object' && value !== null) {
            return (value as any).url === opt.thumbnailUrl;
        }
        return false;
    }

    return (
        <div className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 w-full"
                    />
                </div>
            </div>

            {/* Templates Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-48 bg-muted/10 animate-pulse rounded-2xl border border-border/50" />
                    ))}
                </div>
            ) : templates.length === 0 ? (
                <div className="p-12 border-2 border-dashed rounded-3xl text-center bg-muted/5 border-border/40">
                    <LayoutTemplate className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-base font-semibold text-muted-foreground">No templates found</p>
                    {searchQuery && <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search terms</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((opt) => {
                        const isSelected = getIsSelected(opt);
                        return (
                            <div
                                key={opt.id}
                                onClick={() => {
                                    // Pass both image and description
                                    onChange(field.name, {
                                        url: opt.thumbnailUrl || '',
                                        description: opt.description || ''
                                    })


                                    // Prefill from template-specific data
                                    if (opt.prefilledData) {
                                        Object.entries(opt.prefilledData).forEach(([key, val]) => {
                                            setValue(key, val, { shouldValidate: true, shouldDirty: true });
                                        });
                                    }
                                }}
                                className={cn(
                                    "cursor-pointer group relative flex flex-col items-start gap-3 rounded-2xl border-2 p-4 text-left text-sm transition-all duration-300",
                                    "hover:shadow-xl hover:shadow-primary/5 active:scale-[0.98]",
                                    isSelected
                                        ? "border-primary bg-primary/[0.03] dark:bg-primary/[0.05] shadow-sm ring-1 ring-primary/20"
                                        : error
                                            ? "border-destructive/40 bg-destructive/[0.02] hover:border-destructive"
                                            : "border-border/40 bg-card hover:border-primary/40 hover:bg-accent/50 dark:bg-zinc-900/40"
                                )}
                            >
                                {opt.thumbnailUrl ? (
                                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border/50 relative shadow-inner">
                                        {(opt.thumbnailUrl.match(/\.(mp4|webm|ogg|mov)$/i)) ? (
                                            <video
                                                src={opt.thumbnailUrl}
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                                autoPlay
                                                muted
                                                loop
                                                playsInline
                                            />
                                        ) : (
                                            <img
                                                src={opt.thumbnailUrl}
                                                alt={opt.name}
                                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                            />
                                        )}
                                        {/* Overlay for selection */}
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px]">
                                                <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg scale-110 animate-in zoom-in-50 duration-300">
                                                    <Check className="w-5 h-5 stroke-[3]" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </div>
                                ) : (
                                    <div className="w-full aspect-video rounded-xl overflow-hidden bg-muted/40 dark:bg-muted/10 border border-border/50 flex flex-col items-center justify-center relative transition-colors group-hover:bg-muted/60">
                                        <LayoutTemplate className="w-10 h-10 text-muted-foreground/20 group-hover:text-primary/30 transition-colors" />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg scale-110 animate-in zoom-in-50 duration-300">
                                                    <Check className="w-5 h-5 stroke-[3]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1 w-full">
                                    <div className="flex w-full items-center justify-between gap-2">
                                        <span className={cn("font-semibold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                            {opt.name}
                                        </span>
                                    </div>
                                    {opt.description && (
                                        <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                                            {opt.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
