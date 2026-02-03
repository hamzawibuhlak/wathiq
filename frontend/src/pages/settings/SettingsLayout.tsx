import { NavLink, Outlet } from 'react-router-dom';
import { Settings, User, Users, Building2, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';

const settingsTabs = [
    { path: '/settings/profile', label: 'الملف الشخصي', icon: User },
    { path: '/settings/users', label: 'المستخدمين', icon: Users, adminOnly: true },
    { path: '/settings/firm', label: 'المكتب', icon: Building2, adminOnly: true },
    { path: '/settings/notifications', label: 'الإشعارات', icon: Bell },
];

export function SettingsLayout() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';

    const visibleTabs = settingsTabs.filter(tab => !tab.adminOnly || isAdmin);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Settings className="w-7 h-7 text-primary" />
                    الإعدادات
                </h1>
                <p className="text-muted-foreground">
                    إدارة إعدادات الحساب والمكتب
                </p>
            </div>

            {/* Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <nav className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-card rounded-xl border p-2 space-y-1">
                        {visibleTabs.map((tab) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )
                                }
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="bg-card rounded-xl border">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SettingsLayout;
