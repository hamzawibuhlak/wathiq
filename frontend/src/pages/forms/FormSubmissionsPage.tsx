import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ArrowRight, Search, MessageSquare, ChevronDown, ChevronUp, User, Mail, Phone, Calendar } from 'lucide-react';
import { useFormSubmissions, useUpdateSubmissionStatus } from '@/hooks/useForms';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'جديد', color: 'bg-blue-100 text-blue-700' },
    { value: 'REVIEWED', label: 'تمت المراجعة', color: 'bg-amber-100 text-amber-700' },
    { value: 'PROCESSED', label: 'تم المعالجة', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'REJECTED', label: 'مرفوض', color: 'bg-red-100 text-red-700' },
];

export default function FormSubmissionsPage() {
    const { id } = useParams();
    const { p } = useSlugPath();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const { data, isLoading } = useFormSubmissions(id || '', { search: search || undefined, status: statusFilter || undefined });
    const updateStatusMutation = useUpdateSubmissionStatus();

    const form = data?.form;
    const submissions = data?.submissions || [];

    const handleStatusChange = (submissionId: string, status: string) => {
        updateStatusMutation.mutate(
            { submissionId, data: { status } },
            {
                onSuccess: () => toast.success('تم تحديث الحالة'),
                onError: () => toast.error('فشل تحديث الحالة'),
            },
        );
    };

    const getStatusBadge = (status: string) => {
        const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
        return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${opt.color}`}>{opt.label}</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link to={p('/forms')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">
                        إجابات: {form?.title || '...'}
                    </h1>
                    <p className="text-sm text-gray-400">{submissions.length} إجابة</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو البريد..."
                        className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">كل الحالات</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-20 text-gray-400">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-3" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && submissions.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد إجابات بعد</h3>
                    <p className="text-gray-400">شارك رابط النموذج مع العملاء لتلقي الإجابات</p>
                </div>
            )}

            {/* Submissions List */}
            {!isLoading && submissions.length > 0 && (
                <div className="space-y-3">
                    {submissions.map((sub: any) => (
                        <div key={sub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Header Row */}
                            <button
                                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-right"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 text-sm truncate">
                                            {sub.submitterName || 'مجهول'}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{sub.code}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {getStatusBadge(sub.status)}
                                    <span className="text-xs text-gray-400">
                                        {new Date(sub.submittedAt).toLocaleDateString('ar-SA')}
                                    </span>
                                    {expandedId === sub.id ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Details */}
                            {expandedId === sub.id && (
                                <div className="border-t border-gray-100 px-4 py-5 space-y-4">
                                    {/* Submitter Info */}
                                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                                        {sub.submitterEmail && (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Mail className="w-4 h-4" /> {sub.submitterEmail}
                                            </span>
                                        )}
                                        {sub.submitterPhone && (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Phone className="w-4 h-4" /> {sub.submitterPhone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(sub.submittedAt).toLocaleString('ar-SA')}
                                        </span>
                                    </div>

                                    {/* Answers */}
                                    <div className="space-y-3">
                                        {(sub.answers || []).map((answer: any) => (
                                            <div key={answer.id} className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">{answer.field?.label || 'حقل'}</p>
                                                <p className="text-sm text-gray-800">
                                                    {answer.valueText ||
                                                        (answer.valueNumber !== null ? answer.valueNumber : '') ||
                                                        (answer.valueBoolean !== null ? (answer.valueBoolean ? 'نعم' : 'لا') : '') ||
                                                        (answer.valueDate ? new Date(answer.valueDate).toLocaleDateString('ar-SA') : '') ||
                                                        (answer.valueJson ? JSON.stringify(answer.valueJson) : '') ||
                                                        '—'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Status Change */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">تغيير الحالة:</span>
                                        {STATUS_OPTIONS.map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => handleStatusChange(sub.id, s.value)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sub.status === s.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
