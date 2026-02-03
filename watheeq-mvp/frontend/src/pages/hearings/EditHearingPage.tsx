import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Trash2 } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { HearingForm, HearingFormData } from '@/components/hearings';
import { useHearing, useUpdateHearing, useDeleteHearing } from '@/hooks/use-hearings';
import { useCases } from '@/hooks/use-cases';
import { useLawyers } from '@/hooks/use-lawyers';
import { useClients } from '@/hooks/use-clients';

export function EditHearingPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const { data: hearingData, isLoading: hearingLoading } = useHearing(id!);
    const updateMutation = useUpdateHearing(id!);
    const deleteMutation = useDeleteHearing();
    const { data: casesData, isLoading: casesLoading } = useCases({ limit: 100 });
    const { data: lawyersData, isLoading: lawyersLoading } = useLawyers();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });

    const cases = casesData?.data?.map((c) => ({
        id: c.id,
        title: c.title,
        caseNumber: c.caseNumber,
    })) || [];

    // Extract lawyers from API response
    const lawyers = lawyersData?.data || [];

    // Extract clients from API response
    const clients = clientsData?.data?.map((c) => ({
        id: c.id,
        name: c.name,
    })) || [];

    const handleSubmit = (data: HearingFormData) => {
        updateMutation.mutate(
            {
                hearingDate: data.hearingDate,
                courtName: data.courtName,
                courtroom: data.courtroom,
                notes: data.notes,
                status: data.status,
                caseId: data.caseId,
                clientId: data.clientId || undefined,
                assignedToId: data.assignedToId || undefined,
            },
            {
                onSuccess: () => {
                    navigate('/hearings');
                },
            }
        );
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
            deleteMutation.mutate(id!, {
                onSuccess: () => {
                    navigate('/hearings');
                },
            });
        }
    };

    const isLoading = hearingLoading || casesLoading || lawyersLoading || clientsLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to="/hearings">
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للجلسات
                    </Button>
                </Link>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleteMutation.isPending}
                >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الجلسة
                </Button>
            </div>

            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            تعديل الجلسة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="w-24 h-4 bg-muted rounded" />
                                        <div className="w-full h-10 bg-muted rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : hearingData?.data ? (
                            <HearingForm
                                initialData={hearingData.data}
                                onSubmit={handleSubmit}
                                isLoading={updateMutation.isPending}
                                cases={cases}
                                clients={clients}
                                lawyers={lawyers}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                الجلسة غير موجودة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default EditHearingPage;

