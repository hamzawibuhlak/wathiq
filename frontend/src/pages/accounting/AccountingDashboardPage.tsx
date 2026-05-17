import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    Calculator, TrendingUp, TrendingDown, DollarSign, CreditCard,
    FileText, BookOpen, Receipt, Wallet, PiggyBank, BarChart3,
    ArrowUp, ArrowDown, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { LoadingState } from '@/components/common/LoadingState';
import {
    useIncomeStatement,
    useBalanceSheet,
    useFinancialRatios,
    useVATReport,
    useARAging,
    useAPAging,
} from '@/hooks/use-accounting';

export function AccountingDashboardPage() {
    const { p } = useSlugPath();

    // Memoize date range so the React Query keys are stable across re-renders.
    // Without this, `now = new Date()` on each render created a new key every render,
    // causing infinite refetches that hammered the API into a 429.
    const { yearStart, today } = useMemo(() => {
        const n = new Date();
        return {
            yearStart: new Date(n.getFullYear(), 0, 1).toISOString(),
            today: n.toISOString(),
        };
    }, []);

    const income = useIncomeStatement(yearStart, today);
    const balanceSheet = useBalanceSheet(today);
    const ratios = useFinancialRatios(today);
    const vat = useVATReport(yearStart, today);
    const arAging = useARAging();
    const apAging = useAPAging();

    // Show the page even if some queries are still loading — partial data is fine.
    // Only block the entire page while the primary income query is loading on first mount.
    const isLoading = income.isLoading && !income.data;

    const formatCurrency = (amount?: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 })
            .format(amount || 0);

    const quickLinks = [
        { path: '/accounting/accounts',        icon: BookOpen, label: 'شجرة الحسابات',    color: 'text-blue-600 bg-blue-100' },
        { path: '/accounting/journal-entries', icon: FileText, label: 'القيود اليومية',  color: 'text-purple-600 bg-purple-100' },
        { path: '/invoices',                   icon: Receipt,  label: 'الفواتير',         color: 'text-green-600 bg-green-100' },
        { path: '/accounting/expenses',        icon: Wallet,   label: 'المصروفات',        color: 'text-red-600 bg-red-100' },
    ];

    if (isLoading) {
        return <LoadingState message="جاري تحميل البيانات المالية..." size="lg" />;
    }

    const inc = income.data;
    const bs = balanceSheet.data;
    const r = ratios.data;
    const vatData = vat.data;
    const ar = arAging.data;
    const ap = apAging.data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calculator className="w-7 h-7 text-primary" />
                        المحاسبة والمالية
                    </h1>
                    <p className="text-muted-foreground">نظرة عامة على الوضع المالي</p>
                </div>
                <div className="flex gap-2">
                    <Link to={p('/accounting/journal-entries')}>
                        <Button variant="outline"><FileText className="w-4 h-4 ml-2" />القيود</Button>
                    </Link>
                    <Link to={p('/accounting/accounts')}>
                        <Button><BookOpen className="w-4 h-4 ml-2" />شجرة الحسابات</Button>
                    </Link>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map(link => (
                    <Link key={link.path} to={p(link.path)} className="bg-card rounded-xl border p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${link.color} flex items-center justify-center group-hover:scale-110 transition`}>
                                <link.icon className="w-5 h-5" />
                            </div>
                            <span className="font-medium">{link.label}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">الإيرادات</p>
                            <p className="text-lg font-bold text-green-600">{formatCurrency(inc?.totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">المصروفات</p>
                            <p className="text-lg font-bold text-red-600">{formatCurrency(inc?.totalExpenses)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${(inc?.netIncome || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center`}>
                            <DollarSign className={`w-5 h-5 ${(inc?.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">صافي الربح</p>
                            <p className={`text-lg font-bold ${(inc?.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(inc?.netIncome)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <PiggyBank className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(bs?.assets?.totalAssets)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Ratios + VAT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        النسب المالية
                    </h2>
                    {r ? (
                        <div className="space-y-4">
                            {[
                                { label: 'نسبة السيولة الجارية', value: r.currentRatio,    suffix: ':1', good: r.currentRatio >= 1 },
                                { label: 'هامش الربح',           value: r.profitMargin,    suffix: '%',  good: r.profitMargin > 0 },
                                { label: 'العائد على الأصول',    value: r.returnOnAssets,  suffix: '%',  good: r.returnOnAssets > 0 },
                                { label: 'نسبة المديونية',        value: r.debtToEquity,    suffix: ':1', good: r.debtToEquity < 2 },
                            ].map(item => (
                                <div key={item.label} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <div className="flex items-center gap-1">
                                        {item.good ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                        <span className="font-semibold">{item.value}{item.suffix}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد بيانات كافية</p>
                    )}
                </div>

                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        تقرير ضريبة القيمة المضافة (15%)
                    </h2>
                    {vatData ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-muted-foreground">ضريبة المخرجات (مبيعات)</span>
                                <span className="font-semibold text-red-600">{formatCurrency(vatData.vatOutput)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-muted-foreground">ضريبة المدخلات (مشتريات)</span>
                                <span className="font-semibold text-green-600">{formatCurrency(vatData.vatInput)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 bg-muted/50 rounded-lg px-3">
                                <span className="font-medium">صافي الضريبة المستحقة</span>
                                <span className={`text-lg font-bold ${vatData.netVAT >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(vatData.netVAT)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد بيانات ضريبية</p>
                    )}
                </div>
            </div>

            {/* AR/AP Aging */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowUp className="w-5 h-5 text-green-600" />
                        الذمم المدينة (AR)
                    </h2>
                    {ar ? (
                        <div className="space-y-3">
                            {[
                                { label: 'حالي',          value: ar.summary?.current,  color: 'text-green-600' },
                                { label: '1-30 يوم',      value: ar.summary?.days30,   color: 'text-yellow-600' },
                                { label: '31-60 يوم',     value: ar.summary?.days60,   color: 'text-orange-600' },
                                { label: '61-90 يوم',     value: ar.summary?.days90,   color: 'text-red-500' },
                                { label: 'أكثر من 90',     value: ar.summary?.over90,   color: 'text-red-700' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-3 mt-2 flex justify-between">
                                <span className="font-medium">الإجمالي</span>
                                <span className="font-bold text-lg">{formatCurrency(ar.totalOutstanding)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد ذمم مدينة</p>
                    )}
                </div>

                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowDown className="w-5 h-5 text-red-600" />
                        الذمم الدائنة (AP)
                    </h2>
                    {ap ? (
                        <div className="space-y-3">
                            {[
                                { label: 'حالي',         value: ap.summary?.current || 0, color: 'text-green-600' },
                                { label: '1-30 يوم',     value: ap.summary?.days30 || 0,  color: 'text-yellow-600' },
                                { label: '31-60 يوم',    value: ap.summary?.days60 || 0,  color: 'text-orange-600' },
                                { label: '61-90 يوم',    value: ap.summary?.days90 || 0,  color: 'text-red-500' },
                                { label: 'أكثر من 90',    value: ap.summary?.over90 || 0,  color: 'text-red-700' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-3 mt-2 flex justify-between">
                                <span className="font-medium">الإجمالي</span>
                                <span className="font-bold text-lg">{formatCurrency(ap.totalOutstanding)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد ذمم دائنة</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccountingDashboardPage;
