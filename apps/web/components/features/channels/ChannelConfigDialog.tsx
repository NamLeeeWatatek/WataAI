import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { handleFormError } from '@/lib/utils/form-errors'
import { Settings, ShieldCheck, Key, Globe, Layout, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const channelConfigSchema = z.object({
    provider: z.string().min(1, 'Provider is required'),
    name: z.string().min(1, 'Name is required'),
    pageId: z.string().optional(),
    pageAccessToken: z.string().optional(),
    verifyToken: z.string().optional(),
    appSecret: z.string().optional(),
    isActive: z.boolean(),
})

interface ChannelConfigDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    channel?: any | null
    providers: Array<{ value: string; label: string }>
    onSubmit: (data: z.infer<typeof channelConfigSchema>) => Promise<void>
}

export function ChannelConfigDialog({
    open,
    onOpenChange,
    channel,
    providers,
    onSubmit
}: ChannelConfigDialogProps) {
    const form = useForm<z.infer<typeof channelConfigSchema>>({
        resolver: zodResolver(channelConfigSchema),
        defaultValues: {
            provider: '',
            name: '',
            pageId: '',
            pageAccessToken: '',
            verifyToken: '',
            appSecret: '',
            isActive: true,
        },
    })

    useEffect(() => {
        if (channel && open) {
            form.reset({
                provider: channel.provider,
                name: channel.name,
                pageId: channel.config?.pageId || '',
                pageAccessToken: channel.config?.pageAccessToken || '',
                verifyToken: channel.config?.verifyToken || '',
                appSecret: channel.config?.appSecret || '',
                isActive: channel.isActive ?? true,
            })
        } else if (!open) {
            form.reset()
        }
    }, [channel, open, form])

    const handleSubmit = async (values: z.infer<typeof channelConfigSchema>) => {
        try {
            await onSubmit(values)
            form.reset()
            onOpenChange(false)
        } catch (error: any) {
            handleFormError(error, form)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-hidden p-0 bg-background border-white/5 shadow-2xl rounded-2xl flex flex-col">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8 border-b border-white/5">
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner transform -rotate-3">
                                <Settings className="w-8 h-8" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">{channel ? 'Modify Connection' : 'Register New Channel'}</DialogTitle>
                                <p className="text-sm font-medium opacity-70">Configure your cryptographic access points</p>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                <div className="flex-1 overflow-y-auto p-8">

                    <div className="max-w-3xl mx-auto w-full">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                                {form.formState.errors.root && (
                                    <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-sm text-destructive font-bold animate-pulse">
                                        <AlertCircle className="w-5 h-5" />
                                        {form.formState.errors.root.message}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="provider"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Protocol Provider</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-12 glass rounded-xl border-white/5 font-bold pl-4">
                                                            <SelectValue placeholder="Select provider" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent className="glass border-white/10 rounded-xl">
                                                        {providers.map((p) => (
                                                            <SelectItem key={p.value} value={p.value} className="font-bold">
                                                                {p.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage className="text-[10px] font-bold" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Friendly Label</FormLabel>
                                                <FormControl>
                                                    <Input className="h-12 glass rounded-xl border-white/5 font-bold pl-4" placeholder="e.g. Master Facebook Hub" {...field} />
                                                </FormControl>
                                                <FormMessage className="text-[10px] font-bold" />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="space-y-6 bg-muted/5 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Key className="w-3.5 h-3.5 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Credentials & Keys</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="pageId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Target ID</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 glass rounded-xl border-white/5 font-mono font-bold text-sm" placeholder="123456789" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="pageAccessToken"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">System Token</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 glass rounded-xl border-white/5 font-mono font-bold text-sm" type="password" placeholder="EAAxxxx..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="verifyToken"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Webhook Secret</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 glass rounded-xl border-white/5 font-mono font-bold text-sm" placeholder="my_verify_token" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="appSecret"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Developer Secret</FormLabel>
                                                    <FormControl>
                                                        <Input className="h-12 glass rounded-xl border-white/5 font-mono font-bold text-sm" type="password" placeholder="abc123..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-2xl border border-white/5 p-6 bg-muted/10">
                                            <div className="space-y-1">
                                                <FormLabel className="text-sm font-black tracking-tight flex items-center gap-2">
                                                    <div className={cn("w-2 h-2 rounded-full", field.value ? "bg-success animate-pulse" : "bg-muted")} />
                                                    Connection Status
                                                </FormLabel>
                                                <FormDescription className="text-xs font-medium opacity-60">
                                                    Activate this link to begin processing real-time traffic
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="pt-10 sticky bottom-0 bg-background/80 backdrop-blur-xl pb-4 flex gap-4">
                                    <Button type="button" variant="outline" rounded="xl" className="h-12 flex-1 font-black uppercase tracking-widest text-xs glass border-white/10" onClick={() => onOpenChange(false)}>
                                        Discard
                                    </Button>
                                    <Button type="submit" rounded="xl" className="h-12 flex-[2] font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20" loading={form.formState.isSubmitting}>
                                        {channel ? 'Push Update' : 'Initialize Connection'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

