/**
 * Phase 35: Tenant Roles List Page
 * Grid of role cards with CRUD actions for the office owner.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantRolesApi, type TenantRole } from '@/api/tenantRoles';
import toast from 'react-hot-toast';

const ICON_MAP: Record<string, string> = {
    scale: '⚖️',
    'book-open': '📖',
    clipboard: '📋',
    calculator: '🧮',
    'graduation-cap': '🎓',
    shield: '🛡️',
    star: '⭐',
    user: '👤',
};

const TenantRolesListPage: React.FC = () => {
    const navigate = useNavigate();
    const [roles, setRoles] = useState<TenantRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const data = await tenantRolesApi.getRoles();
            setRoles(data);
        } catch {
            // Error handled by API interceptor
        } finally {
            setLoading(false);
        }
    };

    const handleSeedRoles = async () => {
        try {
            setSeeding(true);
            await tenantRolesApi.seedRoles();
            toast.success('تم إنشاء الأدوار الافتراضية بنجاح');
            await loadRoles();
        } catch {
            // Error handled by API interceptor
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`هل أنت متأكد من حذف الدور "${name}"؟`)) return;
        try {
            await tenantRolesApi.deleteRole(id);
            toast.success('تم حذف الدور بنجاح');
            setRoles((prev) => prev.filter((r) => r.id !== id));
        } catch {
            // Error handled by API interceptor
        }
    };

    const handleClone = async (id: string, name: string) => {
        const newName = prompt('أدخل اسم الدور الجديد:', `${name} (نسخة)`);
        if (!newName) return;
        try {
            await tenantRolesApi.cloneRole(id, newName);
            toast.success(`تم نسخ الدور كـ "${newName}"`);
            await loadRoles();
        } catch {
            // Error handled by API interceptor
        }
    };

    const getPermissionProgress = (enabled: number, total: number) => {
        if (total === 0) return 0;
        return Math.round((enabled / total) * 100);
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>جاري تحميل الأدوار...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.title}>إدارة الأدوار والصلاحيات</h1>
                    <p style={styles.subtitle}>تحكم في صلاحيات كل دور داخل مكتبك</p>
                </div>
                <div style={styles.headerActions}>
                    {roles.length === 0 && (
                        <button
                            style={{ ...styles.btn, ...styles.btnSecondary }}
                            onClick={handleSeedRoles}
                            disabled={seeding}
                        >
                            {seeding ? '⏳ جاري الإنشاء...' : '🌱 إنشاء الأدوار الافتراضية'}
                        </button>
                    )}
                    <button
                        style={{ ...styles.btn, ...styles.btnPrimary }}
                        onClick={() => navigate('new')}
                    >
                        + إنشاء دور جديد
                    </button>
                </div>
            </div>

            {/* Roles Grid */}
            {roles.length === 0 ? (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>🛡️</div>
                    <h3 style={styles.emptyTitle}>لا توجد أدوار بعد</h3>
                    <p style={styles.emptyText}>
                        ابدأ بإنشاء الأدوار الافتراضية أو أنشئ دوراً جديداً مخصصاً
                    </p>
                    <button
                        style={{ ...styles.btn, ...styles.btnPrimary, marginTop: '16px' }}
                        onClick={handleSeedRoles}
                        disabled={seeding}
                    >
                        🌱 إنشاء الأدوار الافتراضية
                    </button>
                </div>
            ) : (
                <div style={styles.rolesGrid}>
                    {roles.map((role) => {
                        const progress = getPermissionProgress(
                            role.enabledPermissions,
                            role.totalPermissions,
                        );
                        return (
                            <div
                                key={role.id}
                                style={{
                                    ...styles.roleCard,
                                    borderTop: `4px solid ${role.color}`,
                                }}
                            >
                                <div style={styles.roleCardHeader}>
                                    <div style={styles.roleIcon}>
                                        {ICON_MAP[role.icon] || '🛡️'}
                                    </div>
                                    <div style={styles.roleInfo}>
                                        <h3 style={styles.roleName}>{role.name}</h3>
                                        {role.nameEn && (
                                            <span style={styles.roleNameEn}>{role.nameEn}</span>
                                        )}
                                    </div>
                                    {role.isSystem && (
                                        <span style={styles.systemBadge}>نظام</span>
                                    )}
                                </div>

                                {role.description && (
                                    <p style={styles.roleDescription}>{role.description}</p>
                                )}

                                <div style={styles.roleStats}>
                                    <div style={styles.stat}>
                                        <span style={styles.statValue}>{role.usersCount}</span>
                                        <span style={styles.statLabel}>مستخدم</span>
                                    </div>
                                    <div style={styles.stat}>
                                        <span style={styles.statValue}>{role.enabledPermissions}</span>
                                        <span style={styles.statLabel}>صلاحية مفعّلة</span>
                                    </div>
                                </div>

                                {/* Permission Progress */}
                                <div style={styles.progressContainer}>
                                    <div style={styles.progressHeader}>
                                        <span style={styles.progressLabel}>الصلاحيات</span>
                                        <span style={styles.progressPercent}>{progress}%</span>
                                    </div>
                                    <div style={styles.progressBar}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${progress}%`,
                                                backgroundColor: role.color,
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={styles.roleActions}>
                                    <button
                                        style={styles.actionBtn}
                                        onClick={() => navigate(`${role.id}`)}
                                        title="تعديل"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        style={styles.actionBtn}
                                        onClick={() => handleClone(role.id, role.name)}
                                        title="نسخ"
                                    >
                                        📋
                                    </button>
                                    {!role.isSystem && (
                                        <button
                                            style={{ ...styles.actionBtn, ...styles.actionBtnDanger }}
                                            onClick={() => handleDelete(role.id, role.name)}
                                            title="حذف"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Styles ───────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        direction: 'rtl',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#1e293b',
        margin: 0,
    },
    subtitle: {
        fontSize: '15px',
        color: '#64748b',
        marginTop: '4px',
    },
    headerActions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap',
    },
    btn: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontFamily: 'inherit',
    },
    btnPrimary: {
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
    },
    btnSecondary: {
        background: '#f1f5f9',
        color: '#475569',
        border: '1px solid #e2e8f0',
    },
    rolesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
    },
    roleCard: {
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    roleCardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px',
    },
    roleIcon: {
        fontSize: '28px',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        background: '#f8fafc',
    },
    roleInfo: {
        flex: 1,
    },
    roleName: {
        fontSize: '18px',
        fontWeight: 700,
        color: '#1e293b',
        margin: 0,
    },
    roleNameEn: {
        fontSize: '13px',
        color: '#94a3b8',
    },
    systemBadge: {
        fontSize: '11px',
        padding: '2px 8px',
        borderRadius: '6px',
        background: '#dbeafe',
        color: '#3b82f6',
        fontWeight: 600,
    },
    roleDescription: {
        fontSize: '13px',
        color: '#64748b',
        margin: '0 0 16px',
        lineHeight: 1.5,
    },
    roleStats: {
        display: 'flex',
        gap: '24px',
        marginBottom: '16px',
    },
    stat: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    statValue: {
        fontSize: '22px',
        fontWeight: 700,
        color: '#1e293b',
    },
    statLabel: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    progressContainer: {
        marginBottom: '16px',
    },
    progressHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '6px',
    },
    progressLabel: {
        fontSize: '12px',
        color: '#64748b',
    },
    progressPercent: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#475569',
    },
    progressBar: {
        height: '6px',
        borderRadius: '3px',
        background: '#f1f5f9',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: '3px',
        transition: 'width 0.5s ease',
    },
    roleActions: {
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '12px',
    },
    actionBtn: {
        width: '36px',
        height: '36px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: '#fafafa',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        transition: 'all 0.2s',
    },
    actionBtnDanger: {
        borderColor: '#fecaca',
        background: '#fef2f2',
    },
    emptyState: {
        textAlign: 'center',
        padding: '60px 0',
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    emptyTitle: {
        fontSize: '20px',
        fontWeight: 700,
        color: '#1e293b',
        margin: '0 0 8px',
    },
    emptyText: {
        fontSize: '14px',
        color: '#64748b',
    },
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '4px solid #e2e8f0',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    loadingText: {
        marginTop: '12px',
        fontSize: '14px',
        color: '#64748b',
    },
};

export default TenantRolesListPage;
