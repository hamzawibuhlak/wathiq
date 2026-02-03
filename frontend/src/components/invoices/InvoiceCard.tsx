import { Link } from 'react-router-dom';
import { Receipt, MoreVertical, Eye, Pencil, Trash2, CheckCircle } from 'lucide-react';
import type { Invoice } from '@/types';
import { formatDate } from '@/lib/utils';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';
import { useState, useRef, useEffect } from 'react';

interface InvoiceCardProps {
    invoice: Invoice;
    onMarkPaid?: (id: string) => void;
    onDelete?: (id: string) => void;
}

export function InvoiceCard({ invoice, onMarkPaid, onDelete }: InvoiceCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
        }).format(amount);
    };

    const isOverdue = invoice.status !== 'PAID' && invoice.dueDate && new Date(invoice.dueDate) < new Date();

    return (
        <div className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <Link
                            to={`/invoices/${invoice.id}`}
                            className="font-semibold hover:text-primary transition-colors"
                        >
                            {invoice.invoiceNumber}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            {invoice.client?.name}
                        </p>
                    </div>
                </div>

                {/* Actions Menu */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-muted rounded transition-colors"
                    >
                        <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-44 bg-card rounded-lg shadow-lg border py-1 z-10">
                            <Link
                                to={`/invoices/${invoice.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Eye className="w-4 h-4" />
                                عرض
                            </Link>
                            <Link
                                to={`/invoices/${invoice.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
                            >
                                <Pencil className="w-4 h-4" />
                                تعديل
                            </Link>
                            {invoice.status !== 'PAID' && (
                                <button
                                    onClick={() => { onMarkPaid?.(invoice.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    تم الدفع
                                </button>
                            )}
                            <button
                                onClick={() => { onDelete?.(invoice.id); setShowMenu(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
                <p className="text-2xl font-bold text-primary">
                    {formatCurrency(invoice.totalAmount)}
                </p>
                {invoice.taxAmount > 0 && (
                    <p className="text-xs text-muted-foreground">
                        شامل الضريبة: {formatCurrency(invoice.taxAmount)}
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t">
                <InvoiceStatusBadge status={isOverdue && invoice.status !== 'PAID' ? 'OVERDUE' : invoice.status} />
                <div className="text-xs text-muted-foreground">
                    {invoice.dueDate ? (
                        <span className={isOverdue ? 'text-destructive' : ''}>
                            الاستحقاق: {formatDate(invoice.dueDate)}
                        </span>
                    ) : (
                        <span>{formatDate(invoice.createdAt)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InvoiceCard;
