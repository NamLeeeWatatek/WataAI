'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Media } from '@/components/shared/Media';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Workflow {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    category: string;
    author: {
        name: string;
        avatarUrl?: string;
    };
    createdAt: string;
    readTime?: string;
    tags?: string[];
}

interface WorkflowCardProps {
    workflow: Workflow;
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
    return (
        <Link href={`/workflows/${workflow.id}`} className="group block h-full">
            <Card className="h-full overflow-hidden border-0 bg-transparent shadow-none hover:shadow-none">
                {/* Image Container with Odyssey-style overflow/hover effects */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/50 bg-muted/30">
                    <Media
                        src={workflow.thumbnailUrl}
                        alt={workflow.title}
                        fill
                        className="object-cover w-full h-full"
                        objectFit="cover"
                    />

                    {/* Overlay Gradient (Subtle) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100" />

                    {/* Floating Category Badge */}
                    <div className="absolute top-4 left-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                            <span className="text-xs font-semibold tracking-wide text-white/90 drop-shadow-sm uppercase">
                                {workflow.category}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-5 space-y-3">
                    <h3 className="text-xl font-bold tracking-tight text-foreground line-clamp-2">
                        {workflow.title}
                    </h3>

                    {/* Meta Info */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                        <div className="flex items-center gap-1.5">
                            {/* <Calendar className="w-3.5 h-3.5" /> */}
                            <span>{new Date(workflow.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {workflow.readTime && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                <div className="flex items-center gap-1.5">
                                    {/* <Clock className="w-3.5 h-3.5" /> */}
                                    <span>{workflow.readTime}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    );
}
