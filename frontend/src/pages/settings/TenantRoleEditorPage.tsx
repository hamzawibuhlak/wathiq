/**
 * Phase 35: Tenant Role Editor Page
 * Full permission matrix for creating/editing roles.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    tenantRolesApi,
    type PermissionEntry,
    type PermissionModule,
} from '@/api/tenantRoles';
import toast from 'react-hot-toast';

const ACCESS_LEVELS = ['NONE', 'VIEW', 'EDIT', 'FULL'] as const;
const SCOPE_OPTIONS = ['OWN', 'ASSIGNED', 'TEAM', 'ALL'] as const;

const LEVEL_LABELS: Record<string, string> = {
    NONE: 'محظور',
    VIEW: 'عرض',
    EDIT: 'تعديل',
    FULL: 'كامل',
};
const LEVEL_COLORS: Record<string, string> = {
    NONE: '#ef4444',
    VIEW: '#3b82f6',
    EDIT: '#f59e0b',
    FULL: '#10b981',
};
const SCOPE_LABELS: Record<string, string> = {
    OWN: 'ملكي',
    ASSIGNED: 'المعيّن لي',
    TEAM: 'الفريق',
    ALL: 'الكل',
};

const COLOR_OPTIONS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#64748b',
];

interface PermMap {
    [key: string]: { accessLevel: string; scope: string };
}

const TenantRoleEditorPage: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isNew = id === 'new';

    // Form state
    const [name, setName] = useState('');
    const [nameEn, setNameEn] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [icon, setIcon] = useState('shield');

    // Permission state
    const [permMap, setPermMap] = useState<PermMap>({});
    const [modules, setModules] = useState<PermissionModule[]>([]);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');

    // Load data
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load permission catalog
            const catalog = await tenantRolesApi.getPermissionMap();
            setModules(catalog.modules);

            // Initialize perm map with all NONE
            const defaultMap: PermMap = {};
            for (const mod of catalog.modules) {
                for (const act of mod.actions) {
                    defaultMap[`${mod.key}.${act.key}`] = { accessLevel: 'NONE', scope: 'ALL' };
                }
            }

            if (!isNew && id) {
                // Load existing role
                const role = await tenantRolesApi.getRole(id);
                setName(role.name);
                setNameEn(role.nameEn || '');
                setDescription(role.description || '');
                setColor(role.color);
                setIcon(role.icon);

                // Merge existing permissions
                for (const p of role.permissions) {
                    const key = `${p.resource}.${p.action}`;
                    defaultMap[key] = { accessLevel: p.accessLevel, scope: p.scope || 'ALL' };
                }
            }

            setPermMap(defaultMap);
            // Expand first module
            if (catalog.modules.length > 0) {
                setExpandedModules(new Set([catalog.modules[0].key]));
            }
        } catch {
            toast.error('فشل في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    };

    // Apply template
    const handleApplyTemplate = async (templateName: string) => {
        try {
            const perms = await tenantRolesApi.getTemplatePermissions(templateName);
            const newMap: PermMap = { ...permMap };
            for (const p of perms) {
                const key = `${p.resource}.${p.action}`;
                newMap[key] = { accessLevel: p.accessLevel, scope: p.scope || 'ALL' };
            }
            setPermMap(newMap);
            toast.success('تم تطبيق قالب الصلاحيات');
        } catch {
            toast.error('فشل في تحميل القالب');
        }
    };

    // Toggle module expansion
    const toggleModule = (modKey: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            if (next.has(modKey)) {
                next.delete(modKey);
            } else {
                next.add(modKey);
            }
            return next;
        });
    };

    // Update a single permission
    const updatePermission = (key: string, field: 'accessLevel' | 'scope', value: string) => {
        setPermMap((prev) => ({
            ...prev,
            [key]: { ...prev[key], [field]: value },
        }));
    };

    // Bulk set all actions in a module
    const setModuleLevel = (modKey: string, level: string) => {
        setPermMap((prev) => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
                if (key.startsWith(`${modKey}.`)) {
                    next[key] = { ...next[key], accessLevel: level };
                }
            }
            return next;
        });
    };

    // Save handler
    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('اسم الدور مطلوب');
            return;
        }

        const permissions: PermissionEntry[] = Object.entries(permMap).map(([key, val]) => {
            const [resource, action] = key.split('.');
            return {
                resource,
                action,
                accessLevel: val.accessLevel as PermissionEntry['accessLevel'],
                scope: val.scope as PermissionEntry['scope'],
            };
        });

        try {
            setSaving(true);
            if (isNew) {
                await tenantRolesApi.createRole({
                    name: name.trim(),
                    nameEn: nameEn.trim() || undefined,
                    description: description.trim() || undefined,
                    color,
                    icon,
                    permissions,
                });
                toast.success('تم إنشاء الدور بنجاح');
            } else {
                await tenantRolesApi.updateRole(id!, {
                    name: name.trim(),
                    nameEn: nameEn.trim() || undefined,
                    description: description.trim() || undefined,
                    color,
                    icon,
                    permissions,
                });
                toast.success('تم تحديث الدور بنجاح');
            }
            navigate(-1);
        } catch {
            // Error handled by API interceptor
        } finally {
            setSaving(false);
        }
    };

    // Stats
    const stats = useMemo(() => {
        const entries = Object.values(permMap);
        const enabled = entries.filter((e) => e.accessLevel !== 'NONE').length;
        return { enabled, total: entries.length, percent: entries.length ? Math.round((enabled / entries.length) * 100) : 0 };
    }, [permMap]);

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingContainer}>
                    <div style={styles.spinner} />
                    <p style={styles.loadingText}>جاري التحميل...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate(-1)}>
                    → العودة للأدوار
                </button>
                <h1 style={styles.title}>
                    {isNew ? 'إنشاء دور جديد' : `تعديل: ${name}`}
                </h1>
            </div>

            {/* Tab Navigation */}
            <div style={styles.tabs}>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'info' ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab('info')}
                >
                    📝 معلومات الدور
                </button>
                <button
                    style={{
                        ...styles.tab,
                        ...(activeTab === 'permissions' ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab('permissions')}
                >
                    🔐 الصلاحيات ({stats.enabled}/{stats.total})
                </button>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
                <div style={styles.section}>
                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>اسم الدور *</label>
                            <input
                                style={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="مثال: محامي أول"
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>الاسم بالإنجليزية</label>
                            <input
                                style={styles.input}
                                value={nameEn}
                                onChange={(e) => setNameEn(e.target.value)}
                                placeholder="e.g. Senior Lawyer"
                                dir="ltr"
                            />
                        </div>
                        <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                            <label style={styles.label}>الوصف</label>
                            <textarea
                                style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="وصف مختصر لصلاحيات هذا الدور..."
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>اللون</label>
                            <div style={styles.colorPicker}>
                                {COLOR_OPTIONS.map((c) => (
                                    <button
                                        key={c}
                                        style={{
                                            ...styles.colorBtn,
                                            backgroundColor: c,
                                            outline: color === c ? '3px solid #1e293b' : 'none',
                                            outlineOffset: '2px',
                                        }}
                                        onClick={() => setColor(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Template Apply */}
                    <div style={styles.templateSection}>
                        <h3 style={styles.sectionTitle}>⚡ تطبيق قالب جاهز</h3>
                        <p style={styles.sectionSubtitle}>اختر قالباً لملء الصلاحيات تلقائياً</p>
                        <div style={styles.templateGrid}>
                            {['Senior Lawyer', 'Junior Lawyer', 'Secretary', 'Accountant', 'Intern'].map((t) => (
                                <button
                                    key={t}
                                    style={styles.templateBtn}
                                    onClick={() => handleApplyTemplate(t)}
                                >
                                    {t === 'Senior Lawyer' && '⚖️ محامي أول'}
                                    {t === 'Junior Lawyer' && '📖 محامي مبتدئ'}
                                    {t === 'Secretary' && '📋 سكرتير'}
                                    {t === 'Accountant' && '🧮 محاسب'}
                                    {t === 'Intern' && '🎓 متدرب'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Permissions Tab */}
            {activeTab === 'permissions' && (
                <div style={styles.section}>
                    {/* Progress bar */}
                    <div style={styles.statsBar}>
                        <div>
                            <span style={styles.statsValue}>{stats.enabled}</span> صلاحية مفعّلة من{' '}
                            <span style={styles.statsValue}>{stats.total}</span>
                        </div>
                        <div style={styles.globalProgressBar}>
                            <div
                                style={{
                                    ...styles.globalProgressFill,
                                    width: `${stats.percent}%`,
                                }}
                            />
                        </div>
                    </div>

                    {/* Permission Modules */}
                    {modules.map((mod) => {
                        const isExpanded = expandedModules.has(mod.key);
                        const modEnabled = Object.entries(permMap).filter(
                            ([k, v]) => k.startsWith(`${mod.key}.`) && v.accessLevel !== 'NONE',
                        ).length;
                        const modTotal = mod.actions.length;

                        return (
                            <div key={mod.key} style={styles.moduleCard}>
                                <div
                                    style={styles.moduleHeader}
                                    onClick={() => toggleModule(mod.key)}
                                >
                                    <div style={styles.moduleHeaderLeft}>
                                        <span style={styles.moduleIcon}>{mod.icon}</span>
                                        <div>
                                            <span style={styles.moduleName}>{mod.label}</span>
                                            <span style={styles.moduleNameEn}>{mod.labelEn}</span>
                                        </div>
                                    </div>
                                    <div style={styles.moduleHeaderRight}>
                                        <span style={styles.moduleCount}>
                                            {modEnabled}/{modTotal}
                                        </span>
                                        <span style={styles.expandIcon}>
                                            {isExpanded ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={styles.moduleBody}>
                                        {/* Bulk actions */}
                                        <div style={styles.bulkActions}>
                                            <span style={styles.bulkLabel}>تعيين الكل:</span>
                                            {ACCESS_LEVELS.map((lvl) => (
                                                <button
                                                    key={lvl}
                                                    style={{
                                                        ...styles.bulkBtn,
                                                        backgroundColor: LEVEL_COLORS[lvl] + '15',
                                                        color: LEVEL_COLORS[lvl],
                                                        border: `1px solid ${LEVEL_COLORS[lvl]}30`,
                                                    }}
                                                    onClick={() => setModuleLevel(mod.key, lvl)}
                                                >
                                                    {LEVEL_LABELS[lvl]}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Actions table */}
                                        <table style={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th style={styles.th}>الإجراء</th>
                                                    <th style={{ ...styles.th, textAlign: 'center' }}>مستوى الوصول</th>
                                                    <th style={{ ...styles.th, textAlign: 'center' }}>النطاق</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mod.actions.map((act) => {
                                                    const key = `${mod.key}.${act.key}`;
                                                    const perm = permMap[key];
                                                    return (
                                                        <tr key={key} style={styles.tr}>
                                                            <td style={styles.td}>
                                                                <div>
                                                                    <span style={styles.actionLabel}>{act.label}</span>
                                                                    <span style={styles.actionLabelEn}>{act.labelEn}</span>
                                                                </div>
                                                            </td>
                                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                                <div style={styles.levelBtns}>
                                                                    {ACCESS_LEVELS.map((lvl) => (
                                                                        <button
                                                                            key={lvl}
                                                                            style={{
                                                                                ...styles.levelBtn,
                                                                                ...(perm?.accessLevel === lvl
                                                                                    ? {
                                                                                        backgroundColor: LEVEL_COLORS[lvl],
                                                                                        color: 'white',
                                                                                        fontWeight: 700,
                                                                                    }
                                                                                    : {}),
                                                                            }}
                                                                            onClick={() => updatePermission(key, 'accessLevel', lvl)}
                                                                            title={LEVEL_LABELS[lvl]}
                                                                        >
                                                                            {LEVEL_LABELS[lvl]}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td style={{ ...styles.td, textAlign: 'center' }}>
                                                                {act.supportsScope && perm?.accessLevel !== 'NONE' ? (
                                                                    <select
                                                                        style={styles.scopeSelect}
                                                                        value={perm?.scope || 'ALL'}
                                                                        onChange={(e) => updatePermission(key, 'scope', e.target.value)}
                                                                    >
                                                                        {SCOPE_OPTIONS.map((s) => (
                                                                            <option key={s} value={s}>
                                                                                {SCOPE_LABELS[s]}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                ) : (
                                                                    <span style={styles.noScope}>—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer Actions */}
            <div style={styles.footer}>
                <button style={styles.cancelBtn} onClick={() => navigate(-1)}>
                    إلغاء
                </button>
                <button
                    style={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? '⏳ جاري الحفظ...' : isNew ? '✅ إنشاء الدور' : '💾 حفظ التغييرات'}
                </button>
            </div>
        </div>
    );
};

// ─── Styles ───────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
    container: {
        padding: '32px',
        maxWidth: '1000px',
        margin: '0 auto',
        direction: 'rtl',
        paddingBottom: '100px',
    },
    header: {
        marginBottom: '24px',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#6366f1',
        fontSize: '14px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        padding: 0,
        marginBottom: '8px',
    },
    title: {
        fontSize: '26px',
        fontWeight: 700,
        color: '#1e293b',
        margin: 0,
    },
    tabs: {
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        background: '#f1f5f9',
        borderRadius: '12px',
        padding: '4px',
    },
    tab: {
        flex: 1,
        padding: '12px',
        border: 'none',
        borderRadius: '10px',
        background: 'transparent',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        color: '#64748b',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    tabActive: {
        background: '#ffffff',
        color: '#1e293b',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    section: {
        marginBottom: '24px',
    },
    formGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#475569',
        marginBottom: '6px',
    },
    input: {
        padding: '10px 14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border 0.2s',
    },
    colorPicker: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    colorBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    templateSection: {
        background: '#f8fafc',
        borderRadius: '16px',
        padding: '20px',
        border: '1px solid #e2e8f0',
    },
    sectionTitle: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#1e293b',
        margin: '0 0 4px',
    },
    sectionSubtitle: {
        fontSize: '13px',
        color: '#64748b',
        margin: '0 0 12px',
    },
    templateGrid: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
    },
    templateBtn: {
        padding: '8px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: '#ffffff',
        fontSize: '13px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    statsBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
        fontSize: '14px',
        color: '#475569',
    },
    statsValue: {
        fontWeight: 700,
        color: '#1e293b',
    },
    globalProgressBar: {
        width: '200px',
        height: '6px',
        borderRadius: '3px',
        background: '#e2e8f0',
        overflow: 'hidden',
    },
    globalProgressFill: {
        height: '100%',
        borderRadius: '3px',
        background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
        transition: 'width 0.5s ease',
    },
    moduleCard: {
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '12px',
        overflow: 'hidden',
    },
    moduleHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    moduleHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    moduleIcon: {
        fontSize: '24px',
    },
    moduleName: {
        fontSize: '16px',
        fontWeight: 700,
        color: '#1e293b',
        display: 'block',
    },
    moduleNameEn: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    moduleHeaderRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    moduleCount: {
        fontSize: '13px',
        fontWeight: 600,
        color: '#6366f1',
        background: '#eef2ff',
        padding: '2px 10px',
        borderRadius: '6px',
    },
    expandIcon: {
        fontSize: '12px',
        color: '#94a3b8',
    },
    moduleBody: {
        borderTop: '1px solid #f1f5f9',
        padding: '16px 20px',
    },
    bulkActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        flexWrap: 'wrap',
    },
    bulkLabel: {
        fontSize: '13px',
        color: '#64748b',
        fontWeight: 500,
    },
    bulkBtn: {
        padding: '4px 12px',
        borderRadius: '6px',
        border: 'none',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 0.2s',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        padding: '8px 12px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        borderBottom: '1px solid #f1f5f9',
        textAlign: 'right',
    },
    tr: {
        borderBottom: '1px solid #f8fafc',
    },
    td: {
        padding: '10px 12px',
        fontSize: '13px',
        verticalAlign: 'middle',
    },
    actionLabel: {
        display: 'block',
        fontWeight: 500,
        color: '#1e293b',
    },
    actionLabelEn: {
        fontSize: '11px',
        color: '#94a3b8',
    },
    levelBtns: {
        display: 'flex',
        gap: '4px',
        justifyContent: 'center',
    },
    levelBtn: {
        padding: '4px 10px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        fontSize: '11px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: '#64748b',
        transition: 'all 0.15s',
    },
    scopeSelect: {
        padding: '4px 8px',
        borderRadius: '6px',
        border: '1px solid #e2e8f0',
        fontSize: '12px',
        fontFamily: 'inherit',
        background: '#f8fafc',
        cursor: 'pointer',
    },
    noScope: {
        color: '#d1d5db',
        fontSize: '16px',
    },
    footer: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        padding: '16px 32px',
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
        direction: 'rtl',
    },
    cancelBtn: {
        padding: '10px 24px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        color: '#475569',
    },
    saveBtn: {
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        color: 'white',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
        transition: 'all 0.2s',
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

export default TenantRoleEditorPage;
