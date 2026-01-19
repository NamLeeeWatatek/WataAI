import { UseFormReturn } from 'react-hook-form'
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { AlertCircle } from 'lucide-react'
import { KbFormValues } from './schema'

interface KbProcessingTabProps {
    form: UseFormReturn<KbFormValues>
}

export function KbProcessingTab({ form }: KbProcessingTabProps) {
    return (
        <div className="space-y-6">
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wide">Advance Configuration</p>
                    <p className="text-[11px] opacity-90 leading-relaxed">
                        Adjusting these settings after creation will require re-indexing all documents. Leave as default if unsure.
                    </p>
                </div>
            </div>

            <div className="space-y-6 pt-2">
                <FormField
                    control={form.control}
                    name="chunkSize"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chunk Size (Tokens)</FormLabel>
                                <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded">{field.value}</span>
                            </div>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                                        className="font-mono bg-background/50"
                                    />
                                </div>
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Maximum number of tokens per document segment.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="chunkOverlap"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex items-center justify-between mb-2">
                                <FormLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Chunk Overlap</FormLabel>
                                <span className="text-xs font-mono font-medium bg-muted px-2 py-0.5 rounded">{field.value}</span>
                            </div>
                            <FormControl>
                                <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 200)}
                                    className="font-mono bg-background/50"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Number of tokens to repeat between chunks to maintain context.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
    )
}
