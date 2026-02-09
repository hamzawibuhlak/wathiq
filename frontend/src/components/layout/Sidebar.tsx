import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
    LayoutDashboard,
    Calendar,
    Users,
    FileText,
    Settings,
    ChevronRight,
    ChevronLeft,
    Briefcase,
    CreditCard,
    Scale,
    MessageSquare,
    CheckSquare,
    Zap,
    BarChart3,
    FileSpreadsheet,
    Mail,
    UserCog,
    Target,
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    path: string;
    icon: typeof LayoutDashboard;
    label: string;
    roles?: ('OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY')[];
}

interface NavGroup {
    title: string;
    items: NavItem[];
}

// Grouped navigation items
const navGroups: NavGroup[] = [
    {
        title: 'الرئيسية',
        items: [
            { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
        ],
    },
    {
        title: 'إدارة العمل',
        items: [
            { path: '/cases', icon: Briefcase, label: 'القضايا' },
            { path: '/hearings', icon: Calendar, label: 'الجلسات' },
            { path: '/clients', icon: Users, label: 'العملاء' },
            { path: '/tasks', icon: CheckSquare, label: 'المهام' },
            { path: '/documents', icon: FileText, label: 'المستندات' },
        ],
    },
    {
        title: 'المالية',
        items: [
            { path: '/invoices', icon: CreditCard, label: 'الفواتير', roles: ['OWNER', 'ADMIN'] },
        ],
    },
    {
        title: 'التحليلات',
        items: [
            { path: '/analytics', icon: BarChart3, label: 'التقارير والإحصائيات', roles: ['OWNER', 'ADMIN', 'LAWYER'] },
            { path: '/analytics/performance', icon: Target, label: 'تقرير الأداء', roles: ['OWNER', 'ADMIN'] },
            { path: '/reports', icon: FileSpreadsheet, label: 'تصدير البيانات', roles: ['OWNER', 'ADMIN', 'LAWYER'] },
        ],
    },
    {
        title: 'التواصل',
        items: [
            { path: '/messages', icon: Mail, label: 'الرسائل الداخلية' },
            { path: '/whatsapp', icon: MessageSquare, label: 'واتساب', roles: ['OWNER', 'ADMIN'] },
        ],
    },
    {
        title: 'الأتمتة',
        items: [
            { path: '/workflows', icon: Zap, label: 'سير العمل', roles: ['OWNER', 'ADMIN'] },
        ],
    },
    {
        title: 'الإدارة',
        items: [
            { path: '/settings/users', icon: UserCog, label: 'إدارة المستخدمين', roles: ['OWNER', 'ADMIN'] },
            { path: '/settings', icon: Settings, label: 'الإعدادات' },
        ],
    },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const userRole = user?.role;

    // Filter nav items based on user role
    const filterItems = (items: NavItem[]) => {
        return items.filter((item) => {
            if (!item.roles) return true;
            return userRole && item.roles.includes(userRole);
        });
    };

    // Get role display info
    const getRoleInfo = () => {
        switch (userRole) {
            case 'OWNER': return { label: 'مالك المكتب', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
            case 'ADMIN': return { label: 'مدير', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' };
            case 'LAWYER': return { label: 'محامي', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
            case 'SECRETARY': return { label: 'سكرتير', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' };
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
                <Link to="/dashboard" className="flex items-center gap-3">
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

            {/* Navigation Groups */}
            <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
                {navGroups.map((group) => {
                    const visibleItems = filterItems(group.items);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.title}>
                            {/* Group Title */}
                            {!isCollapsed && (
                                <h3 className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                                    {group.title}
                                </h3>
                            )}
                            
                            {/* Group Items */}
                            <div className="space-y-1">
                                {visibleItems.map((item) => {
                                    const isActive = location.pathname === item.path ||
                                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                                                'hover:bg-primary/10',
                                                isActive
                                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground',
                                                isCollapsed && 'justify-center px-2'
                                            )}
                                            title={isCollapsed ? item.label : undefined}
                                        >
                                            <Icon className={cn(
                                                'w-5 h-5 flex-shrink-0',
                                                isActive && 'text-primary-foreground'
                                            )} />
                                            {!isCollapsed && (
                                                <span className="text-sm font-medium">{item.label}</span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

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
                        وثيق © 2024
                    </p>
                </div>
            )}
        </aside>
    );
}

export default Sidebar;
