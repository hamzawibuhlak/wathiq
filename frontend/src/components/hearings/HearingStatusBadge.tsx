import { cn } from '@/lib/utils';

type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';

interface HearingStatusBadgeProps {
    status: HearingStatus | string;
    className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    SCHEDULED: {
        label: 'مجدولة',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    COMPLETED: {
        label: 'منتهية',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    POSTPONED: {
        label: 'مؤجلة',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    CANCELLED: {
        label: 'ملغاة',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
};

export function HearingStatusBadge({ status, className }: HearingStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.SCHEDULED;

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                config.className,
                className
            )}
        >
            {config.label}
        </span>
    );
}

export default HearingStatusBadge;
