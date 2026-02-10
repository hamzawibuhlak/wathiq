import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { GitBranch, Plus, Power, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TRIGGER_LABELS: Record<string, string> = {
    CASE_CREATED: 'عند إنشاء قضية',
    CASE_STATUS_CHANGED: 'تغيير حالة القضية',
    HEARING_SCHEDULED: 'جدولة جلسة',
    HEARING_REMINDER: 'تذكير بجلسة',
    TASK_OVERDUE: 'تأخر مهمة',
    CLIENT_CREATED: 'إنشاء عميل',
    INVOICE_OVERDUE: 'تأخر فاتورة',
    DOCUMENT_UPLOADED: 'رفع مستند',
};

export default function WorkflowsPage() {
    const queryClient = useQueryClient();
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ name: '', triggerType: 'CASE_CREATED', description: '' });

    const { data: workflows = [], isLoading } = useQuery({
        queryKey: ['owner-workflows'],
        queryFn: ownerApi.getWorkflows,
    });

    const createMutation = useMutation({
        mutationFn: (data: typeof form) => ownerApi.createWorkflow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-workflows'] });
            toast.success('تم إنشاء سير العمل');
            setShowCreate(false);
            setForm({ name: '', triggerType: 'CASE_CREATED', description: '' });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: (id: string) => ownerApi.toggleWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-workflows'] });
            toast.success('تم تحديث الحالة');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => ownerApi.deleteWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-workflows'] });
            toast.success('تم حذف سير العمل');
        },
    });

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <GitBranch className="w-5 h-5 text-amber-600" />
                        سير العمل الآلي
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">أتمتة المهام المتكررة</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
                >
                    <Plus className="w-4 h-4" />
                    إنشاء سير عمل
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
            ) : workflows.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 shadow-sm">
                    <GitBranch className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="font-medium">لا توجد قواعد أتمتة</p>
                    <p className="text-sm mt-1">أنشئ قاعدة جديدة لأتمتة سير العمل</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {workflows.map((wf: any) => (
                        <div key={wf.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${wf.isActive ? 'bg-green-50' : 'bg-gray-50'}`}>
                                    <GitBranch className={`w-5 h-5 ${wf.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{wf.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {TRIGGER_LABELS[wf.triggerType] || wf.triggerType}
                                        {' · '}
                                        {wf._count?.executions || 0} تنفيذ
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleMutation.mutate(wf.id)}
                                    className={`p-2 rounded-xl ${wf.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                                    title={wf.isActive ? 'تعطيل' : 'تفعيل'}
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('هل أنت متأكد من حذف سير العمل؟')) {
                                            deleteMutation.mutate(wf.id);
                                        }
                                    }}
                                    className="p-2 rounded-xl text-red-400 hover:bg-red-50"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" dir="rtl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">إنشاء سير عمل جديد</h2>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">اسم القاعدة</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="مثال: إشعار عند إنشاء قضية"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">المحفز</label>
                                <select
                                    value={form.triggerType}
                                    onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    {Object.entries(TRIGGER_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف (اختياري)</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    rows={2}
                                />
                            </div>
                            <button
                                onClick={() => createMutation.mutate(form)}
                                disabled={!form.name || createMutation.isPending}
                                className="w-full py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 text-sm font-medium disabled:opacity-50"
                            >
                                {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
