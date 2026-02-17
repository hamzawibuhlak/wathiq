import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Plus, Search, FileText, MoreVertical, Trash2, Edit, Eye, ToggleLeft, ToggleRight, Copy, ExternalLink } from 'lucide-react';
import { useForms, useDeleteForm, useUpdateForm } from '@/hooks/useForms';
import toast from 'react-hot-toast';

export default function FormsListPage() {
    const { p } = useSlugPath();
    const [search, setSearch] = useState('');
    const [menuOpen, setMenuOpen] = useState<string | null>(null);

    const { data: forms, isLoading } = useForms({ search: search || undefined });
    const deleteMutation = useDeleteForm();
    const updateMutation = useUpdateForm();

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف النموذج "${name}"؟`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('تم حذف النموذج'),
            onError: (err: any) => toast.error(err.response?.data?.message || 'فشل حذف النموذج'),
        });
        setMenuOpen(null);
    };

    const toggleActive = (id: string, currentStatus: boolean) => {
        updateMutation.mutate(
            { id, data: { isActive: !currentStatus } },
            {
                onSuccess: () => toast.success(currentStatus ? 'تم تعطيل النموذج' : 'تم تفعيل النموذج'),
            },
        );
        setMenuOpen(null);
    };

    const copyLink = (slug: string) => {
        const url = `${window.location.origin}/f/${slug}`;
        navigator.clipboard.writeText(url);
        toast.success('تم نسخ الرابط');
        setMenuOpen(null);
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">النماذج التفاعلية</h1>
                    <p className="text-gray-500 mt-1">إنشاء وإدارة النماذج المخصصة — استمارات بيانات، استبيانات، طلبات</p>
                </div>
                <Link
                    to={p('/forms/new')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    نموذج جديد
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ابحث في النماذج..."
                    className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-20 text-gray-400">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-3" />
                    جاري التحميل...
                </div>
            )}

            {/* Empty State */}
            {!isLoading && (!forms || forms.length === 0) && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد نماذج بعد</h3>
                    <p className="text-gray-400 mb-6">أنشئ نموذجك الأول لجمع البيانات من العملاء</p>
                    <Link
                        to={p('/forms/new')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        إنشاء نموذج
                    </Link>
                </div>
            )}

            {/* Forms Grid */}
            {!isLoading && forms && forms.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {forms.map((form: any) => (
                        <div
                            key={form.id}
                            className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
                        >
                            {/* Color bar */}
                            <div
                                className="h-2"
                                style={{ backgroundColor: form.accentColor || '#3b82f6' }}
                            />

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            to={p(`/forms/${form.id}`)}
                                            className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors block truncate"
                                        >
                                            {form.title}
                                        </Link>
                                        <span className="text-xs text-gray-400 font-mono">{form.code}</span>
                                    </div>

                                    {/* Menu */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpen(menuOpen === form.id ? null : form.id)}
                                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>

                                        {menuOpen === form.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                                <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                                                    <Link
                                                        to={p(`/forms/${form.id}`)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                        onClick={() => setMenuOpen(null)}
                                                    >
                                                        <Edit className="w-4 h-4" /> تعديل
                                                    </Link>
                                                    <Link
                                                        to={p(`/forms/${form.id}/submissions`)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                        onClick={() => setMenuOpen(null)}
                                                    >
                                                        <Eye className="w-4 h-4" /> عرض الإجابات
                                                    </Link>
                                                    <button
                                                        onClick={() => copyLink(form.slug)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-right"
                                                    >
                                                        <Copy className="w-4 h-4" /> نسخ الرابط
                                                    </button>
                                                    <button
                                                        onClick={() => toggleActive(form.id, form.isActive)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-right"
                                                    >
                                                        {form.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                                                        {form.isActive ? 'تعطيل' : 'تفعيل'}
                                                    </button>
                                                    <hr className="my-1" />
                                                    <button
                                                        onClick={() => handleDelete(form.id, form.title)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-right"
                                                    >
                                                        <Trash2 className="w-4 h-4" /> حذف
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {form.description && (
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{form.description}</p>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-4 h-4" />
                                        {form._count?.submissions || 0} إجابة
                                    </span>
                                    {form.case && (
                                        <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                            {form.case.code || form.case.title}
                                        </span>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span
                                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${form.isActive
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}
                                    >
                                        {form.isActive ? 'مفعّل' : 'معطّل'}
                                    </span>

                                    <a
                                        href={`/f/${form.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        فتح الرابط
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
