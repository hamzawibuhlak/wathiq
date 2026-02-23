import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@/components/ui';
import type { Client } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { Upload, CheckCircle, Loader2, User, Building2, UserCircle } from 'lucide-react';
import { useState } from 'react';

const clientSchema = z.object({
    clientType: z.enum(['individual', 'company']),

    // Common
    name: z.string().min(1, 'الاسم مطلوب').min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
    notes: z.string().optional(),
    visibleToUserIds: z.array(z.string()).optional(),

    // Individual fields
    nationalId: z.string().optional(),
    nationalIdDoc: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),

    // Company fields
    companyName: z.string().optional(),
    brandName: z.string().optional(),
    unifiedNumber: z.string().optional(),
    commercialReg: z.string().optional(),
    commercialRegDoc: z.string().optional(),
    nationalAddressDoc: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),

    // Company Rep fields
    repName: z.string().optional(),
    repIdentity: z.string().optional(),
    repIdentityDoc: z.string().optional(),
    repPhone: z.string().optional(),
    repEmail: z.string().optional(),
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
            clientType: isCompany ? 'company' : 'individual',
            name: initialData?.name || '',
            notes: initialData?.notes || '',
            visibleToUserIds: initialData?.visibleToUsers?.map(u => u.id) || [],

            // Individual
            nationalId: initialData?.nationalId || '',
            nationalIdDoc: (initialData as any)?.nationalIdDoc || '',
            phone: initialData?.phone || '',
            email: initialData?.email || '',

            // Company
            companyName: initialData?.companyName || '',
            brandName: initialData?.brandName || '',
            unifiedNumber: initialData?.unifiedNumber || '',
            commercialReg: initialData?.commercialReg || '',
            commercialRegDoc: initialData?.commercialRegDoc || '',
            nationalAddressDoc: initialData?.nationalAddressDoc || '',
            address: initialData?.address || '',
            city: initialData?.city || '',

            // Rep
            repName: initialData?.repName || '',
            repIdentity: initialData?.repIdentity || '',
            repIdentityDoc: (initialData as any)?.repIdentityDoc || '',
            repPhone: initialData?.repPhone || '',
            repEmail: initialData?.repEmail || '',
            repDocType: initialData?.repDocType || '',
            repDoc: initialData?.repDoc || '',
        },
    });

    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fieldName: keyof ClientFormData) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/) && file.type !== 'application/pdf') {
            toast.error('صيغة الملف غير مدعومة. يرجى رفع صورة أو ملف PDF');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        setUploadingField(fieldName);
        try {
            const token = useAuthStore.getState().token;
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
                <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
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
                            className="bg-green-50 text-green-600 p-2 rounded-md hover:bg-green-100 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
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
            {/* Client Type Selection */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">نوع العميل *</Label>
                <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${clientType === 'individual' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                            type="radio"
                            value="individual"
                            {...register('clientType')}
                            className="w-4 h-4 text-primary"
                        />
                        <UserCircle className={`w-5 h-5 ${clientType === 'individual' ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`font-medium ${clientType === 'individual' ? 'text-primary' : 'text-gray-600'}`}>فرد</span>
                    </label>
                    <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${clientType === 'company' ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                            type="radio"
                            value="company"
                            {...register('clientType')}
                            className="w-4 h-4 text-primary"
                        />
                        <Building2 className={`w-5 h-5 ${clientType === 'company' ? 'text-primary' : 'text-gray-400'}`} />
                        <span className={`font-medium ${clientType === 'company' ? 'text-primary' : 'text-gray-600'}`}>شركة</span>
                    </label>
                </div>
            </div>

            {/* ===== INDIVIDUAL FORM ===== */}
            {clientType === 'individual' && (
                <div className="space-y-5">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">الاسم الكامل *</Label>
                        <Input
                            id="name"
                            placeholder="أدخل الاسم الكامل"
                            error={errors.name?.message}
                            {...register('name')}
                        />
                    </div>

                    {/* National ID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nationalId">رقم الهوية</Label>
                            <Input
                                id="nationalId"
                                placeholder="رقم الهوية الوطنية"
                                {...register('nationalId')}
                            />
                        </div>
                        <FileUploadInput label="مستند الهوية" fieldName="nationalIdDoc" />
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>
                </div>
            )}

            {/* ===== COMPANY FORM ===== */}
            {clientType === 'company' && (
                <div className="space-y-6">
                    {/* Company Info Section */}
                    <div className="space-y-5 border rounded-xl p-5 bg-muted/20">
                        <h3 className="font-semibold flex items-center gap-2 text-base">
                            <Building2 className="w-5 h-5 text-primary" />
                            بيانات المنشأة
                        </h3>

                        {/* Company Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">اسم الشركة *</Label>
                            <Input
                                id="name"
                                placeholder="أدخل اسم الشركة"
                                error={errors.name?.message}
                                {...register('name')}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="brandName">العلامة التجارية (اختياري)</Label>
                                <Input
                                    id="brandName"
                                    placeholder="العلامة التجارية"
                                    {...register('brandName')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unifiedNumber">الرقم الموحد</Label>
                                <Input
                                    id="unifiedNumber"
                                    placeholder="700..."
                                    {...register('unifiedNumber')}
                                />
                            </div>
                        </div>

                        {/* Commercial Registration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="commercialReg">رقم السجل التجاري</Label>
                                <Input
                                    id="commercialReg"
                                    placeholder="رقم السجل التجاري"
                                    {...register('commercialReg')}
                                />
                            </div>
                            <FileUploadInput label="مستند السجل التجاري" fieldName="commercialRegDoc" />
                        </div>

                        {/* National Address */}
                        <FileUploadInput label="العنوان الوطني (مستند)" fieldName="nationalAddressDoc" required />
                    </div>

                    {/* Company Representative Section */}
                    <div className="space-y-5 border rounded-xl p-5 bg-muted/20">
                        <h3 className="font-semibold flex items-center gap-2 text-base">
                            <User className="w-5 h-5 text-primary" />
                            معلومات ممثل الشركة
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="repName">اسم الممثل</Label>
                                <Input
                                    id="repName"
                                    placeholder="اسم ممثل الشركة"
                                    {...register('repName')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repIdentity">رقم هوية الممثل</Label>
                                <Input
                                    id="repIdentity"
                                    placeholder="رقم هوية الممثل"
                                    {...register('repIdentity')}
                                />
                            </div>
                        </div>

                        <FileUploadInput label="مستند هوية الممثل" fieldName="repIdentityDoc" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="repPhone">رقم جوال الممثل</Label>
                                <Input
                                    id="repPhone"
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                    className="text-left"
                                    {...register('repPhone')}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="repEmail">البريد الإلكتروني للممثل</Label>
                                <Input
                                    id="repEmail"
                                    type="email"
                                    placeholder="admin@company.com"
                                    {...register('repEmail')}
                                />
                            </div>
                        </div>

                        {/* Representation Document */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="repDocType">نوع مستند التمثيل</Label>
                                <select
                                    id="repDocType"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
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
