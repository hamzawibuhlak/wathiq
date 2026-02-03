import { cn } from '@/lib/utils';

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

interface InvoiceStatusBadgeProps {
    status: InvoiceStatus | string;
    className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    DRAFT: {
        label: 'مسودة',
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    SENT: {
        label: 'مُرسلة',
        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    PAID: {
        label: 'مدفوعة',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    OVERDUE: {
        label: 'متأخرة',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    CANCELLED: {
        label: 'ملغاة',
        className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    },
};

export function InvoiceStatusBadge({ status, className }: InvoiceStatusBadgeProps) {
    const config = statusConfig[status] || statusConfig.DRAFT;

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

export default InvoiceStatusBadge;
