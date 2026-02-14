import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ArrowRight, Pencil, Printer, CheckCircle, AlertTriangle, Mail, MessageSquare, Loader2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { InvoiceTemplate, InvoiceStatusBadge } from '@/components/invoices';
import { useInvoice, useMarkInvoiceAsPaid } from '@/hooks/use-invoices';
import { useFirmSettings } from '@/hooks/use-settings';
import { useReactToPrint } from 'react-to-print';
import { invoicesApi } from '@/api/invoices.api';
import toast from 'react-hot-toast';

export function InvoiceDetailsPage() {
    const { p } = useSlugPath();
    const { id } = useParams<{ id: string }>();
    const printRef = useRef<HTMLDivElement>(null);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [isSendingSms, setIsSendingSms] = useState(false);

    const { data: invoiceData, isLoading, error } = useInvoice(id!);
    const markPaidMutation = useMarkInvoiceAsPaid();
    const { data: firmData } = useFirmSettings();

    const invoice = invoiceData?.data;
    const firm = firmData?.data;

    // Prepare company info for invoice template
    const company = firm ? {
        name: firm.name,
        logo: firm.logo || undefined,
        taxNumber: firm.taxNumber || undefined,
        commercialReg: firm.commercialReg || undefined,
        address: firm.address || undefined,
        city: firm.city || undefined,
        phone: firm.phone || undefined,
        email: firm.email || undefined
    } : undefined;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoice?.invoiceNumber || 'فاتورة'
    });

    const handleMarkPaid = () => {
        if (invoice) {
            markPaidMutation.mutate(invoice.id);
        }
    };

    const handleSendEmail = async () => {
        if (!invoice?.client?.email) {
            toast.error('العميل لا يملك بريد إلكتروني');
            return;
        }
        setIsSendingEmail(true);
        try {
            await invoicesApi.sendEmail(invoice.id);
            toast.success(`تم إرسال الفاتورة إلى ${invoice.client.email}`);
        } catch (error) {
            toast.error('فشل إرسال البريد الإلكتروني');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleSendSms = async () => {
        if (!invoice?.client?.phone) {
            toast.error('العميل لا يملك رقم هاتف');
            return;
        }
        setIsSendingSms(true);
        try {
            await invoicesApi.sendSms(invoice.id);
            toast.success(`تم إرسال الرسالة إلى ${invoice.client.phone}`);
        } catch (error) {
            toast.error('فشل إرسال الرسالة النصية');
        } finally {
            setIsSendingSms(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-32 h-8 bg-muted rounded" />
                </div>
                <div className="bg-card rounded-xl border p-8">
                    <div className="h-[600px] bg-muted rounded" />
                </div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="space-y-6">
                <Link to={p('/invoices')}>
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للفواتير
                    </Button>
                </Link>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">الفاتورة غير موجودة</h3>
                    <p className="text-muted-foreground">لم يتم العثور على الفاتورة المطلوبة</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to={p('/invoices')}>
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4 ml-2" />
                            الفواتير
                        </Button>
                    </Link>
                    <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {invoice.status !== 'PAID' && (
                        <Button
                            variant="outline"
                            onClick={handleMarkPaid}
                            isLoading={markPaidMutation.isPending}
                        >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تحديد كمدفوعة
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleSendEmail}
                        disabled={isSendingEmail || !invoice.client?.email}
                    >
                        {isSendingEmail ? (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : (
                            <Mail className="w-4 h-4 ml-2" />
                        )}
                        إرسال بالإيميل
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSendSms}
                        disabled={isSendingSms || !invoice.client?.phone}
                    >
                        {isSendingSms ? (
                            <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        ) : (
                            <MessageSquare className="w-4 h-4 ml-2" />
                        )}
                        إرسال SMS
                    </Button>
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 ml-2" />
                        طباعة
                    </Button>
                    <Link to={p(`/invoices/${id}/edit`)}>
                        <Button variant="outline">
                            <Pencil className="w-4 h-4 ml-2" />
                            تعديل
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Invoice Preview */}
            <Card className="print-card">
                <CardContent className="p-6">
                    <InvoiceTemplate ref={printRef} invoice={invoice} company={company} />
                </CardContent>
            </Card>

            {/* Print Styles - Global styles for react-to-print */}
            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}

export default InvoiceDetailsPage;
