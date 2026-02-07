import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApiClient, PortalDashboardStats, PortalHearing, portalAuth } from '@/api/portal.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, FileText, Calendar, DollarSign, Clock, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function PortalDashboardPage() {
    const [stats, setStats] = useState<PortalDashboardStats | null>(null);
    const [hearings, setHearings] = useState<PortalHearing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const client = portalAuth.getClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, hearingsData] = await Promise.all([
                    portalApiClient.getDashboard(),
                    portalApiClient.getUpcomingHearings(),
                ]);
                setStats(statsData);
                setHearings(hearingsData);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div>
                <h1 className="text-2xl font-bold">مرحباً {client?.name}</h1>
                <p className="text-muted-foreground">إليك ملخص حسابك</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            القضايا النشطة
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats?.activeCases || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            من إجمالي {stats?.totalCases || 0} قضية
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            الجلسات القادمة
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats?.upcomingHearings || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">جلسة مجدولة</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            الفواتير المعلقة
                        </CardDescription>
                        <CardTitle className="text-3xl">{stats?.pendingInvoices || 0}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            من إجمالي {stats?.totalInvoices || 0} فاتورة
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            المبلغ المستحق
                        </CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            {formatCurrency(stats?.pendingAmount || 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">بانتظار السداد</p>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Hearings */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            الجلسات القادمة
                        </CardTitle>
                        <CardDescription>أقرب المواعيد المجدولة</CardDescription>
                    </div>
                    <Link
                        to="/portal/hearings"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        عرض الكل
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </CardHeader>
                <CardContent>
                    {hearings.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            لا توجد جلسات قادمة
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {hearings.slice(0, 3).map((hearing) => (
                                <div
                                    key={hearing.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-slate-50"
                                >
                                    <div>
                                        <p className="font-medium">{hearing.case?.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {hearing.courtName}
                                            {hearing.courtroom && ` - ${hearing.courtroom}`}
                                        </p>
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-primary">
                                            {format(new Date(hearing.hearingDate), 'dd MMMM yyyy', {
                                                locale: ar,
                                            })}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {format(new Date(hearing.hearingDate), 'hh:mm a', {
                                                locale: ar,
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
