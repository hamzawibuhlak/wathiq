import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ClientForm, ClientFormData } from '@/components/clients';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/use-clients';
import { useLawyers } from '@/hooks/useUsers';

export function EditClientPage() {
    const { id, slug } = useParams<{ id: string; slug: string }>();
    const navigate = useNavigate();

    const { data: clientData, isLoading } = useClient(id!);
    const updateMutation = useUpdateClient(id!);
    const deleteMutation = useDeleteClient();
    const { data: lawyersData } = useLawyers();

    const lawyers = lawyersData?.data?.map((l: { id: string; name: string }) => ({
        id: l.id,
        name: l.name,
    })) || [];

    const handleSubmit = (data: ClientFormData) => {
        updateMutation.mutate(
            {
                name: data.name,
                email: data.email || undefined,
                phone: data.phone || undefined,
                notes: data.notes || undefined,
                visibleToUserIds: data.visibleToUserIds || [],

                // Individual fields
                nationalId: data.clientType === 'individual' ? (data.nationalId || undefined) : undefined,
                nationalIdDoc: data.clientType === 'individual' ? (data.nationalIdDoc || undefined) : undefined,

                // Company fields
                companyName: data.clientType === 'company' ? (data.companyName || undefined) : undefined,
                brandName: data.clientType === 'company' ? (data.brandName || undefined) : undefined,
                unifiedNumber: data.clientType === 'company' ? (data.unifiedNumber || undefined) : undefined,
                commercialReg: data.clientType === 'company' ? (data.commercialReg || undefined) : undefined,
                commercialRegDoc: data.clientType === 'company' ? (data.commercialRegDoc || undefined) : undefined,
                nationalAddressDoc: data.clientType === 'company' ? (data.nationalAddressDoc || undefined) : undefined,
                address: data.address || undefined,
                city: data.city || undefined,

                // Company representative fields
                repName: data.clientType === 'company' ? (data.repName || undefined) : undefined,
                repPhone: data.clientType === 'company' ? (data.repPhone || undefined) : undefined,
                repEmail: data.clientType === 'company' ? (data.repEmail || undefined) : undefined,
                repIdentity: data.clientType === 'company' ? (data.repIdentity || undefined) : undefined,
                repIdentityDoc: data.clientType === 'company' ? (data.repIdentityDoc || undefined) : undefined,
                repDocType: data.clientType === 'company' ? (data.repDocType || undefined) : undefined,
                repDoc: data.clientType === 'company' ? (data.repDoc || undefined) : undefined,
            },
            {
                onSuccess: () => {
                    navigate(`/${slug}/clients/${id}`);
                },
            }
        );
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            deleteMutation.mutate(id!);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to={`/${slug}/clients/${id}`}>
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
                    حذف العميل
                </Button>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            تعديل بيانات العميل
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
                        ) : clientData?.data ? (
                            <ClientForm
                                initialData={clientData.data}
                                onSubmit={handleSubmit}
                                isLoading={updateMutation.isPending}
                                lawyers={lawyers}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                العميل غير موجود
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default EditClientPage;

