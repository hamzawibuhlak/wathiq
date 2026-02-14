import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import type { Hearing } from '@/types';

interface CalendarProps {
    hearings: Hearing[];
    currentDate: Date;
    onMonthChange: (date: Date) => void;
    isLoading?: boolean;
}

const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function Calendar({ hearings, currentDate, onMonthChange, isLoading }: CalendarProps) {
    const { p } = useSlugPath();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and total days
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startingDayIndex = firstDayOfMonth.getDay();

    // Create calendar grid
    const calendarDays: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayIndex; i++) {
        calendarDays.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day);
    }

    // Get hearings for a specific day
    const getHearingsForDay = (day: number) => {
        return hearings.filter((hearing) => {
            const hearingDate = new Date(hearing.hearingDate);
            return (
                hearingDate.getFullYear() === year &&
                hearingDate.getMonth() === month &&
                hearingDate.getDate() === day
            );
        });
    };

    const goToPreviousMonth = () => {
        onMonthChange(new Date(year, month - 1, 1));
    };

    const goToNextMonth = () => {
        onMonthChange(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        onMonthChange(new Date());
    };

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    return (
        <div className="bg-card rounded-xl border">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold min-w-[180px] text-center">
                        {arabicMonths[month]} {year}
                    </h2>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        اليوم
                    </Button>
                    <Link to={p('/hearings/new')}>
                        <Button size="sm">
                            <Plus className="w-4 h-4 ml-1" />
                            جلسة جديدة
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b">
                {arabicDays.map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                    if (day === null) {
                        return <div key={`empty-${index}`} className="min-h-[100px] bg-muted/30" />;
                    }

                    const dayHearings = getHearingsForDay(day);
                    const isToday = isCurrentMonth && today.getDate() === day;
                    const isSelected = selectedDate?.getDate() === day &&
                        selectedDate?.getMonth() === month &&
                        selectedDate?.getFullYear() === year;

                    return (
                        <div
                            key={day}
                            onClick={() => setSelectedDate(new Date(year, month, day))}
                            className={cn(
                                'min-h-[100px] p-2 border-b border-l cursor-pointer transition-colors hover:bg-muted/50',
                                isToday && 'bg-primary/5',
                                isSelected && 'ring-2 ring-primary ring-inset'
                            )}
                        >
                            {/* Day Number */}
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1',
                                isToday && 'bg-primary text-primary-foreground'
                            )}>
                                {day}
                            </div>

                            {/* Hearings */}
                            <div className="space-y-1">
                                {dayHearings.slice(0, 3).map((hearing) => (
                                    <Link
                                        key={hearing.id}
                                        to={`/hearings/${hearing.id}/edit`}
                                        onClick={(e) => e.stopPropagation()}
                                        className={cn(
                                            'block text-xs p-1 rounded truncate',
                                            hearing.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                hearing.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    hearing.status === 'POSTPONED' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-blue-100 text-blue-700'
                                        )}
                                    >
                                        {new Date(hearing.hearingDate).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })} - {hearing.courtName || (hearing as any).hearingNumber || 'جلسة'}
                                    </Link>
                                ))}
                                {dayHearings.length > 3 && (
                                    <span className="text-xs text-muted-foreground">
                                        +{dayHearings.length - 3} أخرى
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Calendar;
