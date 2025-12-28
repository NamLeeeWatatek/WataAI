'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ScrollArea } from '@/components/ui/ScrollArea';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Tag,
    MessageSquare,
    Clock,
    CheckCircle2,
    ExternalLink,
    Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/Badge';

interface Task {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
}

interface ProfilePanelProps {
    customerName: string;
    customerAvatar?: string;
    email?: string;
    phone?: string;
    location?: string;
    channelName: string;
    channelType: string;
    status: 'open' | 'pending' | 'closed';
    createdAt: string;
    tags?: string[];
    tasks?: Task[];
    metadata?: any;
    onViewDetails?: () => void;
    className?: string;
}

export function ProfilePanel({
    customerName,
    customerAvatar,
    email,
    phone,
    location,
    channelName,
    channelType,
    status,
    createdAt,
    tags = [],
    tasks = [],
    metadata = {},
    onViewDetails,
    className
}: ProfilePanelProps) {
    const getStatusConfig = (status: string) => {
        const config = {
            open: {
                label: 'In Progress',
                className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
            },
            pending: {
                label: 'Medium',
                className: 'bg-blue-500/10 text-blue-600 border-blue-500/30'
            },
            closed: {
                label: 'Completed',
                className: 'bg-green-500/10 text-green-600 border-green-500/30'
            },
        };
        return config[status as keyof typeof config] || config.open;
    };

    const statusConfig = getStatusConfig(status);

    return (
        <div className={cn('w-80 border-l border-border/50 bg-background flex flex-col', className)}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-border/50">
                <h2 className="text-base font-semibold text-foreground">Profile</h2>
                <p className="text-xs text-muted-foreground mt-1">Customer information</p>
            </div>

            <ScrollArea className="flex-1">
                <div className="px-6 py-6 space-y-6">
                    {/* Avatar & Name */}
                    <div className="flex flex-col items-center text-center">
                        <Avatar className="h-20 w-20 ring-4 ring-background shadow-lg mb-4">
                            <AvatarImage src={customerAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-2xl font-semibold">
                                {customerName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{customerName}</h3>
                        <p className="text-sm text-muted-foreground">{channelName}</p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 gap-2"
                            onClick={onViewDetails}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View details
                        </Button>
                    </div>

                    {/* Status Badge */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Status
                        </label>
                        <Badge
                            variant="outline"
                            className={cn('h-7 px-3 gap-2', statusConfig.className)}
                        >
                            <span className="w-2 h-2 rounded-full bg-current" />
                            <span className="text-xs font-medium">{statusConfig.label}</span>
                        </Badge>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Contact
                        </label>

                        {email && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                                    <p className="text-sm text-foreground truncate">{email}</p>
                                </div>
                            </div>
                        )}

                        {phone && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                                    <p className="text-sm text-foreground truncate">{phone}</p>
                                </div>
                            </div>
                        )}

                        {location && (
                            <div className="flex items-center gap-3 text-sm">
                                <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">Location</p>
                                    <p className="text-sm text-foreground truncate">{location}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 text-sm">
                            <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                                <p className="text-sm text-foreground">
                                    {format(new Date(createdAt), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {tags.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Tags
                                </label>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, index) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="h-6 px-2.5 gap-1.5"
                                    >
                                        <Tag className="w-3 h-3" />
                                        <span className="text-xs">{tag}</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks */}
                    {tasks.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Tasks ({tasks.filter(t => !t.completed).length})
                                </label>
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1">
                                    <span>+ Add task</span>
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className={cn(
                                            'p-3 rounded-lg border border-border/50 transition-colors',
                                            task.completed ? 'bg-muted/30' : 'bg-background hover:bg-muted/30'
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <div className={cn(
                                                'mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0',
                                                task.completed
                                                    ? 'bg-primary border-primary'
                                                    : 'border-muted-foreground/30'
                                            )}>
                                                {task.completed && (
                                                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    'text-sm font-medium',
                                                    task.completed && 'line-through text-muted-foreground'
                                                )}>
                                                    {task.title}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3 h-3 text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">
                                                        {format(new Date(task.dueDate), 'MMM dd, yyyy')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
