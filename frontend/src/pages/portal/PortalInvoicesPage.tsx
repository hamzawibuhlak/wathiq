import { useEffect, useState } from 'react';
import { portalApiClient, PortalInvoice } from '@/api/portal.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'معلقة', className: 'bg-yellow-100 text-yellow-700' },
    SENT: { label: 'مرسلة', className: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'مدفوعة', className: 'bg-green-100 text-green-700' },
    PARTIAL: { label: 'مدفوعة جزئياً', className: 'bg-orange-100 text-orange-700' },
    OVERDUE: { label: 'متأخرة', className: 'bg-red-100 text-red-700' },
    CANCELLED: { label: 'ملغاة', className: 'bg-gray-100 text-gray-600' },
};

export default function PortalInvoicesPage() {
    const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const data = await portalApiClient.getInvoices();
                setInvoices(data);
            } catch (error) {
                console.error('Failed to fetch invoices:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    // Calculate totals
    const totalPending = invoices
        .filter((inv) => ['PENDING', 'SENT', 'OVERDUE', 'PARTIAL'].includes(inv.status))
        .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    فواتيري
                </h1>
                <p className="text-muted-foreground">عرض جميع الفواتير الخاصة بك</p>
            </div>

            {/* Summary Card */}
            <Card className="bg-gradient-to-l from-red-50 to-white border-red-200">
                <CardHeader>
                    <CardDescription>إجمالي المبالغ المستحقة</CardDescription>
                    <CardTitle className="text-3xl text-red-600">
                        {formatCurrency(totalPending)}
                    </CardTitle>
                </CardHeader>
            </Card>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لا توجد فواتير</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {invoices.map((invoice) => {
                        const status = statusConfig[invoice.status] || statusConfig.PENDING;
                        const remaining = invoice.totalAmount - invoice.paidAmount;
                        const isOverdue = invoice.status === 'OVERDUE';

                        return (
                            <Card
                                key={invoice.id}
                                className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <DollarSign className="w-5 h-5 text-muted-foreground" />
                                                {invoice.invoiceNumber}
                                            </CardTitle>
                                            {invoice.case && (
                                                <CardDescription className="mt-1">
                                                    {invoice.case.title} ({invoice.case.caseNumber})
                                                </CardDescription>
                                            )}
                                        </div>
                                        <Badge className={status.className}>{status.label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">المبلغ الإجمالي</p>
                                            <p className="font-semibold">{formatCurrency(invoice.totalAmount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">المدفوع</p>
                                            <p className="font-semibold text-green-600">
                                                {formatCurrency(invoice.paidAmount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">المتبقي</p>
                                            <p className={`font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {formatCurrency(remaining)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                تاريخ الاستحقاق
                                            </p>
                                            <p className={`font-semibold ${isOverdue ? 'text-red-600' : ''}`}>
                                                {format(new Date(invoice.dueDate), 'dd/MM/yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
