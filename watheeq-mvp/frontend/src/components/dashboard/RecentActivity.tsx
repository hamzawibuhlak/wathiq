import { Activity, Scale, FileText, Receipt, Users } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { UserAvatar } from '@/components/ui';

interface ActivityItem {
    id: string;
    type: 'case' | 'hearing' | 'document' | 'invoice' | 'client';
    title: string;
    description?: string;
    createdAt: string;
    user?: string;
    userAvatar?: string | null;
    date?: string;
    time?: string;
}

interface RecentActivityProps {
    activities: ActivityItem[];
    isLoading?: boolean;
}

const activityIcons = {
    case: Scale,
    hearing: Activity,
    document: FileText,
    invoice: Receipt,
    client: Users,
};

const activityColors = {
    case: 'bg-blue-100 text-blue-600',
    hearing: 'bg-purple-100 text-purple-600',
    document: 'bg-green-100 text-green-600',
    invoice: 'bg-yellow-100 text-yellow-600',
    client: 'bg-pink-100 text-pink-600',
};

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border p-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-muted rounded animate-pulse" />
                    <div className="w-32 h-6 bg-muted rounded animate-pulse" />
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 bg-muted rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="w-3/4 h-4 bg-muted rounded" />
                                <div className="w-1/4 h-3 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border p-6">
            <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">النشاط الأخير</h3>
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>لا يوجد نشاط حديث</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute right-5 top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-4">
                        {activities.map((activity) => {
                            const Icon = activityIcons[activity.type] || Activity;
                            const colorClass = activityColors[activity.type] || 'bg-gray-100 text-gray-600';

                            return (
                                <div key={activity.id} className="flex gap-4 relative">
                                    {/* Icon */}
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass} relative z-10`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <p className="font-medium">{activity.title}</p>
                                        {activity.description && (
                                            <p className="text-sm text-muted-foreground">{activity.description}</p>
                                        )}

                                        {/* User, Date and Time */}
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            {activity.user && (
                                                <span className="flex items-center gap-1.5">
                                                    <UserAvatar
                                                        name={activity.user}
                                                        avatar={activity.userAvatar}
                                                        size="sm"
                                                        className="w-5 h-5 text-[10px]"
                                                    />
                                                    {activity.user}
                                                </span>
                                            )}
                                            {activity.date && (
                                                <span>{activity.date}</span>
                                            )}
                                            {activity.time && (
                                                <span>{activity.time}</span>
                                            )}
                                            {!activity.date && !activity.time && (
                                                <span>{formatRelativeTime(activity.createdAt)}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default RecentActivity;
