'use client'

import { Facebook, Instagram, Share2, Globe, Check, Monitor, ArrowRight } from 'lucide-react'
import { Button } from '../Button'
import { cn } from '@/lib/utils'
import { useDynamicOptions, DynamicOption } from '@/lib/hooks/useDynamicOptions'
import { DynamicFormFieldProps } from './types'

interface OptionItem {
    label: string
    value: string | number
    icon?: string
    [key: string]: unknown
}

export function FieldChannelSelector({ field, value, onChange }: DynamicFormFieldProps) {
    const { options: dynamicOptions, isLoading } = useDynamicOptions(field as any);

    const activeChannels = dynamicOptions.filter((c) =>
        c.status === 'active' || c.status === 'connected' || c.isPage === true
    );
    const selectedValues: string[] = Array.isArray(value) ? value : (value ? [value] : []);

    const getPlatformIcon = (type: string | undefined) => {
        switch (type?.toLowerCase()) {
            case 'facebook': return <Facebook className="w-4 h-4 text-blue-600" />;
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-600" />;
            case 'telegram': return <Share2 className="w-4 h-4 text-sky-500" />;
            default: return <Globe className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const selectorPlaceholder = "Select platforms"

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2.5">
                {isLoading ? (
                    <>
                        {[1, 2].map((i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-md border bg-card/50">
                                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                                <div className="flex flex-col gap-1.5 flex-1">
                                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                    <div className="h-3 w-16 bg-muted/50 animate-pulse rounded" />
                                </div>
                            </div>
                        ))}
                    </>
                ) : activeChannels.length > 0 ? (
                    activeChannels.map((channel) => {
                        const channelId = String(channel.id);
                        const isSelected = selectedValues.includes(channelId);
                        return (
                            <button
                                type="button"
                                key={channelId}
                                onClick={() => {
                                    const newValue = isSelected
                                        ? selectedValues.filter(v => v !== channelId)
                                        : [...selectedValues, channelId];
                                    onChange(field.name, newValue);
                                }}
                                aria-pressed={isSelected}
                                className={cn(
                                    "group flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-300 w-full text-left relative overflow-hidden",
                                    isSelected
                                        ? "bg-primary/[0.03] border-primary/40 shadow-sm"
                                        : "bg-background/40 hover:bg-background/80 border-border/30 hover:border-border/60"
                                )}
                            >
                                <div className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                                    isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-muted/50 group-hover:bg-muted"
                                )}>
                                    {isSelected ? (
                                        <Check className="w-4 h-4" />
                                    ) : (
                                        getPlatformIcon(channel.type as string)
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-bold truncate tracking-tight">
                                        {String(channel.name || channel.type || '')}
                                    </span>
                                    {channel.isPage ? (
                                        <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight">
                                            Page • {String(channel.originalName || '')}
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-medium text-muted-foreground/60 leading-tight capitalize">
                                            {String(channel.type || '')}
                                        </span>
                                    )}
                                </div>
                                {isSelected && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full" />
                                )}
                            </button>
                        )
                    })
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center p-6 border border-dashed rounded-md bg-muted/10 text-center gap-2">
                        <Monitor className="w-8 h-8 text-muted-foreground/50" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium">No channels connected</p>
                            <p className="text-xs text-muted-foreground">Integrate your accounts to start creating</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 h-8"
                            onClick={() => window.open('/channels', '_blank')}
                        >
                            Explore integrations <ArrowRight className="w-3 h-3 ml-2" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
