import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Scale, Eye, ChevronLeft } from 'lucide-react';
import { useRegulations } from '@/hooks/useLegalLibrary';

const CATEGORY_LABELS: Record<string, string> = {
    CIVIL: 'مدني', COMMERCIAL: 'تجاري', LABOR: 'عمل', CRIMINAL: 'جنائي',
    ADMINISTRATIVE_REG: 'إداري', FAMILY: 'أحوال شخصية', REAL_ESTATE: 'عقاري',
    INTELLECTUAL: 'ملكية فكرية', CORPORATE: 'شركات', BANKING: 'بنكي',
    TAX: 'ضريبي', CYBER: 'معلوماتي', ARBITRATION: 'تحكيم',
    PROCEDURES: 'مرافعات', NOTARY: 'توثيق', OTHER_REG: 'أخرى',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    ACTIVE_REG: { label: 'ساري', color: 'bg-green-100 text-green-700' },
    AMENDED: { label: 'معدَّل', color: 'bg-yellow-100 text-yellow-700' },
    REPEALED: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
    DRAFT_REG: { label: 'مشروع', color: 'bg-gray-100 text-gray-600' },
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
];

export function RegulationsPage() {
    const [searchParams] = useSearchParams();
    const initialCat = searchParams.get('category') || '';
    const [category, setCategory] = useState(initialCat);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useRegulations({ category: category || undefined, search: search || undefined, page });

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">الأنظمة واللوائح</h1>
                    <p className="text-sm text-gray-500 mt-1">تصفح الأنظمة السعودية المعتمدة</p>
                </div>
                <Link to="/legal-library" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    العودة للمكتبة <ChevronLeft className="w-4 h-4" />
                </Link>
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
                            <Link key={reg.id} to={`/legal-library/regulations/${reg.id}`}
                                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
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
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
                                        <Eye className="w-3.5 h-3.5" />
                                        {reg.viewCount}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {(!data?.data || data.data.length === 0) && (
                            <div className="text-center py-16">
                                <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد أنظمة مطابقة</p>
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
        </div>
    );
}

export default RegulationsPage;
