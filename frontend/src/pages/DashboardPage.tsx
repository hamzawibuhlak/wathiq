import { Scale, Users, Calendar, Receipt, TrendingUp, Clock } from 'lucide-react';
import { StatCard, UpcomingHearings, RecentActivity } from '@/components/dashboard';
import { useDashboardStats, useUpcomingHearings, useRecentActivity } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth.store';

export function DashboardPage() {
    const { user } = useAuthStore();
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: hearingsData, isLoading: hearingsLoading } = useUpcomingHearings(7);
    const { data: activityData, isLoading: activityLoading } = useRecentActivity();

    const stats = statsData?.data;

    // Mock activity data until backend provides proper format
    const activities = activityData?.data || [];

    // Get hearings array from grouped response
    const hearings: any[] = [];
    if (hearingsData?.data) {
        const grouped = hearingsData.data;
        if (grouped.today) hearings.push(...grouped.today);
        if (grouped.tomorrow) hearings.push(...grouped.tomorrow);
        if (grouped.later) hearings.push(...grouped.later);
    }

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        مرحباً، {user?.name || 'المستخدم'} 👋
                    </h1>
                    <p className="text-muted-foreground">
                        إليك نظرة عامة على نشاط مكتبك اليوم
                    </p>
                </div>
                <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleDateString('ar-SA', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Scale}
                    title="إجمالي القضايا"
                    value={stats?.cases.total || 0}
                    color="primary"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={TrendingUp}
                    title="القضايا النشطة"
                    value={stats?.cases.active || 0}
                    color="success"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={Calendar}
                    title="الجلسات هذا الأسبوع"
                    value={stats?.hearings.thisWeek || 0}
                    color="warning"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={Users}
                    title="العملاء"
                    value={stats?.clients.total || 0}
                    color="primary"
                    isLoading={statsLoading}
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    icon={Clock}
                    title="الجلسات اليوم"
                    value={stats?.hearings.today || 0}
                    color="destructive"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={Receipt}
                    title="الفواتير المعلقة"
                    value={stats?.invoices.pending || 0}
                    color="warning"
                    isLoading={statsLoading}
                />
                <StatCard
                    icon={Receipt}
                    title="إجمالي الإيرادات"
                    value={stats?.invoices.totalRevenue ? `${stats.invoices.totalRevenue.toLocaleString()} ر.س` : '0 ر.س'}
                    color="success"
                    isLoading={statsLoading}
                />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Hearings */}
                <UpcomingHearings
                    hearings={hearings.slice(0, 5)}
                    isLoading={hearingsLoading}
                />

                {/* Recent Activity */}
                <RecentActivity
                    activities={activities.slice(0, 5)}
                    isLoading={activityLoading}
                />
            </div>
        </div>
    );
}

export default DashboardPage;
