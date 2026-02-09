import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';

interface AnalyticsData {
    period: { start: string; end: string };
    cases: {
        total: number;
        byStatus: { status: string; count: number }[];
        byType: { caseType: string; count: number }[];
        byPriority: { priority: string; count: number }[];
        averageDuration: number;
        closureRate: number;
    };
    financial: {
        total: { amount: number; count: number };
        paid: { amount: number; count: number };
        pending: { amount: number; count: number };
        overdue: { amount: number; count: number };
        revenueByMonth: { month: string; revenue: number; count: number }[];
        topClients: { client: { name: string }; revenue: number; count: number }[];
        paymentSuccessRate: number;
    };
    clients: {
        total: number;
        active: number;
        new: number;
        retentionRate: number;
        averageCasesPerClient: number;
        averageRevenuePerClient: number;
    };
    performance: {
        lawyers: {
            lawyer: { id: string; name: string; email: string };
            metrics: {
                totalCases: number;
                activeCases: number;
                closedCases: number;
                successRate: number;
                revenue: number;
            };
        }[];
        topPerformer: any;
    };
    trends: {
        cases: { month: string; count: number }[];
        revenue: { month: string; revenue: number }[];
        clients: { month: string; count: number }[];
    };
}

// Status name mapping for Arabic
const statusLabels: Record<string, string> = {
    OPEN: 'مفتوحة',
    IN_PROGRESS: 'قيد العمل',
    CLOSED: 'مغلقة',
    PENDING: 'معلقة',
    ON_HOLD: 'موقوفة',
};

// Case type mapping for Arabic  
const caseTypeLabels: Record<string, string> = {
    CRIMINAL: 'جنائية',
    CIVIL: 'مدنية',
    COMMERCIAL: 'تجارية',
    LABOR: 'عمالية',
    FAMILY: 'أحوال شخصية',
    ADMINISTRATIVE: 'إدارية',
    OTHER: 'أخرى',
};

export default function AdvancedAnalyticsPage() {
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const { data: analytics, isLoading, error } = useQuery<AnalyticsData>({
        queryKey: ['analytics', 'overview', startDate, endDate],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            const res = await api.get(`/analytics/overview?${params.toString()}`);
            return res.data;
        },
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen" dir="rtl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">جاري تحميل التحليلات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6" dir="rtl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">حدث خطأ في تحميل التحليلات</p>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="p-6 space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">التحليلات المتقدمة</h1>
                    <p className="text-gray-500 mt-1">رؤى شاملة لأداء المكتب</p>
                </div>

                {/* Date Filters */}
                <div className="flex gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">من</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">إلى</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Total Cases */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">إجمالي القضايا</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.cases.total || 0}</p>
                            <p className="text-sm text-green-600 mt-1">
                                {analytics?.cases.closureRate || 0}% معدل الإغلاق
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">الإيرادات</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {formatCurrency(analytics?.financial.total.amount || 0)}
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                {analytics?.financial.paymentSuccessRate || 0}% معدل التحصيل
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Clients */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">العملاء</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.clients.total || 0}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {analytics?.clients.active || 0} نشط | {analytics?.clients.new || 0} جديد
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Avg Case Duration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">متوسط مدة القضية</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{analytics?.cases.averageDuration || 0} يوم</p>
                            <p className="text-sm text-gray-500 mt-1">من الفتح للإغلاق</p>
                        </div>
                        <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Cases & Financial */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Cases by Status */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">القضايا حسب الحالة</h3>
                    <div className="space-y-4">
                        {analytics?.cases.byStatus.map((item, index) => {
                            const total = analytics.cases.total || 1;
                            const percentage = Math.round((item.count / total) * 100);
                            const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
                            return (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                            {statusLabels[item.status] || item.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Cases by Type */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">القضايا حسب النوع</h3>
                    <div className="space-y-4">
                        {analytics?.cases.byType.map((item, index) => {
                            const total = analytics.cases.total || 1;
                            const percentage = Math.round((item.count / total) * 100);
                            const colors = ['bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'];
                            return (
                                <div key={index}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-gray-700">
                                            {caseTypeLabels[item.caseType] || item.caseType}
                                        </span>
                                        <span className="text-sm text-gray-500">{item.count} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Row 3: Financial Overview */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500">المدفوعات</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                        {formatCurrency(analytics?.financial.paid.amount || 0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{analytics?.financial.paid.count || 0} فاتورة</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500">المعلقة</h3>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">
                        {formatCurrency(analytics?.financial.pending.amount || 0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{analytics?.financial.pending.count || 0} فاتورة</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        المتأخرة
                    </h3>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                        {formatCurrency(analytics?.financial.overdue.amount || 0)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{analytics?.financial.overdue.count || 0} فاتورة</p>
                </div>
            </div>

            {/* Row 4: Top Clients & Team Performance */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Top Paying Clients */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">أفضل العملاء (إيرادات)</h3>
                    <div className="space-y-3">
                        {analytics?.financial.topClients.slice(0, 5).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-900">{item.client.name}</span>
                                </div>
                                <span className="font-bold text-green-600">{formatCurrency(item.revenue)}</span>
                            </div>
                        ))}
                        {(!analytics?.financial.topClients || analytics.financial.topClients.length === 0) && (
                            <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                        )}
                    </div>
                </div>

                {/* Team Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">أداء الفريق</h3>
                    <div className="space-y-4">
                        {analytics?.performance.lawyers.slice(0, 5).map((item, index) => (
                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-900">{item.lawyer.name}</span>
                                    <span className="text-lg font-bold text-blue-600">{item.metrics.successRate}%</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    <div className="text-center">
                                        <p className="text-gray-500">القضايا</p>
                                        <p className="font-semibold">{item.metrics.totalCases}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-500">النشطة</p>
                                        <p className="font-semibold text-blue-600">{item.metrics.activeCases}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-gray-500">المغلقة</p>
                                        <p className="font-semibold text-green-600">{item.metrics.closedCases}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {(!analytics?.performance.lawyers || analytics.performance.lawyers.length === 0) && (
                            <p className="text-center text-gray-500 py-4">لا يوجد محامين</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 5: Monthly Revenue Trend */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">تطور الإيرادات (12 شهر)</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                    {analytics?.financial.revenueByMonth.map((item, index) => {
                        const maxRevenue = Math.max(...(analytics.financial.revenueByMonth.map(r => r.revenue) || [1]));
                        const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center">
                                <div className="w-full flex flex-col items-center justify-end h-48">
                                    <span className="text-xs text-gray-500 mb-1">{formatCurrency(item.revenue)}</span>
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    ></div>
                                </div>
                                <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-right">
                                    {item.month}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Row 6: Client Insights */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">رؤى العملاء</h3>
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-indigo-600">{analytics?.clients.total || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">إجمالي العملاء</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">{analytics?.clients.retentionRate || 0}%</p>
                        <p className="text-sm text-gray-500 mt-1">معدل الاحتفاظ</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">{analytics?.clients.averageCasesPerClient || 0}</p>
                        <p className="text-sm text-gray-500 mt-1">متوسط القضايا لكل عميل</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-3xl font-bold text-purple-600">
                            {formatCurrency(analytics?.clients.averageRevenuePerClient || 0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">متوسط الإيرادات لكل عميل</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
