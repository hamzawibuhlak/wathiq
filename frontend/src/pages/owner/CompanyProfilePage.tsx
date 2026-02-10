import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { Building2, Save, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CompanyProfilePage() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery({
        queryKey: ['owner-company'],
        queryFn: ownerApi.getCompanyProfile,
    });

    const [form, setForm] = useState<any>(null);

    // Sync form with fetched data
    if (profile && !form) {
        setForm({ ...profile });
    }

    const updateMutation = useMutation({
        mutationFn: (data: any) => ownerApi.updateCompanyProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-company'] });
            toast.success('تم حفظ بيانات الشركة');
        },
        onError: () => toast.error('فشل حفظ البيانات'),
    });

    const handleSave = () => {
        if (form) {
            const { id, tenantId, updatedAt, ...data } = form;
            updateMutation.mutate(data);
        }
    };

    if (isLoading || !form) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-amber-600" />
                        ملف الشركة
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">بيانات المؤسسة والهوية البصرية</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
            </div>

            {/* Company Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">البيانات الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="الاسم القانوني" value={form.legalName} onChange={(v) => setForm({ ...form, legalName: v })} />
                    <Field label="الاسم بالعربي" value={form.legalNameAr || ''} onChange={(v) => setForm({ ...form, legalNameAr: v })} />
                    <Field label="السجل التجاري" value={form.commercialRegNo || ''} onChange={(v) => setForm({ ...form, commercialRegNo: v })} />
                    <Field label="الرقم الضريبي" value={form.vatNumber || ''} onChange={(v) => setForm({ ...form, vatNumber: v })} />
                    <Field label="رقم الترخيص" value={form.licenseNumber || ''} onChange={(v) => setForm({ ...form, licenseNumber: v })} />
                </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-900 mb-4">التواصل</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="الموقع الإلكتروني" value={form.website || ''} onChange={(v) => setForm({ ...form, website: v })} />
                    <Field label="الهاتف" value={form.phone || ''} onChange={(v) => setForm({ ...form, phone: v })} />
                    <Field label="البريد الإلكتروني" value={form.email || ''} onChange={(v) => setForm({ ...form, email: v })} />
                    <Field label="المدينة" value={form.city || ''} onChange={(v) => setForm({ ...form, city: v })} />
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
                    <textarea
                        value={form.address || ''}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                    />
                </div>
            </div>

            {/* Branding */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-600" />
                    الهوية البصرية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اللون الأساسي</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={form.primaryColor || '#1a56db'}
                                onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                                className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                            />
                            <span className="text-sm text-gray-500">{form.primaryColor || '#1a56db'}</span>
                        </div>
                    </div>
                    <Field label="رابط الشعار" value={form.logoUrl || ''} onChange={(v) => setForm({ ...form, logoUrl: v })} placeholder="https://..." />
                </div>
            </div>

            {/* System Settings */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-4">⚙️ إعدادات النظام</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة الزمنية</label>
                        <select
                            value={form.timezone || 'Asia/Riyadh'}
                            onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                            <option value="Asia/Riyadh">الرياض (GMT+3)</option>
                            <option value="Asia/Dubai">دبي (GMT+4)</option>
                            <option value="Asia/Kuwait">الكويت (GMT+3)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">اللغة</label>
                        <select
                            value={form.language || 'ar'}
                            onChange={(e) => setForm({ ...form, language: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                            <option value="ar">العربية</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">تنسيق التاريخ</label>
                        <select
                            value={form.dateFormat || 'DD/MM/YYYY'}
                            onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        >
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
        </div>
    );
}
