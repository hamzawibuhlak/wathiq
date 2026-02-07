import { Calendar, Clock, MapPin, User, ArrowLeft, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Hearing {
    id: string;
    hearingNumber?: string;
    hearingDate: string;
    courtName?: string | null;
    opponentName?: string | null;
    case?: {
        id: string;
        title: string;
        caseNumber: string;
        client?: {
            id: string;
            name: string;
        };
    } | null;
    client?: {
        id: string;
        name: string;
    } | null;
    assignedTo?: {
        id: string;
        name: string;
        avatar?: string | null;
    } | null;
}

interface UpcomingHearingsProps {
    hearings: Hearing[];
    isLoading?: boolean;
}

export function UpcomingHearings({ hearings, isLoading }: UpcomingHearingsProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-muted rounded animate-pulse" />
                    <div className="w-32 h-6 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse p-3 rounded-xl bg-muted/30">
                            <div className="w-14 h-14 bg-muted rounded-xl" />
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
        <div className="bg-card rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">الجلسات القادمة</h3>
                </div>
                <Link 
                    to="/hearings" 
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                    عرض الكل
                    <ArrowLeft className="w-4 h-4" />
                </Link>
            </div>

            {hearings.length === 0 ? (
                <div className="text-center py-10">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <p className="text-muted-foreground mb-4">لا توجد جلسات قادمة</p>
                    <Link
                        to="/hearings/new"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة جلسة
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {hearings.map((hearing) => {
                        const date = new Date(hearing.hearingDate);
                        const isToday = new Date().toDateString() === date.toDateString();
                        const isTomorrow =
                            new Date(Date.now() + 86400000).toDateString() === date.toDateString();

                        // Get title - use courtName, hearingNumber, or case title
                        const title = hearing.courtName || 
                            (hearing.hearingNumber ? `جلسة رقم ${hearing.hearingNumber}` : null) ||
                            hearing.case?.title || 
                            'جلسة';

                        // Get client name from direct client or case's client
                        const clientName = hearing.client?.name || hearing.case?.client?.name;

                        return (
                            <Link
                                key={hearing.id}
                                to={`/hearings/${hearing.id}/edit`}
                                className={cn(
                                    'flex gap-4 p-3 rounded-xl transition-all duration-200 block',
                                    isToday 
                                        ? 'bg-red-50 hover:bg-red-100/80 dark:bg-red-950/20 dark:hover:bg-red-950/30 border border-red-100 dark:border-red-900/30'
                                        : 'hover:bg-muted/50'
                                )}
                            >
                                {/* Date Badge */}
                                <div
                                    className={cn(
                                        'w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center shrink-0',
                                        isToday
                                            ? 'bg-red-500 text-white'
                                            : isTomorrow
                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-muted'
                                    )}
                                >
                                    <span className="text-[10px] font-medium">
                                        {isToday ? 'اليوم' : isTomorrow ? 'غدا' : date.toLocaleDateString('ar-SA', { weekday: 'short' })}
                                    </span>
                                    <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold truncate text-sm">{title}</h4>
                                    {hearing.case && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                            {hearing.case.caseNumber} - {hearing.case.title}
                                        </p>
                                    )}
                                    {clientName && !hearing.case && (
                                        <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {clientName}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {hearing.courtName && (
                                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <MapPin className="w-3 h-3" />
                                                <span className="truncate max-w-[100px]">{hearing.courtName}</span>
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Lawyer Avatar */}
                                {hearing.assignedTo && (
                                    <div className="shrink-0 flex items-center">
                                        {hearing.assignedTo.avatar ? (
                                            <img 
                                                src={hearing.assignedTo.avatar}
                                                alt={hearing.assignedTo.name}
                                                className="w-9 h-9 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                                                <span className="text-xs font-semibold text-primary">
                                                    {hearing.assignedTo.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default UpcomingHearings;
