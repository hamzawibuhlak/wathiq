import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowRight, Pencil, Printer, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { InvoiceTemplate, InvoiceStatusBadge } from '@/components/invoices';
import { useInvoice, useMarkInvoiceAsPaid } from '@/hooks/use-invoices';
import { useFirmSettings } from '@/hooks/use-settings';
import { useReactToPrint } from 'react-to-print';

export function InvoiceDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const printRef = useRef<HTMLDivElement>(null);

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
        email: firm.email || undefined,
    } : undefined;

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: invoice?.invoiceNumber || 'فاتورة',
    });

    const handleMarkPaid = () => {
        if (invoice) {
            markPaidMutation.mutate(invoice.id);
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
                <Link to="/invoices">
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
                    <Link to="/invoices">
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4 ml-2" />
                            الفواتير
                        </Button>
                    </Link>
                    <InvoiceStatusBadge status={invoice.status} />
                </div>
                <div className="flex items-center gap-2">
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
                    <Button variant="outline" onClick={() => handlePrint()}>
                        <Printer className="w-4 h-4 ml-2" />
                        طباعة
                    </Button>
                    <Link to={`/invoices/${id}/edit`}>
                        <Button variant="outline">
                            <Pencil className="w-4 h-4 ml-2" />
                            تعديل
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Invoice Preview */}
            <Card>
                <CardContent className="p-6">
                    <div id="print-area">
                        <InvoiceTemplate ref={printRef} invoice={invoice} company={company} />
                    </div>
                </CardContent>
            </Card>

            {/* Print Styles */}
            <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            direction: rtl;
            background: white;
            padding: 20px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
        </div>
    );
}

export default InvoiceDetailsPage;
