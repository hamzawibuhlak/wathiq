import { useState } from 'react';
import { 
    BarChart3, 
    PieChart, 
    TrendingUp,
    TrendingDown,
    Users, 
    Briefcase, 
    Calendar, 
    DollarSign,
    Download,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    FileSpreadsheet,
    Clock,
    FileText,
    CheckSquare,
    AlertTriangle,
    Printer
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAnalyticsDashboard, useLawyerPerformance } from '@/hooks/use-analytics';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/client';
import { toast } from 'react-hot-toast';

// Color palette for charts
const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Case type translations
const caseTypeLabels: Record<string, string> = {
    CRIMINAL: 'جنائي',
    CIVIL: 'مدني',
    COMMERCIAL: 'تجاري',
    LABOR: 'عمالي',
    FAMILY: 'أحوال شخصية',
    ADMINISTRATIVE: 'إداري',
    REAL_ESTATE: 'عقاري',
    OTHER: 'أخرى',
};

// Case status translations
const caseStatusLabels: Record<string, string> = {
    OPEN: 'مفتوحة',
    IN_PROGRESS: 'جارية',
    SUSPENDED: 'معلقة',
    CLOSED: 'مغلقة',
    ARCHIVED: 'مؤرشفة',
};

// Invoice status translations
const invoiceStatusLabels: Record<string, string> = {
    DRAFT: 'مسودة',
    PENDING: 'مستحقة',
    SENT: 'مرسلة',
    PAID: 'مدفوعة',
    OVERDUE: 'متأخرة',
    CANCELLED: 'ملغية',
};

