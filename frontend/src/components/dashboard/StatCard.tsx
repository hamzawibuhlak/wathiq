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
    primary:     { icon: 'bg-primary/15 text-primary',             glow: 'shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]' },
    success:     { icon: 'bg-emerald-500/15 text-emerald-400',     glow: 'shadow-[0_0_20px_rgba(52,211,153,0.08)]' },
    warning:     { icon: 'bg-amber-500/15 text-amber-400',         glow: 'shadow-[0_0_20px_rgba(251,191,36,0.08)]' },
    destructive: { icon: 'bg-rose-500/15 text-rose-400',           glow: 'shadow-[0_0_20px_rgba(251,113,133,0.08)]' },
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
            <div className="rounded-2xl border border-white/[0.07] bg-slate-900/60 backdrop-blur-sm p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 bg-white/[0.05] rounded-xl" />
                    <div className="flex-1">
                        <div className="w-20 h-3 bg-white/[0.05] rounded mb-2" />
                        <div className="w-14 h-6 bg-white/[0.05] rounded" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            'rounded-2xl border border-white/[0.07] p-5 transition-all duration-200',
            'bg-slate-900/60 backdrop-blur-sm',
            'hover:border-white/[0.12] hover:bg-slate-900/80',
            colorClasses[color].glow
        )}>
            <div className="flex items-center gap-3">
                <div className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    colorClasses[color].icon
                )}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/40 mb-1 truncate">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">{value}</span>
                        {change !== undefined && (
                            <span className={cn(
                                'text-[11px] font-semibold px-1.5 py-0.5 rounded-md',
                                trend === 'up'      && 'bg-emerald-500/15 text-emerald-400',
                                trend === 'down'    && 'bg-rose-500/15 text-rose-400',
                                trend === 'neutral' && 'bg-white/[0.06] text-white/40'
                            )}>
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
