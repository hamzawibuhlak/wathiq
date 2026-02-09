import { Link } from 'react-router-dom';
import {
    Briefcase,
    Users,
    Calendar,
    Clock,
    TrendingUp,
    AlertCircle,
    ArrowLeft,
    Plus,
    Receipt
} from 'lucide-react';
import { StatCard, UpcomingHearings, RecentActivity, DashboardAnalytics } from '@/components/dashboard';
import { useDashboardStats, useUpcomingHearings, useRecentActivity } from '@/hooks/use-dashboard';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';


export function DashboardPage() {
    const { user } = useAuthStore();
    const { data: statsData, isLoading: statsLoading } = useDashboardStats();
    const { data: hearingsData, isLoading: hearingsLoading } = useUpcomingHearings(30);
    const { data: activityData, isLoading: activityLoading } = useRecentActivity();

    const stats = statsData?.data;

    // Check if user can see financial data (OWNER/ADMIN only)
    const canSeeFinancials = user?.role === 'OWNER' || user?.role === 'ADMIN';

    // Mock activity data until backend provides proper format
    const activities = activityData?.data || [];

    // Get hearings array from grouped response
    const hearings: any[] = [];
    if (hearingsData?.data) {
        const grouped = hearingsData.data;
        if (grouped.today) hearings.push(...grouped.today);
        if (grouped.tomorrow) hearings.push(...grouped.tomorrow);
        if (grouped.later) hearings.push(...grouped.later);
        // Also check 'all' array
        if (grouped.all && hearings.length === 0) {
            hearings.push(...grouped.all);
        }
    }

    // Separate today's and upcoming hearings
    const todayHearings = hearingsData?.data?.today || [];
    const tomorrowHearings = hearingsData?.data?.tomorrow || [];

    // Get Arabic day name
    const getArabicDayName = () => {
        return new Date().toLocaleDateString('ar-SA', { weekday: 'long' });
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header with Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        مرحبا، {user?.name?.split(' ')[0] || 'المستخدم'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {getArabicDayName()}، {new Date().toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                    <Link
                        to="/cases/new"
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        قضية جديدة
                    </Link>
                    <Link
                        to="/hearings/new"
                        className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        جلسة جديدة
                    </Link>
                </div>
            </div>

            {/* Today Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        اليوم
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Today's Hearings Card */}
                    <div className={cn(
                        "col-span-1 md:col-span-2 p-5 rounded-2xl border",
                        todayHearings.length > 0
                            ? "bg-gradient-to-br from-red-50 to-orange-50 border-red-100 dark:from-red-950/20 dark:to-orange-950/20 dark:border-red-900/30"
                            : "bg-card"
                    )}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    todayHearings.length > 0
                                        ? "bg-red-500/10 text-red-600"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">جلسات اليوم</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {todayHearings.length > 0
                                            ? `${todayHearings.length} جلسة تحتاج انتباهك`
                                            : 'لا توجد جلسات اليوم'
                                        }
                                    </p>
                                </div>
                            </div>
                            <span className="text-3xl font-bold">
                                {stats?.hearings.today || 0}
                            </span>
                        </div>

                        {todayHearings.length > 0 && (
                            <div className="space-y-2">
                                {todayHearings.slice(0, 2).map((hearing: any) => (
                                    <Link
                                        key={hearing.id}
                                        to={`/hearings/${hearing.id}`}
                                        className="flex items-center justify-between p-3 bg-white/60 dark:bg-white/5 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Clock className="w-4 h-4 text-red-500" />
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {hearing.case?.title || hearing.title || 'جلسة'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {hearing.courtName || 'المحكمة'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-medium">
                                            {new Date(hearing.hearingDate).toLocaleTimeString('ar-SA', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </Link>
                                ))}
                                {todayHearings.length > 2 && (
                                    <Link
                                        to="/hearings?filter=today"
                                        className="flex items-center justify-center gap-2 py-2 text-sm text-primary hover:underline"
                                    >
                                        عرض الكل ({todayHearings.length})
                                        <ArrowLeft className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Active Cases */}
                    <div className="p-5 rounded-2xl border bg-card">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                <Briefcase className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">قضايا نشطة</p>
                                <p className="text-2xl font-bold">{stats?.cases.active || 0}</p>
                            </div>
                        </div>
                        <Link
                            to="/cases?status=active"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            عرض القضايا
                            <ArrowLeft className="w-3 h-3" />
                        </Link>
                    </div>

                    {/* Clients */}
                    <div className="p-5 rounded-2xl border bg-card">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">العملاء</p>
                                <p className="text-2xl font-bold">{stats?.clients.total || 0}</p>
                            </div>
                        </div>
                        <Link
                            to="/clients"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            عرض العملاء
                            <ArrowLeft className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* This Week Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-muted-foreground" />
                        هذا الأسبوع
                    </h2>
                    <Link
                        to="/calendar"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        عرض التقويم
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        icon={Calendar}
                        title="جلسات الأسبوع"
                        value={stats?.hearings.thisWeek || 0}
                        color="warning"
                        isLoading={statsLoading}
                    />
                    <StatCard
                        icon={TrendingUp}
                        title="إجمالي القضايا"
                        value={stats?.cases.total || 0}
                        color="primary"
                        isLoading={statsLoading}
                    />
                    <StatCard
                        icon={Clock}
                        title="جلسات غدا"
                        value={tomorrowHearings.length}
                        color="success"
                        isLoading={hearingsLoading}
                    />
                </div>
            </section>

            {/* Financial Section - Only for OWNER/ADMIN */}
            {canSeeFinancials && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-muted-foreground" />
                            المالية
                        </h2>
                        <Link
                            to="/invoices"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                            عرض الفواتير
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-100 dark:border-amber-900/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">فواتير معلقة</p>
                                        <p className="text-2xl font-bold">{stats?.invoices.pending || 0}</p>
                                    </div>
                                </div>
                                <p className="text-lg font-semibold text-amber-600">
                                    {stats?.invoices.pendingAmount?.toLocaleString() || 0} ر.س
                                </p>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl border bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {stats?.invoices.totalRevenue?.toLocaleString() || 0} ر.س
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Analytics Charts Section */}
            <DashboardAnalytics canSeeFinancials={canSeeFinancials} />

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
