import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useModuleStore } from '@/hooks/useModules';
import { useFirmSettings } from '@/hooks/use-settings';
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    Settings,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Briefcase,
    CreditCard,
    Scale,
    MessageSquare,
    CheckSquare,
    BarChart3,
    Mail,
    Target,
    Phone,
    Clock,
    FileEdit,
    Megaphone,
    Bell,
    User,
    Share2,
    PhoneCall,
    Handshake,
    TrendingUp,
    Send,
    CalendarDays,
    PieChart,
    Download,
    Wallet,
    Receipt,
    Calculator,
    UsersRound,
    Palmtree,
    Banknote,
    History,
    BookOpen,
    ClipboardList,
    Sparkles,
    Bookmark,
    LogOut,
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    path: string;
    icon: typeof LayoutDashboard;
    label: string;
    moduleKey?: string;
    roles?: ('OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT')[];
    permission?: { resource: string; action: string };
}

interface NavGroup {
    id: string;
    title: string;
    icon: typeof LayoutDashboard;
    items: NavItem[];
    collapsible: boolean;
    moduleKey?: string;
    roles?: ('OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT')[];
    permission?: { resource: string; action: string };
    accent: string;
}

const dashboardItem: NavItem = {
    path: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم',
};

const navGroups: NavGroup[] = [
    {
        id: 'work',
        title: 'إدارة العمل',
        icon: Briefcase,
        collapsible: true,
        accent: 'text-sky-400',
        items: [
            { path: 'clients', icon: Users, label: 'العملاء', moduleKey: 'clients', permission: { resource: 'clients', action: 'view_list' } },
            { path: 'cases', icon: Briefcase, label: 'القضايا', moduleKey: 'cases', permission: { resource: 'cases', action: 'view_list' } },
            { path: 'hearings', icon: Calendar, label: 'الجلسات', moduleKey: 'hearings', permission: { resource: 'hearings', action: 'view_list' } },
            { path: 'documents', icon: FileText, label: 'المستندات', moduleKey: 'documents', permission: { resource: 'documents', action: 'view_list' } },
            { path: 'tasks', icon: CheckSquare, label: 'المهام', moduleKey: 'tasks', permission: { resource: 'tasks', action: 'view_list' } },
            { path: 'legal-documents', icon: FileEdit, label: 'محرر الوثائق', moduleKey: 'legal_documents', permission: { resource: 'documents', action: 'manage_templates' } },
            { path: 'activity-logs', icon: History, label: 'التايم لاين', permission: { resource: 'settings', action: 'view_activity_log' } },
            { path: 'legal-library', icon: BookOpen, label: 'المكتبة القانونية', moduleKey: 'legal_library', permission: { resource: 'cases', action: 'view_list' } },
            { path: 'legal-search', icon: Sparkles, label: 'البحث الذكي', moduleKey: 'legal_ai', permission: { resource: 'cases', action: 'view_list' } },
            { path: 'legal-library/bookmarks', icon: Bookmark, label: 'المفضلة', moduleKey: 'legal_library', permission: { resource: 'cases', action: 'view_list' } },
            { path: 'forms', icon: ClipboardList, label: 'النماذج', moduleKey: 'forms', permission: { resource: 'cases', action: 'view_list' } },
        ],
    },
    {
        id: 'communication',
        title: 'التواصل',
        icon: MessageSquare,
        collapsible: true,
        accent: 'text-emerald-400',
        items: [
            { path: 'messages', icon: Mail, label: 'الرسائل الداخلية', moduleKey: 'messages' },
            { path: 'chat', icon: MessageSquare, label: 'الدردشة الداخلية', moduleKey: 'messages' },
            { path: 'social-inbox', icon: Share2, label: 'صندوق الوارد الموحد' },
            { path: 'whatsapp', icon: Share2, label: 'سجل الواتساب', moduleKey: 'whatsapp', roles: ['OWNER', 'ADMIN'] },
            { path: 'calls', icon: PhoneCall, label: 'مركز الاتصالات', moduleKey: 'call_center', roles: ['OWNER', 'ADMIN'] },
        ],
    },
    {
        id: 'marketing',
        title: 'التسويق',
        icon: Megaphone,
        collapsible: true,
        moduleKey: 'marketing',
        roles: ['OWNER', 'ADMIN'],
        accent: 'text-violet-400',
        items: [
            { path: 'marketing', icon: PieChart, label: 'لوحة التحكم', moduleKey: 'marketing' },
            { path: 'marketing/leads', icon: Target, label: 'العملاء المحتملون', moduleKey: 'marketing' },
            { path: 'marketing/telemarketing', icon: Phone, label: 'التسويق الهاتفي', moduleKey: 'marketing' },
            { path: 'marketing/affiliate', icon: Handshake, label: 'التسويق بالعمولة', moduleKey: 'marketing' },
            { path: 'marketing/campaigns', icon: Megaphone, label: 'الحملات', moduleKey: 'marketing' },
            { path: 'marketing/ads-analytics', icon: TrendingUp, label: 'نتائج الإعلانات', moduleKey: 'marketing' },
            { path: 'marketing/messages', icon: Send, label: 'الرسائل الجماعية', moduleKey: 'marketing' },
            { path: 'marketing/calendar', icon: CalendarDays, label: 'تقويم المحتوى', moduleKey: 'marketing' },
        ],
    },
    {
        id: 'analytics',
        title: 'التحليلات',
        icon: BarChart3,
        collapsible: true,
        moduleKey: 'reports',
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        permission: { resource: 'reports', action: 'view_dashboard' },
        accent: 'text-amber-400',
        items: [
            { path: 'analytics', icon: BarChart3, label: 'التقارير والإحصائيات', moduleKey: 'reports', permission: { resource: 'reports', action: 'view_dashboard' } },
            { path: 'analytics/performance', icon: Target, label: 'تقرير الأداء', moduleKey: 'reports', roles: ['OWNER', 'ADMIN'], permission: { resource: 'reports', action: 'view_performance' } },
            { path: 'reports', icon: Download, label: 'تصدير البيانات', moduleKey: 'reports', roles: ['OWNER', 'ADMIN', 'LAWYER'], permission: { resource: 'reports', action: 'export' } },
        ],
    },
    {
        id: 'hr',
        title: 'الموارد البشرية',
        icon: UsersRound,
        collapsible: true,
        moduleKey: 'hr',
        roles: ['OWNER', 'ADMIN'],
        permission: { resource: 'hr', action: 'view_employees' },
        accent: 'text-rose-400',
        items: [
            { path: 'hr/employees', icon: Users, label: 'الموظفون', moduleKey: 'hr', permission: { resource: 'hr', action: 'view_employees' } },
            { path: 'hr/attendance', icon: Clock, label: 'الحضور والانصراف', moduleKey: 'hr', permission: { resource: 'hr', action: 'view_attendance' } },
            { path: 'hr/leaves', icon: Palmtree, label: 'الإجازات', moduleKey: 'hr', permission: { resource: 'hr', action: 'view_leaves' } },
            { path: 'hr/payroll', icon: Banknote, label: 'الرواتب', moduleKey: 'hr', permission: { resource: 'hr', action: 'view_payroll' } },
        ],
    },
    {
        id: 'finance',
        title: 'المالية',
        icon: Wallet,
        collapsible: true,
        roles: ['OWNER', 'ADMIN'],
        permission: { resource: 'invoices', action: 'view_list' },
        accent: 'text-teal-400',
        items: [
            { path: 'invoices', icon: Receipt, label: 'الفواتير', moduleKey: 'invoices', permission: { resource: 'invoices', action: 'view_list' } },
            { path: 'accounting/expenses', icon: CreditCard, label: 'المصروفات', moduleKey: 'accounting', permission: { resource: 'accounting', action: 'manage_expenses' } },
            { path: 'accounting', icon: Calculator, label: 'المحاسبة', moduleKey: 'accounting', permission: { resource: 'accounting', action: 'view_accounts' } },
        ],
    },
    {
        id: 'preferences',
        title: 'الإعدادات',
        icon: Settings,
        collapsible: true,
        accent: 'text-slate-400',
        items: [
            { path: 'account/profile', icon: User, label: 'الملف الشخصي' },
            { path: 'account/notifications', icon: Bell, label: 'الإشعارات' },
        ],
    },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const userRole = user?.role;
    const { can } = usePermissions();
    const { isModuleEnabled, fetchModules } = useModuleStore();
    const { data: firmData } = useFirmSettings();
    const firm = firmData?.data;

    useEffect(() => { fetchModules(); }, [fetchModules]);

    const slugPrefix = '';

    const getInitialExpanded = (): Set<string> => {
        const expanded = new Set<string>();
        for (const group of navGroups) {
            for (const item of group.items) {
                const fullPath = `${slugPrefix}/${item.path}`;
                if (location.pathname === fullPath ||
                    (item.path !== 'dashboard' && location.pathname.startsWith(fullPath))) {
                    expanded.add(group.id);
                    break;
                }
            }
        }
        return expanded;
    };

    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(getInitialExpanded);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const filterItems = (items: NavItem[]) => items.filter((item) => {
        if (item.moduleKey && !isModuleEnabled(item.moduleKey)) return false;
        if (item.roles && (!userRole || !item.roles.includes(userRole))) return false;
        if (item.permission && !can(item.permission.resource, item.permission.action)) return false;
        return true;
    });

    const isGroupVisible = (group: NavGroup) => {
        if (group.moduleKey && !isModuleEnabled(group.moduleKey)) return false;
        if (group.roles && userRole && !group.roles.includes(userRole)) return false;
        if (group.permission && !can(group.permission.resource, group.permission.action)) return false;
        return filterItems(group.items).length > 0;
    };

    const isActive = (relativePath: string) => {
        const fullPath = `${slugPrefix}/${relativePath}`;
        if (relativePath === 'dashboard') return location.pathname === fullPath;
        if (relativePath === 'marketing') return location.pathname === fullPath;
        if (relativePath === 'accounting') return location.pathname === fullPath;
        if (relativePath === 'analytics') return location.pathname === fullPath;
        return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    };

    const getRoleInfo = () => {
        switch (userRole) {
            case 'OWNER':     return { label: 'مالك المكتب', color: 'text-amber-300 bg-amber-400/10 border-amber-400/20' };
            case 'ADMIN':     return { label: 'مدير', color: 'text-sky-300 bg-sky-400/10 border-sky-400/20' };
            case 'LAWYER':    return { label: 'محامي', color: 'text-violet-300 bg-violet-400/10 border-violet-400/20' };
            case 'SECRETARY': return { label: 'سكرتير', color: 'text-slate-300 bg-slate-400/10 border-slate-400/20' };
            case 'ACCOUNTANT':return { label: 'محاسب', color: 'text-teal-300 bg-teal-400/10 border-teal-400/20' };
            default:          return { label: '', color: '' };
        }
    };

    const roleInfo = getRoleInfo();
    const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('') || 'م';

    return (
        <aside
            className={cn(
                'fixed top-0 right-0 z-40 h-screen flex flex-col transition-all duration-300',
                'bg-slate-900/95 backdrop-blur-xl',
                'border-l border-white/[0.07]',
                'shadow-[0_0_40px_rgba(0,0,0,0.4)]',
                isCollapsed ? 'w-[68px]' : 'w-64'
            )}
        >
            {/* ── Logo ── */}
            <div className={cn(
                'h-16 flex items-center border-b border-white/[0.07] px-4',
                'bg-gradient-to-l from-primary/10 to-transparent',
                isCollapsed ? 'justify-center' : 'justify-between'
            )}>
                <Link to={`${slugPrefix}/dashboard`} className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                        'flex-shrink-0 rounded-xl flex items-center justify-center overflow-hidden',
                        'bg-gradient-to-br from-primary to-[hsl(var(--gold))]',
                        'shadow-[0_0_16px_rgba(var(--primary-rgb),0.4)]',
                        isCollapsed ? 'w-9 h-9' : 'w-9 h-9'
                    )}>
                        {firm?.logo
                            ? <img src={firm.logo} alt={firm.name || 'logo'} className="w-full h-full object-contain" />
                            : <Scale className="w-5 h-5 text-white" />
                        }
                    </div>
                    {!isCollapsed && (
                        <span className="text-[17px] font-bold bg-gradient-to-l from-primary to-[hsl(var(--gold))] bg-clip-text text-transparent truncate">
                            {firm?.name || 'وسم الثقة'}
                        </span>
                    )}
                </Link>
            </div>

            {/* ── User Card ── */}
            {!isCollapsed ? (
                <div className="px-3 py-3 border-b border-white/[0.07]">
                    <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-[hsl(var(--gold))]/60 flex items-center justify-center ring-2 ring-primary/30">
                                <span className="text-sm font-bold text-white">{initials}</span>
                            </div>
                            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white/90 truncate">{user?.name || 'المستخدم'}</p>
                            {userRole && (
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md border font-medium', roleInfo.color)}>
                                    {roleInfo.label}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => logout()}
                            className="p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                            title="تسجيل الخروج"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center py-3 border-b border-white/[0.07]">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/60 to-[hsl(var(--gold))]/60 flex items-center justify-center ring-2 ring-primary/30">
                            <span className="text-sm font-bold text-white">{initials}</span>
                        </div>
                        <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900" />
                    </div>
                </div>
            )}

            {/* ── Navigation ── */}
            <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

                {/* Dashboard */}
                <Link
                    to={`${slugPrefix}/${dashboardItem.path}`}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive(dashboardItem.path)
                            ? 'bg-primary/20 text-primary border-r-[3px] border-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]'
                            : 'text-white/50 hover:text-white/90 hover:bg-white/[0.06]',
                        isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? dashboardItem.label : undefined}
                >
                    <LayoutDashboard className="w-[18px] h-[18px] flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px] font-medium">{dashboardItem.label}</span>}
                </Link>

                {!isCollapsed && <div className="my-2 border-b border-white/[0.06]" />}

                {/* Groups */}
                {navGroups.map((group) => {
                    if (!isGroupVisible(group)) return null;
                    const visibleItems = filterItems(group.items);
                    const isExpanded = expandedGroups.has(group.id);
                    const GroupIcon = group.icon;
                    const hasActiveItem = visibleItems.some(item => isActive(item.path));

                    if (isCollapsed) {
                        return (
                            <div
                                key={group.id}
                                className={cn(
                                    'flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
                                    hasActiveItem
                                        ? 'bg-white/10 ' + group.accent
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.06]'
                                )}
                                title={group.title}
                            >
                                <GroupIcon className="w-[18px] h-[18px]" />
                            </div>
                        );
                    }

                    return (
                        <div key={group.id} className="space-y-0.5">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={cn(
                                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-200',
                                    'hover:bg-white/[0.05]',
                                    hasActiveItem ? group.accent + ' font-semibold' : 'text-white/40 hover:text-white/70'
                                )}
                            >
                                <GroupIcon className="w-[17px] h-[17px] flex-shrink-0" />
                                <span className="text-[12px] font-semibold uppercase tracking-wide flex-1 text-right">{group.title}</span>
                                <ChevronDown className={cn(
                                    'w-3.5 h-3.5 transition-transform duration-200 opacity-60',
                                    !isExpanded && '-rotate-90'
                                )} />
                            </button>

                            {/* Group Items */}
                            <div className={cn(
                                'overflow-hidden transition-all duration-200',
                                isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                            )}>
                                <div className="mr-3 pr-3 border-r border-white/[0.08] space-y-0.5 py-0.5">
                                    {visibleItems.map((item) => {
                                        const active = isActive(item.path);
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={`${slugPrefix}/${item.path}`}
                                                className={cn(
                                                    'flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150',
                                                    active
                                                        ? 'bg-primary/20 text-primary border-r-[3px] border-primary shadow-[inset_0_0_8px_rgba(var(--primary-rgb),0.1)]'
                                                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.05]'
                                                )}
                                            >
                                                <Icon className="w-[15px] h-[15px] flex-shrink-0" />
                                                <span className="text-[12.5px]">{item.label}</span>
                                                {active && <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary/80" />}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ── Toggle Button ── */}
            <button
                onClick={onToggle}
                className={cn(
                    'absolute -left-3.5 top-[72px] w-7 h-7 rounded-full flex items-center justify-center',
                    'bg-slate-800 border border-white/10 text-white/60',
                    'hover:bg-primary hover:text-white hover:border-primary/50',
                    'shadow-lg transition-all duration-200'
                )}
            >
                {isCollapsed
                    ? <ChevronRight className="w-3.5 h-3.5" />
                    : <ChevronLeft className="w-3.5 h-3.5" />
                }
            </button>

            {/* ── Settings Button ── */}
            <div className="px-3 pb-3 pt-2 border-t border-white/[0.07] space-y-1.5">
                <Link
                    to={`${slugPrefix}/settings`}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        'bg-gradient-to-l from-primary/80 to-[hsl(var(--gold))]/80',
                        'hover:from-primary hover:to-[hsl(var(--gold))]',
                        'shadow-[0_0_20px_rgba(var(--primary-rgb),0.25)] hover:shadow-[0_0_28px_rgba(var(--primary-rgb),0.4)]',
                        'text-white',
                        isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? 'إدارة المكتب' : undefined}
                >
                    <Settings className="w-[18px] h-[18px] flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px] font-semibold">إدارة المكتب</span>}
                </Link>

                {!isCollapsed && (
                    <p className="text-[10px] text-white/20 text-center pb-1">
                        وسم الثقة © 2026
                    </p>
                )}
            </div>
        </aside>
    );
}

export default Sidebar;
