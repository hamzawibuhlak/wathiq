import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@/components/ui';
import type { Client } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { Upload, FileText, CheckCircle, Loader2, User } from 'lucide-react';
import { useState } from 'react';

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

    // New Fields
    brandName: z.string().optional(),
    unifiedNumber: z.string().optional(),
    commercialRegDoc: z.string().optional(),
    nationalAddressDoc: z.string().optional(),
    repName: z.string().optional(),
    repPhone: z.string().optional(),
    repEmail: z.string().optional(),
    repIdentity: z.string().optional(),
    repDocType: z.string().optional(),
    repDoc: z.string().optional(),
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

const repDocTypes = [
    { value: 'COMMERCIAL_REG', label: 'السجل التجاري' },
    { value: 'ARTICLES_OF_ASSOC', label: 'عقد التأسيس' },
    { value: 'AUTH_LETTER', label: 'خطاب تفويض' },
    { value: 'POWER_OF_ATTORNEY', label: 'وكالة' },
];

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
            brandName: initialData?.brandName || '',
            unifiedNumber: initialData?.unifiedNumber || '',
            commercialRegDoc: initialData?.commercialRegDoc || '',
            nationalAddressDoc: initialData?.nationalAddressDoc || '',
            repName: initialData?.repName || '',
            repPhone: initialData?.repPhone || '',
            repEmail: initialData?.repEmail || '',
            repIdentity: initialData?.repIdentity || '',
            repDocType: initialData?.repDocType || '',
            repDoc: initialData?.repDoc || '',
        },
    });

    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ClientFormData) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type (PDF or Image)
        if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/) && file.type !== 'application/pdf') {
            toast.error('صيغة الملف غير مدعومة. يرجى رفع صورة أو ملف PDF');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingField(fieldName);
        try {
            const token = useAuthStore.getState().token;
            // Use the new generic document upload endpoint
            const res = await fetch('/api/uploads/document', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Upload failed');

            const data = await res.json();
            setValue(fieldName, data.data.url);
            toast.success('تم رفع الملف بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل رفع الملف');
        } finally {
            setUploadingField(null);
        }
    };

    const FileUploadInput = ({ label, fieldName, required = false }: { label: string, fieldName: keyof ClientFormData, required?: boolean }) => {
        const value = watch(fieldName) as string;
        const isUploading = uploadingField === fieldName;

        return (
            <div className="space-y-2">
                <Label>{label} {required && '*'}</Label>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Input
                            type="file"
                            accept=".pdf,image/*"
                            onChange={(e) => handleFileUpload(e, fieldName)}
                            disabled={isUploading}
                            className="pl-10"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </div>
                    </div>
                    {value && (
                        <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-50 text-green-600 p-2 rounded-md hover:bg-green-100 transition-colors flex items-center gap-2 text-sm"
                            title="عرض الملف المرفوع"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>تم الرفع</span>
                        </a>
                    )}
                </div>
                {required && !value && <p className="text-xs text-red-500">هذا المستند مطلوب</p>}
            </div>
        );
    };

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
            {/* Company Fields */}
            {clientType === 'company' && (
                <div className="space-y-6 border rounded-lg p-5 bg-muted/20">
                    <h3 className="font-medium flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        بيانات المنشأة
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">الاسم التجاري (اختياري)</Label>
                            <Input
                                id="companyName"
                                placeholder="الاسم التجاري للشركة"
                                {...register('companyName')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brandName">العلامة التجارية (اختياري)</Label>
                            <Input
                                id="brandName"
                                placeholder="العلامة التجارية"
                                {...register('brandName')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="commercialReg">رقم السجل التجاري</Label>
                            <Input
                                id="commercialReg"
                                placeholder="رقم السجل التجاري"
                                {...register('commercialReg')}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unifiedNumber">الرقم الموحد (700...)</Label>
                            <Input
                                id="unifiedNumber"
                                placeholder="الرقم الموحد للمنشأة"
                                {...register('unifiedNumber')}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileUploadInput label="صورة السجل التجاري" fieldName="commercialRegDoc" />
                        <FileUploadInput label="العنوان الوطني (ضروري جداً)" fieldName="nationalAddressDoc" required />
                    </div>

                    {/* Company Representative */}
                    <div className="pt-4 border-t mt-4">
                        <h3 className="font-medium flex items-center gap-2 mb-4">
                            <User className="w-5 h-5" />
                            بيانات ممثل الشركة
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                                <Label htmlFor="repName">اسم الممثل</Label>
                                <Input
                                    id="repName"
                                    placeholder="اسم ممثل الشركة"
                                    {...register('repName')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repIdentity">رقم الهوية</Label>
                                <Input
                                    id="repIdentity"
                                    placeholder="رقم هوية الممثل"
                                    {...register('repIdentity')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repPhone">رقم الجوال</Label>
                                <Input
                                    id="repPhone"
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    className="text-left"
                                    {...register('repPhone')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repEmail">البريد الإلكتروني</Label>
                                <Input
                                    id="repEmail"
                                    type="email"
                                    placeholder="admin@company.com"
                                    {...register('repEmail')}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="repDocType">نوع مستند التمثيل</Label>
                                <select
                                    id="repDocType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...register('repDocType')}
                                >
                                    <option value="">اختر نوع المستند...</option>
                                    {repDocTypes.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <FileUploadInput label="مستند التمثيل" fieldName="repDoc" />
                        </div>
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

