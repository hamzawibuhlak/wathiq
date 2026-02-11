import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminApi } from '@/api/superAdmin';
import { useSuperAdminStore } from '@/stores/superAdmin.store';
import toast from 'react-hot-toast';

export default function SuperAdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, loadFromStorage } = useSuperAdminStore();

    useEffect(() => {
        loadFromStorage();
    }, []);

    useEffect(() => {
        if (isAuthenticated) navigate('/super-admin');
    }, [isAuthenticated]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) return toast.error('يرجى إدخال البيانات');
        setLoading(true);
        try {
            const res = await superAdminApi.login(email, password);
            login(res.token, res.admin);
            toast.success('تم تسجيل الدخول بنجاح');
            navigate('/super-admin');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'بيانات الدخول غير صحيحة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center" dir="rtl"
            style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)' }}>
            <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: '24px',
                padding: '48px',
                width: '420px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        borderRadius: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        fontSize: '28px',
                    }}>👑</div>
                    <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>وثيق</h1>
                    <p style={{ color: '#6366f1', fontSize: '14px', marginTop: '4px' }}>Super Admin Dashboard</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                            البريد الإلكتروني
                        </label>
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="admin@bewathiq.com"
                            style={{
                                width: '100%', padding: '12px 16px',
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '12px', color: '#fff', fontSize: '14px',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ marginBottom: '28px' }}>
                        <label style={{ color: '#94a3b8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                            كلمة المرور
                        </label>
                        <input
                            type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '12px 16px',
                                background: 'rgba(30, 41, 59, 0.8)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                borderRadius: '12px', color: '#fff', fontSize: '14px',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <button type="submit" disabled={loading}
                        style={{
                            width: '100%', padding: '14px',
                            background: loading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', border: 'none', borderRadius: '12px',
                            fontSize: '16px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                            opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                        }}>
                        {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>
        </div>
    );
}
