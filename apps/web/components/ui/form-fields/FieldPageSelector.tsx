import { DynamicFormFieldProps } from "./types"
import { Monitor, Info, CheckCircle2, ChevronRight } from "lucide-react"
import { useDynamicOptions } from "@/lib/hooks/useDynamicOptions"
import { FormField } from "@/lib/api/creation-tools"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../Select"
import { cn } from "@/lib/utils"

export function FieldPageSelector({ field, value, onChange, loadingOptions }: any) {
    const { options: dynamicOptions, isLoading } = useDynamicOptions({
        ...field,
        options: 'dynamic:channels' // Pages are inside channels
    } as unknown as FormField)

    // Filter only Facebook Pages from connections
    const pageOptions = (Array.isArray(dynamicOptions) ? dynamicOptions : [])
        .filter(opt => opt.type === 'facebook' && opt.isPage === true)

    return (
        <div className="space-y-3">
            <Select
                value={value ? String(value) : undefined}
                onValueChange={(val) => onChange(field.name, val)}
                disabled={isLoading}
            >
                <SelectTrigger className="bg-card">
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
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <Monitor className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="font-medium">{String(page.name || 'Untitled')}</span>
                                <span className="text-[10px] opacity-50">({String(page.id)})</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {value && (
                <div className="p-3 rounded-xl border border-success/20 bg-success/5 flex items-center gap-3 animate-in fade-in zoom-in-95">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-xs font-bold text-success">Page Selected</p>
                        <p className="text-[10px] text-muted-foreground">Ready to post to this page</p>
                    </div>
                </div>
            )}
        </div>
    )
}
