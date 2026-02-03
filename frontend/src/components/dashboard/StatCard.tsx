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
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
    destructive: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
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
            <div className="bg-card rounded-xl border p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-muted rounded-lg" />
                    <div className="w-16 h-4 bg-muted rounded" />
                </div>
                <div className="w-24 h-8 bg-muted rounded mb-2" />
                <div className="w-20 h-4 bg-muted rounded" />
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {change !== undefined && (
                    <span
                        className={cn(
                            'text-sm font-medium px-2 py-1 rounded-full',
                            trend === 'up' && 'bg-green-100 text-green-600',
                            trend === 'down' && 'bg-red-100 text-red-600',
                            trend === 'neutral' && 'bg-gray-100 text-gray-600'
                        )}
                    >
                        {trend === 'up' && '+'}
                        {change}%
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold mb-1">{value}</div>
            <div className="text-sm text-muted-foreground">{title}</div>
        </div>
    );
}

export default StatCard;
