import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useUpdateTask } from '@/hooks/use-tasks';
import { useLawyers } from '@/hooks/use-lawyers';
import { useCases } from '@/hooks/use-cases';
import { Task, TaskPriority, TaskStatus } from '@/api/tasks.api';
import { Check } from 'lucide-react';

interface EditTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task;
}

export function EditTaskDialog({ open, onOpenChange, task }: EditTaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
    const [status, setStatus] = useState<TaskStatus>('TODO');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('');
    const [assignedToId, setAssignedToId] = useState('');
    const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
    const [caseId, setCaseId] = useState('');
    const [showUserList, setShowUserList] = useState(false);

    const updateMutation = useUpdateTask(task.id);
    const { data: lawyersData } = useLawyers();
    const { data: casesData } = useCases({ limit: 100 });

    const lawyers = lawyersData?.data || [];
    const cases = casesData?.data || [];

    // Populate from task
    useEffect(() => {
        if (task && open) {
            setTitle(task.title);
            setDescription(task.description || '');
            setPriority(task.priority);
            setStatus(task.status);
            setDueDate(task.dueDate ? task.dueDate.substring(0, 10) : '');
            setDueTime(task.dueTime || '');
            setAssignedToId(task.assignedToId);
            setCaseId(task.caseId || '');
            // Load existing assignees
            const existingIds = task.assignees?.map(a => a.userId) || [task.assignedToId];
            setAssignedToIds(existingIds);
        }
    }, [task, open]);

    const toggleUser = (id: string) => {
        setAssignedToIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
        // Always keep primary assignee if none selected
        if (id === assignedToId && assignedToIds.includes(id) && assignedToIds.length === 1) return;
        // Auto set primary if first selection
        if (!assignedToIds.length) setAssignedToId(id);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        const primaryId = assignedToIds[0] || assignedToId;

        updateMutation.mutate({
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            status,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            assignedToId: primaryId,
            assignedToIds,
            caseId: caseId || undefined,
        }, {
            onSuccess: () => {
                onOpenChange(false);
            }
        });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
            <div className="relative bg-card rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-card z-10">
                    <h2 className="text-lg font-semibold">تعديل المهمة</h2>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => onOpenChange(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            عنوان المهمة <span className="text-destructive">*</span>
                        </label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1">الوصف</label>
                        <textarea
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 rounded-md border bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Assignees multi-select */}
                    <div>
                        <label className="block text-sm font-medium mb-1">
                            المعيّنون
                            {assignedToIds.length > 0 && (
                                <span className="mr-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                                    {assignedToIds.length} {assignedToIds.length === 1 ? 'شخص' : 'أشخاص'}
                                </span>
                            )}
                        </label>
                        <button
                            type="button"
                            onClick={() => setShowUserList(!showUserList)}
                            className="w-full px-3 py-2 border rounded-md bg-background text-sm text-right flex items-center justify-between"
                        >
                            <span className="text-muted-foreground">
                                {assignedToIds.length === 0 ? 'اختر أشخاصاً...' : `${assignedToIds.length} محدد`}
                            </span>
                            <span className="text-xs text-muted-foreground">{showUserList ? '▲' : '▼'}</span>
                        </button>
                        {showUserList && (
                            <div className="mt-1 border rounded-md bg-background max-h-40 overflow-y-auto">
                                {lawyers.map(lawyer => (
                                    <label
                                        key={lawyer.id}
                                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${assignedToIds.includes(lawyer.id) ? 'bg-primary border-primary text-white' : 'border-gray-300'}`}>
                                            {assignedToIds.includes(lawyer.id) && <Check className="w-3 h-3" />}
                                        </div>
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                                {lawyer.name.charAt(0)}
                                            </div>
                                            <span className="text-sm">{lawyer.name}</span>
                                        </div>
                                        <input type="checkbox" className="hidden" checked={assignedToIds.includes(lawyer.id)} onChange={() => toggleUser(lawyer.id)} />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Priority & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">الأولوية</label>
                            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full h-10 px-3 rounded-md border bg-background text-sm">
                                <option value="LOW">منخفضة</option>
                                <option value="MEDIUM">متوسطة</option>
                                <option value="HIGH">عالية</option>
                                <option value="URGENT">عاجلة</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">الحالة</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full h-10 px-3 rounded-md border bg-background text-sm">
                                <option value="TODO">قيد الانتظار</option>
                                <option value="IN_PROGRESS">قيد التنفيذ</option>
                                <option value="REVIEW">قيد المراجعة</option>
                                <option value="BLOCKED">معلقة</option>
                                <option value="COMPLETED">مكتملة</option>
                                <option value="CANCELLED">ملغاة</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">تاريخ التسليم</label>
                            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">وقت التسليم (اختياري)</label>
                            <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
                        </div>
                    </div>

                    {/* Related Case */}
                    <div>
                        <label className="block text-sm font-medium mb-1">القضية المرتبطة</label>
                        <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="w-full h-10 px-3 rounded-md border bg-background text-sm">
                            <option value="">بدون قضية</option>
                            {cases.map((c) => (
                                <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                        <Button type="submit" disabled={updateMutation.isPending || !title.trim()}>
                            {updateMutation.isPending ? (
                                <><Loader2 className="w-4 h-4 ml-1 animate-spin" />جارٍ الحفظ...</>
                            ) : (
                                <><Save className="w-4 h-4 ml-1" />حفظ التغييرات</>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
