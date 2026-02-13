import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { superAdminApi } from '@/api/superAdmin';

export default function RolesListPage() {
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDelete, setShowDelete] = useState<string | null>(null);
    const [cloneName, setCloneName] = useState('');
    const [cloneTarget, setCloneTarget] = useState<string | null>(null);

    const load = async () => {
        try {
            const data = await superAdminApi.getRoles();
            setRoles(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string) => {
        try {
            await superAdminApi.deleteRole(id);
            setRoles(r => r.filter(role => role.id !== id));
            setShowDelete(null);
        } catch (e: any) {
            alert(e?.response?.data?.message || 'فشل الحذف');
        }
    };

    const handleClone = async () => {
        if (!cloneTarget || !cloneName.trim()) return;
        try {
            const newRole = await superAdminApi.cloneRole(cloneTarget, cloneName);
            setRoles(r => [...r, newRole]);
            setCloneTarget(null);
            setCloneName('');
        } catch (e: any) {
            alert(e?.response?.data?.message || 'فشل النسخ');
        }
    };

    return (
        <div style={{ padding: '32px', direction: 'rtl', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: 0 }}>
                        🔐 إدارة الأدوار والصلاحيات
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 0' }}>
                        إنشاء وتخصيص أدوار مع صلاحيات دقيقة لكل إجراء
                    </p>
                </div>
                <Link
                    to="/super-admin/roles/new"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        padding: '10px 20px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', fontWeight: 600, fontSize: '14px',
                        textDecoration: 'none', transition: 'all 0.2s',
                    }}
                >
                    ➕ دور جديد
                </Link>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                    جاري التحميل...
                </div>
            )}

            {/* Roles Grid */}
            {!loading && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px',
                }}>
                    {roles.map(role => (
                        <div
                            key={role.id}
                            style={{
                                position: 'relative',
                                background: '#0f172a',
                                borderRadius: '16px',
                                border: `1px solid ${role.color || '#1e293b'}33`,
                                overflow: 'hidden',
                                transition: 'all 0.2s',
                            }}
                        >
                            {/* Color stripe */}
                            <div style={{
                                height: '4px',
                                background: `linear-gradient(90deg, ${role.color || '#6366f1'}, ${role.color || '#6366f1'}66)`,
                            }} />

                            <div style={{ padding: '20px' }}>
                                {/* Title line */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '20px' }}>{role.icon || '🔒'}</span>
                                    <h3 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, margin: 0, flex: 1 }}>
                                        {role.name}
                                    </h3>
                                    {role.isSystem && (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '6px', fontSize: '10px',
                                            background: '#1e293b', color: '#94a3b8', fontWeight: 600,
                                        }}>
                                            أساسي
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {role.description && (
                                    <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 12px', lineHeight: 1.6 }}>
                                        {role.description}
                                    </p>
                                )}

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: '#64748b', fontSize: '12px',
                                    }}>
                                        <span>👤</span>
                                        {role._count?.users || 0} مستخدم
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        color: '#64748b', fontSize: '12px',
                                    }}>
                                        <span>🔑</span>
                                        {role.permissions?.length || 0} صلاحية
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <Link
                                        to={`/super-admin/roles/${role.id}`}
                                        style={{
                                            flex: 1, textAlign: 'center',
                                            padding: '8px 0', borderRadius: '8px',
                                            background: '#1e293b', color: '#94a3b8',
                                            fontSize: '12px', textDecoration: 'none',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {role.isSystem ? '👁️ عرض' : '✏️ تعديل'}
                                    </Link>
                                    {!role.isSystem && (
                                        <>
                                            <button
                                                onClick={() => { setCloneTarget(role.id); setCloneName(role.name + ' - نسخة'); }}
                                                style={{
                                                    padding: '8px 12px', borderRadius: '8px',
                                                    background: '#1e293b', color: '#94a3b8',
                                                    fontSize: '12px', border: 'none', cursor: 'pointer',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                📋
                                            </button>
                                            <button
                                                onClick={() => setShowDelete(role.id)}
                                                style={{
                                                    padding: '8px 12px', borderRadius: '8px',
                                                    background: '#1c1517', color: '#f87171',
                                                    fontSize: '12px', border: '1px solid #7f1d1d33',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Delete Confirm */}
                            {showDelete === role.id && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: 'rgba(2,6,23,0.95)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: '12px', padding: '20px',
                                }}>
                                    <p style={{ color: '#f87171', fontSize: '14px', fontWeight: 600 }}>
                                        حذف "{role.name}"؟
                                    </p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleDelete(role.id)}
                                            style={{
                                                padding: '8px 20px', borderRadius: '8px',
                                                background: '#dc2626', color: '#fff',
                                                border: 'none', cursor: 'pointer', fontSize: '12px',
                                            }}
                                        >
                                            تأكيد الحذف
                                        </button>
                                        <button
                                            onClick={() => setShowDelete(null)}
                                            style={{
                                                padding: '8px 20px', borderRadius: '8px',
                                                background: '#1e293b', color: '#94a3b8',
                                                border: 'none', cursor: 'pointer', fontSize: '12px',
                                            }}
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && roles.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    color: '#64748b', fontSize: '14px',
                }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</p>
                    <p>لا توجد أدوار بعد</p>
                    <Link
                        to="/super-admin/roles/new"
                        style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600 }}
                    >
                        إنشاء أول دور →
                    </Link>
                </div>
            )}

            {/* Clone Modal */}
            {cloneTarget && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <div style={{
                        background: '#0f172a', borderRadius: '16px',
                        border: '1px solid #1e293b', padding: '24px',
                        width: '400px', direction: 'rtl',
                    }}>
                        <h3 style={{ color: '#fff', margin: '0 0 16px', fontSize: '16px' }}>
                            📋 نسخ الدور
                        </h3>
                        <input
                            value={cloneName}
                            onChange={e => setCloneName(e.target.value)}
                            placeholder="اسم الدور الجديد"
                            style={{
                                width: '100%', padding: '10px 12px',
                                borderRadius: '8px', border: '1px solid #334155',
                                background: '#1e293b', color: '#fff',
                                fontSize: '14px', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-start' }}>
                            <button
                                onClick={handleClone}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px',
                                    background: '#6366f1', color: '#fff',
                                    border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                }}
                            >
                                نسخ
                            </button>
                            <button
                                onClick={() => { setCloneTarget(null); setCloneName(''); }}
                                style={{
                                    padding: '10px 20px', borderRadius: '8px',
                                    background: '#1e293b', color: '#94a3b8',
                                    border: 'none', cursor: 'pointer', fontSize: '13px',
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
