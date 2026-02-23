import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ArrowRight, Scale } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { CaseForm, CaseFormData } from '@/components/cases';
import { useCreateCase } from '@/hooks/use-cases';
import { useClients } from '@/hooks/use-clients';
import { useLawyers } from '@/hooks/useUsers';

export function CreateCasePage() {
    const { p } = useSlugPath();
    const createMutation = useCreateCase();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });
    const { data: lawyersData, isLoading: lawyersLoading } = useLawyers();

    const clients = clientsData?.data?.map((c) => ({ id: c.id, name: c.name })) || [];
    const lawyers = lawyersData?.data?.map((l: any) => ({ id: l.id, name: l.name })) || [];

    const handleSubmit = (data: CaseFormData) => {
        // Remove empty optional fields so backend validators don't reject empty strings
        const cleaned = { ...data };
        if (!cleaned.filingDate) delete cleaned.filingDate;
        if (!cleaned.assignedToId) delete cleaned.assignedToId;
        if (!cleaned.courtName) delete cleaned.courtName;
        if (!cleaned.opposingParty) delete cleaned.opposingParty;
        if (!cleaned.description) delete cleaned.description;
        createMutation.mutate(cleaned);
    };

    const isLoading = clientsLoading || lawyersLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to={p('/cases')}>
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للقضايا
                    </Button>
                </Link>
            </div>

            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-primary" />
                            إنشاء قضية جديدة
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
                            <CaseForm
                                onSubmit={handleSubmit}
                                isLoading={createMutation.isPending}
                                clients={clients}
                                lawyers={lawyers}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default CreateCasePage;