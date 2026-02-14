import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
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
    Building2,
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
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    path: string;
    icon: typeof LayoutDashboard;
    label: string;
    roles?: ('SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT')[];
    permission?: { resource: string; action: string };
}

interface NavGroup {
    id: string;
    title: string;
    icon: typeof LayoutDashboard;
    items: NavItem[];
    collapsible: boolean;
    roles?: ('SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY' | 'ACCOUNTANT')[];
    permission?: { resource: string; action: string };
}

// ═══════════════════════════════════════════════════════
// Navigation structure matching user specification
// ═══════════════════════════════════════════════════════

const dashboardItem: NavItem = {
    path: 'dashboard', icon: LayoutDashboard, label: 'لوحة التحكم',
};

const navGroups: NavGroup[] = [
    {
        id: 'work',
        title: 'إدارة العمل',
        icon: Briefcase,
        collapsible: true,
        items: [
            { path: 'clients', icon: Users, label: 'العملاء', permission: { resource: 'clients', action: 'view_list' } },
            { path: 'cases', icon: Briefcase, label: 'القضايا', permission: { resource: 'cases', action: 'view_list' } },
            { path: 'hearings', icon: Calendar, label: 'الجلسات', permission: { resource: 'hearings', action: 'view_list' } },
            { path: 'documents', icon: FileText, label: 'المستندات', permission: { resource: 'documents', action: 'view_list' } },
            { path: 'tasks', icon: CheckSquare, label: 'المهام', permission: { resource: 'tasks', action: 'view_list' } },
            { path: 'legal-documents', icon: FileEdit, label: 'محرر الوثائق', permission: { resource: 'documents', action: 'manage_templates' } },
            { path: 'activity-logs', icon: History, label: 'التايم لاين', permission: { resource: 'settings', action: 'view_activity_log' } },
            { path: 'legal-library', icon: BookOpen, label: 'المكتبة القانونية', permission: { resource: 'cases', action: 'view_list' } },
        ],
    },
    {
        id: 'communication',
        title: 'التواصل',
        icon: MessageSquare,
        collapsible: true,
        items: [
            { path: 'messages', icon: Mail, label: 'الرسائل الداخلية' },
            { path: 'chat', icon: MessageSquare, label: 'الدردشة الداخلية' },
            { path: 'whatsapp', icon: Share2, label: 'التواصل الاجتماعي', roles: ['OWNER', 'ADMIN'] },
            { path: 'calls', icon: PhoneCall, label: 'مركز الاتصالات', roles: ['OWNER', 'ADMIN'] },
        ],
    },
    {
        id: 'marketing',
        title: 'التسويق',
        icon: Megaphone,
        collapsible: true,
        roles: ['OWNER', 'ADMIN'],
        items: [
            { path: 'marketing', icon: PieChart, label: 'لوحة التحكم' },
            { path: 'marketing/leads', icon: Target, label: 'العملاء المحتملون' },
            { path: 'marketing/telemarketing', icon: Phone, label: 'التسويق عبر الهاتف' },
            { path: 'marketing/affiliate', icon: Handshake, label: 'التسويق بالعمولة' },
            { path: 'marketing/campaigns', icon: Megaphone, label: 'الحملات التسويقية' },
            { path: 'marketing/ads-analytics', icon: TrendingUp, label: 'نتائج الإعلانات' },
            { path: 'marketing/messages', icon: Send, label: 'الرسائل الجماعية' },
            { path: 'marketing/calendar', icon: CalendarDays, label: 'تقويم المحتوى' },
        ],
    },
    {
        id: 'analytics',
        title: 'التحليلات',
        icon: BarChart3,
        collapsible: true,
        roles: ['OWNER', 'ADMIN', 'LAWYER'],
        permission: { resource: 'reports', action: 'view_dashboard' },
        items: [
            { path: 'analytics', icon: BarChart3, label: 'التقارير والإحصائيات', permission: { resource: 'reports', action: 'view_dashboard' } },
            { path: 'analytics/performance', icon: Target, label: 'تقرير الأداء', roles: ['OWNER', 'ADMIN'], permission: { resource: 'reports', action: 'view_performance' } },
            { path: 'reports', icon: Download, label: 'تصدير البيانات', roles: ['OWNER', 'ADMIN', 'LAWYER'], permission: { resource: 'reports', action: 'export' } },
        ],
    },
    {
        id: 'hr',
        title: 'الموارد البشرية',
        icon: UsersRound,
        collapsible: true,
        roles: ['OWNER', 'ADMIN'],
        permission: { resource: 'hr', action: 'view_employees' },
        items: [
            { path: 'hr/employees', icon: Users, label: 'الموظفون', permission: { resource: 'hr', action: 'view_employees' } },
            { path: 'hr/attendance', icon: Clock, label: 'الحضور والانصراف', permission: { resource: 'hr', action: 'view_attendance' } },
            { path: 'hr/leaves', icon: Palmtree, label: 'الإجازات', permission: { resource: 'hr', action: 'view_leaves' } },
            { path: 'hr/payroll', icon: Banknote, label: 'الرواتب', permission: { resource: 'hr', action: 'view_payroll' } },
        ],
    },
    {
        id: 'finance',
        title: 'المالية',
        icon: Wallet,
        collapsible: true,
        roles: ['OWNER', 'ADMIN'],
        permission: { resource: 'invoices', action: 'view_list' },
        items: [
            { path: 'invoices', icon: Receipt, label: 'الفواتير', permission: { resource: 'invoices', action: 'view_list' } },
            { path: 'accounting/expenses', icon: CreditCard, label: 'المصروفات', permission: { resource: 'accounting', action: 'manage_expenses' } },
            { path: 'accounting', icon: Calculator, label: 'المحاسبة', permission: { resource: 'accounting', action: 'view_accounts' } },
        ],
    },
    {
        id: 'settings',
        title: 'الإعدادات',
        icon: Settings,
        collapsible: true,
        items: [
            { path: 'settings/profile', icon: User, label: 'الملف الشخصي' },
            { path: 'settings/notifications', icon: Bell, label: 'الإشعارات' },
            { path: 'settings/call-center', icon: Phone, label: 'السنترال', roles: ['OWNER', 'ADMIN'] },
        ],
    },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const { slug } = useParams<{ slug: string }>();
    const user = useAuthStore((state) => state.user);
    const userRole = user?.role;
    const { can } = usePermissions();

    // Build slug prefix for all paths
    const slugPrefix = slug ? `/${slug}` : '';

    // Track expanded groups — default expand the group that contains the active path
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
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    // Filter nav items based on user role AND tenant permissions
    const filterItems = (items: NavItem[]) => {
        return items.filter((item) => {
            // System role check
            if (item.roles && (!userRole || !item.roles.includes(userRole))) return false;
            // Tenant permission check
            if (item.permission && !can(item.permission.resource, item.permission.action)) return false;
            return true;
        });
    };

    // Check if group is visible based on role AND permissions
    const isGroupVisible = (group: NavGroup) => {
        if (group.roles && userRole && !group.roles.includes(userRole)) return false;
        if (group.permission && !can(group.permission.resource, group.permission.action)) return false;
        return filterItems(group.items).length > 0;
    };

    // Check if path is active (paths are now relative, e.g. 'dashboard')
    const isActive = (relativePath: string) => {
        const fullPath = `${slugPrefix}/${relativePath}`;
        if (relativePath === 'dashboard') return location.pathname === fullPath;
        if (relativePath === 'marketing') return location.pathname === fullPath;
        if (relativePath === 'accounting') return location.pathname === fullPath;
        if (relativePath === 'analytics') return location.pathname === fullPath;
        return location.pathname === fullPath || location.pathname.startsWith(fullPath + '/');
    };

    // Can see Owner dashboard
    const canSeeOwnerDashboard = userRole === 'OWNER' || userRole === 'ADMIN';

    // Get role display info
    const getRoleInfo = () => {
        switch (userRole) {
            case 'OWNER': return { label: 'مالك المكتب', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
            case 'ADMIN': return { label: 'مدير', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
            case 'LAWYER': return { label: 'محامي', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
            case 'SECRETARY': return { label: 'سكرتير', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
            case 'ACCOUNTANT': return { label: 'محاسب', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' };
            default: return { label: '', color: '' };
        }
    };

    const roleInfo = getRoleInfo();

    return (
        <aside
            className={cn(
                'fixed top-0 right-0 z-40 h-screen bg-card border-l transition-all duration-300 flex flex-col shadow-sm',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b bg-gradient-to-l from-primary/5 to-transparent">
                <Link to={`${slugPrefix}/dashboard`} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Scale className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                            وثيق
                        </span>
                    )}
                </Link>
            </div>

            {/* User Role Badge */}
            {!isCollapsed && userRole && (
                <div className="px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                                {user?.name?.charAt(0) || 'م'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || 'المستخدم'}</p>
                            <span className={cn(
                                'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                                roleInfo.color
                            )}>
                                {roleInfo.label}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto scrollbar-thin">
                {/* ═══ Dashboard (standalone) ═══ */}
                <Link
                    to={`${slugPrefix}/${dashboardItem.path}`}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        'hover:bg-primary/10',
                        isActive(dashboardItem.path)
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground',
                        isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? dashboardItem.label : undefined}
                >
                    <LayoutDashboard className={cn(
                        'w-5 h-5 flex-shrink-0',
                        isActive(dashboardItem.path) && 'text-primary-foreground'
                    )} />
                    {!isCollapsed && (
                        <span className="text-sm font-medium">{dashboardItem.label}</span>
                    )}
                </Link>

                {/* Separator */}
                {!isCollapsed && <div className="my-2 border-b border-border/50" />}

                {/* ═══ Collapsible Groups ═══ */}
                {navGroups.map((group) => {
                    if (!isGroupVisible(group)) return null;
                    const visibleItems = filterItems(group.items);
                    const isExpanded = expandedGroups.has(group.id);
                    const GroupIcon = group.icon;

                    // Check if any item in the group is active
                    const hasActiveItem = visibleItems.some(item => isActive(item.path));

                    // Collapsed: show only the group icon
                    if (isCollapsed) {
                        return (
                            <div key={group.id} className="space-y-1">
                                <div
                                    className={cn(
                                        'flex items-center justify-center px-2 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
                                        'hover:bg-primary/10',
                                        hasActiveItem
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:text-foreground'
                                    )}
                                    title={group.title}
                                >
                                    <GroupIcon className="w-5 h-5 flex-shrink-0" />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={group.id} className="space-y-0.5">
                            {/* Group Header */}
                            <button
                                onClick={() => toggleGroup(group.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                                    'hover:bg-muted/50',
                                    hasActiveItem
                                        ? 'text-primary font-semibold'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <GroupIcon className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium flex-1 text-right">{group.title}</span>
                                <ChevronDown
                                    className={cn(
                                        'w-4 h-4 transition-transform duration-200',
                                        !isExpanded && '-rotate-90'
                                    )}
                                />
                            </button>

                            {/* Group Items */}
                            <div
                                className={cn(
                                    'overflow-hidden transition-all duration-200',
                                    isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                                )}
                            >
                                <div className="mr-4 pr-3 border-r-2 border-border/30 space-y-0.5 py-1">
                                    {visibleItems.map((item) => {
                                        const active = isActive(item.path);
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.path}
                                                to={`${slugPrefix}/${item.path}`}
                                                className={cn(
                                                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                                                    'hover:bg-primary/10',
                                                    active
                                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                )}
                                            >
                                                <Icon className={cn(
                                                    'w-4 h-4 flex-shrink-0',
                                                    active && 'text-primary-foreground'
                                                )} />
                                                <span className="text-[13px]">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Owner Dashboard Button (bottom) */}
            {canSeeOwnerDashboard && (
                <div className={cn('px-3 pb-2', isCollapsed && 'px-2')}>
                    <Link
                        to={`${slugPrefix}/owner`}
                        className={cn(
                            'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                            'bg-gradient-to-l from-emerald-500/10 to-teal-500/10 border border-emerald-500/20',
                            'hover:from-emerald-500/20 hover:to-teal-500/20',
                            isActive('owner')
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/25'
                                : 'text-emerald-700 dark:text-emerald-400',
                            isCollapsed && 'justify-center px-2'
                        )}
                        title={isCollapsed ? 'صفحة الشركة' : undefined}
                    >
                        <Building2 className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                            <span className="text-sm font-semibold">صفحة الشركة</span>
                        )}
                    </Link>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={onToggle}
                className="absolute -left-3 top-20 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
            >
                {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                ) : (
                    <ChevronLeft className="w-4 h-4" />
                )}
            </button>

            {/* Footer */}
            {!isCollapsed && (
                <div className="p-4 border-t">
                    <p className="text-[10px] text-muted-foreground/50 text-center">
                        وثيق © 2026
                    </p>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
