import { cn } from '@/lib/utils';

type CaseStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED' | 'PENDING' | 'ARCHIVED';

interface CaseStatusBadgeProps {
    status: CaseStatus | string;
    className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    OPEN: {
        label: 'مفتوحة',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    IN_PROGRESS: {
        label: 'قيد المعالجة',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    CLOSED: {
        label: 'مغلقة',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    PENDING: {
        label: 'معلقة',
        className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    ARCHIVED: {
        label: 'مؤرشفة',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    },
};

export function CaseStatusBadge({ status, className }: CaseStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.OPEN;

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

export default CaseStatusBadge;
