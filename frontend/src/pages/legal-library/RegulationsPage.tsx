import { useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Search, Scale, Eye, ChevronLeft, Plus, X, Loader2, Trash2, Upload, FileText } from 'lucide-react';
import { useRegulations, useCreateRegulation, useDeleteRegulation } from '@/hooks/useLegalLibrary';
import toast from 'react-hot-toast';
import api from '@/api/client';

const CATEGORY_LABELS: Record<string, string> = {
    CIVIL: 'مدني', COMMERCIAL: 'تجاري', LABOR: 'عمل', CRIMINAL: 'جنائي',
    ADMINISTRATIVE_REG: 'إداري', FAMILY: 'أحوال شخصية', REAL_ESTATE: 'عقاري',
    INTELLECTUAL: 'ملكية فكرية', CORPORATE: 'شركات', BANKING: 'بنكي',
    TAX: 'ضريبي', CYBER: 'معلوماتي', ARBITRATION: 'تحكيم',
    PROCEDURES: 'مرافعات', NOTARY: 'توثيق', OTHER_REG: 'أخرى'
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ACTIVE_REG: { label: 'ساري', color: 'bg-green-100 text-green-700' },
    AMENDED: { label: 'معدَّل', color: 'bg-yellow-100 text-yellow-700' },
    REPEALED: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    DRAFT_REG: { label: 'مشروع', color: 'bg-gray-100 text-gray-600' }
};

const CATEGORIES = [
    { value: '', label: 'جميع الفئات' },
    { value: 'LABOR', label: 'عمل' },
    { value: 'CORPORATE', label: 'شركات' },
    { value: 'FAMILY', label: 'أحوال شخصية' },
    { value: 'PROCEDURES', label: 'مرافعات' },
    { value: 'TAX', label: 'ضريبي' },
    { value: 'REAL_ESTATE', label: 'عقاري' },
    { value: 'ARBITRATION', label: 'تحكيم' },
    { value: 'CYBER', label: 'معلوماتي' },
    { value: 'COMMERCIAL', label: 'تجاري' },
    { value: 'CRIMINAL', label: 'جنائي' },
    { value: 'CIVIL', label: 'مدني' },
    { value: 'BANKING', label: 'بنكي' },
    { value: 'NOTARY', label: 'توثيق' },
    { value: 'ADMINISTRATIVE_REG', label: 'إداري' },
    { value: 'INTELLECTUAL', label: 'ملكية فكرية' },
    { value: 'OTHER_REG', label: 'أخرى' },
];

