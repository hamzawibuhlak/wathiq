import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, ChevronDown, ChevronLeft, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

const API_BASE = '/api/accounting';

async function fetchApi(url: string, options?: RequestInit) {
    const token = useAuthStore.getState().token;
    const res = await fetch(url, {
        ...options,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error('فشل في العملية');
    return res.json();
}

interface Account {
    id: string; accountNumber: string; nameEn: string; nameAr: string;
    accountType: string; category: string; isActive: boolean; level: number;
    childAccounts?: Account[];
}

const typeLabels: Record<string, string> = {
    ASSET: 'أصول', LIABILITY: 'خصوم', EQUITY: 'حقوق ملكية', REVENUE: 'إيرادات', EXPENSE: 'مصروفات',
};
const typeColors: Record<string, string> = {
    ASSET: 'bg-blue-100 text-blue-700', LIABILITY: 'bg-red-100 text-red-700', EQUITY: 'bg-purple-100 text-purple-700',
    REVENUE: 'bg-green-100 text-green-700', EXPENSE: 'bg-orange-100 text-orange-700',
};

export function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [showSeedBtn, setShowSeedBtn] = useState(false);
    const [seeding, setSeeding] = useState(false);

    const loadAccounts = async () => {
        try {
            const data = await fetchApi(`${API_BASE}/accounts/hierarchy`);
            setAccounts(data);
            if (data.length === 0) setShowSeedBtn(true);
        } catch { toast.error('فشل في تحميل الحسابات'); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadAccounts(); }, []);

    const seedAccounts = async () => {
        setSeeding(true);
        try {
            const res = await fetchApi(`${API_BASE}/accounts/seed`, { method: 'POST' });
            toast.success(res.message || 'تم إنشاء الحسابات الافتراضية');
            setShowSeedBtn(false);
            loadAccounts();
        } catch { toast.error('فشل في إنشاء الحسابات'); }
        finally { setSeeding(false); }
    };

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        const collect = (accs: Account[]) => accs.forEach(a => {
            if (a.childAccounts?.length) { allIds.add(a.id); collect(a.childAccounts); }
        });
        collect(accounts);
        setExpandedIds(allIds);
    };

    const collapseAll = () => setExpandedIds(new Set());

    const flatFiltered = () => {
        const result: Account[] = [];
        const walk = (accs: Account[]) => {
            accs.forEach(a => {
                if (typeFilter && a.accountType !== typeFilter) return;
                if (search && !a.nameAr.includes(search) && !a.nameEn.toLowerCase().includes(search.toLowerCase()) && !a.accountNumber.includes(search)) return;
                result.push(a);
                if (a.childAccounts) walk(a.childAccounts);
            });
        };
        walk(accounts);
        return result;
    };

    const renderAccount = (account: Account, depth: number = 0) => {
        const hasChildren = account.childAccounts && account.childAccounts.length > 0;
        const isExpanded = expandedIds.has(account.id);

        if (typeFilter && account.accountType !== typeFilter) return null;
        if (search && !account.nameAr.includes(search) && !account.nameEn.toLowerCase().includes(search.toLowerCase()) && !account.accountNumber.includes(search)) return null;

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center gap-3 py-3 px-4 hover:bg-muted/50 border-b cursor-pointer transition ${depth > 0 ? 'bg-muted/20' : ''}`}
                    style={{ paddingRight: `${16 + depth * 24}px` }}
                    onClick={() => hasChildren && toggleExpand(account.id)}
                >
                    <div className="w-6">
                        {hasChildren && (
                            isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                        )}
                    </div>
                    <span className="font-mono text-sm w-16 text-muted-foreground">{account.accountNumber}</span>
                    <span className={`font-medium flex-1 ${depth === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{account.nameAr}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{account.nameEn}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[account.accountType] || 'bg-gray-100 text-gray-700'}`}>
                        {typeLabels[account.accountType]}
                    </span>
                </div>
                {hasChildren && isExpanded && account.childAccounts!.map(child => renderAccount(child, depth + 1))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-7 h-7 text-primary" />
                        شجرة الحسابات
                    </h1>
                    <p className="text-muted-foreground">دليل الحسابات وفقاً للمعايير السعودية</p>
                </div>
                <div className="flex gap-2">
                    {showSeedBtn && (
                        <Button variant="outline" onClick={seedAccounts} disabled={seeding}>
                            {seeding ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
                            إنشاء الحسابات الافتراضية
                        </Button>
                    )}
                    <Button variant="outline" onClick={expandAll}>توسيع الكل</Button>
                    <Button variant="outline" onClick={collapseAll}>طي الكل</Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card rounded-xl border p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="text" placeholder="بحث برقم الحساب أو الاسم..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
                    </div>
                    <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]">
                        <option value="">جميع الأنواع</option>
                        {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-5 gap-3">
                {Object.entries(typeLabels).map(([type, label]) => {
                    const count = flatFiltered().filter(a => a.accountType === type).length;
                    return (
                        <div key={type} className={`rounded-lg border p-3 text-center cursor-pointer hover:shadow transition ${typeFilter === type ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setTypeFilter(typeFilter === type ? '' : type)}>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[type]}`}>{label}</span>
                            <p className="text-lg font-bold mt-1">{count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Accounts Tree */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <div className="flex items-center gap-3 py-2 px-4 bg-muted/50 border-b text-sm font-medium text-muted-foreground">
                    <div className="w-6" />
                    <span className="w-16">الرقم</span>
                    <span className="flex-1">اسم الحساب</span>
                    <span className="hidden sm:block">الاسم بالإنجليزية</span>
                    <span>النوع</span>
                </div>
                {(search || typeFilter) ? (
                    flatFiltered().map(a => renderAccount(a))
                ) : (
                    accounts.map(a => renderAccount(a))
                )}
                {accounts.length === 0 && (
                    <div className="p-12 text-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد حسابات</h3>
                        <p className="text-muted-foreground mb-4">قم بإنشاء الحسابات الافتراضية للبدء</p>
                        <Button onClick={seedAccounts} disabled={seeding}>
                            <Plus className="w-4 h-4 ml-2" />
                            إنشاء الحسابات الافتراضية
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChartOfAccountsPage;
