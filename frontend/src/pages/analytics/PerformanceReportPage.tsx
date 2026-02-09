import { useState, useRef } from 'react';
import { 
    BarChart3, 
    TrendingUp,
    TrendingDown,
    Users, 
    Briefcase, 
    Calendar, 
    DollarSign,
    Download,
    RefreshCw,
    Clock,
    CheckSquare,
    Target,
    Award,
    Printer,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    BarChart,
    Bar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAnalyticsDashboard, useLawyerPerformance } from '@/hooks/use-analytics';
import { useAuthStore } from '@/stores/auth.store';
import api from '@/api/client';
import { toast } from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';

export function PerformanceReportPage() {
    const { user } = useAuthStore();
    const printRef = useRef<HTMLDivElement>(null);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
    const [isExporting, setIsExporting] = useState(false);
    
    const { data: analyticsData, isLoading: analyticsLoading, refetch } = useAnalyticsDashboard(period);
    const { data: lawyerData, isLoading: lawyerLoading } = useLawyerPerformance();
    
    const analytics = analyticsData?.data;
    const lawyers = lawyerData?.data || [];

    const canSeeFinancials = user?.role === 'OWNER' || user?.role === 'ADMIN';
    const isLoading = analyticsLoading || lawyerLoading;

    // Prepare radar chart data for overall performance
    const performanceRadarData = [
        { 
            metric: 'إغلاق القضايا', 
            value: analytics?.cases?.closureRate || 0,
            fullMark: 100 
        },
        { 
            metric: 'حضور الجلسات', 
            value: analytics?.hearings?.attendanceRate || 0,
            fullMark: 100 
        },
        { 
            metric: 'إنجاز المهام', 
            value: analytics?.tasks?.completionRate || 0,
            fullMark: 100 
        },
        { 
            metric: 'نمو القضايا', 
            value: Math.min(100, Math.max(0, 50 + (analytics?.cases?.growth || 0))),
            fullMark: 100 
        },
        { 
            metric: 'نمو الإيرادات', 
            value: canSeeFinancials ? Math.min(100, Math.max(0, 50 + (analytics?.financial?.revenueGrowth || 0))) : 50,
            fullMark: 100 
        },
    ];

    // Monthly comparison data
    const monthlyComparisonData = analytics?.trends?.cases?.map((item, index) => ({
        name: item.date,
        cases: item.value,
        hearings: analytics?.trends?.hearings?.[index]?.value || 0,
        revenue: canSeeFinancials ? (analytics?.trends?.revenue?.[index]?.value || 0) / 1000 : 0,
    })) || [];

    // Print handler
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `تقرير الأداء - ${new Date().toLocaleDateString('ar-SA')}`,
    });

    // Export handler
    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await api.get('/exports/financial-report', {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `performance-report-${Date.now()}.xlsx`);
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

    // Calculate overall score
    const overallScore = Math.round(
        ((analytics?.cases?.closureRate || 0) +
        (analytics?.hearings?.attendanceRate || 0) +
        (analytics?.tasks?.completionRate || 0)) / 3
    );

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-amber-600';
        return 'text-red-600';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Target className="w-7 h-7 text-primary" />
                        تقرير الأداء الشامل
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        تحليل شامل لأداء المكتب والموظفين
                    </p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
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
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors"
                    >
                        <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        تحديث
                    </button>

                    <button
                        onClick={() => handlePrint()}
                        className="flex items-center gap-2 px-4 py-2 border rounded-xl hover:bg-muted transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        طباعة
                    </button>
                    
                    {canSeeFinancials && (
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            {isExporting ? 'جاري التصدير...' : 'تصدير Excel'}
                        </button>
                    )}
                </div>
            </div>

            {/* Printable Content */}
            <div ref={printRef} className="space-y-6 print:p-4">
                {/* Print Header */}
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold">تقرير الأداء الشامل</h1>
                    <p className="text-gray-600">
                        {period === 'week' ? 'هذا الأسبوع' : period === 'month' ? 'هذا الشهر' : 'هذه السنة'} - 
                        {new Date().toLocaleDateString('ar-SA')}
                    </p>
                </div>

                {/* Overall Score Card */}
                <div className="p-8 rounded-2xl border bg-gradient-to-br from-primary/5 to-primary/10 print:border-gray-300">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-right">
                            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2 justify-center md:justify-start">
                                <Award className="w-6 h-6 text-primary" />
                                التقييم العام للأداء
                            </h2>
                            <p className="text-muted-foreground">
                                بناءً على معدل إغلاق القضايا وحضور الجلسات وإنجاز المهام
                            </p>
                        </div>
                        
                        <div className="flex items-center gap-6">
                            <div className="relative w-32 h-32">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="none"
                                        className="text-muted"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="56"
                                        stroke="currentColor"
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${overallScore * 3.52} 352`}
                                        className={getScoreBg(overallScore).replace('bg-', 'text-')}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
                                        {overallScore}%
                                    </span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-sm">ممتاز (80%+)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                                    <span className="text-sm">جيد (60-79%)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500" />
                                    <span className="text-sm">يحتاج تحسين (&lt;60%)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        icon={Briefcase}
                        title="القضايا الجديدة"
                        value={analytics?.cases?.total || 0}
                        target={period === 'month' ? 20 : period === 'week' ? 5 : 100}
                        trend={analytics?.cases?.growth}
                        color="blue"
                        isLoading={analyticsLoading}
                    />
                    <KPICard
                        icon={CheckSquare}
                        title="معدل إغلاق القضايا"
                        value={`${analytics?.cases?.closureRate || 0}%`}
                        target={80}
                        current={analytics?.cases?.closureRate || 0}
                        color="green"
                        isLoading={analyticsLoading}
                    />
                    <KPICard
                        icon={Calendar}
                        title="معدل حضور الجلسات"
                        value={`${analytics?.hearings?.attendanceRate || 0}%`}
                        target={90}
                        current={analytics?.hearings?.attendanceRate || 0}
                        color="amber"
                        isLoading={analyticsLoading}
                    />
                    <KPICard
                        icon={Clock}
                        title="متوسط مدة القضية"
                        value={`${analytics?.cases?.avgCaseDuration || 0} يوم`}
                        subValue="للقضايا المغلقة"
                        color="purple"
                        isLoading={analyticsLoading}
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Performance Radar */}
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            مؤشرات الأداء الرئيسية
                        </h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={performanceRadarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                    <Radar
                                        name="الأداء"
                                        dataKey="value"
                                        stroke="#2563eb"
                                        fill="#2563eb"
                                        fillOpacity={0.5}
                                    />
                                    <Legend />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Monthly Comparison */}
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            مقارنة الأداء الشهري
                        </h3>
                        <div className="h-[300px]">
                            {monthlyComparisonData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyComparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                                direction: 'rtl'
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="cases" name="القضايا" fill="#2563eb" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="hearings" name="الجلسات" fill="#f59e0b" radius={[4, 4, 0, 0]} />
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

                {/* Lawyer Performance Table */}
                {canSeeFinancials && (
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            أداء المحامين
                        </h3>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-right py-3 px-4 font-semibold">#</th>
                                        <th className="text-right py-3 px-4 font-semibold">المحامي</th>
                                        <th className="text-right py-3 px-4 font-semibold">القضايا</th>
                                        <th className="text-right py-3 px-4 font-semibold">النشطة</th>
                                        <th className="text-right py-3 px-4 font-semibold">المغلقة</th>
                                        <th className="text-right py-3 px-4 font-semibold">الجلسات</th>
                                        <th className="text-right py-3 px-4 font-semibold">معدل النجاح</th>
                                        <th className="text-right py-3 px-4 font-semibold">متوسط الإنجاز</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lawyerLoading ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8">
                                                <div className="animate-pulse">جاري التحميل...</div>
                                            </td>
                                        </tr>
                                    ) : lawyers.length > 0 ? (
                                        lawyers.map((lawyer: any, index: number) => (
                                            <tr key={lawyer.lawyerId} className="border-b hover:bg-muted/50">
                                                <td className="py-3 px-4">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                                        index === 0 ? "bg-amber-500" : 
                                                        index === 1 ? "bg-gray-400" :
                                                        index === 2 ? "bg-amber-700" : "bg-blue-500"
                                                    )}>
                                                        {index + 1}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-medium">{lawyer.lawyerName}</td>
                                                <td className="py-3 px-4">{lawyer.totalCases}</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                                        {lawyer.activeCases}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm">
                                                        {lawyer.closedCases}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">{lawyer.totalHearings}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 bg-muted rounded-full h-2">
                                                            <div 
                                                                className={cn(
                                                                    "h-2 rounded-full",
                                                                    lawyer.successRate >= 80 ? "bg-green-500" :
                                                                    lawyer.successRate >= 60 ? "bg-amber-500" : "bg-red-500"
                                                                )}
                                                                style={{ width: `${lawyer.successRate}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-semibold">{lawyer.successRate}%</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">{lawyer.avgResolutionDays} يوم</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="text-center py-8 text-muted-foreground">
                                                لا توجد بيانات
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Financial Performance */}
                {canSeeFinancials && analytics?.financial && (
                    <div className="p-6 rounded-2xl border bg-card print:border-gray-300">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            الأداء المالي
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30">
                                <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {analytics.financial.totalRevenue.toLocaleString()} ر.س
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
                            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30">
                                <p className="text-sm text-muted-foreground">إجمالي الفواتير</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {analytics.financial.totalInvoices}
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                                <p className="text-sm text-muted-foreground">المعلقة</p>
                                <p className="text-2xl font-bold text-amber-600">
                                    {analytics.financial.pending.toLocaleString()} ر.س
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30">
                                <p className="text-sm text-muted-foreground">المتأخرة</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {analytics.financial.overdue.toLocaleString()} ر.س
                                </p>
                            </div>
                        </div>

                        {/* Revenue Trend */}
                        <div className="h-[250px]">
                            {analytics?.trends?.revenue && analytics.trends.revenue.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.trends.revenue}>
                                        <defs>
                                            <linearGradient id="colorRevenuePR" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                        <YAxis 
                                            tick={{ fontSize: 11 }} 
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
                                            fill="url(#colorRevenuePR)"
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

                {/* Print Footer */}
                <div className="hidden print:block text-center mt-8 pt-4 border-t text-gray-500 text-sm">
                    <p>تم إنشاء هذا التقرير بواسطة نظام وثيق - {new Date().toLocaleDateString('ar-SA')}</p>
                </div>
            </div>
        </div>
    );
}

