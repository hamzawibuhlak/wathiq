import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, List, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui';
import { Calendar } from '@/components/hearings';
import { useHearings } from '@/hooks/use-hearings';
import { cn } from '@/lib/utils';

type ViewMode = 'calendar' | 'list';

export function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');

    const { data, isLoading, error } = useHearings({
        startDate: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString(),
        endDate: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString(),
        limit: 100,
    });

    const hearings = data?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarDays className="w-7 h-7 text-primary" />
                        تقويم الجلسات
                    </h1>
                    <p className="text-muted-foreground">
                        عرض جميع جلسات المحكمة في تقويم شهري
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                                viewMode === 'calendar' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <CalendarDays className="w-4 h-4" />
                            تقويم
                        </button>
                        <Link
                            to="/hearings"
                            className={cn(
                                'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
                                viewMode === 'list' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'
                            )}
                        >
                            <List className="w-4 h-4" />
                            قائمة
                        </Link>
                    </div>
                    <Link to="/hearings/new">
                        <Button>
                            <Plus className="w-4 h-4 ml-2" />
                            جلسة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
                    <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                    <p className="text-destructive font-medium">حدث خطأ أثناء تحميل الجلسات</p>
                </div>
            )}

            {/* Calendar */}
            {!error && (
                <div className="relative">
                    <Calendar
                        hearings={hearings}
                        currentDate={currentDate}
                        onMonthChange={setCurrentDate}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
}

export default CalendarPage;
