import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    ArrowRight,
    Trash2,
    Calendar,
    User,
    Briefcase,
    Clock,
    Send,
    CheckCircle2,
    Circle,
    AlertCircle,
    Pause,
    XCircle,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useTask, useUpdateTask, useDeleteTask, useAddTaskComment, useDeleteTaskComment } from '@/hooks/use-tasks';
import { TaskStatus, TaskPriority } from '@/api/tasks.api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuthStore } from '@/stores/auth.store';

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    TODO: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-800', icon: Circle },
    IN_PROGRESS: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: Clock },
    REVIEW: { label: 'قيد المراجعة', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    BLOCKED: { label: 'معلقة', color: 'bg-orange-100 text-orange-800', icon: Pause },
    COMPLETED: { label: 'مكتملة', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
    LOW: { label: 'منخفضة', color: 'bg-gray-100 text-gray-600' },
    MEDIUM: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700' },
    HIGH: { label: 'عالية', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'عاجلة', color: 'bg-red-100 text-red-700' },
};

function TaskDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { p, nav } = useSlugPath();
    const user = useAuthStore((state) => state.user);
    const [newComment, setNewComment] = useState('');

    const { data, isLoading, error } = useTask(id || '');
    const updateMutation = useUpdateTask(id || '');
    const deleteMutation = useDeleteTask();
    const addCommentMutation = useAddTaskComment(id || '');
    const deleteCommentMutation = useDeleteTaskComment(id || '');

    const task = data?.data;

    const handleStatusChange = (newStatus: TaskStatus) => {
        updateMutation.mutate({ status: newStatus });
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            deleteMutation.mutate(id || '', {
                onSuccess: () => nav('/tasks')
            });
        }
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        addCommentMutation.mutate(newComment.trim(), {
            onSuccess: () => setNewComment('')
        });
    };

    const handleDeleteComment = (commentId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
            deleteCommentMutation.mutate(commentId);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">المهمة غير موجودة</h2>
                <Link to={p('/tasks')} className="text-primary hover:underline">
                    العودة لقائمة المهام
                </Link>
            </div>
        );
    }

    const statusInfo = statusConfig[task.status];
    const priorityInfo = priorityConfig[task.priority];
    const StatusIcon = statusInfo.icon;

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() &&
        !['COMPLETED', 'CANCELLED'].includes(task.status);

    // Check if user can edit (owner, admin, or assigned lawyer)
    const canEdit = user?.role === 'OWNER' || user?.role === 'ADMIN' ||
        task.assignedToId === user?.id || task.createdById === user?.id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => nav('/tasks')}>
                    <ArrowRight className="w-4 h-4 ml-1" />
                    العودة
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Task Header Card */}
                    <div className="bg-card rounded-xl border p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className={cn(
                                    "text-2xl font-bold mb-2",
                                    task.status === 'COMPLETED' && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn(
                                        "text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1",
                                        statusInfo.color
                                    )}>
                                        <StatusIcon className="w-4 h-4" />
                                        {statusInfo.label}
                                    </span>
                                    <span className={cn(
                                        "text-sm px-3 py-1 rounded-full",
                                        priorityInfo.color
                                    )}>
                                        {priorityInfo.label}
                                    </span>
                                    {isOverdue && (
                                        <span className="text-sm px-3 py-1 rounded-full bg-red-100 text-red-700">
                                            متأخرة
                                        </span>
                                    )}
                                </div>
                            </div>
                            {canEdit && (
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        {task.description && (
                            <p className="text-muted-foreground mb-4 whitespace-pre-wrap">
                                {task.description}
                            </p>
                        )}

                        {/* Quick Status Change */}
                        {canEdit && (
                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-sm font-medium mb-3">تغيير الحالة:</h3>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.keys(statusConfig) as TaskStatus[]).map((status) => {
                                        const config = statusConfig[status];
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(status)}
                                                disabled={task.status === status || updateMutation.isPending}
                                                className={cn(
                                                    "flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all",
                                                    task.status === status
                                                        ? "ring-2 ring-primary " + config.color
                                                        : "bg-muted hover:opacity-80 " + config.color,
                                                    updateMutation.isPending && "opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <Icon className="w-3 h-3" />
                                                {config.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Comments Section */}
                    <div className="bg-card rounded-xl border p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5" />
                            الملاحظات والتعليقات
                            {task.comments && task.comments.length > 0 && (
                                <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">
                                    {task.comments.length}
                                </span>
                            )}
                        </h2>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="mb-6">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder="اكتب ملاحظة أو سؤال..."
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-2">
                                <Button
                                    type="submit"
                                    disabled={!newComment.trim() || addCommentMutation.isPending}
                                    size="sm"
                                >
                                    <Send className="w-4 h-4 ml-1" />
                                    {addCommentMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
                                </Button>
                            </div>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {task.comments && task.comments.length > 0 ? (
                                [...task.comments].reverse().map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={cn(
                                            "p-4 rounded-lg",
                                            comment.userId === user?.id
                                                ? "bg-primary/5 border-r-4 border-primary"
                                                : "bg-muted"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-xs font-semibold text-primary">
                                                        {comment.user?.name?.charAt(0) || '؟'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-sm">
                                                        {comment.user?.name || 'مستخدم'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground mr-2">
                                                        {format(new Date(comment.createdAt), 'dd MMM yyyy - HH:mm', { locale: ar })}
                                                    </span>
                                                </div>
                                            </div>
                                            {(comment.userId === user?.id || user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="text-muted-foreground hover:text-destructive transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap pr-10">
                                            {comment.content}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                    <p>لا توجد ملاحظات بعد</p>
                                    <p className="text-sm">أضف أول ملاحظة أو سؤال</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Task Info Card */}
                    <div className="bg-card rounded-xl border p-6">
                        <h3 className="font-semibold mb-4">معلومات المهمة</h3>
                        <div className="space-y-4">
                            {task.dueDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className={cn(
                                        "w-5 h-5",
                                        isOverdue ? "text-red-500" : "text-muted-foreground"
                                    )} />
                                    <div>
                                        <p className="text-xs text-muted-foreground">تاريخ الاستحقاق</p>
                                        <p className={cn(
                                            "font-medium",
                                            isOverdue && "text-red-600"
                                        )}>
                                            {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: ar })}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {task.assignedTo && (
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">مسندة إلى</p>
                                        <p className="font-medium">{task.assignedTo.name}</p>
                                    </div>
                                </div>
                            )}

                            {task.createdBy && (
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">أنشأها</p>
                                        <p className="font-medium">{task.createdBy.name}</p>
                                    </div>
                                </div>
                            )}

                            {task.case && (
                                <div className="flex items-center gap-3">
                                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">القضية المرتبطة</p>
                                        <Link
                                            to={p(`/cases/${task.case.id}`)}
                                            className="font-medium text-primary hover:underline"
                                        >
                                            {task.case.caseNumber}
                                        </Link>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Clock className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                                    <p className="font-medium">
                                        {format(new Date(task.createdAt), 'dd MMMM yyyy', { locale: ar })}
                                    </p>
                                </div>
                            </div>

                            {task.completedAt && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">تاريخ الإكمال</p>
                                        <p className="font-medium text-green-600">
                                            {format(new Date(task.completedAt), 'dd MMMM yyyy', { locale: ar })}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subtasks */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="bg-card rounded-xl border p-6">
                            <h3 className="font-semibold mb-4">المهام الفرعية</h3>
                            <div className="space-y-2">
                                {task.subtasks.map((subtask) => (
                                    <div
                                        key={subtask.id}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                                    >
                                        {subtask.status === 'COMPLETED' ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <Circle className="w-4 h-4 text-muted-foreground" />
                                        )}
                                        <span className={cn(
                                            "text-sm",
                                            subtask.status === 'COMPLETED' && "line-through text-muted-foreground"
                                        )}>
                                            {subtask.title}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TaskDetailsPage;
