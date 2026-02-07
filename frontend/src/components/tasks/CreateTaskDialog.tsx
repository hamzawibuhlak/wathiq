import { useState } from 'react';
import { X } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useCreateTask } from '@/hooks/use-tasks';
import { useLawyers } from '@/hooks/use-lawyers';
import { useCases } from '@/hooks/use-cases';
import { TaskPriority, TaskStatus } from '@/api/tasks.api';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultCaseId?: string;
    defaultAssignedToId?: string;
}

export function CreateTaskDialog({ 
    open, 
    onOpenChange,
    defaultCaseId,
    defaultAssignedToId 
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
    const [status, setStatus] = useState<TaskStatus>('TODO');
    const [dueDate, setDueDate] = useState('');
    const [assignedToId, setAssignedToId] = useState(defaultAssignedToId || '');
    const [caseId, setCaseId] = useState(defaultCaseId || '');

    const createMutation = useCreateTask();
    const { data: lawyersData } = useLawyers();
    const { data: casesData } = useCases({ limit: 100 });

    const lawyers = lawyersData?.data || [];
    const cases = casesData?.data || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !assignedToId) {
            return;
        }

        createMutation.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            status,
            dueDate: dueDate || undefined,
            assignedToId,
            caseId: caseId || undefined,
        }, {
            onSuccess: () => {
                // Reset form
                setTitle('');
                setDescription('');
                setPriority('MEDIUM');
                setStatus('TODO');
                setDueDate('');
                setAssignedToId(defaultAssignedToId || '');
                setCaseId(defaultCaseId || '');
                onOpenChange(false);
            }
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50" 
                onClick={() => onOpenChange(false)}
            />
            
            {/* Dialog */}
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card">
                    <h2 className="text-lg font-semibold">إنشاء مهمة جديدة</h2>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => onOpenChange(false)}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            عنوان المهمة <span className="text-destructive">*</span>
                        </label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="أدخل عنوان المهمة..."
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            الوصف
                        </label>
                        <textarea
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            placeholder="أدخل وصف المهمة..."
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none"
                        />
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            تعيين إلى <span className="text-destructive">*</span>
                        </label>
                        <select
                            value={assignedToId}
                            onChange={(e) => setAssignedToId(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                            required
                        >
                            <option value="">اختر...</option>
                            {lawyers.map((lawyer) => (
                                <option key={lawyer.id} value={lawyer.id}>
                                    {lawyer.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                الأولوية
                            </label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                            >
                                <option value="LOW">منخفضة</option>
                                <option value="MEDIUM">متوسطة</option>
                                <option value="HIGH">عالية</option>
                                <option value="URGENT">عاجلة</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                الحالة
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                            >
                                <option value="TODO">قيد الانتظار</option>
                                <option value="IN_PROGRESS">قيد التنفيذ</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            تاريخ الاستحقاق
                        </label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />
                    </div>

                    {/* Related Case */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            القضية المرتبطة
                        </label>
                        <select
                            value={caseId}
                            onChange={(e) => setCaseId(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="">بدون قضية</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.caseNumber} - {c.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        <Button 
                            type="submit"
                            disabled={createMutation.isPending || !title.trim() || !assignedToId}
                        >
                            {createMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء المهمة'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
