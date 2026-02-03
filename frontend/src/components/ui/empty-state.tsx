import { cn } from '@/lib/utils';
import { FileText, Users, Scale, Receipt, Search, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from './button';

type EmptyStateType = 'cases' | 'clients' | 'hearings' | 'documents' | 'invoices' | 'search' | 'error' | 'generic';

interface EmptyStateProps {
    type?: EmptyStateType;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

const typeConfigs: Record<EmptyStateType, { icon: typeof Scale; title: string; description: string }> = {
    cases: {
        icon: Scale,
        title: 'لا توجد قضايا',
        description: 'لم يتم العثور على قضايا. أنشئ قضية جديدة للبدء.',
    },
    clients: {
        icon: Users,
        title: 'لا يوجد عملاء',
        description: 'لم يتم العثور على عملاء. أضف عميل جديد للبدء.',
    },
    hearings: {
        icon: Calendar,
        title: 'لا توجد جلسات',
        description: 'لم يتم العثور على جلسات. أنشئ جلسة جديدة للبدء.',
    },
    documents: {
        icon: FileText,
        title: 'لا توجد مستندات',
        description: 'لم يتم العثور على مستندات. ارفع مستند جديد للبدء.',
    },
    invoices: {
        icon: Receipt,
        title: 'لا توجد فواتير',
        description: 'لم يتم العثور على فواتير. أنشئ فاتورة جديدة للبدء.',
    },
    search: {
        icon: Search,
        title: 'لا توجد نتائج',
        description: 'لم يتم العثور على نتائج مطابقة. جرب تعديل معايير البحث.',
    },
    error: {
        icon: AlertTriangle,
        title: 'حدث خطأ',
        description: 'حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.',
    },
    generic: {
        icon: FileText,
        title: 'لا توجد بيانات',
        description: 'لا توجد بيانات للعرض.',
    },
};

export function EmptyState({
    type = 'generic',
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    const config = typeConfigs[type];
    const Icon = config.icon;

    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
            <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center mb-6',
                type === 'error' ? 'bg-destructive/10' : 'bg-muted'
            )}>
                <Icon className={cn(
                    'w-10 h-10',
                    type === 'error' ? 'text-destructive' : 'text-muted-foreground/50'
                )} />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title || config.title}</h3>
            <p className="text-muted-foreground max-w-sm mb-6">
                {description || config.description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}

export default EmptyState;
