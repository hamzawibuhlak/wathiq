import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { superAdminApi } from '@/api/superAdmin';

export default function SAAuditLogPage() {
    const [page, setPage] = useState(1);
    const [actionFilter, setActionFilter] = useState('');

    const { data } = useQuery({
        queryKey: ['sa-audit', page, actionFilter],
        queryFn: () => superAdminApi.getAuditLogs({ page, action: actionFilter || undefined }),
    });

    const logs = data?.data || [];
    const meta = data?.meta || { page: 1, total: 0, totalPages: 1 };

    const actionLabels: Record<string, { label: string; color: string }> = {
        FREEZE_TENANT: { label: 'تجميد مكتب', color: '#fbbf24' },
        UNFREEZE_TENANT: { label: 'رفع تجميد', color: '#4ade80' },
        CHANGE_PLAN: { label: 'تغيير باقة', color: '#818cf8' },
        SOFT_DELETE_TENANT: { label: 'حذف ناعم', color: '#fb923c' },
        HARD_DELETE_TENANT: { label: 'حذف نهائي', color: '#f87171' },
    };

    return (
        <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: 0 }}>📋 سجل العمليات</h1>
                <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
                    style={{
                        padding: '10px 16px', background: '#1e293b', border: '1px solid #334155',
                        borderRadius: '12px', color: '#e2e8f0', fontSize: '13px', outline: 'none',
                    }}>
                    <option value="">كل العمليات</option>
                    <option value="FREEZE_TENANT">تجميد</option>
                    <option value="UNFREEZE_TENANT">رفع تجميد</option>
                    <option value="CHANGE_PLAN">تغيير باقة</option>
                    <option value="SOFT_DELETE_TENANT">حذف ناعم</option>
                    <option value="HARD_DELETE_TENANT">حذف نهائي</option>
                </select>
            </div>

            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #1e293b' }}>
                            {['التاريخ', 'المنفذ', 'العملية', 'الهدف', 'التفاصيل'].map(h => (
                                <th key={h} style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', fontWeight: 500, textAlign: 'right' }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log: any) => {
                            const al = actionLabels[log.action];
                            return (
                                <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                    <td style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '12px' }}>
                                        {new Date(log.createdAt).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{
                                                width: '24px', height: '24px', borderRadius: '50%',
                                                background: 'rgba(99,102,241,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#818cf8', fontSize: '11px', fontWeight: 700,
                                            }}>{log.user?.name?.charAt(0) || '؟'}</div>
                                            <span style={{ color: '#e2e8f0', fontSize: '13px' }}>{log.user?.name || '—'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{
                                            fontSize: '11px', padding: '3px 10px', borderRadius: '8px',
                                            background: al ? `${al.color}20` : 'rgba(100,116,139,0.2)',
                                            color: al?.color || '#94a3b8',
                                        }}>{al?.label || log.action}</span>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{log.targetType}</span>
                                        <span style={{ color: '#475569', fontSize: '11px', marginRight: '6px' }}>
                                            {log.targetId?.substring(0, 8)}...
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '12px', maxWidth: '200px' }}>
                                        {log.details ? (
                                            <span style={{
                                                background: '#1e293b', padding: '2px 8px', borderRadius: '6px', fontSize: '11px',
                                            }}>
                                                {typeof log.details === 'object' ? JSON.stringify(log.details).substring(0, 60) : String(log.details)}
                                            </span>
                                        ) : '—'}
                                    </td>
                                </tr>
                            );
                        })}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
                                    لا توجد عمليات مسجلة
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
                    {Array.from({ length: Math.min(meta.totalPages, 10) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            style={{
                                padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                                background: p === page ? '#4f46e5' : '#1e293b',
                                color: p === page ? '#fff' : '#94a3b8', fontSize: '13px',
                            }}>{p}</button>
                    ))}
                </div>
            )}
        </div>
    );
}
