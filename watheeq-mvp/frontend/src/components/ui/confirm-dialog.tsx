import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { AlertTriangle, HelpCircle, Trash2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ConfirmDialogOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'warning' | 'danger';
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
}

interface ConfirmDialogContextType {
    confirm: (options: ConfirmDialogOptions) => void;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | null>(null);

export function useConfirmDialog() {
    const context = useContext(ConfirmDialogContext);
    if (!context) {
        throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
    }
    return context;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);

    const confirm = useCallback((opts: ConfirmDialogOptions) => {
        setOptions(opts);
        setIsOpen(true);
    }, []);

    const handleClose = () => {
        if (!isLoading) {
            setIsOpen(false);
            options?.onCancel?.();
        }
    };

    const handleConfirm = async () => {
        if (!options) return;

        try {
            setIsLoading(true);
            await options.onConfirm();
            setIsOpen(false);
        } catch (error) {
            console.error('Confirmation action failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const variantConfig = {
        default: {
            icon: HelpCircle,
            iconClass: 'text-primary',
            buttonVariant: 'default' as const,
        },
        warning: {
            icon: AlertTriangle,
            iconClass: 'text-yellow-500',
            buttonVariant: 'default' as const,
        },
        danger: {
            icon: Trash2,
            iconClass: 'text-destructive',
            buttonVariant: 'destructive' as const,
        },
    };

    const config = options ? variantConfig[options.variant || 'default'] : variantConfig.default;
    const Icon = config.icon;

    return (
        <ConfirmDialogContext.Provider value={{ confirm }}>
            {children}

            {/* Dialog Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={handleClose}
                >
                    {/* Dialog */}
                    <div
                        className="bg-card rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                                    options?.variant === 'danger' ? 'bg-destructive/10' :
                                        options?.variant === 'warning' ? 'bg-yellow-100' : 'bg-primary/10'
                                )}>
                                    <Icon className={cn('w-6 h-6', config.iconClass)} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold">{options?.title}</h3>
                                    <p className="text-muted-foreground mt-1">{options?.message}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 p-4 border-t bg-muted/30 rounded-b-xl">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                {options?.cancelText || 'إلغاء'}
                            </Button>
                            <Button
                                variant={config.buttonVariant}
                                onClick={handleConfirm}
                                isLoading={isLoading}
                            >
                                {options?.confirmText || 'تأكيد'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmDialogContext.Provider>
    );
}

export default ConfirmDialogProvider;
