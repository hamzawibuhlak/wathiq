import { Link, Outlet, useLocation } from 'react-router-dom';
import { Building2, Users, Link2, GitBranch, CreditCard, LayoutDashboard, LogOut, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

const navItems = [
    { href: '/owner', label: 'نظرة عامة', icon: LayoutDashboard, exact: true },
    { href: '/owner/company', label: 'ملف الشركة', icon: Building2 },
    { href: '/owner/users', label: 'المستخدمون والصلاحيات', icon: Users },
    { href: '/owner/integrations', label: 'الارتباطات', icon: Link2 },
    { href: '/owner/workflows', label: 'سير العمل', icon: GitBranch },
    { href: '/owner/billing', label: 'الاشتراك والفوترة', icon: CreditCard },
];

export default function OwnerLayout() {
    const location = useLocation();
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    return (
        <div className="flex h-screen bg-slate-50" dir="rtl">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-l border-gray-200 flex flex-col shadow-sm">
                {/* Header */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                            <span className="text-amber-600 text-lg">👑</span>
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">لوحة المالك</p>
                            <p className="text-amber-600 text-xs">{user?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? location.pathname === item.href
                            : location.pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                                        ? 'bg-amber-50 text-amber-700 font-medium shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-amber-600' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        );
                    })}

                    {/* Chat Link */}
                    <Link
                        to="/chat"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
                    >
                        <MessageSquare className="w-4.5 h-4.5 text-gray-400" />
                        الدردشة
                    </Link>
                </nav>

                {/* Bottom section */}
                <div className="p-4 border-t border-gray-100 space-y-3">
                    {/* Hint */}
                    <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                        <p className="font-medium mb-1">💡 تريد متابعة الأعمال؟</p>
                        <p>أنشئ حساب بصلاحية <strong>مدير</strong> من قسم المستخدمين لمتابعة القضايا والعملاء</p>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={() => logout()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        تسجيل الخروج
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
