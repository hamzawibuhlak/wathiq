import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    Clock,
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
    LOW: { label: 'منخفضة', color: 'bg-gray-100 text-gray-600', shadow: 'shadow-[0_4px_20px_rgba(156,163,175,0.4)]' },
    MEDIUM: { label: 'متوسطة', color: 'bg-yellow-100 text-yellow-700', shadow: 'shadow-[0_4px_20px_rgba(234,179,8,0.35)]' },
    HIGH: { label: 'عالية', color: 'bg-orange-100 text-orange-700', shadow: 'shadow-[0_4px_20px_rgba(249,115,22,0.4)]' },
    URGENT: { label: 'عاجلة', color: 'bg-red-100 text-red-700', shadow: 'shadow-[0_4px_20px_rgba(239,68,68,0.45)]' },
};

export function TaskCard({ task, isSelected, onSelect, onDelete }: TaskCardProps) {
    const [showMenu, setShowMenu] = useState(false);
    const updateStatusMutation = useUpdateTaskStatus();
    const { p } = useSlugPath();

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

    // Get all assignees for display
    const allAssignees = task.assignees?.map(a => a.user) ||
        (task.assignedTo ? [task.assignedTo] : []);

    return (
        <div className={cn(
            "bg-card rounded-xl border p-4 transition-all hover:shadow-lg relative",
            priorityInfo.shadow, // priority-colored shadow
            isSelected && "ring-2 ring-primary",
            isOverdue && "border-red-300"
        )}>
            {/* Selection & Actions */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                    {onSelect && (
                        <Checkbox checked={isSelected} onChange={onSelect} />
                    )}
                    <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
                        statusInfo.color
                    )}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                    </span>
                    <span className={cn("text-xs px-2 py-1 rounded-full", priorityInfo.color)}>
                        {priorityInfo.label}
                    </span>
                </div>
                <div className="relative">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowMenu(!showMenu)}>
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                    {showMenu && (
                        <div className="absolute left-0 top-full mt-1 w-48 bg-popover border rounded-lg shadow-lg z-10">
                            <div className="p-1">
                                <Link
                                    to={p(`/tasks/${task.id}`)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent rounded-md"
                                >
                                    <Edit className="w-4 h-4" />
                                    عرض وتعديل
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
                                            <><CheckCircle2 className="w-4 h-4 text-green-600" />إكمال المهمة</>
                                        ) : (
                                            <><Circle className="w-4 h-4" />{statusConfig[status].label}</>
                                        )}
                                    </button>
                                ))}
                                <div className="border-t my-1"></div>
                                {onDelete && (
                                    <button
                                        onClick={() => { onDelete(); setShowMenu(false); }}
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

            {/* Title */}
            <Link to={p(`/tasks/${task.id}`)}>
                <h3 className={cn(
                    "font-semibold text-base mb-2 hover:text-primary transition-colors line-clamp-2",
                    task.status === 'COMPLETED' && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </h3>
            </Link>
            {task.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                {task.dueDate && (
                    <div className={cn("flex items-center gap-1", isOverdue && "text-red-600 font-medium")}>
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDueDate(task.dueDate)}
                        {task.dueTime && <span className="text-muted-foreground">في {task.dueTime}</span>}
                        {isOverdue && <span>(متأخرة)</span>}
                    </div>
                )}
                {task._count?.comments && task._count.comments > 0 && (
                    <div className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {task._count.comments}
                    </div>
                )}
            </div>

            {/* Assignees avatars */}
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {allAssignees.slice(0, 4).map((user, idx) => (
                        <div
                            key={user.id}
                            title={user.name}
                            className="w-7 h-7 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary"
                            style={{ marginRight: idx > 0 ? '-8px' : 0, zIndex: allAssignees.length - idx }}
                        >
                            {user.name.charAt(0)}
                        </div>
                    ))}
                    {allAssignees.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-xs font-medium -mr-2">
                            +{allAssignees.length - 4}
                        </div>
                    )}
                    {allAssignees.length > 0 && (
                        <span className="text-xs text-muted-foreground mr-3">
                            {allAssignees.length === 1
                                ? allAssignees[0].name
                                : `${allAssignees.length} أشخاص`}
                        </span>
                    )}
                </div>

                {task.case && (
                    <Link
                        to={p(`/cases/${task.case.id}`)}
                        className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full hover:bg-muted/80"
                    >
                        <Briefcase className="w-3 h-3" />
                        {task.case.caseNumber}
                    </Link>
                )}
            </div>
        </div>
    );
}
