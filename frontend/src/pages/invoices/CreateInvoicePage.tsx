import { Link } from 'react-router-dom';
import { ArrowRight, Receipt } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { InvoiceForm, InvoiceFormData } from '@/components/invoices';
import { useCreateInvoice } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useCases } from '@/hooks/use-cases';

export function CreateInvoicePage() {
    const createMutation = useCreateInvoice();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
    const { data: casesData, isLoading: casesLoading } = useCases({ limit: 100 });

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
        // Calculate totals
        const amount = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

        createMutation.mutate({
            clientId: data.clientId,
            caseId: data.caseId || undefined,
            description: data.description,
            dueDate: data.dueDate || undefined,
            amount,
            taxRate: data.taxRate,
            items: data.items,
        });
    };

    const isLoading = clientsLoading || casesLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/invoices">
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للفواتير
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-primary" />
                            إنشاء فاتورة جديدة
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
                        ) : (
                            <InvoiceForm
                                onSubmit={handleSubmit}
                                isLoading={createMutation.isPending}
                                clients={clients}
                                cases={cases}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateInvoicePage;
