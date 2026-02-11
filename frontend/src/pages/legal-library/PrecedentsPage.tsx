import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, BookMarked, Eye, ChevronLeft, Calendar, CheckCircle2 } from 'lucide-react';
import { usePrecedents } from '@/hooks/useLegalLibrary';

const COURT_LABELS: Record<string, string> = {
    SUPREME_COURT: 'المحكمة العليا', APPEAL_COURT: 'محكمة الاستئناف',
    GENERAL_COURT: 'المحكمة العامة', COMMERCIAL_COURT: 'المحكمة التجارية',
    LABOR_COURT: 'المحكمة العمالية', ADMINISTRATIVE_COURT: 'المحكمة الإدارية',
    FAMILY_COURT: 'محكمة الأحوال الشخصية', CRIMINAL_COURT: 'المحكمة الجزائية',
};

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
    FOR_PLAINTIFF: { label: 'لصالح المدعي', color: 'bg-green-100 text-green-700' },
    FOR_DEFENDANT: { label: 'لصالح المدعى عليه', color: 'bg-blue-100 text-blue-700' },
    PARTIAL: { label: 'حكم جزئي', color: 'bg-yellow-100 text-yellow-700' },
    DISMISSED: { label: 'رفض الدعوى', color: 'bg-red-100 text-red-700' },
    SETTLEMENT: { label: 'صلح', color: 'bg-purple-100 text-purple-700' },
};

const CASE_TYPES = ['تجاري', 'عمالي', 'أحوال شخصية', 'جزائي', 'إداري', 'مدني', 'عقاري'];

export function PrecedentsPage() {
    const [searchParams] = useSearchParams();
    const [courtType, setCourtType] = useState(searchParams.get('courtType') || '');
    const [caseType, setCaseType] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = usePrecedents({
        courtType: courtType || undefined,
        caseType: caseType || undefined,
        search: search || undefined,
        page,
    });

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">الأحكام القضائية</h1>
                    <p className="text-sm text-gray-500 mt-1">المبادئ القضائية والأحكام السابقة</p>
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
                        placeholder="بحث في الأحكام..."
                        className="w-full h-10 pr-10 pl-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                    />
                </div>
                <select
                    value={courtType}
                    onChange={(e) => { setCourtType(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">جميع المحاكم</option>
                    {Object.entries(COURT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                    ))}
                </select>
                <select
                    value={caseType}
                    onChange={(e) => { setCaseType(e.target.value); setPage(1); }}
                    className="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                >
                    <option value="">جميع التصنيفات</option>
                    {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {/* Results */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 animate-pulse">
                            <div className="w-2/3 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                            <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {data?.data?.map((p: any) => (
                            <Link key={p.id} to={`/legal-library/precedents/${p.id}`}
                                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-purple-300 hover:shadow-sm transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                                                {COURT_LABELS[p.courtType] || p.courtType}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_LABELS[p.outcome]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                {OUTCOME_LABELS[p.outcome]?.label || p.outcome}
                                            </span>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{p.caseType}</span>
                                            {p.isVerified && (
                                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 mb-2 leading-relaxed line-clamp-2">{p.summary}</p>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-400 line-clamp-1">المبدأ: {p.legalPrinciple}</p>
                                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                                            {p.caseNumber && <span>رقم: {p.caseNumber}</span>}
                                            {p.judgmentDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(p.judgmentDate).toLocaleDateString('ar-SA')}
                                                </span>
                                            )}
                                        </div>
                                        {p.keywords?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {p.keywords.slice(0, 4).map((kw: string) => (
                                                    <span key={kw} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">#{kw}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 text-xs flex-shrink-0">
                                        <Eye className="w-3.5 h-3.5" />
                                        {p.viewCount}
                                    </div>
                                </div>
                            </Link>
                        ))}
                        {(!data?.data || data.data.length === 0) && (
                            <div className="text-center py-16">
                                <BookMarked className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد أحكام مطابقة</p>
                            </div>
                        )}
                    </div>

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

export default PrecedentsPage;
