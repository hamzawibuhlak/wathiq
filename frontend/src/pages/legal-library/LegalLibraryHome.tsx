import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, BookOpen, Scale, BookMarked, Hash, Eye } from 'lucide-react';
import { useLibraryStats, useGlobalSearch } from '@/hooks/useLegalLibrary';

const CATEGORY_LABELS: Record<string, string> = {
    CIVIL: 'مدني', COMMERCIAL: 'تجاري', LABOR: 'عمل', CRIMINAL: 'جنائي',
    ADMINISTRATIVE_REG: 'إداري', FAMILY: 'أحوال شخصية', REAL_ESTATE: 'عقاري',
    INTELLECTUAL: 'ملكية فكرية', CORPORATE: 'شركات', BANKING: 'بنكي',
    TAX: 'ضريبي', CYBER: 'معلوماتي', ARBITRATION: 'تحكيم',
    PROCEDURES: 'مرافعات', NOTARY: 'توثيق', OTHER_REG: 'أخرى',
};

const QUICK_CATS = [
    { label: 'نظام العمل', icon: '👷', cat: 'LABOR', color: 'bg-blue-50 border-blue-200 hover:bg-blue-100' },
    { label: 'نظام الشركات', icon: '🏢', cat: 'CORPORATE', color: 'bg-purple-50 border-purple-200 hover:bg-purple-100' },
    { label: 'الأحوال الشخصية', icon: '👨‍👩‍👧', cat: 'FAMILY', color: 'bg-pink-50 border-pink-200 hover:bg-pink-100' },
    { label: 'نظام المرافعات', icon: '⚖️', cat: 'PROCEDURES', color: 'bg-amber-50 border-amber-200 hover:bg-amber-100' },
    { label: 'الضرائب', icon: '💰', cat: 'TAX', color: 'bg-green-50 border-green-200 hover:bg-green-100' },
    { label: 'العقارات', icon: '🏠', cat: 'REAL_ESTATE', color: 'bg-orange-50 border-orange-200 hover:bg-orange-100' },
    { label: 'التحكيم', icon: '🤝', cat: 'ARBITRATION', color: 'bg-teal-50 border-teal-200 hover:bg-teal-100' },
    { label: 'الجرائم الإلكترونية', icon: '💻', cat: 'CYBER', color: 'bg-red-50 border-red-200 hover:bg-red-100' },
];

