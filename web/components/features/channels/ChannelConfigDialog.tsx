import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog'
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
import { Settings, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

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
    const [origin, setOrigin] = useState('')
    const [copied, setCopied] = useState(false)
    const [showAppSecret, setShowAppSecret] = useState(false)
    const [showAccessToken, setShowAccessToken] = useState(false)

    // Construct simplified callback URL (assuming standard API structure)
    // In a real app, this might come from configuration
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
    // Remove trailing slash if present
    const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    // Ensure the callback URL points to the v1 endpoint where the raw body parser is active
    const callbackUrl = cleanApiUrl.includes('/v1')
        ? `${cleanApiUrl}/webhooks/facebook`
        : `${cleanApiUrl}/v1/webhooks/facebook`;

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
        setOrigin(window.location.origin)
    }, [])

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

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

    // Redirect URL for OAuth - must include provider for matching in backend
    const redirectUrl = `${origin}/channels/callback?provider=${form.watch('provider') || 'facebook'}`

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-3xl border-none shadow-3xl">
                <DialogHeader>
                    <DialogTitle>{channel ? 'Edit Channel' : 'New Channel'}</DialogTitle>
                    <DialogDescription>
                        Configure your messaging channel connection settings.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="provider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Provider</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select provider" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {providers.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="My Facebook Page" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Facebook Specific Config Section */}
                        {form.watch('provider') === 'facebook' && (
                            <div className="space-y-4 rounded-xl border border-border/40 p-5 bg-muted/10">
                                <div className="flex items-center gap-2 mb-2 font-semibold text-sm">
                                    <Settings className="w-4 h-4" />
                                    Facebook Configuration
                                </div>

                                {/* URLs Section - 2 Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">OAuth Redirect URI</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={redirectUrl} className="bg-muted font-mono text-xs truncate h-9" />
                                            <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(redirectUrl)} className="shrink-0">
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Paste into Facebook Login settings.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel className="text-xs font-semibold uppercase text-muted-foreground">Webhook Callback URL</FormLabel>
                                        <div className="flex items-center gap-2">
                                            <Input readOnly value={callbackUrl} className="bg-muted font-mono text-xs truncate h-9" />
                                            <Button type="button" size="icon" variant="outline" onClick={() => copyToClipboard(callbackUrl)} className="shrink-0">
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground">Paste into Webhooks product settings.</p>
                                    </div>
                                </div>

                                {/* Credentials Grid - 2 Columns */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <FormField
                                        control={form.control}
                                        name="pageId"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Page ID</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="1234567890"  {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="verifyToken"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Verify Token</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="my_secure_token"  {...field} />
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
                                                <FormLabel>App Secret</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showAppSecret ? "text" : "password"} placeholder="App Secret" {...field} />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowAppSecret(!showAppSecret)}
                                                        >
                                                            {showAppSecret ? (
                                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </Button>
                                                    </div>
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
                                                <FormLabel>Page Access Token</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input type={showAccessToken ? "text" : "password"} placeholder="EAA..." {...field} />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowAccessToken(!showAccessToken)}
                                                        >
                                                            {showAccessToken ? (
                                                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border/40 p-4 bg-muted/5">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Active Status</FormLabel>
                                        <FormDescription>
                                            Enable or disable this channel connection.
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

                        <DialogFooter className="gap-2 pt-4 border-t border-border/10">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="font-bold">
                                Cancel
                            </Button>
                            <Button type="submit" className="font-bold px-8" loading={form.formState.isSubmitting}>
                                {channel ? 'Save Changes' : 'Create Channel'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
