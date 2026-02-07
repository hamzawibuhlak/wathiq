import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
    Clock, 
    User, 
    Calendar, 
    Briefcase, 
    MessageSquare, 
    MoreVertical,
    Trash2,
    Edit,
    CheckCircle2,
    Circle,
    AlertCircle,
    Pause,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TaskStatus } from '@/api/tasks.api';
import { useUpdateTaskStatus } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface TaskCardProps {
    task: Task;
    isSelected?: boolean;
    onSelect?: () => void;
    onDelete?: () => void;
}

const statusConfig: Record<TaskStatus, { label: string; color: string; icon: React.ElementType }> = {
    TODO: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-800', icon: Circle },
    IN_PROGRESS: { label: 'قيد التنفيذ', color: 'bg-blue-100 text-blue-800', icon: Clock },
    REVIEW: { label: 'قيد المراجعة', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
    BLOCKED: { label: 'معلقة', color: 'bg-orange-100 text-orange-800', icon: Pause },
    COMPLETED: { label: 'مكتملة', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-800', icon: XCircle },
};

const priorityConfig = {
    LOW: { label: 'منخفضة', color: 'bg-gray-100 text-gray-600' },
    MEDIUM: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700' },
    HIGH: { label: 'عالية', color: 'bg-orange-100 text-orange-700' },
    URGENT: { label: 'عاجلة', color: 'bg-red-100 text-red-700' },
};

export function TaskCard({ task, isSelected, onSelect, onDelete }: TaskCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const updateStatusMutation = useUpdateTaskStatus();

    const statusInfo = statusConfig[task.status];
    const priorityInfo = priorityConfig[task.priority];
    const StatusIcon = statusInfo.icon;

    const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && 
        !['COMPLETED', 'CANCELLED'].includes(task.status);

    const formatDueDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'اليوم';
        if (isTomorrow(date)) return 'غداً';
        return format(date, 'd MMMM', { locale: ar });
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        updateStatusMutation.mutate({ id: task.id, status: newStatus });
        setShowMenu(false);
    };

    const quickStatusOptions: TaskStatus[] = task.status === 'COMPLETED' 
        ? ['TODO', 'IN_PROGRESS']
        : ['COMPLETED'];

    return (
        <div className={cn(
            "bg-card rounded-xl border p-4 transition-all hover:shadow-md relative",
            isSelected && "ring-2 ring-primary",
            isOverdue && "border-red-300"
        )}>
            {/* Selection & Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    {onSelect && (
                        <Checkbox
                            checked={isSelected}
                            onChange={onSelect}
                        />
                    )}
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
                        statusInfo.color
                    )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                    </span>
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        priorityInfo.color
                    )}>
                        {priorityInfo.label}
                    </span>
                </div>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
                            <div className="p-1">
                                <Link
                                    to={`/tasks/${task.id}`}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                                >
                                    <Edit className="w-4 h-4" />
                                    تعديل
                                </Link>
                                <div className="border-t my-1"></div>
                                <div className="px-3 py-1 text-xs text-muted-foreground">تغيير الحالة</div>
                                {quickStatusOptions.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusChange(status)}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md"
                                    >
                                        {status === 'COMPLETED' ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                إكمال المهمة
                                            </>
                                        ) : (
                                            <>
                                                <Circle className="w-4 h-4" />
                                                {statusConfig[status].label}
                                            </>
                                        )}
                                    </button>
                                ))}
                                <div className="border-t my-1"></div>
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            onDelete();
                                            setShowMenu(false);
                                        }}
                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        حذف
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Title & Description */}
            <Link to={`/tasks/${task.id}`}>
                <h3 className={cn(
                    "font-semibold text-lg mb-2 hover:text-primary transition-colors",
                    task.status === 'COMPLETED' && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </h3>
            </Link>
            {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-3">
                {task.dueDate && (
                    <div className={cn(
                        "flex items-center gap-1",
                        isOverdue && "text-red-600 font-medium"
                    )}>
                        <Calendar className="w-4 h-4" />
                        {formatDueDate(task.dueDate)}
                        {isOverdue && <span className="text-xs">(متأخرة)</span>}
                    </div>
                )}
                {task.assignedTo && (
                    <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {task.assignedTo.name}
                    </div>
                )}
                {task._count?.comments && task._count.comments > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {task._count.comments}
                    </div>
                )}
            </div>

            {/* Created By */}
            {task.createdBy && (
                <div className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    <span>طلبها:</span>
                    <span className="font-medium text-foreground">{task.createdBy.name}</span>
                </div>
            )}

            {/* Related Case/Hearing */}
            {task.case && (
                <Link 
                    to={`/cases/${task.case.id}`}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full hover:bg-muted/80"
                >
                    <Briefcase className="w-3 h-3" />
                    {task.case.caseNumber}
                </Link>
            )}

            {/* Subtasks Progress */}
            {task._count?.subtasks && task._count.subtasks > 0 && (
                <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-muted-foreground">
                        {task.subtasks?.filter(s => s.status === 'COMPLETED').length || 0} / {task._count.subtasks} مهام فرعية
                    </div>
                </div>
            )}
        </div>
    );
}
