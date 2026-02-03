import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
    LayoutDashboard,
    Scale,
    Calendar,
    Users,
    UserCog,
    FileText,
    Receipt,
    Settings,
    ChevronRight,
    ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

interface NavItem {
    path: string;
    icon: typeof LayoutDashboard;
    label: string;
    // Roles that can see this item (undefined = all roles)
    roles?: ('OWNER' | 'ADMIN' | 'LAWYER' | 'SECRETARY')[];
}

const navItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
    { path: '/cases', icon: Scale, label: 'القضايا' },
    { path: '/hearings', icon: Calendar, label: 'الجلسات' },
    { path: '/clients', icon: Users, label: 'العملاء' },
    { path: '/documents', icon: FileText, label: 'المستندات' },
    { path: '/invoices', icon: Receipt, label: 'الفواتير', roles: ['OWNER', 'ADMIN'] },
    { path: '/settings', icon: Settings, label: 'الإعدادات' },
    { path: '/settings/users', icon: UserCog, label: 'المستخدمون', roles: ['OWNER'] },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    const location = useLocation();
    const user = useAuthStore((state) => state.user);
    const userRole = user?.role;

    // Filter nav items based on user role
    const visibleNavItems = navItems.filter((item) => {
        // If no roles specified, visible to all
        if (!item.roles) return true;
        // Check if user role is in allowed roles
        return userRole && item.roles.includes(userRole);
    });

    return (
        <aside
            className={cn(
                'fixed top-0 right-0 z-40 h-screen bg-card border-l transition-all duration-300 flex flex-col',
                isCollapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="h-16 flex items-center justify-between px-4 border-b">
                <Link to="/dashboard" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Scale className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-xl font-bold text-primary">وثيق</span>
                    )}
                </Link>
            </div>

            {/* User Role Badge */}
            {!isCollapsed && userRole && (
                <div className="px-4 py-2 border-b">
                    <span className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        userRole === 'OWNER' && 'bg-purple-100 text-purple-700',
                        userRole === 'ADMIN' && 'bg-blue-100 text-blue-700',
                        userRole === 'LAWYER' && 'bg-green-100 text-green-700',
                        userRole === 'SECRETARY' && 'bg-orange-100 text-orange-700',
                    )}>
                        {userRole === 'OWNER' && 'مالك المكتب'}
                        {userRole === 'ADMIN' && 'مدير'}
                        {userRole === 'LAWYER' && 'محامي'}
                        {userRole === 'SECRETARY' && 'سكرتير'}
                    </span>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                                'hover:bg-primary/10 hover:text-primary',
                                isActive
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-muted-foreground',
                                isCollapsed && 'justify-center'
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCollapsed && <span>{item.label}</span>}
                        </Link>
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
        </aside>
    );
}

export default Sidebar;
