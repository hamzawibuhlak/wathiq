import React from 'react';

// ═══════════════════════════════════════
// API
// ═══════════════════════════════════════
const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function api(url: string, options?: RequestInit) {
    const token = localStorage.getItem('sa_token') || localStorage.getItem('token');
    const res = await fetch(`${API}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════
export interface ConfigItem {
    id: string;
    key: string;
    value: string;
    category: string;
    label?: string;
    encrypted: boolean;
    updatedAt: string;
}

// ═══════════════════════════════════════
// STYLES
// ═══════════════════════════════════════
export const pageWrapStyle: React.CSSProperties = {
    padding: '24px', color: '#e2e8f0', maxWidth: '800px',
};

export const sectionStyle: React.CSSProperties = {
    background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px',
};

export const labelStyle: React.CSSProperties = {
    display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '6px',
};

export const inputStyle: React.CSSProperties = {
    background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155',
    borderRadius: '10px', padding: '10px 14px', fontSize: '13px', width: '100%',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'monospace',
};

export const keyBlockStyle: React.CSSProperties = {
    background: '#0c1222', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px',
};

export const btnStyle: React.CSSProperties = {
    color: '#fff', border: 'none', borderRadius: '10px',
    padding: '10px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
};

export const delBtnStyle: React.CSSProperties = {
    background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid #ef444433',
    borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
};

export const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, minWidth: '140px', padding: '14px 16px', borderRadius: '12px',
    border: active ? '2px solid #6366f1' : '1px solid #1e293b',
    background: active ? 'rgba(99, 102, 241, 0.1)' : '#0f172a',
    color: active ? '#a5b4fc' : '#94a3b8',
    cursor: 'pointer', textAlign: 'right' as const, transition: 'all 0.2s',
});

export const backLinkStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    color: '#818cf8', textDecoration: 'none', fontSize: '13px',
    marginBottom: '20px', cursor: 'pointer',
};
