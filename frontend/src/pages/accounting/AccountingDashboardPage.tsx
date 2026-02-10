import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Calculator, TrendingUp, TrendingDown, DollarSign, CreditCard,
    FileText, BookOpen, Receipt, Wallet, PiggyBank, BarChart3,
    ArrowUp, ArrowDown, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const API_BASE = '/api/accounting';

async function fetchApi(url: string) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('فشل في جلب البيانات');
    return res.json();
}

export function AccountingDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [ratios, setRatios] = useState<any>(null);
    const [vatReport, setVatReport] = useState<any>(null);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(amount || 0);

    useEffect(() => {
        const loadData = async () => {
            try {
                const now = new Date();
                const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
                const today = now.toISOString();

                const [incomeRes, bsRes, ratiosRes, vatRes, arRes, apRes] = await Promise.allSettled([
                    fetchApi(`${API_BASE}/statements/income?startDate=${yearStart}&endDate=${today}`),
                    fetchApi(`${API_BASE}/statements/balance-sheet?date=${today}`),
                    fetchApi(`${API_BASE}/statements/ratios?date=${today}`),
                    fetchApi(`${API_BASE}/statements/vat?startDate=${yearStart}&endDate=${today}`),
                    fetchApi(`${API_BASE}/ar/aging`),
                    fetchApi(`${API_BASE}/ap/aging`),
                ]);

                setStats({
                    income: incomeRes.status === 'fulfilled' ? incomeRes.value : null,
                    balanceSheet: bsRes.status === 'fulfilled' ? bsRes.value : null,
                    arAging: arRes.status === 'fulfilled' ? arRes.value : null,
                    apAging: apRes.status === 'fulfilled' ? apRes.value : null,
                });
                setRatios(ratiosRes.status === 'fulfilled' ? ratiosRes.value : null);
                setVatReport(vatRes.status === 'fulfilled' ? vatRes.value : null);
            } catch (err) {
                toast.error('فشل في تحميل بيانات المحاسبة');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const quickLinks = [
        { path: '/accounting/accounts', icon: BookOpen, label: 'شجرة الحسابات', color: 'text-blue-600 bg-blue-100' },
        { path: '/accounting/journal-entries', icon: FileText, label: 'القيود اليومية', color: 'text-purple-600 bg-purple-100' },
        { path: '/invoices', icon: Receipt, label: 'الفواتير', color: 'text-green-600 bg-green-100' },
        { path: '/accounting/expenses', icon: Wallet, label: 'المصروفات', color: 'text-red-600 bg-red-100' },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Calculator className="w-7 h-7 text-primary animate-pulse" />
                    <h1 className="text-2xl font-bold">المحاسبة والمالية</h1>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-card rounded-xl border p-5 animate-pulse">
                            <div className="w-10 h-10 bg-muted rounded-full mb-3" />
                            <div className="w-2/3 h-4 bg-muted rounded mb-2" />
                            <div className="w-1/2 h-6 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                    <Link to="/accounting/journal-entries">
                        <Button variant="outline"><FileText className="w-4 h-4 ml-2" />القيود</Button>
                    </Link>
                    <Link to="/accounting/accounts">
                        <Button><BookOpen className="w-4 h-4 ml-2" />شجرة الحسابات</Button>
                    </Link>
                </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickLinks.map(link => (
                    <Link key={link.path} to={link.path} className="bg-card rounded-xl border p-4 hover:shadow-md transition-all group">
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
                            <p className="text-lg font-bold text-green-600">{formatCurrency(stats?.income?.totalRevenue)}</p>
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
                            <p className="text-lg font-bold text-red-600">{formatCurrency(stats?.income?.totalExpenses)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-card rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${(stats?.income?.netIncome || 0) >= 0 ? 'bg-emerald-100' : 'bg-red-100'} flex items-center justify-center`}>
                            <DollarSign className={`w-5 h-5 ${(stats?.income?.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">صافي الربح</p>
                            <p className={`text-lg font-bold ${(stats?.income?.netIncome || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatCurrency(stats?.income?.netIncome)}
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
                            <p className="text-lg font-bold text-blue-600">{formatCurrency(stats?.balanceSheet?.assets?.totalAssets)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Ratios + VAT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Ratios */}
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        النسب المالية
                    </h2>
                    {ratios ? (
                        <div className="space-y-4">
                            {[
                                { label: 'نسبة السيولة الجارية', value: ratios.currentRatio, suffix: ':1', good: ratios.currentRatio >= 1 },
                                { label: 'هامش الربح', value: ratios.profitMargin, suffix: '%', good: ratios.profitMargin > 0 },
                                { label: 'العائد على الأصول', value: ratios.returnOnAssets, suffix: '%', good: ratios.returnOnAssets > 0 },
                                { label: 'نسبة المديونية', value: ratios.debtToEquity, suffix: ':1', good: ratios.debtToEquity < 2 },
                            ].map(r => (
                                <div key={r.label} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{r.label}</span>
                                    <div className="flex items-center gap-1">
                                        {r.good ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                                        <span className="font-semibold">{r.value}{r.suffix}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد بيانات كافية</p>
                    )}
                </div>

                {/* VAT */}
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        تقرير ضريبة القيمة المضافة (15%)
                    </h2>
                    {vatReport ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-muted-foreground">ضريبة المخرجات (مبيعات)</span>
                                <span className="font-semibold text-red-600">{formatCurrency(vatReport.vatOutput)}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-muted-foreground">ضريبة المدخلات (مشتريات)</span>
                                <span className="font-semibold text-green-600">{formatCurrency(vatReport.vatInput)}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 bg-muted/50 rounded-lg px-3">
                                <span className="font-medium">صافي الضريبة المستحقة</span>
                                <span className={`text-lg font-bold ${vatReport.netVAT >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(vatReport.netVAT)}
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
                {/* Accounts Receivable */}
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowUp className="w-5 h-5 text-green-600" />
                        الذمم المدينة (AR)
                    </h2>
                    {stats?.arAging ? (
                        <div className="space-y-3">
                            {[
                                { label: 'حالي', value: stats.arAging.summary?.current, color: 'text-green-600' },
                                { label: '1-30 يوم', value: stats.arAging.summary?.days30, color: 'text-yellow-600' },
                                { label: '31-60 يوم', value: stats.arAging.summary?.days60, color: 'text-orange-600' },
                                { label: '61-90 يوم', value: stats.arAging.summary?.days90, color: 'text-red-500' },
                                { label: 'أكثر من 90', value: stats.arAging.summary?.over90, color: 'text-red-700' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-3 mt-2 flex justify-between">
                                <span className="font-medium">الإجمالي</span>
                                <span className="font-bold text-lg">{formatCurrency(stats.arAging.totalOutstanding)}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">لا توجد ذمم مدينة</p>
                    )}
                </div>

                {/* Accounts Payable */}
                <div className="bg-card rounded-xl border p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ArrowDown className="w-5 h-5 text-red-600" />
                        الذمم الدائنة (AP)
                    </h2>
                    {stats?.apAging ? (
                        <div className="space-y-3">
                            {[
                                { label: 'حالي', value: stats.apAging.summary?.current || 0, color: 'text-green-600' },
                                { label: '1-30 يوم', value: stats.apAging.summary?.days30 || 0, color: 'text-yellow-600' },
                                { label: '31-60 يوم', value: stats.apAging.summary?.days60 || 0, color: 'text-orange-600' },
                                { label: '61-90 يوم', value: stats.apAging.summary?.days90 || 0, color: 'text-red-500' },
                                { label: 'أكثر من 90', value: stats.apAging.summary?.over90 || 0, color: 'text-red-700' },
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                    <span className={`font-semibold ${item.color}`}>{formatCurrency(item.value)}</span>
                                </div>
                            ))}
                            <div className="border-t pt-3 mt-2 flex justify-between">
                                <span className="font-medium">الإجمالي</span>
                                <span className="font-bold text-lg">{formatCurrency(stats.apAging.totalOutstanding)}</span>
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
