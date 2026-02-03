import { Calendar, Clock, MapPin } from 'lucide-react';

interface Hearing {
    id: string;
    title: string;
    hearingDate: string;
    location: string | null;
    case?: {
        title: string;
        caseNumber: string;
    };
}

interface UpcomingHearingsProps {
    hearings: Hearing[];
    isLoading?: boolean;
}

export function UpcomingHearings({ hearings, isLoading }: UpcomingHearingsProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-muted rounded animate-pulse" />
                    <div className="w-32 h-6 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-12 h-12 bg-muted rounded" />
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-4 bg-muted rounded" />
                                <div className="w-1/2 h-3 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">الجلسات القادمة</h3>
            </div>

            {hearings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد جلسات قادمة</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {hearings.map((hearing) => {
                        const date = new Date(hearing.hearingDate);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isTomorrow =
                            new Date(Date.now() + 86400000).toDateString() === date.toDateString();

                        return (
                            <div
                                key={hearing.id}
                                className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                {/* Date Badge */}
                                <div
                                    className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center text-center ${isToday
                                        ? 'bg-primary text-primary-foreground'
                                        : isTomorrow
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : 'bg-muted'
                                        }`}
                                >
                                    <span className="text-xs">
                                        {isToday ? 'اليوم' : isTomorrow ? 'غداً' : date.toLocaleDateString('ar-SA', { weekday: 'short' })}
                                    </span>
                                    <span className="text-lg font-bold">{date.getDate()}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate">{hearing.title}</h4>
                                    {hearing.case && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {hearing.case.caseNumber} - {hearing.case.title}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {hearing.location && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {hearing.location}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default UpcomingHearings;