export function RegulationsPage() {
    const { p: slugPath } = useSlugPath();
    const [searchParams] = useSearchParams();
    const initialCat = searchParams.get('category') || '';
    const [category, setCategory] = useState(initialCat);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);

    const { data, isLoading } = useRegulations({ category: category || undefined, search: search || undefined, page });
    const deleteMutation = useDeleteRegulation();

    const handleDelete = (id: string, title: string) => {
        if (!confirm(`هل أنت متأكد من حذف "${title}"؟`)) return;
        deleteMutation.mutate(id, {
            onSuccess: () => toast.success('تم حذف النظام'),
            onError: () => toast.error('فشل حذف النظام'),
        });
    };

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">الأنظمة واللوائح</h1>
                    <p className="text-sm text-gray-500 mt-1">تصفح الأنظمة السعودية المعتمدة</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        إضافة نظام
                    </button>
                    <Link to={slugPath('/legal-library')} className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                        العودة للمكتبة <ChevronLeft className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        placeholder="بحث بالاسم أو الكلمات..."
                        className="w-full h-10 pr-10 pl-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm min-w-[140px] text-gray-900 dark:text-white"
                >
                    {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
                            <div className="w-2/3 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                            <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {data?.data?.map((reg: any) => (
                            <div key={reg.id}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <Link to={slugPath(`/legal-library/regulations/${reg.id}`)} className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                                {CATEGORY_LABELS[reg.category] || reg.category}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_LABELS[reg.status]?.color || 'bg-gray-100 text-gray-500'}`}>
                                                {STATUS_LABELS[reg.status]?.label || reg.status}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{reg.title}</h3>
                                        {reg.titleEn && <p className="text-xs text-gray-400 mb-2">{reg.titleEn}</p>}
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                            {reg.number && <span>رقم: {reg.number}</span>}
                                            {reg.issuedBy && <span>الجهة: {reg.issuedBy}</span>}
                                            {reg.issuedDate && <span>الإصدار: {new Date(reg.issuedDate).toLocaleDateString('ar-SA')}</span>}
                                            <span>{reg._count?.articles || 0} مادة</span>
                                        </div>
                                        {reg.tags?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {reg.tags.slice(0, 4).map((tag: string) => (
                                                    <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                    </Link>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className="flex items-center gap-1 text-gray-400 text-xs">
                                            <Eye className="w-3.5 h-3.5" />
                                            {reg.viewCount}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(reg.id, reg.title)}
                                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                            title="حذف النظام"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!data?.data || data.data.length === 0) && (
                            <div className="text-center py-16">
                                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد أنظمة مطابقة</p>
                                <button
                                    onClick={() => setShowCreate(true)}
                                    className="mt-4 text-indigo-600 hover:underline text-sm"
                                >
                                    إضافة نظام جديد
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {data?.meta && data.meta.total > 20 && (
                        <div className="flex justify-center gap-2 mt-6">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50">السابق</button>
                            <span className="flex items-center px-4 text-sm text-gray-500">صفحة {page}</span>
                            <button onClick={() => setPage(p => p + 1)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">التالي</button>
                        </div>
                    )}
                </>
            )}

            {/* Create Modal */}
            {showCreate && <CreateRegulationModal onClose={() => setShowCreate(false)} />}
        </div>
    );
}

// ─── Helper: check if URL is an image ──────────────
function isImageUrl(url: string) {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(url);
}

// ─── Create Regulation Modal ──────────────────────
function CreateRegulationModal({ onClose }: { onClose: () => void }) {
    const createMutation = useCreateRegulation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [attachments, setAttachments] = useState<string[]>([]);
    const [form, setForm] = useState({
        title: '',
        titleEn: '',
        number: '',
        issuedBy: '',
        issuedDate: '',
        effectiveDate: '',
        category: 'LABOR',
        status: 'ACTIVE_REG',
        description: '',
        content: '',
        source: '',
        version: '',
        tags: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length) return;

        setUploading(true);
        const newAttachments: string[] = [];

        for (const file of Array.from(files)) {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/uploads/document', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                if (res.data?.url) {
                    newAttachments.push(res.data.url);
                }
            } catch {
                toast.error(`فشل رفع الملف: ${file.name}`);
            }
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        setUploading(false);
        if (newAttachments.length > 0) {
            toast.success(`تم رفع ${newAttachments.length} ملف بنجاح`);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            toast.error('العنوان والمحتوى مطلوبان');
            return;
        }

        createMutation.mutate({
            ...form,
            tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            attachments,
        }, {
            onSuccess: () => {
                toast.success('تم إضافة النظام بنجاح');
                onClose();
            },
            onError: () => toast.error('فشل إضافة النظام'),
        });
    };

    const inputClass = "w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:border-indigo-400 text-gray-900 dark:text-white";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Scale className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">إضافة نظام جديد</h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl"><X className="w-5 h-5" /></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
                    {/* Row 1: Title */}
                    <div>
                        <label className={labelClass}>عنوان النظام *</label>
                        <input name="title" value={form.title} onChange={handleChange} className={inputClass}
                            placeholder="مثال: نظام العمل" required />
                    </div>

                    {/* Row 2: Title EN + Number */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>العنوان بالإنجليزية</label>
                            <input name="titleEn" value={form.titleEn} onChange={handleChange} className={inputClass}
                                placeholder="Labor Law" dir="ltr" />
                        </div>
                        <div>
                            <label className={labelClass}>رقم النظام</label>
                            <input name="number" value={form.number} onChange={handleChange} className={inputClass}
                                placeholder="مثال: م/51" />
                        </div>
                    </div>

                    {/* Row 3: Category + Status */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>الفئة *</label>
                            <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                                {CATEGORIES.filter(c => c.value).map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>الحالة</label>
                            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                                <option value="ACTIVE_REG">ساري</option>
                                <option value="AMENDED">معدَّل</option>
                                <option value="REPEALED">ملغي</option>
                                <option value="DRAFT_REG">مشروع</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 4: Issued By + Issued Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>الجهة المصدرة</label>
                            <input name="issuedBy" value={form.issuedBy} onChange={handleChange} className={inputClass}
                                placeholder="مثال: مجلس الوزراء" />
                        </div>
                        <div>
                            <label className={labelClass}>تاريخ الإصدار</label>
                            <input name="issuedDate" type="date" value={form.issuedDate} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>

                    {/* Row 5: Source + Version */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>المصدر</label>
                            <input name="source" value={form.source} onChange={handleChange} className={inputClass}
                                placeholder="مثال: هيئة الخبراء" />
                        </div>
                        <div>
                            <label className={labelClass}>الإصدار / النسخة</label>
                            <input name="version" value={form.version} onChange={handleChange} className={inputClass}
                                placeholder="مثال: 1.0" />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>وصف مختصر</label>
                        <textarea name="description" value={form.description} onChange={handleChange} rows={2}
                            className={`${inputClass} h-auto py-2`}
                            placeholder="وصف مختصر للنظام..." />
                    </div>

                    {/* Content */}
                    <div>
                        <label className={labelClass}>محتوى النظام *</label>
                        <textarea name="content" value={form.content} onChange={handleChange} rows={6}
                            className={`${inputClass} h-auto py-2`}
                            placeholder="نص النظام الكامل أو ملخص المواد..." required />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className={labelClass}>الكلمات المفتاحية</label>
                        <input name="tags" value={form.tags} onChange={handleChange} className={inputClass}
                            placeholder="عمل, عقود, إجازات (مفصولة بفاصلة)" />
                    </div>

                    {/* File Uploads */}
                    <div>
                        <label className={labelClass}>المرفقات (ملفات وصور)</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="regulation-files"
                            />
                            <label htmlFor="regulation-files" className="cursor-pointer flex flex-col items-center gap-2">
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-400" />
                                )}
                                <span className="text-sm text-gray-500">
                                    {uploading ? 'جاري الرفع...' : 'اضغط لرفع ملفات أو صور'}
                                </span>
                                <span className="text-xs text-gray-400">PDF, Word, Excel, صور</span>
                            </label>
                        </div>

                        {/* Uploaded files preview */}
                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((url, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-2.5">
                                        {isImageUrl(url) ? (
                                            <img src={url} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                        ) : (
                                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/50 rounded flex items-center justify-center flex-shrink-0">
                                                <FileText className="w-5 h-5 text-indigo-600" />
                                            </div>
                                        )}
                                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                            {decodeURIComponent(url.split('/').pop() || 'ملف')}
                                        </span>
                                        <button type="button" onClick={() => removeAttachment(idx)}
                                            className="text-gray-400 hover:text-red-500 p-1">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={onClose}
                            className="px-5 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 dark:text-gray-300">
                            إلغاء
                        </button>
                        <button type="submit" disabled={createMutation.isPending || uploading}
                            className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            إضافة النظام
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegulationsPage;