export function LegalLibraryHome() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAiSearch, setShowAiSearch] = useState(false);
    const { data: stats } = useLibraryStats();
    const { data: searchResults } = useGlobalSearch(searchQuery);

    return (
        <div className="p-6 lg:p-8 max-w-5xl mx-auto" dir="rtl">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المكتبة القانونية السعودية</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">الأنظمة • الأحكام القضائية • المصطلحات القانونية</p>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                        <Scale className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.regulations || 0}</div>
                        <div className="text-sm text-gray-500">نظام ولائحة</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                        <BookMarked className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.precedents || 0}</div>
                        <div className="text-sm text-gray-500">حكم قضائي</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
                        <Hash className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.terms || 0}</div>
                        <div className="text-sm text-gray-500">مصطلح قانوني</div>
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative mb-8">
                <div className="flex items-center bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl shadow-sm overflow-hidden focus-within:border-indigo-400 transition-colors">
                    <Search className="w-5 h-5 text-gray-400 mr-4 flex-shrink-0" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="ابحث في الأنظمة والأحكام والمصطلحات..."
                        className="flex-1 py-4 text-base outline-none bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                    <button
                        onClick={() => setShowAiSearch(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-4 text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Sparkles className="w-4 h-4" />
                        بحث ذكي AI
                    </button>
                </div>

                {/* Dropdown Search Results */}
                {searchQuery.length > 2 && searchResults && (
                    <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
                        {searchResults.regulations?.length > 0 && (
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                                    <Scale className="w-3 h-3" /> الأنظمة
                                </p>
                                {searchResults.regulations.map((r: any) => (
                                    <Link key={r.id} to={`/legal-library/regulations/${r.id}`}
                                        className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                                        {r.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                        {searchResults.precedents?.length > 0 && (
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                                    <BookMarked className="w-3 h-3" /> الأحكام
                                </p>
                                {searchResults.precedents.map((p: any) => (
                                    <Link key={p.id} to={`/legal-library/precedents/${p.id}`}
                                        className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                                        {p.court} — {p.caseType}
                                    </Link>
                                ))}
                            </div>
                        )}
                        {searchResults.terms?.length > 0 && (
                            <div className="p-3">
                                <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> المصطلحات
                                </p>
                                {searchResults.terms.map((t: any) => (
                                    <Link key={t.id} to={`/legal-library/glossary`}
                                        className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200">
                                        {t.termAr} — {t.termEn}
                                    </Link>
                                ))}
                            </div>
                        )}
                        {!searchResults.regulations?.length && !searchResults.precedents?.length && !searchResults.terms?.length && (
                            <div className="p-6 text-center text-gray-400 text-sm">لا توجد نتائج</div>
                        )}
                    </div>
                )}
            </div>

            {/* Quick Access Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {QUICK_CATS.map(cat => (
                    <Link key={cat.cat} to={`/legal-library/regulations?category=${cat.cat}`}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${cat.color} transition-all`}>
                        <span className="text-2xl">{cat.icon}</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</span>
                    </Link>
                ))}
            </div>

            {/* Most Viewed Regulations */}
            {stats?.popular?.length > 0 && (
                <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4">الأنظمة الأكثر مشاهدة</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {stats.popular.map((reg: any) => (
                            <Link key={reg.id} to={`/legal-library/regulations/${reg.id}`}
                                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{reg.title}</p>
                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                            {CATEGORY_LABELS[reg.category] || reg.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 text-xs">
                                        <Eye className="w-3.5 h-3.5" />
                                        {reg.viewCount}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick links */}
            <div className="mt-8 grid grid-cols-3 gap-3">
                <Link to="/legal-library/regulations"
                    className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-center hover:bg-indigo-100 transition-colors">
                    <Scale className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">تصفح الأنظمة</p>
                </Link>
                <Link to="/legal-library/precedents"
                    className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-center hover:bg-purple-100 transition-colors">
                    <BookMarked className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-300">الأحكام القضائية</p>
                </Link>
                <Link to="/legal-library/glossary"
                    className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-center hover:bg-emerald-100 transition-colors">
                    <Hash className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">المصطلحات القانونية</p>
                </Link>
            </div>

            {/* AI Search Modal */}
            {showAiSearch && <AiSearchModal onClose={() => setShowAiSearch(false)} />}
        </div>
    );
}

// AI Search Modal (inline)
function AiSearchModal({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { legalLibraryApi } = require('@/api/legalLibrary');

    const QUICK_QUESTIONS = [
        'ما هي مدة الإشعار المسبق عند إنهاء عقد العمل؟',
        'ما هي شروط تأسيس شركة ذات مسؤولية محدودة؟',
        'ما هي مواعيد الطعن بالاستئناف؟',
        'ما حقوق العامل عند الفصل التعسفي؟',
        'كيف يتم احتساب مكافأة نهاية الخدمة؟',
    ];

    const handleSearch = async (q: string) => {
        if (!q.trim()) return;
        setQuery(q);
        setLoading(true);
        try {
            const res = await legalLibraryApi.aiSearch(q);
            setResult(res);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">البحث القانوني الذكي</h3>
                            <p className="text-xs text-gray-400">اسأل بالعربية — النظام يجيب من المصادر</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                </div>
                <div className="flex-1 overflow-auto p-5">
                    <div className="flex gap-2 mb-5">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                            placeholder="مثال: ما هي حقوق العامل عند إنهاء عقد العمل؟"
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-sm outline-none bg-transparent text-gray-900 dark:text-white focus:border-indigo-400"
                            autoFocus
                        />
                        <button
                            onClick={() => handleSearch(query)}
                            disabled={loading || !query.trim()}
                            className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                        >
                            بحث
                        </button>
                    </div>

                    {!result && !loading && (
                        <div>
                            <p className="text-xs text-gray-400 mb-3">أسئلة شائعة:</p>
                            <div className="flex flex-col gap-2">
                                {QUICK_QUESTIONS.map(q => (
                                    <button key={q} onClick={() => handleSearch(q)}
                                        className="text-right px-4 py-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-700 transition-colors">
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-12 gap-3 text-indigo-600">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                            <span className="text-sm">يبحث في المكتبة القانونية...</span>
                        </div>
                    )}

                    {result && (
                        <div>
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-600" />
                                    <span className="font-medium text-indigo-900 dark:text-indigo-300 text-sm">الإجابة القانونية</span>
                                </div>
                                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                                    {result.aiAnswer}
                                </p>
                            </div>
                            {(result.sources?.regulations?.length > 0 || result.sources?.precedents?.length > 0) && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-3">المصادر المستخدمة:</p>
                                    <div className="flex flex-col gap-2">
                                        {result.sources?.regulations?.map((r: any) => (
                                            <Link key={r.id} to={`/legal-library/regulations/${r.id}`} onClick={onClose}
                                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-indigo-300">
                                                <Scale className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                                {r.title}
                                            </Link>
                                        ))}
                                        {result.sources?.precedents?.map((p: any) => (
                                            <Link key={p.id} to={`/legal-library/precedents/${p.id}`} onClick={onClose}
                                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:border-indigo-300">
                                                <BookMarked className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                                {p.court} — {p.caseType}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default LegalLibraryHome;
