import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useNotifications,
    useUnreadCount,
    useMarkAsRead,
    useMarkAllAsRead,
} from '@/hooks/use-notifications';
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
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Notification } from '@/api/notifications';

export function NotificationsDropdown() {
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const { data: notificationsData } = useNotifications();
    const { data: unreadData } = useUnreadCount();
    const markAsReadMutation = useMarkAsRead();
    const markAllAsReadMutation = useMarkAllAsRead();

    const notifications = notificationsData || [];
    const unreadCount = unreadData?.count || 0;

    const handleNotificationClick = (notification: Notification) => {
        markAsReadMutation.mutate(notification.id);
        if (notification.link) {
            navigate(notification.link);
        }
        setOpen(false);
    };

    const handleMarkAllAsRead = () => {
        markAllAsReadMutation.mutate();
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'INFO':
                return <Info className="w-4 h-4 text-blue-500" />;
            case 'SUCCESS':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'WARNING':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'ERROR':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Info className="w-4 h-4 text-gray-500" />;
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            INFO: 'bg-blue-500',
            SUCCESS: 'bg-green-500',
            WARNING: 'bg-yellow-500',
            ERROR: 'bg-red-500',
        };
        return colors[type] || 'bg-gray-500';
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -end-1 h-5 min-w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
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
                            onClick={handleMarkAllAsRead}
                            className="h-7 text-xs"
                        >
                            <Check className="w-3 h-3 ms-1" />
                            تعليم الكل كمقروء
                        </Button>
                    )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        لا توجد إشعارات
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.map((notification: Notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    'flex items-start gap-3 p-3 cursor-pointer',
                                    !notification.isRead && 'bg-muted/50',
                                )}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="mt-0.5">
                                    {getTypeIcon(notification.type)}
                                </div>

                                <div className="flex-1 space-y-1 min-w-0">
                                    <p className="text-sm font-medium leading-none">
                                        {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                            addSuffix: true,
                                            locale: ar,
                                        })}
                                    </p>
                                </div>

                                {!notification.isRead && (
                                    <div
                                        className={cn(
                                            'w-2 h-2 rounded-full flex-shrink-0 mt-1',
                                            getTypeColor(notification.type),
                                        )}
                                    />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
