import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

import { Loader2 } from 'lucide-react';
import { useCasesTrend, useRevenueTrend, useCasesByType, useTopClients, useLawyerPerformance } from '@/hooks/use-dashboard';

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

const CASE_TYPE_LABELS: Record<string, string> = {
    'CRIMINAL': 'جنائي',
    'CIVIL': 'مدني',
    'COMMERCIAL': 'تجاري',
    'LABOR': 'عمالي',
    'FAMILY': 'أسري',
    'ADMINISTRATIVE': 'إداري',
    'REAL_ESTATE': 'عقاري',
    'OTHER': 'أخرى',
};

// Cases Trend Chart
export function CasesTrendChart() {
    const { data, isLoading } = useCasesTrend();

    if (isLoading) {
        return <ChartSkeleton title="اتجاه القضايا" />;
    }

    const chartData = data?.data || [];

    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">اتجاه القضايا (آخر 12 شهر)</h3>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCases)"
                        name="القضايا"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Revenue Trend Chart
export function RevenueTrendChart() {
    const { data, isLoading } = useRevenueTrend();

    if (isLoading) {
        return <ChartSkeleton title="اتجاه الإيرادات" />;
    }

    const chartData = data?.data || [];

    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">اتجاه الإيرادات (آخر 12 شهر)</h3>
            <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']}
                    />
                    <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#059669"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        name="الإيرادات"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Cases By Type Pie Chart
export function CasesByTypeChart() {
    const { data, isLoading } = useCasesByType();

    if (isLoading) {
        return <ChartSkeleton title="توزيع القضايا" />;
    }

    const chartData = (data?.data || []).map((item: any) => ({
        ...item,
        name: CASE_TYPE_LABELS[item.type] || item.type,
    }));

    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">توزيع القضايا حسب النوع</h3>
            <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                    >
                        {chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

// Top Clients Chart
export function TopClientsChart() {
    const { data, isLoading } = useTopClients(5);

    if (isLoading) {
        return <ChartSkeleton title="أفضل العملاء" />;
    }

    const chartData = data?.data || [];

    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">أفضل 5 عملاء (حسب عدد القضايا)</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                    <XAxis type="number" fontSize={12} tickLine={false} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        width={100}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                    />
                    <Bar dataKey="caseCount" fill="#7c3aed" radius={[0, 4, 4, 0]} name="عدد القضايا" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Lawyer Performance Chart
export function LawyerPerformanceChart() {
    const { data, isLoading } = useLawyerPerformance();

    if (isLoading) {
        return <ChartSkeleton title="أداء المحامين" />;
    }

    const chartData = data?.data || [];

    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">أداء المحامين</h3>
            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                    />
                    <Legend />
                    <Bar dataKey="activeCases" fill="#2563eb" name="قضايا نشطة" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completedTasks" fill="#059669" name="مهام مكتملة" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// Chart Skeleton
function ChartSkeleton({ title }: { title: string }) {
    return (
        <div className="p-5 rounded-2xl border bg-card">
            <h3 className="font-semibold mb-4">{title}</h3>
            <div className="h-[250px] flex items-center justify-center bg-muted/30 rounded-xl">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        </div>
    );
}

// Dashboard Analytics Section Component
export function DashboardAnalytics({ canSeeFinancials = false }: { canSeeFinancials?: boolean }) {
    return (
        <section className="space-y-4">
            <h2 className="text-lg font-semibold">التحليلات والإحصائيات</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CasesTrendChart />
                {canSeeFinancials && <RevenueTrendChart />}
                <CasesByTypeChart />
                <TopClientsChart />
                <LawyerPerformanceChart />
            </div>
        </section>
    );
}
