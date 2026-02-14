import { Link } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ClientForm, ClientFormData } from '@/components/clients';
import { useCreateClient } from '@/hooks/use-clients';
import { useLawyers } from '@/hooks/useUsers';

export function CreateClientPage() {
    const createMutation = useCreateClient();
    const { data: lawyersData } = useLawyers();

    const lawyers = lawyersData?.data?.map((l: { id: string; name: string }) => ({
        id: l.id,
        name: l.name,
    })) || [];

    const handleSubmit = (data: ClientFormData) => {
        createMutation.mutate({
            name: data.name,
            email: data.email || undefined,
            phone: data.phone || undefined,
            nationalId: data.clientType === 'individual' ? data.nationalId : undefined,
            companyName: data.clientType === 'company' ? data.companyName : undefined,
            commercialReg: data.clientType === 'company' ? data.commercialReg : undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            notes: data.notes || undefined,
            visibleToUserIds: data.visibleToUserIds || [],
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="..">
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للعملاء
                    </Button>
                </Link>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            إضافة عميل جديد
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ClientForm
                            onSubmit={handleSubmit}
                            isLoading={createMutation.isPending}
                            lawyers={lawyers}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateClientPage;

