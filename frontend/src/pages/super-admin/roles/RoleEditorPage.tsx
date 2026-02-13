import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { superAdminApi } from '@/api/superAdmin';
import PermissionsMatrix from '@/components/super-admin/PermissionsMatrix';

const COLOR_PRESETS = [
    '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#f43f5e', '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16', '#22c55e', '#10b981',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

export default function RoleEditorPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [permissions, setPermissions] = useState<Array<{ resource: string; action: string; accessLevel: string }>>([]);
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [isSystem, setIsSystem] = useState(false);

    useEffect(() => {
        if (!isNew && id) {
            superAdminApi.getRoleDetails(id).then(data => {
                setName(data.name || '');
                setDescription(data.description || '');
                setColor(data.color || '#6366f1');
                setPermissions(data.permissions || []);
                setIsSystem(data.isSystem || false);
                setLoading(false);
            }).catch(() => {
                navigate('/super-admin/roles');
            });
        }
    }, [id]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('يرجى إدخال اسم الدور');
            return;
        }
        setSaving(true);
        try {
            if (isNew) {
                await superAdminApi.createRole({ name, description, color, permissions });
            } else {
                await superAdminApi.updateRole(id!, { name, description, color, permissions });
            }
            navigate('/super-admin/roles');
        } catch (e: any) {
            alert(e?.response?.data?.message || 'فشل الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                جاري التحميل...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', direction: 'rtl', maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/super-admin/roles')}
                        style={{
                            background: '#1e293b', border: 'none', color: '#94a3b8',
                            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                            fontSize: '14px',
                        }}
                    >
                        ←
                    </button>
                    <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>
                        {isNew ? '➕ دور جديد' : `✏️ تعديل "${name}"`}
                    </h1>
                    {isSystem && (
                        <span style={{
                            padding: '4px 10px', borderRadius: '6px',
                            background: '#f59e0b22', color: '#f59e0b',
                            fontSize: '11px', fontWeight: 600,
                        }}>
                            ⚠️ دور أساسي — للقراءة فقط
                        </span>
                    )}
                </div>
                {!isSystem && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            padding: '10px 24px', borderRadius: '10px',
                            background: saving ? '#475569' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', fontWeight: 600, fontSize: '14px',
                            border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {saving ? '⏳ جاري الحفظ...' : '💾 حفظ'}
                    </button>
                )}
            </div>

            {/* Role Info */}
            <div style={{
                background: '#0f172a', borderRadius: '16px',
                border: '1px solid #1e293b', padding: '20px',
                marginBottom: '20px',
            }}>
                <h3 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: '0 0 16px' }}>
                    معلومات الدور
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {/* Name */}
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                            الاسم *
                        </label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isSystem}
                            placeholder="مثال: مدير المبيعات"
                            style={{
                                width: '100%', padding: '10px 12px',
                                borderRadius: '8px', border: '1px solid #334155',
                                background: '#1e293b', color: '#fff',
                                fontSize: '14px', outline: 'none',
                                boxSizing: 'border-box',
                                opacity: isSystem ? 0.6 : 1,
                            }}
                        />
                    </div>

                    {/* Color */}
                    <div>
                        <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                            اللون
                        </label>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {COLOR_PRESETS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => !isSystem && setColor(c)}
                                    style={{
                                        width: '24px', height: '24px',
                                        borderRadius: '6px',
                                        background: c,
                                        border: color === c ? '2px solid #fff' : '2px solid transparent',
                                        cursor: isSystem ? 'default' : 'pointer',
                                        transition: 'all 0.15s',
                                        opacity: isSystem ? 0.6 : 1,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div style={{ marginTop: '16px' }}>
                    <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '6px' }}>
                        الوصف
                    </label>
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        disabled={isSystem}
                        rows={2}
                        placeholder="وصف اختياري للدور..."
                        style={{
                            width: '100%', padding: '10px 12px',
                            borderRadius: '8px', border: '1px solid #334155',
                            background: '#1e293b', color: '#fff',
                            fontSize: '13px', outline: 'none',
                            resize: 'vertical', fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            opacity: isSystem ? 0.6 : 1,
                        }}
                    />
                </div>
            </div>

            {/* Permissions Matrix */}
            <div style={{
                background: '#0f172a', borderRadius: '16px',
                border: '1px solid #1e293b', padding: '20px',
            }}>
                <h3 style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, margin: '0 0 16px' }}>
                    🔑 مصفوفة الصلاحيات
                </h3>

                {/* Legend */}
                <div style={{
                    display: 'flex', gap: '16px', marginBottom: '16px',
                    padding: '10px 14px', background: '#1e293b', borderRadius: '10px',
                }}>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>🔴 بلا = ممنوع</span>
                    <span style={{ color: '#38bdf8', fontSize: '11px' }}>🔵 مشاهدة = قراءة فقط</span>
                    <span style={{ color: '#4ade80', fontSize: '11px' }}>🟢 تعديل = قراءة + كتابة</span>
                    <span style={{ color: '#c084fc', fontSize: '11px' }}>🟣 تحكم كامل = كل شيء</span>
                </div>

                <PermissionsMatrix
                    permissions={permissions}
                    onChange={setPermissions}
                    readOnly={isSystem}
                />
            </div>
        </div>
    );
}
