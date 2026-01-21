import { DynamicFormFieldProps } from "./types"
import { Monitor, Info, CheckCircle2, Bot, Sparkles, Loader2, BrainCircuit } from "lucide-react"
import { useDynamicOptions } from "@/lib/hooks/useDynamicOptions"
import { FormField } from "@/lib/api/creation-tools"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select"
import { cn } from "@/lib/utils"
import { useFormContext } from "react-hook-form"
import { Textarea } from "../Textarea"
import { Label } from "../Label"
import { Button } from "../Button"
import { useState, useEffect } from "react"
import { useBots } from "@/lib/hooks/features/useBots"
import { useWorkspace } from "@/lib/hooks/useWorkspace"
import { botsApi } from "@/lib/api/bots"
import { toast } from "sonner"

export function FieldPageSelector({ field, value, onChange, loadingOptions }: any) {
    const { setValue, watch } = useFormContext()
    const { workspaceId } = useWorkspace()
    const { data: bots } = useBots(workspaceId || undefined)

    // Form states
    const message = watch('message') || ''

    // Local UI states
    const [selectedBotId, setSelectedBotId] = useState<string>('')
    const [isGenerating, setIsGenerating] = useState(false)

    const { options: dynamicOptions, isLoading } = useDynamicOptions({
        ...field,
        options: 'dynamic:channels' // Pages are inside channels
    } as unknown as FormField)

    // Default to first bot
    useEffect(() => {
        if (bots?.data?.length && !selectedBotId) {
            setSelectedBotId(bots.data[0].id)
        }
    }, [bots, selectedBotId])

    const handleGenerateContent = async () => {
        setIsGenerating(true)
        try {
            if (selectedBotId) {
                // Use the message as prompt if it exists, otherwise just ask for a generic post
                const prompt = message || "Write a professional social media post about this content."
                const result = await botsApi.chat(selectedBotId, prompt)
                setValue('message', result.response, { shouldDirty: true, shouldValidate: true })
                toast.success("Content generated using Bot's knowledge!")
            } else {
                // Fallback
                await new Promise(resolve => setTimeout(resolve, 1000))
                const generatedContent = `🚀 Check out this update! \n\n#AI #Innovation`
                setValue('message', generatedContent, { shouldDirty: true, shouldValidate: true })
                toast.success("Content generated!")
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to generate content")
        } finally {
            setIsGenerating(false)
        }
    }

    // Filter only Facebook Pages from connections
    const pageOptions = (Array.isArray(dynamicOptions) ? dynamicOptions : [])
        .filter(opt => opt.type === 'facebook' && opt.isPage === true)

    return (
        <div className="space-y-6">
            {/* 1. Page Selection */}
            <div className="space-y-3">
                <Select
                    value={value ? String(value) : undefined}
                    onValueChange={(val) => onChange(field.name, val)}
                    disabled={isLoading}
                >
                    <SelectTrigger className="bg-card h-12">
                        <SelectValue placeholder={isLoading ? "Loading Pages..." : "Select Facebook Page"} />
                    </SelectTrigger>
                    <SelectContent>
                        {pageOptions.length === 0 && !isLoading && (
                            <div className="p-4 text-center space-y-2">
                                <Info className="w-5 h-5 text-muted-foreground mx-auto" />
                                <p className="text-xs text-muted-foreground">No Facebook Pages connected</p>
                                <a href="/channels" target="_blank" className="text-[10px] text-primary underline">Connect via Channels</a>
                            </div>
                        )}
                        {pageOptions.map((page: any) => (
                            <SelectItem key={String(page.id)} value={String(page.id)}>
                                <div className="flex items-center gap-3 py-1">
                                    <div className="w-6 h-6 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                                        <Monitor className="w-3.5 h-3.5 text-[#1877F2]" />
                                    </div>
                                    <div className="flex flex-col text-left">
                                        <span className="font-medium text-sm">{String(page.name || 'Untitled')}</span>
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {value && (
                    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 animate-in fade-in zoom-in-95">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-primary">Page Selected</p>
                            <p className="text-[10px] text-muted-foreground">Ready to post to this page</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Content Generation Section (Only show if a page is selected or always?) -> Always good for UX */}
            <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Post Content
                    </Label>

                    {/* Bot Selector & Generate Button inline */}
                    <div className="flex items-center gap-2">
                        <Select value={selectedBotId} onValueChange={setSelectedBotId}>
                            <SelectTrigger className="h-7 w-[140px] text-[10px] bg-secondary/30 border-none">
                                <SelectValue placeholder="Select Bot" />
                            </SelectTrigger>
                            <SelectContent>
                                {bots?.data?.map((bot) => (
                                    <SelectItem key={bot.id} value={bot.id}>
                                        <span className="text-[10px]">{bot.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] px-2 text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10"
                            onClick={handleGenerateContent}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                            ) : (
                                <Sparkles className="w-3 h-3 mr-1.5" />
                            )}
                            {selectedBotId ? 'Write with Bot' : 'Generate'}
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <Textarea
                        placeholder="Write something amazing or let AI help you..."
                        className="min-h-[120px] resize-none text-sm bg-card/50 focus:bg-card transition-colors p-4 leading-relaxed"
                        value={message}
                        onChange={(e) => setValue('message', e.target.value, { shouldDirty: true })}
                    />
                    {selectedBotId && (
                        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[10px] text-primary/60 pointer-events-none bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm border border-border/50">
                            <BrainCircuit className="w-3 h-3" />
                            <span>Knowledge Enabled</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
