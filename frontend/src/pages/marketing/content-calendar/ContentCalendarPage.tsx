import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronRight, ChevronLeft, Trash2 } from 'lucide-react';
import { marketingApi } from '@/api/marketing';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, { label: string; color: string }> = {
    IDEA: { label: 'فكرة', color: '#94a3b8' }, DRAFT: { label: 'مسودة', color: '#f59e0b' },
    IN_REVIEW: { label: 'مراجعة', color: '#8b5cf6' }, APPROVED: { label: 'معتمد', color: '#3b82f6' },
    SCHEDULED: { label: 'مجدول', color: '#06b6d4' }, PUBLISHED: { label: 'منشور', color: '#10b981' },
    CANCELLED: { label: 'ملغي', color: '#ef4444' },
};

const PLATFORMS = ['Instagram', 'Twitter/X', 'TikTok', 'LinkedIn', 'Snapchat', 'YouTube', 'Facebook', 'Blog'];
const CONTENT_TYPES = ['صورة', 'فيديو', 'ستوري', 'ريلز', 'مقال', 'إنفوجرافيك', 'بودكاست'];
const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function ContentCalendarPage() {
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    const [showNew, setShowNew] = useState(false);
    const [form, setForm] = useState({ title: '', platform: 'Instagram', type: 'صورة', status: 'IDEA', content: '', scheduledAt: '' });
    const queryClient = useQueryClient();

    const { data: items } = useQuery({
        queryKey: ['content-calendar', month, year],
        queryFn: () => marketingApi.getContentCalendar(month, year),
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => marketingApi.createContentItem(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-calendar'] }); setShowNew(false); toast.success('تمت الإضافة'); },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => marketingApi.deleteContentItem(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['content-calendar'] }); toast.success('تم الحذف'); },
    });

    // Calendar grid
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDow = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        week.push(d);
        if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

    const getItemsForDay = (day: number) => items?.filter((i: any) => new Date(i.scheduledAt).getDate() === day) || [];

    const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

    const openNew = (day?: number) => {
        const dt = day ? new Date(year, month - 1, day, 10, 0) : new Date();
        setForm({ ...form, scheduledAt: dt.toISOString().slice(0, 16) });
        setShowNew(true);
    };

    return (
        <div style={{ padding: 28 }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>تقويم المحتوى</h1>
                <button onClick={() => openNew()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', fontSize: 13, fontWeight: 600 }}>
                    <Plus style={{ width: 16, height: 16 }} /> محتوى جديد
                </button>
            </div>

            {/* Month Nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 20 }}>
                <button onClick={prevMonth} style={{ padding: 8, border: 'none', background: '#f1f5f9', borderRadius: 10, cursor: 'pointer' }}><ChevronRight style={{ width: 18, height: 18 }} /></button>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, minWidth: 160, textAlign: 'center' }}>{MONTHS_AR[month - 1]} {year}</h2>
                <button onClick={nextMonth} style={{ padding: 8, border: 'none', background: '#f1f5f9', borderRadius: 10, cursor: 'pointer' }}><ChevronLeft style={{ width: 18, height: 18 }} /></button>
            </div>

            {/* Calendar Grid */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e2e8f0' }}>
                    {DAYS_AR.map(d => (<div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f8fafc' }}>{d}</div>))}
                </div>
                {/* Weeks */}
                {weeks.map((wk, wi) => (
                    <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        {wk.map((day, di) => {
                            const dayItems = day ? getItemsForDay(day) : [];
                            const isToday = day === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();
                            return (
                                <div key={di} onClick={() => day && openNew(day)} style={{
                                    minHeight: 90, padding: 6, borderLeft: di < 6 ? '1px solid #f1f5f9' : 'none',
                                    background: isToday ? '#ecfdf5' : day ? '#fff' : '#fafafa',
                                    cursor: day ? 'pointer' : 'default',
                                }}>
                                    {day && (<span style={{ fontSize: 11, fontWeight: isToday ? 800 : 500, color: isToday ? '#10b981' : '#64748b', display: 'block', marginBottom: 4 }}>{day}</span>)}
                                    {dayItems.slice(0, 3).map((item: any) => {
                                        const st = STATUS_COLORS[item.status] || STATUS_COLORS.IDEA;
                                        return (
                                            <div key={item.id} onClick={e => e.stopPropagation()} style={{
                                                fontSize: 10, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                                                background: `${st.color}15`, color: st.color, fontWeight: 600,
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            }}>
                                                <span>{item.title}</span>
                                                <button onClick={() => deleteMutation.mutate(item.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                                                    <Trash2 style={{ width: 10, height: 10, color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {dayItems.length > 3 && <span style={{ fontSize: 9, color: '#94a3b8' }}>+{dayItems.length - 3}</span>}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* New Content Modal */}
            {showNew && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowNew(false)}>
                    <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: 440 }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>محتوى جديد</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="العنوان" style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                    {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }}>
                                    {CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14 }} />
                            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="وصف المحتوى" rows={3} style={{ padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 10, fontSize: 14, resize: 'vertical' }} />
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => createMutation.mutate({ ...form, scheduledAt: new Date(form.scheduledAt).toISOString() })} disabled={!form.title} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', color: '#fff', fontSize: 14, fontWeight: 600 }}>إضافة</button>
                                <button onClick={() => setShowNew(false)} style={{ padding: '10px 24px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 14 }}>إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
