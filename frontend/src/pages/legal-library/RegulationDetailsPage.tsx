import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, ChevronLeft, Search, Eye } from 'lucide-react';
import { useRegulation } from '@/hooks/useLegalLibrary';

const CATEGORY_LABELS: Record<string, string> = {
    CIVIL: 'مدني', COMMERCIAL: 'تجاري', LABOR: 'عمل', CRIMINAL: 'جنائي',
    ADMINISTRATIVE_REG: 'إداري', FAMILY: 'أحوال شخصية', REAL_ESTATE: 'عقاري',
    INTELLECTUAL: 'ملكية فكرية', CORPORATE: 'شركات', BANKING: 'بنكي',
    TAX: 'ضريبي', CYBER: 'معلوماتي', ARBITRATION: 'تحكيم',
    PROCEDURES: 'مرافعات', NOTARY: 'توثيق', OTHER_REG: 'أخرى',
};

export function RegulationDetailsPage() {
    const { id } = useParams();
    const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
    const [searchArticle, setSearchArticle] = useState('');

    const { data: regulation, isLoading } = useRegulation(id!);

    const toggleArticle = (articleId: string) => {
        setExpandedArticles(prev => {
            const next = new Set(prev);
            next.has(articleId) ? next.delete(articleId) : next.add(articleId);
            return next;
        });
    };

    const expandAll = () => {
        setExpandedArticles(new Set(regulation?.articles?.map((a: any) => a.id)));
    };

    const collapseAll = () => {
        setExpandedArticles(new Set());
    };

    const filteredArticles = regulation?.articles?.filter((a: any) =>
        !searchArticle || a.number.includes(searchArticle) || a.content.includes(searchArticle) || a.title?.includes(searchArticle)
    );

    if (isLoading) {
        return (
            <div className="p-6" dir="rtl">
                <div className="animate-pulse space-y-4">
                    <div className="w-2/3 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-1/3 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!regulation) {
        return <div className="p-8 text-center text-gray-400">النظام غير موجود</div>;
    }

    return (
        <div className="p-6" dir="rtl">
            {/* Back link */}
            <Link to="/legal-library/regulations" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-4">
                الأنظمة <ChevronLeft className="w-4 h-4" />
            </Link>

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                {CATEGORY_LABELS[regulation.category] || regulation.category}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${regulation.status === 'ACTIVE_REG' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {regulation.status === 'ACTIVE_REG' ? 'ساري' : regulation.status === 'AMENDED' ? 'معدَّل' : regulation.status}
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{regulation.title}</h1>
                        {regulation.titleEn && <p className="text-gray-500 text-sm mb-3">{regulation.titleEn}</p>}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            {regulation.number && <span>رقم المرسوم: {regulation.number}</span>}
                            {regulation.issuedBy && <span>الجهة: {regulation.issuedBy}</span>}
                            {regulation.issuedDate && (
                                <span>الإصدار: {new Date(regulation.issuedDate).toLocaleDateString('ar-SA')}</span>
                            )}
                            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {regulation.viewCount} مشاهدة</span>
                            <span>{regulation.articles?.length || 0} مادة</span>
                        </div>
                    </div>
                </div>
                {regulation.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-3 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-3">
                        {regulation.description}
                    </p>
                )}
                {regulation.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {regulation.tags.map((tag: string) => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Articles Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">المواد ({regulation.articles?.length || 0})</h2>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            value={searchArticle}
                            onChange={(e) => setSearchArticle(e.target.value)}
                            placeholder="بحث في المواد..."
                            className="pr-8 pl-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm outline-none bg-transparent text-gray-900 dark:text-white focus:border-indigo-400 w-48"
                        />
                    </div>
                    <button onClick={expandAll} className="text-sm text-indigo-600 hover:underline">توسيع الكل</button>
                    <button onClick={collapseAll} className="text-sm text-gray-500 hover:underline">طي الكل</button>
                </div>
            </div>

            {/* Articles */}
            <div className="space-y-2">
                {filteredArticles?.map((article: any) => (
                    <div key={article.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <button
                            onClick={() => toggleArticle(article.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-right"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {article.number}
                                </span>
                                <div>
                                    {article.title && <p className="font-medium text-gray-900 dark:text-white text-sm">{article.title}</p>}
                                    {!expandedArticles.has(article.id) && (
                                        <p className="text-gray-500 text-xs line-clamp-1">{article.content.substring(0, 100)}...</p>
                                    )}
                                </div>
                            </div>
                            {expandedArticles.has(article.id)
                                ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            }
                        </button>
                        {expandedArticles.has(article.id) && (
                            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line pt-3">
                                    {article.content}
                                </p>
                                {article.notes && (
                                    <p className="text-gray-400 text-xs mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                                        ملاحظة: {article.notes}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {(!filteredArticles || filteredArticles.length === 0) && (
                    <p className="text-center text-gray-400 py-8">لا توجد مواد مطابقة</p>
                )}
            </div>
        </div>
    );
}

export default RegulationDetailsPage;
