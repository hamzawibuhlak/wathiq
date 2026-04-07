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
    MessageSquare,
    Edit,
    UserMinus,
    UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui';
import {
    useTask,
    useUpdateTask,
    useDeleteTask,
    useAddTaskComment,
    useDeleteTaskComment,
    useRemoveTaskAssignee,
} from '@/hooks/use-tasks';
import { TaskStatus, TaskPriority, MentionItem } from '@/api/tasks.api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuthStore } from '@/stores/auth.store';
import { useLawyers } from '@/hooks/use-lawyers';
import { MentionTextarea } from '@/components/tasks/MentionTextarea';
import { EditTaskDialog } from '@/components/tasks/EditTaskDialog';

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    TODO: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-800', icon: Circle },
    IN_PROGRESS: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: Clock },
    REVIEW: { label: 'قيد المراجعة', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    BLOCKED: { label: 'معلقة', color: 'bg-orange-100 text-orange-800', icon: Pause },
    COMPLETED: { label: 'مكتملة', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; border: string }> = {
    LOW: { label: 'منخفضة', color: 'bg-gray-100 text-gray-600', border: 'border-r-4 border-gray-300' },
    MEDIUM: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700', border: 'border-r-4 border-yellow-400' },
    HIGH: { label: 'عالية', color: 'bg-orange-100 text-orange-700', border: 'border-r-4 border-orange-500' },
    URGENT: { label: 'عاجلة', color: 'bg-red-100 text-red-700', border: 'border-r-4 border-red-500' },
};

// Deterministic color per user ID for comments
const USER_COLORS = [
    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', avatar: 'bg-blue-500' },
    { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', avatar: 'bg-green-500' },
    { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', avatar: 'bg-purple-500' },
    { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', avatar: 'bg-orange-500' },
    { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', avatar: 'bg-pink-500' },
    { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', avatar: 'bg-teal-500' },
];

function getUserColor(userId: string) {
    const hash = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return USER_COLORS[hash % USER_COLORS.length];
}

function TaskDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const { p, nav } = useSlugPath();
    const user = useAuthStore((state) => state.user);
    const [newComment, setNewComment] = useState('');
    const [commentMentions, setCommentMentions] = useState<MentionItem[]>([]);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAddAssignee, setShowAddAssignee] = useState(false);

    const { data: lawyersData } = useLawyers();
    const lawyers = lawyersData?.data || [];

    const { data, isLoading, error } = useTask(id || '');
    const updateMutation = useUpdateTask(id || '');
    const deleteMutation = useDeleteTask();
    const addCommentMutation = useAddTaskComment(id || '');
    const deleteCommentMutation = useDeleteTaskComment(id || '');
    const removeAssigneeMutation = useRemoveTaskAssignee(id || '');

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
        addCommentMutation.mutate(
            { content: newComment.trim(), mentions: commentMentions },
            { onSuccess: () => { setNewComment(''); setCommentMentions([]); } }
        );
    };

    const handleDeleteComment = (commentId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التعليق؟')) {
            deleteCommentMutation.mutate(commentId);
        }
    };

    const handleRemoveAssignee = (userId: string, userName: string) => {
        if (window.confirm(`هل تريد إزالة ${userName} من هذه المهمة؟`)) {
            removeAssigneeMutation.mutate(userId);
        }
    };

    const handleAddAssignee = (userId: string) => {
        const currentAssigneeIds = task?.assignees?.map(a => a.userId) || (task?.assignedTo ? [task.assignedToId] : []);
        if (currentAssigneeIds.includes(userId)) return;

        updateMutation.mutate({
            assignedToIds: [...currentAssigneeIds, userId],
        }, {
            onSuccess: () => setShowAddAssignee(false)
        });
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

    const canEdit = user?.role === 'OWNER' || user?.role === 'ADMIN' ||
        task.assignedToId === user?.id || task.createdById === user?.id;

    // All assignees list
    const allAssignees = task.assignees?.map(a => a.user) ||
        (task.assignedTo ? [task.assignedTo] : []);

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
                    <div className={cn("bg-card rounded-xl border p-6", priorityInfo.border)}>
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h1 className={cn(
                                    "text-2xl font-bold mb-2",
                                    task.status === 'COMPLETED' && "line-through text-muted-foreground"
                                )}>
                                    {task.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={cn("text-sm px-3 py-1 rounded-full font-medium flex items-center gap-1", statusInfo.color)}>
                                        <StatusIcon className="w-4 h-4" />
                                        {statusInfo.label}
                                    </span>
                                    <span className={cn("text-sm px-3 py-1 rounded-full", priorityInfo.color)}>
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
                                    <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                                        <Edit className="w-4 h-4 ml-1" />
                                        تعديل
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={handleDelete}>
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
                            <MentionTextarea
                                value={newComment}
                                onChange={setNewComment}
                                onMentionsChange={setCommentMentions}
                                placeholder="اكتب ملاحظة أو سؤال... اكتب @ للإشارة إلى شخص أو قضية"
                                rows={3}
                            />
                            <div className="flex justify-end mt-2">
                                <Button
                                    type="submit"
                                    disabled={!newComment.trim() || addCommentMutation.isPending}
                                    size="sm"
                                >
                                    <Send className="w-4 h-4 ml-1" />
                                    {addCommentMutation.isPending ? 'جارٍ الإرسال...' : 'إرسال'}
                                </Button>
                            </div>
                        </form>

                        {/* Comments List */}
                        <div className="space-y-3">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((comment) => {
                                    const isMe = comment.userId === user?.id;
                                    const userColor = isMe
                                        ? { bg: 'bg-primary/5', text: 'text-primary-foreground', border: 'border-primary', avatar: 'bg-primary' }
                                        : getUserColor(comment.userId);

                                    return (
                                        <div
                                            key={comment.id}
                                            className={cn(
                                                "p-4 rounded-xl border-r-4",
                                                isMe ? "bg-primary/5 border-primary" : `${userColor.bg} border-${userColor.border.replace('border-', '')}`
                                            )}
                                            style={!isMe ? { borderRightColor: undefined } : undefined}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold",
                                                        isMe ? "bg-primary" : userColor.avatar
                                                    )}>
                                                        {comment.user?.name?.charAt(0) || '؟'}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-sm">
                                                            {comment.user?.name || 'مستخدم'}
                                                            {isMe && <span className="mr-1 text-xs text-muted-foreground">(أنت)</span>}
                                                        </span>
                                                        <p className="text-xs text-muted-foreground">
                                                            {format(new Date(comment.createdAt), 'dd MMM yyyy - HH:mm', { locale: ar })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {(isMe || user?.role === 'OWNER' || user?.role === 'ADMIN') && (
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
                                            {/* Render mentions */}
                                            {comment.mentions && Array.isArray(comment.mentions) && comment.mentions.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2 pr-10">
                                                    {(comment.mentions as MentionItem[]).map((m, i) => (
                                                        <span
                                                            key={i}
                                                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                                                        >
                                                            @{m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
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
                            {/* Due Date + Time */}
                            {task.dueDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className={cn("w-5 h-5", isOverdue ? "text-red-500" : "text-muted-foreground")} />
                                    <div>
                                        <p className="text-xs text-muted-foreground">تاريخ التسليم</p>
                                        <p className={cn("font-medium", isOverdue && "text-red-600")}>
                                            {format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: ar })}
                                            {task.dueTime && (
                                                <span className="text-sm text-muted-foreground mr-1">الساعة {task.dueTime}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Assignees */}
                            {(allAssignees.length > 0 || canEdit) && (
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">المعيّنون ({allAssignees.length})</p>
                                        </div>
                                        {canEdit && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowAddAssignee(!showAddAssignee)}
                                                    className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                                    title="إضافة شخص"
                                                >
                                                    <UserPlus className="w-3 h-3" />
                                                </button>
                                                {showAddAssignee && (
                                                    <div className="absolute left-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                                                        <div className="p-1">
                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                                                                اختر شخصاً للإضافة:
                                                            </div>
                                                            {lawyers.filter(l => !allAssignees.some(a => a.id === l.id)).length === 0 ? (
                                                                <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                                                                    تمت إضافة جميع الأشخاص
                                                                </div>
                                                            ) : (
                                                                lawyers
                                                                    .filter(l => !allAssignees.some(a => a.id === l.id))
                                                                    .map(lawyer => (
                                                                    <button
                                                                        key={lawyer.id}
                                                                        onClick={() => handleAddAssignee(lawyer.id)}
                                                                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-md text-right transition-colors"
                                                                    >
                                                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                            {lawyer.name.charAt(0)}
                                                                        </div>
                                                                        <span className="truncate">{lawyer.name}</span>
                                                                    </button>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 pr-7">
                                        {allAssignees.map((assignee) => {
                                            const color = getUserColor(assignee.id);
                                            const isCurrentUser = assignee.id === user?.id;
                                            const canRemove = canEdit && allAssignees.length > 1;
                                            return (
                                                <div key={assignee.id} className="flex items-center justify-between group">
                                                    <div className="flex items-center gap-2">
                                                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold", color.avatar)}>
                                                            {assignee.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium">
                                                            {assignee.name}
                                                            {isCurrentUser && <span className="text-xs text-muted-foreground mr-1">(أنت)</span>}
                                                        </span>
                                                    </div>
                                                    {canRemove && (
                                                        <button
                                                            onClick={() => handleRemoveAssignee(assignee.id, assignee.name)}
                                                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                                            title="إزالة من المهمة"
                                                        >
                                                            <UserMinus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
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
                                    <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
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

            {/* Edit Task Dialog */}
            {showEditDialog && (
                <EditTaskDialog
                    open={showEditDialog}
                    onOpenChange={setShowEditDialog}
                    task={task}
                />
            )}
        </div>
    );
}

export default TaskDetailsPage;