export function AnalyticsDashboardPage() {
    const { user } = useAuthStore();
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [isExporting, setIsExporting] = useState(false);
    
    // Use new analytics API
    const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalyticsDashboard(period);
    const { data: lawyerData, isLoading: lawyerLoading } = useLawyerPerformance();
    
    const analytics = analyticsData?.data;
    const lawyers = lawyerData?.data || [];

    // Check if user can see financial data
    const canSeeFinancials = user?.role === 'OWNER' || user?.role === 'ADMIN';

    // Prepare chart data
    const casesByStatusData = analytics?.cases?.byStatus?.map(item => ({
        name: caseStatusLabels[item.status] || item.status,
        value: item.count,
    })) || [];

    const casesByTypeData = analytics?.cases?.byType?.map(item => ({
        name: caseTypeLabels[item.type] || item.type,
        value: item.count,
    })) || [];

    // Trends data for charts
    const casesTrend = analytics?.trends?.cases || [];
    const revenueTrend = analytics?.trends?.revenue || [];
    const hearingsTrend = analytics?.trends?.hearings || [];

    // Export financial report
    const handleExportFinancial = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/exports/financial-report', {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `financial-report-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('تم تصدير التقرير بنجاح');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('فشل تصدير التقرير');
        } finally {
            setIsExporting(false);
        }
    };

    // Export cases report
    const handleExportCases = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/exports/cases', {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cases-report-${Date.now()}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success('تم تصدير التقرير بنجاح');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('فشل تصدير التقرير');
        } finally {
            setIsExporting(false);
        }
    };

    // Print report
    const handlePrint = () => {
        window.print();
    };

    const isLoading = analyticsLoading || lawyerLoading;

    return (
        <div className="space-y-6 print:space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        التقارير والتحليلات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        نظرة شاملة على أداء المكتب والإحصائيات
                    </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Period Selector */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
                        className="px-3 py-2 border rounded-xl bg-background text-sm"
                    >
                        <option value="week">هذا الأسبوع</option>
                        <option value="month">هذا الشهر</option>
                        <option value="year">هذه السنة</option>
                    </select>
                    
                    <button
                        onClick={() => refetchAnalytics()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        تحديث
                    </button>

                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        طباعة
                    </button>
                    
                    {canSeeFinancials && (
                        <button
                            onClick={handleExportFinancial}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {isExporting ? 'جاري التصدير...' : 'تصدير التقرير المالي'}
                        </button>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-bold">تقرير التحليلات</h1>
                <p className="text-gray-600">
                    {period === 'week' ? 'هذا الأسبوع' : period === 'month' ? 'هذا الشهر' : 'هذه السنة'} - 
                    {new Date().toLocaleDateString('ar-SA')}
                </p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Briefcase}
                    title="القضايا الجديدة"
                    value={analytics?.cases?.total || 0}
                    change={analytics?.cases?.growth}
                    changeLabel={`نمو ${period === 'week' ? 'أسبوعي' : period === 'month' ? 'شهري' : 'سنوي'}`}
                    color="blue"
                    isLoading={analyticsLoading}
                />
                <MetricCard
                    icon={Users}
                    title="العملاء الجدد"
                    value={analytics?.clients?.newClients || 0}
                    subValue={`من ${analytics?.clients?.total || 0} عميل`}
                    color="green"
                    isLoading={analyticsLoading}
                />
                <MetricCard
                    icon={Calendar}
                    title="الجلسات القادمة"
                    value={analytics?.hearings?.upcoming || 0}
                    subValue={`${analytics?.hearings?.today || 0} اليوم - ${analytics?.hearings?.thisWeek || 0} هذا الأسبوع`}
                    color="amber"
                    isLoading={analyticsLoading}
                />
                {canSeeFinancials && (
                    <MetricCard
                        icon={DollarSign}
                        title="الإيرادات"
                        value={`${(analytics?.financial?.totalRevenue || 0).toLocaleString()} ر.س`}
                        change={analytics?.financial?.revenueGrowth}
                        changeLabel="نمو الإيرادات"
                        color="purple"
                        isLoading={analyticsLoading}
                    />
                )}
            </div>

            {/* Performance Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    icon={Clock}
                    title="متوسط مدة القضية"
                    value={`${analytics?.cases?.avgCaseDuration || 0} يوم`}
                    subValue="للقضايا المغلقة"
                    color="blue"
                    isLoading={analyticsLoading}
                />
                <MetricCard
                    icon={CheckSquare}
                    title="معدل إغلاق القضايا"
                    value={`${analytics?.cases?.closureRate || 0}%`}
                    subValue={`${analytics?.cases?.totalClosedCases || 0} من ${analytics?.cases?.totalAllCases || 0}`}
                    color="green"
                    isLoading={analyticsLoading}
                />
                <MetricCard
                    icon={Calendar}
                    title="معدل حضور الجلسات"
                    value={`${analytics?.hearings?.attendanceRate || 0}%`}
                    subValue={`${analytics?.hearings?.past || 0} جلسة مكتملة`}
                    color="amber"
                    isLoading={analyticsLoading}
                />
                <MetricCard
                    icon={CheckSquare}
                    title="معدل إنجاز المهام"
                    value={`${analytics?.tasks?.completionRate || 0}%`}
                    subValue={`${analytics?.tasks?.overdueTasks || 0} متأخرة`}
                    color="purple"
                    isLoading={analyticsLoading}
                    alert={(analytics?.tasks?.overdueTasks ?? 0) > 0}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                {canSeeFinancials && (
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" />
                                اتجاه الإيرادات
                            </h3>
                        </div>
                        <div className="h-[300px]">
                            {revenueTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                        />
                                        <YAxis 
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [`${value.toLocaleString()} ر.س`, 'الإيرادات']}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                direction: 'rtl'
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground">
                                    لا توجد بيانات للإيرادات
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Cases by Type - Pie Chart */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-blue-500" />
                            القضايا حسب النوع
                        </h3>
                        <button
                            onClick={handleExportCases}
                            disabled={isExporting}
                            className="text-sm text-primary hover:underline flex items-center gap-1 print:hidden"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            تصدير
                        </button>
                    </div>
                    <div className="h-[300px]">
                        {casesByTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={casesByTypeData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {casesByTypeData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => [value, 'عدد القضايا']}
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            direction: 'rtl'
                                        }}
                                    />
                                </RechartsPie>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                لا توجد قضايا حتى الآن
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Cases & Hearings Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases Trend */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-500" />
                            اتجاه القضايا الجديدة
                        </h3>
                    </div>
                    <div className="h-[250px]">
                        {casesTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={casesTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                                    <Tooltip
                                        formatter={(value: number) => [value, 'قضايا']}
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            direction: 'rtl'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#2563eb" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                لا توجد بيانات
                            </div>
                        )}
                    </div>
                </div>

                {/* Hearings Trend */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            اتجاه الجلسات
                        </h3>
                    </div>
                    <div className="h-[250px]">
                        {hearingsTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hearingsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                                    <Tooltip
                                        formatter={(value: number) => [value, 'جلسات']}
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            direction: 'rtl'
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                لا توجد بيانات
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Clients & Top Invoices */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Clients */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            أكثر العملاء قضايا
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {analytics?.topClients && analytics.topClients.length > 0 ? (
                            analytics.topClients.map((client: any, index: number) => (
                                <div 
                                    key={client.clientId}
                                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                            index === 0 ? "bg-amber-500" : 
                                            index === 1 ? "bg-gray-400" :
                                            index === 2 ? "bg-amber-700" : "bg-blue-500"
                                        )}>
                                            {index + 1}
                                        </div>
                                        <span className="font-medium">{client.clientName}</span>
                                    </div>
                                    <div className="text-left">
                                        <span className="font-semibold">{client.casesCount}</span>
                                        <span className="text-xs text-muted-foreground mr-1">قضية</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                لا توجد بيانات
                            </div>
                        )}
                    </div>
                </div>

                {/* Top Invoices */}
                {canSeeFinancials && (
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-green-500" />
                                أكبر الفواتير
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {analytics?.topInvoices && analytics.topInvoices.length > 0 ? (
                                analytics.topInvoices.map((invoice: any, index: number) => (
                                    <div 
                                        key={invoice.invoiceId}
                                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                                index === 0 ? "bg-green-500" : 
                                                index === 1 ? "bg-green-400" :
                                                index === 2 ? "bg-green-600" : "bg-green-700"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                                <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-green-600">
                                                {invoice.amount.toLocaleString()} ر.س
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {invoiceStatusLabels[invoice.status] || invoice.status}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    لا توجد فواتير
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Cases Status & Lawyer Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cases by Status - Bar Chart */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                            حالة القضايا
                        </h3>
                    </div>
                    <div className="h-[300px]">
                        {casesByStatusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={casesByStatusData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        tick={{ fontSize: 12 }}
                                        width={80}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [value, 'عدد القضايا']}
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                            direction: 'rtl'
                                        }}
                                    />
                                    <Bar 
                                        dataKey="value" 
                                        fill="#8b5cf6" 
                                        radius={[0, 4, 4, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                لا توجد قضايا حتى الآن
                            </div>
                        )}
                    </div>
                </div>

                {/* Lawyer Performance */}
                {canSeeFinancials && (
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-emerald-500" />
                                أداء المحامين
                            </h3>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {lawyerLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="animate-pulse">
                                            <div className="h-16 bg-muted rounded-xl" />
                                        </div>
                                    ))}
                                </div>
                            ) : lawyers && lawyers.length > 0 ? (
                                lawyers.map((lawyer: any, index: number) => (
                                    <div 
                                        key={lawyer.lawyerId}
                                        className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
                                                index === 0 ? "bg-amber-500" : 
                                                index === 1 ? "bg-gray-400" :
                                                index === 2 ? "bg-amber-700" : "bg-blue-500"
                                            )}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium">{lawyer.lawyerName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {lawyer.totalCases} قضية - {lawyer.totalHearings} جلسة
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-semibold text-lg">{lawyer.successRate}%</p>
                                            <p className="text-xs text-muted-foreground">معدل النجاح</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground py-12">
                                    لا توجد بيانات للأداء
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Documents & Tasks Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Documents Stats */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            إحصائيات المستندات
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                            <p className="text-sm text-muted-foreground">إجمالي المستندات</p>
                            <p className="text-2xl font-bold text-blue-600">{analytics?.documents?.total || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                            <p className="text-sm text-muted-foreground">مساحة التخزين</p>
                            <p className="text-2xl font-bold text-purple-600">{analytics?.documents?.totalSizeMB || 0} MB</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">حسب النوع:</p>
                        {analytics?.documents?.byType?.map((type: any) => (
                            <div key={type.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <span>{type.type}</span>
                                <span className="font-medium">{type.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clients Stats */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-500" />
                            إحصائيات العملاء
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30">
                            <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                            <p className="text-2xl font-bold text-purple-600">{analytics?.clients?.total || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30">
                            <p className="text-sm text-muted-foreground">العملاء النشطين</p>
                            <p className="text-2xl font-bold text-indigo-600">{analytics?.clients?.activeClients || 0}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">حسب النوع:</p>
                        {analytics?.clients?.byType?.map((type: any) => (
                            <div key={type.type} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <span>{type.type}</span>
                                <span className="font-medium">{type.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tasks Stats */}
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-green-500" />
                            إحصائيات المهام
                        </h3>
                        {(analytics?.tasks?.overdueTasks ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-sm text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                {analytics?.tasks?.overdueTasks} متأخرة
                            </span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
                            <p className="text-sm text-muted-foreground">إجمالي المهام</p>
                            <p className="text-2xl font-bold text-green-600">{analytics?.tasks?.total || 0}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                            <p className="text-sm text-muted-foreground">معدل الإنجاز</p>
                            <p className="text-2xl font-bold text-emerald-600">{analytics?.tasks?.completionRate || 0}%</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">حسب الحالة:</p>
                        {analytics?.tasks?.byStatus?.map((status: any) => (
                            <div key={status.status} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                                <span>{status.label}</span>
                                <span className="font-medium">{status.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Hearings Timeline */}
            {analytics?.upcomingHearings && analytics.upcomingHearings.length > 0 && (
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            جدول الجلسات القادمة
                        </h3>
                        <span className="text-sm text-muted-foreground">
                            {analytics.upcomingHearings.length} جلسة
                        </span>
                    </div>
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-amber-300 to-transparent" />
                        
                        <div className="space-y-4">
                            {analytics.upcomingHearings.slice(0, 5).map((hearing: any, index: number) => {
                                const hearingDate = new Date(hearing.hearingDate);
                                const isToday = new Date().toDateString() === hearingDate.toDateString();
                                const isTomorrow = new Date(Date.now() + 86400000).toDateString() === hearingDate.toDateString();
                                
                                return (
                                    <div key={hearing.id} className="relative flex gap-4 pr-8">
                                        {/* Timeline dot */}
                                        <div className={cn(
                                            "absolute right-2 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800",
                                            isToday ? "bg-red-500" : 
                                            isTomorrow ? "bg-amber-500" : 
                                            "bg-blue-500"
                                        )} />
                                        
                                        <div className={cn(
                                            "flex-1 p-4 rounded-xl transition-colors",
                                            isToday ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" :
                                            isTomorrow ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800" :
                                            "bg-muted/50 border border-transparent"
                                        )}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className="font-medium">{hearing.caseTitle || 'جلسة'}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {hearing.courtName || 'المحكمة'}
                                                        {hearing.courtroom && ` - القاعة ${hearing.courtroom}`}
                                                    </p>
                                                    {hearing.clientName && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            العميل: {hearing.clientName}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        isToday ? "text-red-600" :
                                                        isTomorrow ? "text-amber-600" :
                                                        "text-blue-600"
                                                    )}>
                                                        {isToday ? 'اليوم' : 
                                                         isTomorrow ? 'غداً' : 
                                                         hearingDate.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {hearingDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {analytics.upcomingHearings.length > 5 && (
                            <div className="mt-4 text-center">
                                <span className="text-sm text-muted-foreground">
                                    و {analytics.upcomingHearings.length - 5} جلسات أخرى...
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Financial Summary */}
            {canSeeFinancials && analytics?.financial && (
                <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            ملخص الفواتير
                        </h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                            <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                            <p className="text-2xl font-bold text-blue-600">{analytics.financial.totalInvoices}</p>
                            <p className="text-sm text-blue-600 mt-1">{analytics.financial.totalRevenue.toLocaleString()} ر.س</p>
                        </div>
                        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
                            <p className="text-sm text-muted-foreground">الإيرادات</p>
                            <p className="text-2xl font-bold text-green-600">
                                {analytics.financial.totalRevenue.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                {analytics.financial.revenueGrowth >= 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-4 h-4 text-red-600" />
                                )}
                                <span className={cn(
                                    "text-sm",
                                    analytics.financial.revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                    {analytics.financial.revenueGrowth}%
                                </span>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                            <p className="text-sm text-muted-foreground">المعلقة</p>
                            <p className="text-2xl font-bold text-amber-600">
                                {analytics.financial.pending.toLocaleString()}
                            </p>
                            <p className="text-sm text-amber-600 mt-1">ر.س</p>
                        </div>
                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30">
                            <p className="text-sm text-muted-foreground">المتأخرة</p>
                            <p className="text-2xl font-bold text-red-600">
                                {analytics.financial.overdue.toLocaleString()}
                            </p>
                            <p className="text-sm text-red-600 mt-1">ر.س</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Metric Card Component
interface MetricCardProps {
    icon: React.ElementType;
    title: string;
    value: number | string;
    change?: number;
    changeLabel?: string;
    subValue?: string;
    color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
    isLoading?: boolean;
    alert?: boolean;
}

function MetricCard({ icon: Icon, title, value, change, changeLabel, subValue, color, isLoading, alert }: MetricCardProps) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600',
        green: 'bg-emerald-500/10 text-emerald-600',
        amber: 'bg-amber-500/10 text-amber-600',
        purple: 'bg-purple-500/10 text-purple-600',
        red: 'bg-red-500/10 text-red-600',
    };

    return (
        <div className={cn(
            "p-5 rounded-2xl border bg-card hover:shadow-md transition-shadow print:border-gray-300",
            alert && "border-red-300 dark:border-red-800"
        )}>
            <div className="flex items-start justify-between">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {change !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        change >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {change >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4" />
                        )}
                        {Math.abs(change)}%
                    </div>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-muted-foreground">{title}</p>
                {isLoading ? (
                    <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
                ) : (
                    <p className="text-2xl font-bold mt-1">{value}</p>
                )}
                {(changeLabel || subValue) && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {changeLabel || subValue}
                    </p>
                )}
            </div>
        </div>
    );
}

export default AnalyticsDashboardPage;
