import { Link, useNavigate } from 'react-router-dom';
import {
    Bell,
    CheckCheck,
    Trash2,
    Info,
    AlertTriangle,
    CheckCircle,
    XCircle,
    ExternalLink,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/use-notifications';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Notification } from '@/api/notifications';

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'INFO':
            return <Info className="h-4 w-4 text-blue-500" />;
        case 'WARNING':
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'SUCCESS':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'ERROR':
            return <XCircle className="h-4 w-4 text-red-500" />;
        default:
            return <Info className="h-4 w-4 text-gray-500" />;
    }
};

const getNotificationBgColor = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return 'bg-white';
    switch (type) {
        case 'INFO':
            return 'bg-blue-50';
        case 'WARNING':
            return 'bg-yellow-50';
        case 'SUCCESS':
            return 'bg-green-50';
        case 'ERROR':
            return 'bg-red-50';
        default:
            return 'bg-gray-50';
    }
};

export function NotificationCenter() {
    const navigate = useNavigate();
    const { data: notifications = [], isLoading } = useNotifications();
    const { data: unreadData } = useUnreadCount();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();
    const deleteNotification = useDeleteNotification();

    const unreadCount = unreadData?.count || 0;

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead.mutate(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 text-xs"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>الإشعارات</span>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-auto p-1 text-xs"
                            onClick={() => markAllAsRead.mutate()}
                            disabled={markAllAsRead.isPending}
                        >
                            <CheckCheck className="h-3 w-3 ml-1" />
                            تعليم الكل كمقروء
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <span className="text-sm">لا توجد إشعارات</span>
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    'flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors',
                                    getNotificationBgColor(notification.type, notification.isRead)
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            'text-sm leading-tight',
                                            !notification.isRead && 'font-medium'
                                        )}>
                                            {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), {
                                                addSuffix: true,
                                                locale: ar,
                                            })}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {notification.link && (
                                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification.mutate(notification.id);
                                                }}
                                            >
                                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="justify-center cursor-pointer">
                            <Link to="/notifications" className="text-primary text-sm">
                                عرض جميع الإشعارات
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
