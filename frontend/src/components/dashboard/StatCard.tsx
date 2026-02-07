import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    icon: LucideIcon;
    title: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'primary' | 'success' | 'warning' | 'destructive';
    isLoading?: boolean;
}

const colorClasses = {
    primary: {
        icon: 'bg-primary/10 text-primary',
        gradient: 'from-primary/5 to-transparent',
    },
    success: {
        icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        gradient: 'from-emerald-500/5 to-transparent',
    },
    warning: {
        icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        gradient: 'from-amber-500/5 to-transparent',
    },
    destructive: {
        icon: 'bg-red-500/10 text-red-600 dark:text-red-400',
        gradient: 'from-red-500/5 to-transparent',
    },
};

export function StatCard({
    icon: Icon,
    title,
    value,
    change,
    trend = 'neutral',
    color = 'primary',
    isLoading = false,
}: StatCardProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl border p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-xl" />
                    <div className="flex-1">
                        <div className="w-16 h-3 bg-muted rounded mb-2" />
                        <div className="w-12 h-6 bg-muted rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            'bg-card rounded-2xl border p-5 hover:shadow-md transition-all duration-200',
            'bg-gradient-to-br',
            colorClasses[color].gradient
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    colorClasses[color].icon
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5 truncate">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold">{value}</span>
                        {change !== undefined && (
                            <span
                                className={cn(
                                    'text-xs font-medium px-1.5 py-0.5 rounded-md',
                                    trend === 'up' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
                                    trend === 'down' && 'bg-red-100 text-red-600 dark:bg-red-900/30',
                                    trend === 'neutral' && 'bg-muted text-muted-foreground'
                                )}
                            >
                                {trend === 'up' && '+'}
                                {change}%
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StatCard;
