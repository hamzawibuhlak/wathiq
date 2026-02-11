import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Hash, ChevronLeft } from 'lucide-react';
import { useTerms } from '@/hooks/useLegalLibrary';

const ARABIC_LETTERS = ['أ', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن', 'ه', 'و', 'ي'];

export function GlossaryPage() {
    const [search, setSearch] = useState('');
    const [selectedLetter, setSelectedLetter] = useState('');
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

    const { data: terms, isLoading } = useTerms({
        search: search || undefined,
        letter: selectedLetter || undefined,
    });

    return (
        <div className="p-6" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">المصطلحات القانونية</h1>
                    <p className="text-sm text-gray-500 mt-1">المعجم القانوني السعودي</p>
                </div>
                <Link to="/legal-library" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    العودة للمكتبة <ChevronLeft className="w-4 h-4" />
                </Link>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSelectedLetter(''); }}
                    placeholder="ابحث عن مصطلح..."
                    className="w-full h-10 pr-10 pl-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm outline-none focus:border-indigo-400 text-gray-900 dark:text-white"
                />
            </div>

            {/* Letter Filter */}
            <div className="flex flex-wrap gap-1.5 mb-6">
                <button
                    onClick={() => setSelectedLetter('')}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${!selectedLetter ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-50'}`}
                >
                    الكل
                </button>
                {ARABIC_LETTERS.map(letter => (
                    <button
                        key={letter}
                        onClick={() => { setSelectedLetter(letter); setSearch(''); }}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${selectedLetter === letter ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-indigo-50'}`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {/* Terms */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 animate-pulse">
                            <div className="w-1/3 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                            <div className="w-2/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {terms?.map((term: any) => (
                        <div key={term.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-emerald-300 transition-all">
                            <button
                                onClick={() => setExpandedTerm(expandedTerm === term.id ? null : term.id)}
                                className="w-full flex items-center justify-between p-4 text-right"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Hash className="w-5 h-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{term.termAr}</p>
                                        {term.termEn && <p className="text-xs text-gray-400">{term.termEn}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {term.category && (
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">{term.category}</span>
                                    )}
                                </div>
                            </button>
                            {expandedTerm === term.id && (
                                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-line pt-3 mb-2">
                                        {term.definition}
                                    </p>
                                    {term.example && (
                                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-300">
                                            <span className="font-medium">مثال:</span> {term.example}
                                        </div>
                                    )}
                                    {term.relatedTerms?.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            <span className="text-xs text-gray-400">مصطلحات ذات صلة:</span>
                                            {term.relatedTerms.map((rt: string) => (
                                                <span key={rt} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{rt}</span>
                                            ))}
                                        </div>
                                    )}
                                    {term.source && (
                                        <p className="text-xs text-gray-400 mt-2">المصدر: {term.source}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {(!terms || terms.length === 0) && (
                        <div className="text-center py-16">
                            <Hash className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">لا توجد مصطلحات مطابقة</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default GlossaryPage;
