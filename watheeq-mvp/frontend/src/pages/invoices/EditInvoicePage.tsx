import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Receipt, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { InvoiceForm, InvoiceFormData } from '@/components/invoices';
import { useInvoice, useUpdateInvoice, useDeleteInvoice } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useCases } from '@/hooks/use-cases';

export function EditInvoicePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: invoiceData, isLoading: invoiceLoading } = useInvoice(id!);
    const updateMutation = useUpdateInvoice(id!);
    const deleteMutation = useDeleteInvoice();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
    const { data: casesData, isLoading: casesLoading } = useCases({ limit: 100 });

    const invoice = invoiceData?.data;

    const clients = clientsData?.data?.map((c) => ({
        id: c.id,
        name: c.name,
    })) || [];

    const cases = casesData?.data?.map((c) => ({
        id: c.id,
        title: c.title,
        caseNumber: c.caseNumber,
    })) || [];

    const handleSubmit = (data: InvoiceFormData) => {
        const amount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        updateMutation.mutate(
            {
                clientId: data.clientId,
                caseId: data.caseId || undefined,
                description: data.description,
                status: data.status, // Include status in update
                dueDate: data.dueDate || undefined,
                amount,
                taxRate: data.taxRate,
                items: data.items,
            },
            {
                onSuccess: () => {
                    navigate(`/invoices/${id}`);
                },
            }
        );
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
            deleteMutation.mutate(id!);
        }
    };

    const isLoading = invoiceLoading || clientsLoading || casesLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to={`/invoices/${id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للتفاصيل
                    </Button>
                </Link>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleteMutation.isPending}
                >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الفاتورة
                </Button>
            </div>

            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            تعديل الفاتورة
                            {invoice && <span className="text-muted-foreground">({invoice.invoiceNumber})</span>}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="w-24 h-4 bg-muted rounded" />
                                        <div className="w-full h-10 bg-muted rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : invoice ? (
                            <InvoiceForm
                                initialData={invoice}
                                onSubmit={handleSubmit}
                                isLoading={updateMutation.isPending}
                                clients={clients}
                                cases={cases}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                الفاتورة غير موجودة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default EditInvoicePage;
