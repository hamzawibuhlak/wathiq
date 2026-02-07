import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { portalAuth } from '@/api/portal.api';
import { cn } from '@/lib/utils';
import {
    Scale,
    LayoutDashboard,
    Briefcase,
    FileText,
    Calendar,
    LogOut,
    User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
    { path: '/portal/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
    { path: '/portal/cases', icon: Briefcase, label: 'قضاياي' },
    { path: '/portal/invoices', icon: FileText, label: 'فواتيري' },
    { path: '/portal/hearings', icon: Calendar, label: 'الجلسات القادمة' },
];

export default function PortalLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const client = portalAuth.getClient();

    const handleLogout = () => {
        portalAuth.logout();
        navigate('/portal/login');
    };

    if (!portalAuth.isAuthenticated()) {
        navigate('/portal/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/portal/dashboard" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                                <Scale className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <span className="font-bold text-lg">بوابة العملاء</span>
                                <p className="text-xs text-muted-foreground">نظام وثيق</p>
                            </div>
                        </Link>

                        {/* User Menu */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium hidden sm:inline">{client?.name}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLogout}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                <LogOut className="w-4 h-4 ml-2" />
                                <span className="hidden sm:inline">خروج</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto py-2">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                                        isActive
                                            ? 'bg-primary text-white'
                                            : 'text-muted-foreground hover:bg-slate-100'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t bg-white py-4 mt-auto">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    نظام وثيق لإدارة المكاتب القانونية © {new Date().getFullYear()}
                </div>
            </footer>
        </div>
    );
}
