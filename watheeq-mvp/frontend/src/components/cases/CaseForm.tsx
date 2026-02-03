import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import type { Case } from '@/types';

// Validation schema
const caseSchema = z.object({
    title: z.string().min(1, 'العنوان مطلوب').min(3, 'العنوان يجب أن يكون 3 أحرف على الأقل'),
    description: z.string().optional(),
    caseType: z.string().min(1, 'نوع القضية مطلوب'),
    status: z.string().optional(),
    priority: z.string().optional(),
    clientId: z.string().min(1, 'العميل مطلوب'),
    assignedToId: z.string().optional(),
    courtName: z.string().optional(),
    opposingParty: z.string().optional(),
    filingDate: z.string().optional(),
});

export type CaseFormData = z.infer<typeof caseSchema>;

interface CaseFormProps {
    initialData?: Case;
    onSubmit: (data: CaseFormData) => void;
    isLoading?: boolean;
    clients?: Array<{ id: string; name: string }>;
    lawyers?: Array<{ id: string; name: string }>;
}

const statusOptions = [
    { value: 'OPEN', label: 'مفتوحة' },
    { value: 'IN_PROGRESS', label: 'قيد المعالجة' },
    { value: 'SUSPENDED', label: 'معلقة' },
    { value: 'CLOSED', label: 'مغلقة' },
    { value: 'ARCHIVED', label: 'مؤرشفة' },
];

const typeOptions = [
    { value: 'CIVIL', label: 'مدني' },
    { value: 'CRIMINAL', label: 'جنائي' },
    { value: 'COMMERCIAL', label: 'تجاري' },
    { value: 'LABOR', label: 'عمالي' },
    { value: 'FAMILY', label: 'أحوال شخصية' },
    { value: 'ADMINISTRATIVE', label: 'إداري' },
];

const priorityOptions = [
    { value: 'HIGH', label: 'عالية' },
    { value: 'MEDIUM', label: 'متوسطة' },
    { value: 'LOW', label: 'منخفضة' },
];

export function CaseForm({ initialData, onSubmit, isLoading, clients = [], lawyers = [] }: CaseFormProps) {
    const user = useAuthStore((state) => state.user);
    const isLawyer = user?.role === 'LAWYER';

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CaseFormData>({
        resolver: zodResolver(caseSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            caseType: initialData?.caseType || '',
            status: initialData?.status || 'OPEN',
            priority: initialData?.priority || 'MEDIUM',
            clientId: initialData?.clientId || '',
            assignedToId: initialData?.assignedToId || (isLawyer ? user?.id : ''),
            courtName: initialData?.courtName || '',
            opposingParty: initialData?.opposingParty || '',
            filingDate: initialData?.filingDate ? initialData.filingDate.split('T')[0] : '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Case Number (Read Only for Edit) */}
            {initialData?.caseNumber && (
                <div className="space-y-2">
                    <Label>رقم القضية</Label>
                    <Input
                        value={initialData.caseNumber}
                        disabled
                        className="bg-muted"
                    />
                </div>
            )}

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">عنوان القضية *</Label>
                <Input
                    id="title"
                    placeholder="أدخل عنوان القضية"
                    error={errors.title?.message}
                    {...register('title')}
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">وصف القضية</Label>
                <textarea
                    id="description"
                    placeholder="أدخل وصف تفصيلي للقضية..."
                    className="w-full min-h-[100px] px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('description')}
                />
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case Type */}
                <div className="space-y-2">
                    <Label htmlFor="caseType">نوع القضية *</Label>
                    <select
                        id="caseType"
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('caseType')}
                    >
                        <option value="">اختر نوع القضية</option>
                        {typeOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {errors.caseType && (
                        <p className="text-sm text-destructive">{errors.caseType.message}</p>
                    )}
                </div>

                {/* Status */}
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

                {/* Priority */}
                <div className="space-y-2">
                    <Label htmlFor="priority">الأولوية</Label>
                    <select
                        id="priority"
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('priority')}
                    >
                        {priorityOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Client */}
                <div className="space-y-2">
                    <Label htmlFor="clientId">العميل *</Label>
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
                    {errors.clientId && (
                        <p className="text-sm text-destructive">{errors.clientId.message}</p>
                    )}
                </div>

                {/* Assigned Lawyer */}
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

                {/* Court Name */}
                <div className="space-y-2">
                    <Label htmlFor="courtName">اسم المحكمة</Label>
                    <Input
                        id="courtName"
                        placeholder="أدخل اسم المحكمة"
                        {...register('courtName')}
                    />
                </div>

                {/* Opposing Party */}
                <div className="space-y-2">
                    <Label htmlFor="opposingParty">الخصم</Label>
                    <Input
                        id="opposingParty"
                        placeholder="أدخل اسم الخصم"
                        {...register('opposingParty')}
                    />
                </div>

                {/* Filing Date */}
                <div className="space-y-2">
                    <Label htmlFor="filingDate">تاريخ الإيداع</Label>
                    <Input
                        id="filingDate"
                        type="date"
                        {...register('filingDate')}
                    />
                </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'حفظ التغييرات' : 'إنشاء القضية'}
                </Button>
            </div>
        </form>
    );
}

export default CaseForm;
