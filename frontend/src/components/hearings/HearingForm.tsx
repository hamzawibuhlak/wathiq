import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMemo } from 'react';
import { Button, Input, Label } from '@/components/ui';
import type { Hearing } from '@/types';

// Arabic day names
const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

// Validation schema - matches backend DTO
const hearingSchema = z.object({
    hearingNumber: z.string().min(1, 'رقم الجلسة مطلوب'),
    hearingDate: z.string().min(1, 'تاريخ الجلسة مطلوب'),
    hearingTime: z.string().min(1, 'وقت الجلسة مطلوب'),
    clientId: z.string().min(1, 'الموكل مطلوب'),
    caseId: z.string().optional(),
    assignedToId: z.string().min(1, 'المحامي مطلوب'),
    opponentName: z.string().optional(),
    courtName: z.string().optional(),
    judgeName: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
});

export type HearingFormData = z.infer<typeof hearingSchema>;

interface HearingFormProps {
    initialData?: Hearing;
    onSubmit: (data: HearingFormData) => void;
    isLoading?: boolean;
    cases?: Array<{ id: string; title: string; caseNumber: string; clientId?: string }>;
    clients?: Array<{ id: string; name: string }>;
    lawyers?: Array<{ id: string; name: string }>;
}

const statusOptions = [
    { value: 'SCHEDULED', label: 'مجدولة' },
    { value: 'COMPLETED', label: 'منتهية' },
    { value: 'POSTPONED', label: 'مؤجلة' },
    { value: 'CANCELLED', label: 'ملغاة' },
];

export function HearingForm({ initialData, onSubmit, isLoading, cases = [], clients = [], lawyers = [] }: HearingFormProps) {
    // Parse initial date/time if editing
    let initialDate = '';
    let initialTime = '';
    if (initialData?.hearingDate) {
        const date = new Date(initialData.hearingDate);
        initialDate = date.toISOString().split('T')[0];
        initialTime = date.toTimeString().slice(0, 5);
    }

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<HearingFormData>({
        resolver: zodResolver(hearingSchema),
        defaultValues: {
            hearingNumber: (initialData as any)?.hearingNumber || '',
            hearingDate: initialDate,
            hearingTime: initialTime,
            clientId: (initialData as any)?.clientId || '',
            caseId: initialData?.caseId || '',
            assignedToId: (initialData as any)?.assignedToId || '',
            opponentName: (initialData as any)?.opponentName || '',
            courtName: initialData?.courtName || '',
            judgeName: (initialData as any)?.judgeName || '',
            notes: initialData?.notes || '',
            status: initialData?.status || 'SCHEDULED',
        },
    });

    // Watch date and client for dynamic updates
    const selectedDate = useWatch({ control, name: 'hearingDate' });
    const selectedClientId = useWatch({ control, name: 'clientId' });

    // Get day name from selected date
    const dayName = useMemo(() => {
        if (!selectedDate) return '';
        const date = new Date(selectedDate);
        if (isNaN(date.getTime())) return '';
        return arabicDays[date.getDay()];
    }, [selectedDate]);

    // Filter cases based on selected client
    const filteredCases = useMemo(() => {
        if (!selectedClientId) return [];
        return cases.filter(c => c.clientId === selectedClientId);
    }, [cases, selectedClientId]);

    const handleFormSubmit = (data: HearingFormData) => {
        // Combine date and time
        const combinedDateTime = `${data.hearingDate}T${data.hearingTime}:00`;
        onSubmit({
            ...data,
            hearingDate: combinedDateTime,
            caseId: data.caseId || undefined,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* 1. Hearing Number - Required */}
            <div className="space-y-2">
                <Label htmlFor="hearingNumber">رقم الجلسة (من المحكمة) *</Label>
                <Input
                    id="hearingNumber"
                    placeholder="أدخل رقم الجلسة"
                    error={errors.hearingNumber?.message}
                    {...register('hearingNumber')}
                />
            </div>

            {/* 2. Date and 3. Time - Required */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hearingDate">تاريخ الجلسة *</Label>
                    <div className="relative">
                        <Input
                            id="hearingDate"
                            type="date"
                            error={errors.hearingDate?.message}
                            {...register('hearingDate')}
                        />
                        {dayName && (
                            <div className="mt-1 text-sm text-primary font-medium">
                                {dayName}
                            </div>
                        )}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="hearingTime">وقت الجلسة *</Label>
                    <Input
                        id="hearingTime"
                        type="time"
                        error={errors.hearingTime?.message}
                        {...register('hearingTime')}
                    />
                </div>
            </div>

            {/* 4. Lawyer Selection - Required */}
            <div className="space-y-2">
                <Label htmlFor="assignedToId">المحامي المسؤول *</Label>
                <select
                    id="assignedToId"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('assignedToId')}
                >
                    <option value="">اختر المحامي</option>
                    {lawyers.map((lawyer) => (
                        <option key={lawyer.id} value={lawyer.id}>
                            {lawyer.name}
                        </option>
                    ))}
                </select>
                {errors.assignedToId && (
                    <p className="text-sm text-destructive">{errors.assignedToId.message}</p>
                )}
            </div>

            {/* 5. Client Selection - Required */}
            <div className="space-y-2">
                <Label htmlFor="clientId">الموكل *</Label>
                <select
                    id="clientId"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('clientId')}
                >
                    <option value="">اختر الموكل</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
                {errors.clientId && (
                    <p className="text-sm text-destructive">{errors.clientId.message}</p>
                )}
            </div>

            {/* 6. Case Selection - Optional (filtered by client) */}
            <div className="space-y-2">
                <Label htmlFor="caseId">القضية (اختياري)</Label>
                <select
                    id="caseId"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedClientId}
                    {...register('caseId')}
                >
                    <option value="">
                        {!selectedClientId 
                            ? 'اختر الموكل أولاً' 
                            : filteredCases.length === 0 
                                ? 'لا توجد قضايا لهذا الموكل' 
                                : 'اختر القضية'}
                    </option>
                    {filteredCases.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.caseNumber} - {c.title}
                        </option>
                    ))}
                </select>
            </div>

            {/* 7. Opponent Name - Optional */}
            <div className="space-y-2">
                <Label htmlFor="opponentName">اسم الخصم</Label>
                <Input
                    id="opponentName"
                    placeholder="أدخل اسم الخصم"
                    {...register('opponentName')}
                />
            </div>

            {/* 8. Court Name - Optional */}
            <div className="space-y-2">
                <Label htmlFor="courtName">المحكمة</Label>
                <Input
                    id="courtName"
                    placeholder="مثال: المحكمة العامة"
                    {...register('courtName')}
                />
            </div>

            {/* 9. Judge Name - Optional */}
            <div className="space-y-2">
                <Label htmlFor="judgeName">القاضي</Label>
                <Input
                    id="judgeName"
                    placeholder="أدخل اسم القاضي"
                    {...register('judgeName')}
                />
            </div>

            {/* Status - Only show when editing */}
            {initialData && (
                <div className="space-y-2">
                    <Label htmlFor="status">الحالة</Label>
                    <select
                        id="status"
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('status')}
                    >
                        {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* 10. Notes - Optional */}
            <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات</Label>
                <textarea
                    id="notes"
                    placeholder="أي ملاحظات إضافية..."
                    className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('notes')}
                />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'حفظ التغييرات' : 'إنشاء الجلسة'}
                </Button>
            </div>
        </form>
    );
}

export default HearingForm;
