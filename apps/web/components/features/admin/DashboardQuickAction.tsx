import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

interface DashboardQuickActionProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
    color?: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'indigo';
}

export function DashboardQuickAction({
    title,
    description,
    icon: Icon,
    onClick,
    color = 'blue'
}: DashboardQuickActionProps) {
    const colorStyles = {
        blue: 'text-blue-500 group-hover:bg-blue-500',
        purple: 'text-purple-500 group-hover:bg-purple-500',
        amber: 'text-amber-500 group-hover:bg-amber-500',
        emerald: 'text-emerald-500 group-hover:bg-emerald-500',
        rose: 'text-rose-500 group-hover:bg-rose-500',
        indigo: 'text-indigo-500 group-hover:bg-indigo-500',
    };

    return (
        <Card
            onClick={onClick}
            className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card hover:bg-accent hover:border-primary/20 transition-all cursor-pointer group"
        >
            <div className={cn(
                "h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-hover:text-white",
                colorStyles[color] || 'text-primary group-hover:bg-primary'
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
                <div className="text-sm font-bold truncate">{title}</div>
                <div className="text-[10px] text-muted-foreground truncate uppercase font-semibold opacity-70"> Manage </div>
            </div>
        </Card>
    );
}
