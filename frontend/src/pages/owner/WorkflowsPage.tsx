import { useState } from 'react';
import { GitBranch, Plus, Power, Trash2 } from 'lucide-react';
import { useWorkflows, useToggleWorkflow, useDeleteWorkflow } from '@/hooks/use-workflows';
import { CreateWorkflowDialog } from '@/components/workflows/CreateWorkflowDialog';

const TRIGGER_LABELS: Record<string, string> = {
    CASE_CREATED: 'عند إنشاء قضية',
    CASE_STATUS_CHANGED: 'تغيير حالة القضية',
    HEARING_SCHEDULED: 'جدولة جلسة',
    HEARING_REMINDER: 'تذكير بجلسة',
    TASK_OVERDUE: 'تأخر مهمة',
    CLIENT_CREATED: 'إنشاء عميل',
    INVOICE_CREATED: 'إنشاء فاتورة',
    INVOICE_OVERDUE: 'تأخر فاتورة',
    DOCUMENT_UPLOADED: 'رفع مستند',
    MANUAL: 'تشغيل يدوي',
};

export default function WorkflowsPage() {
    const [showCreate, setShowCreate] = useState(false);

    const { data, isLoading } = useWorkflows();
    const toggleMutation = useToggleWorkflow();
    const deleteMutation = useDeleteWorkflow();

    const workflows = data?.data || [];

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
                                        {(wf.actions as any[])?.length || 0} إجراء
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

            {/* Full 3-step Create Workflow Dialog */}
            <CreateWorkflowDialog
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
            />
        </div>
    );
}
