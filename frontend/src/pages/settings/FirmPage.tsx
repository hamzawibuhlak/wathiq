import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Camera, Save } from 'lucide-react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { useFirmSettings, useUpdateFirmSettings, useUploadFirmLogo } from '@/hooks/use-settings';

const firmSchema = z.object({
    name: z.string().min(2, 'اسم المكتب مطلوب'),
    email: z.string().email('البريد الإلكتروني غير صالح').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    taxNumber: z.string().optional(),
    commercialReg: z.string().optional(),
    website: z.string().url('رابط غير صالح').optional().or(z.literal('')),
});

type FirmFormData = z.infer<typeof firmSchema>;

export function FirmPage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const { data: firmData, isLoading } = useFirmSettings();
    const updateMutation = useUpdateFirmSettings();
    const uploadLogoMutation = useUploadFirmLogo();

    const firm = firmData?.data;

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
    } = useForm<FirmFormData>({
        resolver: zodResolver(firmSchema),
        defaultValues: {
            name: firm?.name || '',
            email: firm?.email || '',
            phone: firm?.phone || '',
            address: firm?.address || '',
            city: firm?.city || '',
            taxNumber: firm?.taxNumber || '',
            commercialReg: firm?.commercialReg || '',
            website: firm?.website || '',
        },
        values: firm ? {
            name: firm.name || '',
            email: firm.email || '',
            phone: firm.phone || '',
            address: firm.address || '',
            city: firm.city || '',
            taxNumber: firm.taxNumber || '',
            commercialReg: firm.commercialReg || '',
            website: firm.website || '',
        } : undefined,
    });

    const onSubmit = (data: FirmFormData) => {
        updateMutation.mutate(data);
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoPreview(URL.createObjectURL(file));
            uploadLogoMutation.mutate(file);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 space-y-6 animate-pulse">
                <div className="h-32 bg-muted rounded-lg" />
                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="w-24 h-4 bg-muted rounded" />
                            <div className="w-full h-10 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Logo Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        شعار المكتب
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden bg-muted/50">
                                {logoPreview || firm?.logo ? (
                                    <img
                                        src={logoPreview || firm?.logo}
                                        alt={firm?.name}
                                        className="w-full h-full object-contain p-2"
                                    />
                                ) : (
                                    <Building2 className="w-12 h-12 text-muted-foreground/50" />
                                )}
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-2 left-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoChange}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{firm?.name || 'اسم المكتب'}</h3>
                            <p className="text-sm text-muted-foreground">
                                الشعار سيظهر على الفواتير والمستندات الرسمية
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                أفضل أبعاد: 512x512 بكسل (PNG أو SVG)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Firm Info Form */}
            <Card>
                <CardHeader>
                    <CardTitle>معلومات المكتب</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground">المعلومات الأساسية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">اسم المكتب *</Label>
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        error={errors.name?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="website">الموقع الإلكتروني</Label>
                                    <Input
                                        id="website"
                                        type="url"
                                        dir="ltr"
                                        className="text-left"
                                        placeholder="https://example.com"
                                        {...register('website')}
                                        error={errors.website?.message}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground">معلومات الاتصال</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">البريد الإلكتروني</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        {...register('email')}
                                        error={errors.email?.message}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        dir="ltr"
                                        className="text-right"
                                        placeholder="+966 XX XXX XXXX"
                                        {...register('phone')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">المدينة</Label>
                                    <Input
                                        id="city"
                                        {...register('city')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">العنوان</Label>
                                    <Input
                                        id="address"
                                        {...register('address')}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Legal Info */}
                        <div className="space-y-4">
                            <h3 className="font-medium text-sm text-muted-foreground">المعلومات القانونية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="commercialReg">السجل التجاري</Label>
                                    <Input
                                        id="commercialReg"
                                        {...register('commercialReg')}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="taxNumber">الرقم الضريبي</Label>
                                    <Input
                                        id="taxNumber"
                                        {...register('taxNumber')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <Button
                                type="submit"
                                isLoading={updateMutation.isPending}
                                disabled={!isDirty}
                            >
                                <Save className="w-4 h-4 ml-2" />
                                حفظ التغييرات
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default FirmPage;
