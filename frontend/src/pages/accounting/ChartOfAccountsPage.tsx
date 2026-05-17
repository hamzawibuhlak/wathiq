import { useState } from 'react';
import { BookOpen, Plus, Search, ChevronDown, ChevronLeft, Loader2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { LoadingState } from '@/components/common/LoadingState';
import { useAccountsHierarchy, useSeedAccounts } from '@/hooks/use-accounting';
import {
    Account, AccountType,
    ACCOUNT_TYPE_LABELS, ACCOUNT_TYPE_COLORS,
} from '@/types/accounting.types';

export function ChartOfAccountsPage() {
    const { data: accounts = [], isLoading } = useAccountsHierarchy();
    const seedMutation = useSeedAccounts();

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<AccountType | ''>('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

    const matchesFilters = (a: Account): boolean => {
        if (typeFilter && a.accountType !== typeFilter) return false;
        if (search) {
            const term = search.toLowerCase();
            const matches =
                a.nameAr.includes(search) ||
                a.nameEn.toLowerCase().includes(term) ||
                a.accountNumber.includes(search);
            if (!matches) return false;
        }
        return true;
    };

    const flatFiltered = (): Account[] => {
        const result: Account[] = [];
        const walk = (accs: Account[]) => {
            accs.forEach(a => {
                if (matchesFilters(a)) result.push(a);
                if (a.childAccounts) walk(a.childAccounts);
            });
        };
        walk(accounts);
        return result;
    };

    const renderAccount = (account: Account, depth: number = 0) => {
        const hasChildren = account.childAccounts && account.childAccounts.length > 0;
        const isExpanded = expandedIds.has(account.id);

        if (!matchesFilters(account)) return null;

        return (
            <div key={account.id}>
                <div
                    className={`flex items-center gap-3 py-3 px-4 hover:bg-muted/50 border-b cursor-pointer transition ${depth > 0 ? 'bg-muted/20' : ''}`}
                    style={{ paddingRight: `${16 + depth * 24}px` }}
                    onClick={() => hasChildren && toggleExpand(account.id)}
                >
                    <div className="w-6">
                        {hasChildren && (isExpanded
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronLeft className="w-4 h-4 text-muted-foreground" />)}
                    </div>
                    <span className="font-mono text-sm w-16 text-muted-foreground">{account.accountNumber}</span>
                    <span className={`font-medium flex-1 ${depth === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{account.nameAr}</span>
                    <span className="text-xs text-muted-foreground hidden sm:block">{account.nameEn}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[account.accountType] || 'bg-gray-100 text-gray-700'}`}>
                        {ACCOUNT_TYPE_LABELS[account.accountType]}
                    </span>
                </div>
                {hasChildren && isExpanded && account.childAccounts!.map(child => renderAccount(child, depth + 1))}
            </div>
        );
    };

    if (isLoading) return <LoadingState size="lg" />;

    const showSeedBtn = accounts.length === 0;

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
                        <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                            {seedMutation.isPending ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
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
                        <Input
                            type="text"
                            placeholder="بحث برقم الحساب أو الاسم..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={e => setTypeFilter(e.target.value as AccountType | '')}
                        className="h-10 px-3 rounded-md border bg-background text-sm min-w-[140px]"
                    >
                        <option value="">جميع الأنواع</option>
                        {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-5 gap-3">
                {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, label]) => {
                    const count = flatFiltered().filter(a => a.accountType === type).length;
                    return (
                        <div
                            key={type}
                            className={`rounded-lg border p-3 text-center cursor-pointer hover:shadow transition ${typeFilter === type ? 'ring-2 ring-primary' : ''}`}
                            onClick={() => setTypeFilter(typeFilter === type ? '' : type as AccountType)}
                        >
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ACCOUNT_TYPE_COLORS[type as AccountType]}`}>{label}</span>
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
                {accounts.map(a => renderAccount(a))}
                {accounts.length === 0 && (
                    <div className="p-12 text-center">
                        <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">لا توجد حسابات</h3>
                        <p className="text-muted-foreground mb-4">قم بإنشاء الحسابات الافتراضية للبدء</p>
                        <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
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
