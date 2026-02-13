import { useState, useEffect } from 'react';

const RESOURCES = [
    {
        group: 'لوحة المعلومات',
        items: [
            { resource: 'dashboard', action: 'view_overview', label: 'نظرة عامة' },
            { resource: 'dashboard', action: 'view_recent', label: 'التسجيلات الأخيرة' },
        ],
    },
    {
        group: 'المكاتب',
        items: [
            { resource: 'tenants', action: 'view_list', label: 'عرض القائمة' },
            { resource: 'tenants', action: 'view_details', label: 'عرض التفاصيل' },
            { resource: 'tenants', action: 'freeze', label: 'تجميد' },
            { resource: 'tenants', action: 'unfreeze', label: 'إلغاء التجميد' },
            { resource: 'tenants', action: 'change_plan', label: 'تغيير الباقة' },
            { resource: 'tenants', action: 'soft_delete', label: 'حذف مؤقت' },
            { resource: 'tenants', action: 'hard_delete', label: 'حذف نهائي' },
        ],
    },
    {
        group: 'الملاحظات',
        items: [
            { resource: 'notes', action: 'create', label: 'إضافة ملاحظة' },
        ],
    },
    {
        group: 'الموظفون',
        items: [
            { resource: 'staff', action: 'view_list', label: 'عرض القائمة' },
            { resource: 'staff', action: 'create', label: 'إضافة موظف' },
            { resource: 'staff', action: 'assign_role', label: 'تعيين دور' },
            { resource: 'staff', action: 'deactivate', label: 'إيقاف' },
            { resource: 'staff', action: 'activate', label: 'تفعيل' },
            { resource: 'staff', action: 'reset_password', label: 'إعادة كلمة المرور' },
        ],
    },
    {
        group: 'الدردشة',
        items: [
            { resource: 'chat', action: 'view_rooms', label: 'عرض الغرف' },
            { resource: 'chat', action: 'view_messages', label: 'قراءة الرسائل' },
            { resource: 'chat', action: 'send_messages', label: 'إرسال رسائل' },
            { resource: 'chat', action: 'resolve', label: 'إغلاق المحادثة' },
        ],
    },
    {
        group: 'الأدوار',
        items: [
            { resource: 'roles', action: 'view', label: 'عرض الأدوار' },
            { resource: 'roles', action: 'create', label: 'إنشاء دور' },
            { resource: 'roles', action: 'edit', label: 'تعديل دور' },
            { resource: 'roles', action: 'delete', label: 'حذف دور' },
        ],
    },
    {
        group: 'سجل العمليات',
        items: [
            { resource: 'audit_log', action: 'view', label: 'عرض السجل' },
        ],
    },
];

const LEVELS = ['NONE', 'VIEW', 'EDIT', 'FULL'];
const LEVEL_LABELS: Record<string, string> = {
    NONE: 'بلا',
    VIEW: 'مشاهدة',
    EDIT: 'تعديل',
    FULL: 'تحكم كامل',
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    NONE: { bg: '#1e293b', text: '#64748b', border: '#334155' },
    VIEW: { bg: '#1e3a5f', text: '#38bdf8', border: '#0c4a6e' },
    EDIT: { bg: '#1c3d2a', text: '#4ade80', border: '#14532d' },
    FULL: { bg: '#3b1c59', text: '#c084fc', border: '#581c87' },
};

interface PermissionsMatrixProps {
    permissions: Array<{ resource: string; action: string; accessLevel: string }>;
    onChange: (permissions: Array<{ resource: string; action: string; accessLevel: string }>) => void;
    readOnly?: boolean;
}

export default function PermissionsMatrix({ permissions, onChange, readOnly }: PermissionsMatrixProps) {
    const [permMap, setPermMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const map: Record<string, string> = {};
        permissions.forEach(p => {
            map[`${p.resource}.${p.action}`] = p.accessLevel;
        });
        setPermMap(map);
    }, [permissions]);

    const getLevel = (resource: string, action: string) => {
        return permMap[`${resource}.${action}`] || 'NONE';
    };

    const setLevel = (resource: string, action: string, level: string) => {
        if (readOnly) return;
        const key = `${resource}.${action}`;
        const newMap = { ...permMap, [key]: level };
        setPermMap(newMap);

        const newPerms = Object.entries(newMap).map(([k, v]) => {
            const [res, act] = k.split('.');
            return { resource: res, action: act, accessLevel: v };
        });
        onChange(newPerms);
    };

    const setGroupLevel = (group: typeof RESOURCES[0], level: string) => {
        if (readOnly) return;
        const newMap = { ...permMap };
        group.items.forEach(item => {
            newMap[`${item.resource}.${item.action}`] = level;
        });
        setPermMap(newMap);

        const newPerms = Object.entries(newMap).map(([k, v]) => {
            const [res, act] = k.split('.');
            return { resource: res, action: act, accessLevel: v };
        });
        onChange(newPerms);
    };

    return (
        <div style={{ direction: 'rtl' }}>
            {RESOURCES.map(group => (
                <div key={group.group} style={{
                    marginBottom: '16px',
                    background: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #1e293b',
                    overflow: 'hidden',
                }}>
                    {/* Group Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: '#1e293b',
                        borderBottom: '1px solid #334155',
                    }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '14px' }}>
                            {group.group}
                        </span>
                        {!readOnly && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {LEVELS.map(level => (
                                    <button
                                        key={level}
                                        onClick={() => setGroupLevel(group, level)}
                                        style={{
                                            padding: '3px 8px',
                                            fontSize: '10px',
                                            borderRadius: '6px',
                                            border: `1px solid ${LEVEL_COLORS[level].border}`,
                                            background: LEVEL_COLORS[level].bg,
                                            color: LEVEL_COLORS[level].text,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        {LEVEL_LABELS[level]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rows */}
                    {group.items.map((item, idx) => {
                        const currentLevel = getLevel(item.resource, item.action);
                        return (
                            <div
                                key={`${item.resource}.${item.action}`}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 16px',
                                    borderBottom: idx < group.items.length - 1 ? '1px solid #1e293b' : 'none',
                                }}
                            >
                                <span style={{ color: '#94a3b8', fontSize: '13px', flex: 1 }}>
                                    {item.label}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {LEVELS.map(level => {
                                        const isActive = currentLevel === level;
                                        const colors = LEVEL_COLORS[level];
                                        return (
                                            <button
                                                key={level}
                                                onClick={() => setLevel(item.resource, item.action, level)}
                                                disabled={readOnly}
                                                style={{
                                                    padding: '4px 10px',
                                                    fontSize: '11px',
                                                    borderRadius: '6px',
                                                    border: `1.5px solid ${isActive ? colors.text : '#334155'}`,
                                                    background: isActive ? colors.bg : 'transparent',
                                                    color: isActive ? colors.text : '#475569',
                                                    cursor: readOnly ? 'default' : 'pointer',
                                                    fontWeight: isActive ? 600 : 400,
                                                    transition: 'all 0.15s',
                                                    opacity: readOnly ? 0.6 : 1,
                                                }}
                                            >
                                                {LEVEL_LABELS[level]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
