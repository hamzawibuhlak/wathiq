import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useNotifications,
    useMarkAsRead,
    useMarkAllAsRead,
    useDeleteNotification,
} from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Check,
    CheckCheck,
    Trash2,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
    Filter,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Notification } from '@/api/notifications';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type FilterType = 'all' | 'unread' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';

export default function NotificationsListPage() {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<FilterType>('all');
    
    const { data: notificationsData, isLoading } = useNotifications();
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();
    const deleteNotificationMutation = useDeleteNotification();

    const notifications = notificationsData || [];

    // Filter notifications
    const filteredNotifications = notifications.filter((n: Notification) => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        return n.type === filter;
    });

    const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsReadMutation.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        markAsReadMutation.mutate(id);
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteNotificationMutation.mutate(id);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'INFO':
                return <Info className="w-5 h-5 text-blue-500" />;
            case 'SUCCESS':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'WARNING':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'ERROR':
                return <XCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const variants: Record<string, string> = {
            INFO: 'bg-blue-100 text-blue-800',
            SUCCESS: 'bg-green-100 text-green-800',
            WARNING: 'bg-yellow-100 text-yellow-800',
            ERROR: 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            INFO: 'معلومات',
            SUCCESS: 'نجاح',
            WARNING: 'تنبيه',
            ERROR: 'خطأ',
        };
        return (
            <Badge className={cn('text-xs', variants[type] || 'bg-gray-100 text-gray-800')}>
                {labels[type] || type}
            </Badge>
        );
    };

    const filterLabels: Record<FilterType, string> = {
        all: 'الكل',
        unread: 'غير مقروءة',
        INFO: 'معلومات',
        SUCCESS: 'نجاح',
        WARNING: 'تنبيهات',
        ERROR: 'أخطاء',
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Bell className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">الإشعارات</h1>
                        <p className="text-muted-foreground">
                            {unreadCount > 0 
                                ? `لديك ${unreadCount} إشعار غير مقروء`
                                : 'لا توجد إشعارات غير مقروءة'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Filter className="w-4 h-4 ms-2" />
                                {filterLabels[filter]}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {(Object.keys(filterLabels) as FilterType[]).map((key) => (
                                <DropdownMenuItem
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={cn(filter === key && 'bg-muted')}
                                >
                                    {filterLabels[key]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mark All as Read */}
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                        >
                            <CheckCheck className="w-4 h-4 ms-2" />
                            تعليم الكل كمقروء
                        </Button>
                    )}
                </div>
            </div>

            {/* Notifications List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        {filter === 'all' 
                            ? `جميع الإشعارات (${notifications.length})`
                            : `${filterLabels[filter]} (${filteredNotifications.length})`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredNotifications.length === 0 ? (
                        <div className="py-16 text-center">
                            <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <p className="text-lg font-medium text-muted-foreground">لا توجد إشعارات</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                ستظهر هنا جميع الإشعارات الخاصة بك
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredNotifications.map((notification: Notification) => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={cn(
                                        'p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                                        !notification.isRead && 'bg-primary/5'
                                    )}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        <div className="mt-1 flex-shrink-0">
                                            {getTypeIcon(notification.type)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={cn(
                                                            'font-medium',
                                                            !notification.isRead && 'text-primary'
                                                        )}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-2">
                                                        {getTypeBadge(notification.type)}
                                                        <span className="text-xs text-muted-foreground">
                                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                                addSuffix: true,
                                                                locale: ar,
                                                            })}
                                                        </span>
                                                        {notification.link && (
                                                            <span className="text-xs text-primary flex items-center gap-1">
                                                                <ExternalLink className="w-3 h-3" />
                                                                عرض التفاصيل
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.isRead && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                                                            title="تعليم كمقروء"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                                        onClick={(e) => handleDelete(e, notification.id)}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
