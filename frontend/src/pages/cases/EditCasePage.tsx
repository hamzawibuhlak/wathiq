import { Link, useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ArrowRight, Scale, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { CaseForm, CaseFormData } from '@/components/cases';
import { useCase, useUpdateCase, useDeleteCase } from '@/hooks/use-cases';
import { useClients } from '@/hooks/use-clients';
import { useLawyers } from '@/hooks/use-lawyers';
import { useAuthStore } from '@/stores/auth.store';

export function EditCasePage() {
    const { id } = useParams<{ id: string }>();
    const { p, nav } = useSlugPath();
    const canDelete = useAuthStore((state) => state.isAdminOrOwner());

    const { data: caseData, isLoading: caseLoading } = useCase(id!);
    const updateMutation = useUpdateCase(id!);
    const deleteMutation = useDeleteCase();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
    const { data: lawyersData, isLoading: lawyersLoading } = useLawyers();

    const clients = clientsData?.data?.map((c) => ({ id: c.id, name: c.name })) || [];
    const lawyers = lawyersData?.data?.map((l) => ({ id: l.id, name: l.name })) || [];

    const handleSubmit = (data: CaseFormData) => {
        updateMutation.mutate(data, {
            onSuccess: () => {
                nav(`/cases/${id}`);
            },
        });
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذه القضية؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            deleteMutation.mutate(id!);
        }
    };

    const isLoading = caseLoading || clientsLoading || lawyersLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to={p(`/cases/${id}`)}>
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للتفاصيل
                    </Button>
                </Link>
                {canDelete && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        isLoading={deleteMutation.isPending}
                    >
                        <Trash2 className="w-4 h-4 ml-2" />
                        حذف القضية
                    </Button>
                )}
            </div>

            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" />
                            تعديل القضية
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
                        ) : caseData?.data ? (
                            <CaseForm
                                initialData={caseData.data}
                                onSubmit={handleSubmit}
                                isLoading={updateMutation.isPending}
                                clients={clients}
                                lawyers={lawyers}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                القضية غير موجودة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default EditCasePage;
