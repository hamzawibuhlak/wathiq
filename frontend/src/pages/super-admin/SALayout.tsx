import { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSuperAdminStore } from '@/stores/superAdmin.store';

const navItems = [
    { label: 'نظرة عامة', href: '/super-admin', icon: '📊' },
    { label: 'المكاتب', href: '/super-admin/tenants', icon: '🏢' },
    { label: 'الدردشة', href: '/super-admin/chat', icon: '💬' },
    { label: 'الموظفون', href: '/super-admin/staff', icon: '👥' },
    { label: 'سجل العمليات', href: '/super-admin/audit', icon: '📋' },
];

export default function SuperAdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { admin, isAuthenticated, loadFromStorage, logout } = useSuperAdminStore();

    useEffect(() => {
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (!isAuthenticated && !localStorage.getItem('sa_token')) {
            navigate('/super-admin/login');
        }
    }, [isAuthenticated]);

    const isActive = (href: string) => {
        if (href === '/super-admin') return location.pathname === '/super-admin';
        return location.pathname.startsWith(href);
    };

    const roleLabels: Record<string, string> = {
        OWNER: 'مالك النظام',
        MANAGER: 'مدير',
        SUPPORT: 'دعم فني',
        SALES: 'مبيعات',
        MODERATOR: 'مشرف',
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: '#020617', direction: 'rtl' }}>
            {/* Sidebar */}
            <aside style={{
                width: '240px', background: '#0f172a',
                borderLeft: '1px solid #1e293b',
                display: 'flex', flexDirection: 'column',
                flexShrink: 0,
            }}>
                {/* Logo */}
                <div style={{
                    padding: '20px 16px', borderBottom: '1px solid #1e293b',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <div style={{
                        width: '36px', height: '36px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                    }}>👑</div>
                    <div>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: '14px', margin: 0 }}>وثيق</p>
                        <p style={{ color: '#6366f1', fontSize: '11px', margin: 0 }}>Super Admin</p>
                    </div>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map(item => (
                        <Link key={item.href} to={item.href}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                padding: '10px 14px', borderRadius: '12px',
                                fontSize: '14px', textDecoration: 'none',
                                transition: 'all 0.2s',
                                background: isActive(item.href) ? '#4f46e5' : 'transparent',
                                color: isActive(item.href) ? '#fff' : '#94a3b8',
                            }}>
                            <span style={{ fontSize: '16px' }}>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Admin Info */}
                <div style={{ padding: '12px', borderTop: '1px solid #1e293b' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 10px',
                    }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '13px', fontWeight: 700,
                        }}>
                            {admin?.name?.charAt(0) || '؟'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: '#fff', fontSize: '12px', fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {admin?.name || 'مسؤول'}
                            </p>
                            <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>
                                {roleLabels[admin?.role || ''] || admin?.role}
                            </p>
                        </div>
                        <button onClick={() => { logout(); navigate('/super-admin/login'); }}
                            title="تسجيل الخروج"
                            style={{
                                background: 'none', border: 'none', color: '#64748b',
                                cursor: 'pointer', fontSize: '16px', padding: '4px',
                            }}>
                            🚪
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, overflowY: 'auto', background: '#020617' }}>
                <Outlet />
            </main>
        </div>
    );
}
