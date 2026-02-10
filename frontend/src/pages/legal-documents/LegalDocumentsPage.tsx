import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FileText, Plus, Search, Trash2, Copy, Eye,
    FileSignature, Scale, ScrollText, Gavel, Send,
    Clock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { legalDocumentsApi } from '@/api/legalDocuments';
import toast from 'react-hot-toast';

const DOC_TYPES: Record<string, { label: string; icon: any; color: string }> = {
    DEFENSE_MEMO: { label: 'مذكرة دفاع', icon: Scale, color: '#3b82f6' },
    REPLY: { label: 'رد على دعوى', icon: ScrollText, color: '#8b5cf6' },
    CONTRACT: { label: 'عقد', icon: FileSignature, color: '#10b981' },
    POWER_OF_ATTORNEY: { label: 'توكيل رسمي', icon: FileText, color: '#f59e0b' },
    APPEAL: { label: 'لائحة اعتراضية', icon: Gavel, color: '#ef4444' },
    COMPLAINT: { label: 'شكوى', icon: AlertCircle, color: '#f97316' },
    LEGAL_OPINION: { label: 'رأي قانوني', icon: Sparkles, color: '#6366f1' },
    SETTLEMENT: { label: 'اتفاقية تسوية', icon: CheckCircle2, color: '#14b8a6' },
    LETTER: { label: 'خطاب رسمي', icon: Send, color: '#64748b' },
    OTHER: { label: 'أخرى', icon: FileText, color: '#94a3b8' },
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    DRAFT: { label: 'مسودة', color: '#64748b', bg: '#f1f5f9' },
    REVIEW: { label: 'قيد المراجعة', color: '#f59e0b', bg: '#fef3c7' },
    FINAL: { label: 'نهائي', color: '#10b981', bg: '#d1fae5' },
    SENT: { label: 'مُرسل', color: '#3b82f6', bg: '#dbeafe' },
    ARCHIVED: { label: 'مؤرشف', color: '#94a3b8', bg: '#f1f5f9' },
};

export default function LegalDocumentsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ['legal-documents', { search, type: filterType, status: filterStatus, page }],
        queryFn: () => legalDocumentsApi.getAll({
            search: search || undefined,
            type: filterType || undefined,
            status: filterStatus || undefined,
            page,
        }),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => legalDocumentsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
            toast.success('تم حذف الوثيقة');
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: string) => legalDocumentsApi.duplicate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['legal-documents'] });
            toast.success('تم نسخ الوثيقة');
        },
    });

    const documents = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">محرر الوثائق القانونية</h1>
                    <p className="text-gray-500 mt-1">إنشاء وتحرير المذكرات والعقود والوثائق القانونية</p>
                </div>
                <button
                    onClick={() => navigate('/legal-documents/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20"
                >
                    <Plus className="w-5 h-5" />
                    وثيقة جديدة
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="البحث في الوثائق..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* Type filter */}
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        <option value="">جميع الأنواع</option>
                        {Object.entries(DOC_TYPES).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        <option value="">جميع الحالات</option>
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <option key={key} value={key}>{val.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-20">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">لا توجد وثائق</h3>
                    <p className="text-gray-400 mt-1">ابدأ بإنشاء وثيقة قانونية جديدة</p>
                    <button
                        onClick={() => navigate('/legal-documents/new')}
                        className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        + إنشاء وثيقة
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {documents.map((doc: any) => {
                        const typeInfo = DOC_TYPES[doc.type] || DOC_TYPES.OTHER;
                        const statusInfo = STATUS_MAP[doc.status] || STATUS_MAP.DRAFT;
                        const TypeIcon = typeInfo.icon;

                        return (
                            <div
                                key={doc.id}
                                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer group"
                                onClick={() => navigate(`/legal-documents/${doc.id}/edit`)}
                            >
                                {/* Type badge + Status */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                                            style={{ backgroundColor: `${typeInfo.color}15` }}
                                        >
                                            <TypeIcon className="w-5 h-5" style={{ color: typeInfo.color }} />
                                        </div>
                                        <span className="text-xs font-medium" style={{ color: typeInfo.color }}>
                                            {typeInfo.label}
                                        </span>
                                    </div>

                                    <span
                                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                                    >
                                        {statusInfo.label}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                    {doc.title}
                                </h3>

                                {/* Meta */}
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(doc.updatedAt).toLocaleDateString('ar-SA')}
                                    </span>
                                    {doc.creator && (
                                        <span>{doc.creator.name}</span>
                                    )}
                                    {doc.aiGenerated && (
                                        <span className="flex items-center gap-1 text-violet-500">
                                            <Sparkles className="w-3 h-3" />
                                            AI
                                        </span>
                                    )}
                                </div>

                                {/* Case link */}
                                {doc.case && (
                                    <div className="mt-2 text-xs text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg inline-block">
                                        {doc.case.caseNumber} - {doc.case.title}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/legal-documents/${doc.id}/edit`); }}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                                        title="تحرير"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(doc.id); }}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                                        title="نسخ"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm('هل تريد حذف هذه الوثيقة؟')) deleteMutation.mutate(doc.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        السابق
                    </button>
                    <span className="text-sm text-gray-500">
                        {page} من {meta.totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                        className="px-4 py-2 rounded-lg border text-sm disabled:opacity-50 hover:bg-gray-50"
                    >
                        التالي
                    </button>
                </div>
            )}
        </div>
    );
}
