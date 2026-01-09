'use client'

import { Facebook, Instagram, Share2, Globe, ChevronDown, Check, Monitor, ArrowRight } from 'lucide-react'
import { Button } from '../Button'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from '../DropdownMenu'
import { Badge } from '../Badge'
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
    const { options: dynamicOptions } = useDynamicOptions(field as any);

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
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-between bg-card/50 rounded-md"
                    >
                        <div className="flex flex-wrap gap-1">
                            {selectedValues.length > 0 ? (
                                selectedValues.map((val) => {
                                    const platformOpt = activeChannels.find((o) => o.id === val);
                                    // Fallback to finding by original ID if not found (backward compatibility)
                                    const label = platformOpt
                                        ? platformOpt.name
                                        : ((field.options as OptionItem[])?.find((o) => o.value === val)?.label || val);

                                    return (
                                        <Badge
                                            key={val}
                                            variant="secondary"
                                            className="bg-primary/10 text-primary border-primary/20"
                                        >
                                            {String(label || val)}
                                        </Badge>
                                    )
                                })
                            ) : (
                                <span className="text-muted-foreground">{selectorPlaceholder}</span>
                            )}
                        </div>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto">
                    {activeChannels.map((channel) => {
                        const isSelected = selectedValues.includes(String(channel.id))
                        return (
                            <DropdownMenuCheckboxItem
                                key={String(channel.id)}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                    const channelId = String(channel.id);
                                    const newValue = checked
                                        ? [...selectedValues, channelId]
                                        : selectedValues.filter(v => v !== channelId)
                                    onChange(field.name, newValue)
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    {getPlatformIcon(channel.type as string)}
                                    <span className="flex flex-col">
                                        <span>{String(channel.name || channel.type || '')}</span>
                                        {channel.isPage && (
                                            <span className="text-xs text-muted-foreground">via {String(channel.originalName || '')}</span>
                                        )}
                                    </span>
                                </div>
                            </DropdownMenuCheckboxItem>
                        )
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeChannels.length > 0 ? (
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
                                    "group flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors w-full text-left",
                                    isSelected
                                        ? "bg-accent border-primary/50"
                                        : "bg-card hover:bg-accent/50 border-input"
                                )}
                            >
                                <div className="w-8 h-8 flex items-center justify-center">
                                    {isSelected ? (
                                        <Check className="w-4 h-4 text-primary" />
                                    ) : (
                                        getPlatformIcon(channel.type as string)
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium truncate">
                                        {String(channel.name || channel.type || '')}
                                    </span>
                                    {channel.isPage ? (
                                        <span className="text-xs text-muted-foreground">
                                            Page • {String(channel.originalName || '')}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {String(channel.type || '')}
                                        </span>
                                    )}
                                </div>
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
