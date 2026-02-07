import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApiClient, PortalCase } from '@/api/portal.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, FileText, Calendar, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
    OPEN: { label: 'مفتوحة', className: 'bg-blue-100 text-blue-700' },
    IN_PROGRESS: { label: 'جارية', className: 'bg-yellow-100 text-yellow-700' },
    SUSPENDED: { label: 'معلقة', className: 'bg-orange-100 text-orange-700' },
    CLOSED: { label: 'مغلقة', className: 'bg-gray-100 text-gray-600' },
    WON: { label: 'مكسوبة', className: 'bg-green-100 text-green-700' },
    LOST: { label: 'خاسرة', className: 'bg-red-100 text-red-700' },
};

export default function PortalCasesPage() {
    const [cases, setCases] = useState<PortalCase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const data = await portalApiClient.getCases();
                setCases(data);
            } catch (error) {
                console.error('Failed to fetch cases:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCases();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    قضاياي
                </h1>
                <p className="text-muted-foreground">عرض جميع القضايا الخاصة بك</p>
            </div>

            {cases.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لا توجد قضايا مسجلة</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {cases.map((caseItem) => {
                        const status = statusConfig[caseItem.status] || statusConfig.OPEN;
                        return (
                            <Card key={caseItem.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{caseItem.title}</CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1">
                                                <span>رقم القضية: {caseItem.caseNumber}</span>
                                                <span>•</span>
                                                <span>{caseItem.caseType}</span>
                                            </CardDescription>
                                        </div>
                                        <Badge className={status.className}>{status.label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                        {caseItem.courtName && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {caseItem.courtName}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            {caseItem._count?.documents || 0} مستند
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {caseItem._count?.hearings || 0} جلسة
                                        </span>
                                        <span>
                                            منذ {format(new Date(caseItem.createdAt), 'dd MMMM yyyy', { locale: ar })}
                                        </span>
                                    </div>
                                    {caseItem.assignedTo && (
                                        <p className="text-sm mt-3">
                                            <span className="text-muted-foreground">المحامي المسؤول:</span>{' '}
                                            <span className="font-medium">{caseItem.assignedTo.name}</span>
                                        </p>
                                    )}
                                    <Link
                                        to={`/portal/cases/${caseItem.id}`}
                                        className="inline-flex items-center gap-1 text-primary text-sm mt-4 hover:underline"
                                    >
                                        عرض التفاصيل
                                        <ChevronLeft className="w-4 h-4" />
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
