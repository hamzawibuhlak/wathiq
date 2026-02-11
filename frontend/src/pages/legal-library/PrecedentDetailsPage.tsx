import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Eye, CheckCircle2, BookMarked } from 'lucide-react';
import { usePrecedent } from '@/hooks/useLegalLibrary';

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

export function PrecedentDetailsPage() {
    const { id } = useParams();
    const { data: precedent, isLoading } = usePrecedent(id!);

    if (isLoading) {
        return (
            <div className="p-6" dir="rtl">
                <div className="animate-pulse space-y-4">
                    <div className="w-2/3 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!precedent) {
        return <div className="p-8 text-center text-gray-400">الحكم غير موجود</div>;
    }

    return (
        <div className="p-6 max-w-3xl mx-auto" dir="rtl">
            <Link to="/legal-library/precedents" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mb-4">
                الأحكام القضائية <ChevronLeft className="w-4 h-4" />
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {COURT_LABELS[precedent.courtType] || precedent.courtType}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${OUTCOME_LABELS[precedent.outcome]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {OUTCOME_LABELS[precedent.outcome]?.label || precedent.outcome}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{precedent.caseType}</span>
                    {precedent.isVerified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" /> موثق
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
                    <span>المحكمة: {precedent.court}</span>
                    {precedent.caseNumber && <span>رقم القضية: {precedent.caseNumber}</span>}
                    {precedent.circuit && <span>الدائرة: {precedent.circuit}</span>}
                    {precedent.judgmentDate && (
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(precedent.judgmentDate).toLocaleDateString('ar-SA')}
                        </span>
                    )}
                    <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {precedent.viewCount} مشاهدة
                    </span>
                </div>

                <div className="space-y-5">
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">ملخص الحكم</h3>
                        <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                            {precedent.summary}
                        </p>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-2 flex items-center gap-1">
                            <BookMarked className="w-4 h-4" />
                            المبدأ القضائي
                        </h3>
                        <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed whitespace-pre-line">
                            {precedent.legalPrinciple}
                        </p>
                    </div>

                    {precedent.fullText && (
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">النص الكامل</h3>
                            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-line">
                                {precedent.fullText}
                            </p>
                        </div>
                    )}
                </div>

                {precedent.keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                        {precedent.keywords.map((kw: string) => (
                            <span key={kw} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                                #{kw}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default PrecedentDetailsPage;
