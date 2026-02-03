import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@/components/ui';
import type { Hearing } from '@/types';

// Validation schema - matches backend DTO
const hearingSchema = z.object({
    hearingDate: z.string().min(1, 'تاريخ الجلسة مطلوب'),
    hearingTime: z.string().min(1, 'وقت الجلسة مطلوب'),
    courtName: z.string().optional(),
    courtroom: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
    caseId: z.string().min(1, 'القضية مطلوبة'),
    clientId: z.string().optional(),
    assignedToId: z.string().optional(),
});

export type HearingFormData = z.infer<typeof hearingSchema>;

interface HearingFormProps {
    initialData?: Hearing;
    onSubmit: (data: HearingFormData) => void;
    isLoading?: boolean;
    cases?: Array<{ id: string; title: string; caseNumber: string }>;
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
        formState: { errors },
    } = useForm<HearingFormData>({
        resolver: zodResolver(hearingSchema),
        defaultValues: {
            hearingDate: initialDate,
            hearingTime: initialTime,
            courtName: initialData?.courtName || '',
            courtroom: (initialData as any)?.courtroom || '',
            notes: initialData?.notes || '',
            status: initialData?.status || 'SCHEDULED',
            caseId: initialData?.caseId || '',
            clientId: (initialData as any)?.clientId || '',
            assignedToId: (initialData as any)?.assignedToId || '',
        },
    });

    const handleFormSubmit = (data: HearingFormData) => {
        // Combine date and time
        const combinedDateTime = `${data.hearingDate}T${data.hearingTime}:00`;
        onSubmit({
            ...data,
            hearingDate: combinedDateTime,
        });
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Case */}
            <div className="space-y-2">
                <Label htmlFor="caseId">القضية *</Label>
                <select
                    id="caseId"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('caseId')}
                >
                    <option value="">اختر القضية</option>
                    {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.caseNumber} - {c.title}
                        </option>
                    ))}
                </select>
                {errors.caseId && (
                    <p className="text-sm text-destructive">{errors.caseId.message}</p>
                )}
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="hearingDate">تاريخ الجلسة *</Label>
                    <Input
                        id="hearingDate"
                        type="date"
                        error={errors.hearingDate?.message}
                        {...register('hearingDate')}
                    />
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

            {/* Court Name */}
            <div className="space-y-2">
                <Label htmlFor="courtName">المحكمة</Label>
                <Input
                    id="courtName"
                    placeholder="مثال: المحكمة العامة"
                    {...register('courtName')}
                />
            </div>

            {/* Courtroom */}
            <div className="space-y-2">
                <Label htmlFor="courtroom">قاعة المحكمة</Label>
                <Input
                    id="courtroom"
                    placeholder="مثال: قاعة 5"
                    {...register('courtroom')}
                />
            </div>

            {/* Client Selection */}
            <div className="space-y-2">
                <Label htmlFor="clientId">العميل (اختياري)</Label>
                <select
                    id="clientId"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('clientId')}
                >
                    <option value="">اختر العميل</option>
                    {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                            {client.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Lawyer Selection */}
            <div className="space-y-2">
                <Label htmlFor="assignedToId">المحامي المسؤول</Label>
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
            </div>

            {/* Status */}
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

            {/* Notes */}
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