// KPI Card Component
interface KPICardProps {
    icon: React.ElementType;
    title: string;
    value: number | string;
    target?: number;
    current?: number;
    trend?: number;
    subValue?: string;
    color: 'blue' | 'green' | 'amber' | 'purple';
    isLoading?: boolean;
}

function KPICard({ icon: Icon, title, value, target, current, trend, subValue, color, isLoading }: KPICardProps) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-600',
        green: 'bg-emerald-500/10 text-emerald-600',
        amber: 'bg-amber-500/10 text-amber-600',
        purple: 'bg-purple-500/10 text-purple-600',
    };

    const progressPercent = target && current !== undefined ? Math.min(100, (current / target) * 100) : 0;

    return (
        <div className="p-5 rounded-2xl border bg-card hover:shadow-md transition-shadow print:border-gray-300">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        trend >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                        {trend >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                        ) : (
                            <ArrowDownRight className="w-4 h-4" />
                        )}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
                <div className="h-8 w-24 bg-muted animate-pulse rounded mt-1" />
            ) : (
                <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            
            {target && current !== undefined && (
                <div className="mt-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>الهدف: {target}%</span>
                        <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                        <div 
                            className={cn(
                                "h-2 rounded-full transition-all",
                                progressPercent >= 100 ? "bg-green-500" :
                                progressPercent >= 70 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}
            
            {subValue && (
                <p className="text-xs text-muted-foreground mt-2">{subValue}</p>
            )}
        </div>
    );
}

export default PerformanceReportPage;
