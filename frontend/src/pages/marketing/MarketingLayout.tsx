import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Users, Phone, Star,
    Megaphone, BarChart3, Mail, Calendar
} from 'lucide-react';

const navItems = [
    { href: '/marketing', label: 'لوحة التحكم', icon: LayoutDashboard, exact: true },
    { href: '/marketing/leads', label: 'العملاء المحتملون', icon: Users },
    { href: '/marketing/telemarketing', label: 'التسويق الهاتفي', icon: Phone },
    { href: '/marketing/affiliate', label: 'التسويق بالعمولة', icon: Star },
    { href: '/marketing/campaigns', label: 'الحملات التسويقية', icon: Megaphone },
    { href: '/marketing/ads-analytics', label: 'نتائج الإعلانات', icon: BarChart3 },
    { href: '/marketing/messages', label: 'حملات الرسائل', icon: Mail },
    { href: '/marketing/calendar', label: 'تقويم المحتوى', icon: Calendar },
];

export default function MarketingLayout() {
    const location = useLocation();

    return (
        <div className="flex h-full" dir="rtl">
            {/* Marketing Sidebar */}
            <aside style={{
                width: 260,
                background: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)',
                display: 'flex',
                flexDirection: 'column',
                borderLeft: '1px solid rgba(255,255,255,0.1)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 38, height: 38,
                            background: 'linear-gradient(135deg, #10b981, #34d399)',
                            borderRadius: 12,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                        }}>
                            <Megaphone style={{ width: 20, height: 20, color: '#fff' }} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, margin: 0 }}>قسم التسويق</p>
                            <p style={{ color: '#6ee7b7', fontSize: 11, margin: 0 }}>Marketing Hub</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px' }}>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.exact
                            ? location.pathname === item.href
                            : location.pathname.startsWith(item.href) && item.href !== '/marketing';

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    fontSize: 13,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? '#fff' : '#d1fae5',
                                    background: isActive ? 'rgba(16,185,129,0.35)' : 'transparent',
                                    textDecoration: 'none',
                                    marginBottom: 2,
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) (e.currentTarget.style.background = 'rgba(16,185,129,0.15)');
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) (e.currentTarget.style.background = 'transparent');
                                }}
                            >
                                <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{
                    padding: '12px 18px',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: 10,
                    color: '#6ee7b7',
                    textAlign: 'center',
                }}>
                    Phase 29 • Marketing Module
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
                <Outlet />
            </main>
        </div>
    );
}
