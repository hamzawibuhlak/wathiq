import { NavLink, Outlet } from 'react-router-dom';
import {
    Building2,
    Users,
    Mail,
    MessageCircle,
    Shield,
    ShieldCheck,
    Upload,
    PhoneCall,
    Palette,
    Bot,
} from 'lucide-react';

const tabs = [
    { to: 'firm', label: 'بيانات المكتب', icon: Building2 },
    { to: 'theme', label: 'الهوية البصرية', icon: Palette },
    { to: 'users', label: 'المستخدمون', icon: Users },
    { to: 'permissions', label: 'الصلاحيات', icon: ShieldCheck },
    { to: 'email', label: 'البريد (SMTP)', icon: Mail },
    { to: 'whatsapp', label: 'واتساب', icon: MessageCircle },
    { to: 'call-center', label: 'مركز الاتصال', icon: PhoneCall },
    { to: 'ai', label: 'الذكاء الاصطناعي', icon: Bot },
    { to: 'security', label: 'الأمان', icon: Shield },
    { to: 'import', label: 'الاستيراد', icon: Upload },
];

export function SettingsLayout() {
    return (
        <div className="flex gap-6 p-6">
            <aside className="w-64 shrink-0">
                <div className="sticky top-6 bg-card rounded-xl border p-3 space-y-1">
                    <h2 className="text-lg font-bold px-3 py-2">إدارة المكتب</h2>
                    {tabs.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'hover:bg-muted text-foreground'
                                }`
                            }
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </NavLink>
                    ))}
                </div>
            </aside>
            <main className="flex-1 min-w-0">
                <Outlet />
            </main>
        </div>
    );
}

export default SettingsLayout;
