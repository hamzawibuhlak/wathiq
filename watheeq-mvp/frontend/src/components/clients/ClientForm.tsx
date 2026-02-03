import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@/components/ui';
import type { Client } from '@/types';

const clientSchema = z.object({
    name: z.string().min(1, 'الاسم مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
    phone: z.string().optional(),
    nationalId: z.string().optional(),
    companyName: z.string().optional(),
    commercialReg: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    clientType: z.enum(['individual', 'company']),
    visibleToUserIds: z.array(z.string()).optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

interface LawyerOption {
    id: string;
    name: string;
}

interface ClientFormProps {
    initialData?: Client & { visibleToUsers?: LawyerOption[] };
    onSubmit: (data: ClientFormData) => void;
    isLoading?: boolean;
    lawyers?: LawyerOption[];
}

export function ClientForm({ initialData, onSubmit, isLoading, lawyers = [] }: ClientFormProps) {
    const isCompany = initialData?.companyName || initialData?.commercialReg;

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: initialData?.name || '',
            email: initialData?.email || '',
            phone: initialData?.phone || '',
            nationalId: initialData?.nationalId || '',
            companyName: initialData?.companyName || '',
            commercialReg: initialData?.commercialReg || '',
            address: initialData?.address || '',
            city: initialData?.city || '',
            notes: initialData?.notes || '',
            clientType: isCompany ? 'company' : 'individual',
            visibleToUserIds: initialData?.visibleToUsers?.map(u => u.id) || [],
        },
    });

    const clientType = watch('clientType');
    const selectedUserIds = watch('visibleToUserIds') || [];

    const handleUserToggle = (userId: string) => {
        const newIds = selectedUserIds.includes(userId)
            ? selectedUserIds.filter(id => id !== userId)
            : [...selectedUserIds, userId];
        setValue('visibleToUserIds', newIds);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Client Type */}
            <div className="space-y-2">
                <Label>نوع العميل *</Label>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="individual"
                            {...register('clientType')}
                            className="w-4 h-4 text-primary"
                        />
                        <span>فرد</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            value="company"
                            {...register('clientType')}
                            className="w-4 h-4 text-primary"
                        />
                        <span>شركة</span>
                    </label>
                </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    {clientType === 'company' ? 'اسم الشركة' : 'الاسم الكامل'} *
                </Label>
                <Input
                    id="name"
                    placeholder={clientType === 'company' ? 'أدخل اسم الشركة' : 'أدخل الاسم الكامل'}
                    error={errors.name?.message}
                    {...register('name')}
                />
            </div>

            {/* Company Fields */}
            {clientType === 'company' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="companyName">الاسم التجاري</Label>
                        <Input
                            id="companyName"
                            placeholder="الاسم التجاري للشركة"
                            {...register('companyName')}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="commercialReg">السجل التجاري</Label>
                        <Input
                            id="commercialReg"
                            placeholder="رقم السجل التجاري"
                            {...register('commercialReg')}
                        />
                    </div>
                </div>
            )}

            {/* Individual Fields */}
            {clientType === 'individual' && (
                <div className="space-y-2">
                    <Label htmlFor="nationalId">رقم الهوية</Label>
                    <Input
                        id="nationalId"
                        placeholder="رقم الهوية الوطنية"
                        {...register('nationalId')}
                    />
                </div>
            )}

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="example@email.com"
                        error={errors.email?.message}
                        {...register('email')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">رقم الجوال</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                        className="text-left"
                        {...register('phone')}
                    />
                </div>
            </div>

            {/* Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="city">المدينة</Label>
                    <Input
                        id="city"
                        placeholder="أدخل المدينة"
                        {...register('city')}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <Input
                        id="address"
                        placeholder="العنوان التفصيلي"
                        {...register('address')}
                    />
                </div>
            </div>

            {/* Visibility - Users who can see this client */}
            {lawyers.length > 0 && (
                <div className="space-y-2">
                    <Label>المحامون المسموح لهم برؤية هذا العميل</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                        اختر المحامين الذين يمكنهم الوصول إلى بيانات هذا العميل
                    </p>
                    <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                        {lawyers.map((lawyer) => (
                            <label
                                key={lawyer.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedUserIds.includes(lawyer.id)}
                                    onChange={() => handleUserToggle(lawyer.id)}
                                    className="w-4 h-4 text-primary rounded"
                                />
                                <span>{lawyer.name}</span>
                            </label>
                        ))}
                    </div>
                    {selectedUserIds.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            تم اختيار {selectedUserIds.length} محامي
                        </p>
                    )}
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
                    {initialData ? 'حفظ التغييرات' : 'إنشاء العميل'}
                </Button>
            </div>
        </form>
    );
}

export default ClientForm;

