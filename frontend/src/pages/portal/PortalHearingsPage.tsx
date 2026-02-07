import { useEffect, useState } from 'react';
import { portalApiClient, PortalHearing } from '@/api/portal.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
    SCHEDULED: { label: 'مجدولة', className: 'bg-blue-100 text-blue-700' },
    POSTPONED: { label: 'مؤجلة', className: 'bg-yellow-100 text-yellow-700' },
    COMPLETED: { label: 'منتهية', className: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'ملغاة', className: 'bg-gray-100 text-gray-600' },
};

export default function PortalHearingsPage() {
    const [hearings, setHearings] = useState<PortalHearing[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHearings = async () => {
            try {
                const data = await portalApiClient.getUpcomingHearings();
                setHearings(data);
            } catch (error) {
                console.error('Failed to fetch hearings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHearings();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const getDaysUntil = (date: string) => {
        const days = differenceInDays(new Date(date), new Date());
        if (days === 0) return 'اليوم';
        if (days === 1) return 'غداً';
        if (days < 0) return 'منتهية';
        return `بعد ${days} يوم`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    الجلسات القادمة
                </h1>
                <p className="text-muted-foreground">مواعيد جلساتك المجدولة</p>
            </div>

            {hearings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">لا توجد جلسات قادمة</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {hearings.map((hearing) => {
                        const status = statusConfig[hearing.status] || statusConfig.SCHEDULED;
                        const daysUntil = getDaysUntil(hearing.hearingDate);
                        const isToday = daysUntil === 'اليوم';
                        const isTomorrow = daysUntil === 'غداً';

                        return (
                            <Card
                                key={hearing.id}
                                className={`hover:shadow-md transition-shadow ${isToday ? 'border-red-300 bg-red-50/50' : isTomorrow ? 'border-yellow-300 bg-yellow-50/50' : ''}`}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">
                                                {hearing.case?.title}
                                            </CardTitle>
                                            <CardDescription>
                                                رقم القضية: {hearing.case?.caseNumber}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge className={status.className}>{status.label}</Badge>
                                            <span
                                                className={`text-xs font-medium px-2 py-1 rounded ${
                                                    isToday
                                                        ? 'bg-red-100 text-red-700'
                                                        : isTomorrow
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                }`}
                                            >
                                                {daysUntil}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">التاريخ</p>
                                                <p className="font-medium">
                                                    {format(new Date(hearing.hearingDate), 'EEEE dd MMMM yyyy', {
                                                        locale: ar,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">الوقت</p>
                                                <p className="font-medium">
                                                    {format(new Date(hearing.hearingDate), 'hh:mm a', {
                                                        locale: ar,
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-muted-foreground">المكان</p>
                                                <p className="font-medium">
                                                    {hearing.courtName}
                                                    {hearing.courtroom && ` - ${hearing.courtroom}`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {hearing.notes && (
                                        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                                            <p className="text-sm text-muted-foreground">ملاحظات:</p>
                                            <p className="text-sm">{hearing.notes}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
