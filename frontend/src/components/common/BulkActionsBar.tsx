import { X, FileDown, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui';

interface BulkAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    disabled?: boolean;
}

interface BulkActionsBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onClearSelection: () => void;
    actions: BulkAction[];
    isAllSelected: boolean;
}

export function BulkActionsBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onClearSelection,
    actions,
    isAllSelected,
}: BulkActionsBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-card border shadow-lg rounded-xl px-4 py-3 flex items-center gap-4">
                {/* Selection info */}
                <div className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">
                        {selectedCount} محدد
                    </span>
                    <span className="text-muted-foreground">
                        من {totalCount}
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-border" />

                {/* Select all / Clear */}
                <div className="flex items-center gap-2">
                    {!isAllSelected && (
                        <Button variant="ghost" size="sm" onClick={onSelectAll}>
                            تحديد الكل
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onClearSelection}>
                        <X className="w-4 h-4 ml-1" />
                        إلغاء التحديد
                    </Button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-border" />

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {actions.map((action, index) => (
                        <Button
                            key={index}
                            variant={action.variant || 'outline'}
                            size="sm"
                            onClick={action.onClick}
                            disabled={action.disabled}
                        >
                            {action.icon}
                            <span className="mr-1">{action.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Export icon components for convenience
export const BulkActionIcons = {
    Export: <FileDown className="w-4 h-4" />,
    Delete: <Trash2 className="w-4 h-4" />,
};
