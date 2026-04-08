import { useState, useRef, useEffect } from 'react';
import { useActivityLogs, useActivityStats } from '@/hooks/useActivityLogs';
import { activityLogsApi, ActivityLogsParams } from '@/api/activity-logs';
import { clientsApi } from '@/api/clients.api';
import { casesApi } from '@/api/cases.api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Activity, Eye, Plus, Edit, Trash2, Users, Clock, TrendingUp,
  ChevronLeft, ChevronRight, Filter, Download, RefreshCw, Search,
  Globe, Smartphone, Monitor, ChevronDown,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CREATE: { label: 'إنشاء', color: '#16a34a', bg: '#dcfce7', icon: <Plus className="w-3.5 h-3.5" /> },
  UPDATE: { label: 'تعديل', color: '#2563eb', bg: '#dbeafe', icon: <Edit className="w-3.5 h-3.5" /> },
  DELETE: { label: 'حذف',  color: '#dc2626', bg: '#fee2e2', icon: <Trash2 className="w-3.5 h-3.5" /> },
  VIEW:   { label: 'عرض',  color: '#64748b', bg: '#f1f5f9', icon: <Eye className="w-3.5 h-3.5" /> },
};
const ENTITY_LABELS: Record<string, string> = {
  Case: 'القضايا', Hearing: 'الجلسات', Client: 'العملاء',
  Invoice: 'الفواتير', Document: 'المستندات', User: 'المستخدمين',
  Legaldocument: 'الوثائق القانونية', Setting: 'الإعدادات',
};
const ENTITY_EMOJI: Record<string, string> = {
  Case: '⚖️', Hearing: '🏛️', Client: '👤', Invoice: '📄',
  Document: '📋', User: '👥', Legaldocument: '📝', Setting: '⚙️',
};

// ─── MultiSelect ──────────────────────────────────────────────────────────────
interface MSOption { id: string; label: string; sub?: string; }
function MultiSelect({ options, selected, onChange, placeholder, loading }: {
  options: MSOption[]; selected: string[]; onChange: (v: string[]) => void;
  placeholder: string; loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sub || '').toLowerCase().includes(search.toLowerCase())
  );
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 hover:border-slate-300 transition-colors">
        <span className="truncate text-slate-600">
          {selected.length === 0 ? placeholder :
           selected.length === 1 ? (options.find(o => o.id === selected[0])?.label || selected[0]) :
           `${selected.length} محدد`}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selected.length}</span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-xl w-64 overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
                className="w-full pr-8 pl-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none" dir="rtl" />
            </div>
          </div>
          {selected.length > 0 && (
            <button onClick={() => { onChange([]); setOpen(false); }}
              className="w-full px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 text-right border-b border-slate-100">
              مسح الكل
            </button>
          )}
          <div className="max-h-52 overflow-y-auto">
            {loading ? <div className="p-3 text-center text-xs text-slate-400">جاري التحميل...</div>
              : filtered.length === 0 ? <div className="p-3 text-center text-xs text-slate-400">لا توجد نتائج</div>
              : filtered.map(o => (
              <label key={o.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                <input type="checkbox" checked={selected.includes(o.id)} onChange={() => toggle(o.id)}
                  className="w-3.5 h-3.5 rounded accent-blue-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{o.label}</p>
                  {o.sub && <p className="text-[10px] text-slate-400 truncate">{o.sub}</p>}
                </div>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 25;

  const [draft, setDraft] = useState({
    userIds: [] as string[], clientIds: [] as string[],
    caseIds: [] as string[], entities: [] as string[],
    actions: [] as string[], startDate: '', endDate: '',
  });
  const [applied, setApplied] = useState<ActivityLogsParams>({});

  const hasActive = Object.values(applied).some(v => Array.isArray(v) ? v.length > 0 : !!v);

  const { data, isLoading, refetch } = useActivityLogs({ ...applied, page, limit });
  const { data: statsData } = useActivityStats();
  const { data: clientsData } = useQuery({
    queryKey: ['clients-filter'], queryFn: () => clientsApi.getAll({ limit: 200 }),
  });
  const { data: casesData } = useQuery({
    queryKey: ['cases-filter'], queryFn: () => casesApi.getAll({ limit: 200 }),
  });

  const logs = (data?.data as any)?.data || [];
  const meta = (data?.data as any)?.meta;
  const stats = statsData?.data?.data as any;
  const clients = ((clientsData as any)?.data || []) as { id: string; name: string }[];
  const cases   = ((casesData  as any)?.data || []) as { id: string; title: string; caseNumber: string }[];
  const topUsers = (stats?.topUsers || []) as { userId: string; userName: string; count: number }[];

  const applyFilters = () => {
    const p: ActivityLogsParams = {};
    if (draft.userIds.length)  p.userIds = draft.userIds;
    const entityIds = [...draft.clientIds, ...draft.caseIds];
    if (entityIds.length)      p.entityIds = entityIds;
    if (draft.entities.length) p.entity = draft.entities[0];
    if (draft.actions.length)  p.actions = draft.actions;
    if (draft.startDate)       p.startDate = draft.startDate;
    if (draft.endDate)         p.endDate = draft.endDate;
    setApplied(p); setPage(1);
  };
  const resetFilters = () => {
    setDraft({ userIds: [], clientIds: [], caseIds: [], entities: [], actions: [], startDate: '', endDate: '' });
    setApplied({}); setPage(1);
  };
  const handleExport = () => {
    const a = document.createElement('a');
    a.href = activityLogsApi.getExportUrl(applied);
    a.click();
  };

  const uaIcon = (ua?: string) => {
    if (!ua) return <Globe className="w-3 h-3 text-slate-400" />;
    if (/mobile|android|iphone/i.test(ua)) return <Smartphone className="w-3 h-3" />;
    return <Monitor className="w-3 h-3 text-slate-400" />;
  };
  const uaLabel = (ua?: string) => {
    if (!ua) return '';
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
    if (/safari/i.test(ua)) return 'Safari';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/edge/i.test(ua)) return 'Edge';
    return 'Browser';
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">سجل النشاطات</h1>
            <p className="text-xs text-slate-500">
              جميع العمليات في النظام
              {hasActive && <span className="text-blue-600 mr-1.5 font-medium">• فلتر مخصص مفعّل</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} title="تحديث"
            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors">
            <Download className="w-3.5 h-3.5" />
            {hasActive ? 'تصدير المخصص' : 'تصدير الكامل'}
          </button>
          <button onClick={() => setShowFilters(f => !f)}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors',
              showFilters || hasActive
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')}>
            <Filter className="w-3.5 h-3.5" />
            فلتر متقدم
            {hasActive && (
              <span className="bg-white/25 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {[applied.userIds, applied.entityIds, applied.entity ? [1] : [], applied.actions, applied.startDate ? [1] : [], applied.endDate ? [1] : []].filter(v => Array.isArray(v) ? v.length : v).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="border-blue-100 bg-blue-50/40">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">المستخدمون</label>
                <MultiSelect
                  options={topUsers.map(u => ({ id: u.userId, label: u.userName, sub: `${u.count} عملية` }))}
                  selected={draft.userIds} onChange={v => setDraft(d => ({ ...d, userIds: v }))}
                  placeholder="كل المستخدمين" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">العملاء</label>
                <MultiSelect
                  options={clients.map(c => ({ id: c.id, label: c.name }))}
                  selected={draft.clientIds} onChange={v => setDraft(d => ({ ...d, clientIds: v }))}
                  placeholder="كل العملاء" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">القضايا</label>
                <MultiSelect
                  options={cases.map(c => ({ id: c.id, label: c.title || c.caseNumber, sub: c.caseNumber }))}
                  selected={draft.caseIds} onChange={v => setDraft(d => ({ ...d, caseIds: v }))}
                  placeholder="كل القضايا" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">نوع السجل</label>
                <MultiSelect
                  options={Object.entries(ENTITY_LABELS).map(([k, v]) => ({ id: k, label: `${ENTITY_EMOJI[k] || ''} ${v}` }))}
                  selected={draft.entities} onChange={v => setDraft(d => ({ ...d, entities: v }))}
                  placeholder="كل الأنواع" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">نوع العملية</label>
                <MultiSelect
                  options={Object.entries(ACTION_CONFIG).map(([k, v]) => ({ id: k, label: v.label }))}
                  selected={draft.actions} onChange={v => setDraft(d => ({ ...d, actions: v }))}
                  placeholder="كل العمليات" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">من تاريخ</label>
                <input type="date" value={draft.startDate}
                  onChange={e => setDraft(d => ({ ...d, startDate: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">إلى تاريخ</label>
                <input type="date" value={draft.endDate}
                  onChange={e => setDraft(d => ({ ...d, endDate: e.target.value }))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-1 focus:ring-blue-300" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-blue-100">
              <button onClick={applyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                تطبيق الفلاتر
              </button>
              <button onClick={resetFilters}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-lg transition-colors">
                إعادة ضبط
              </button>
              {hasActive && <span className="text-xs text-blue-600 font-medium mr-auto">✓ الفلتر مفعّل</span>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'إجمالي النشاطات', value: stats.total.toLocaleString(), Icon: Activity, c: 'text-slate-700', bg: 'bg-slate-100' },
            { label: 'آخر 24 ساعة', value: stats.last24h.toLocaleString(), Icon: Clock, c: 'text-blue-700', bg: 'bg-blue-100' },
            { label: 'آخر 7 أيام', value: stats.last7d.toLocaleString(), Icon: TrendingUp, c: 'text-emerald-700', bg: 'bg-emerald-100' },
            { label: 'الأكثر نشاطاً', value: stats.topUsers[0]?.userName || '-', sub: stats.topUsers[0] ? `${stats.topUsers[0].count} عملية` : '', Icon: Users, c: 'text-violet-700', bg: 'bg-violet-100' },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', s.bg)}>
                  <s.Icon className={cn('w-5 h-5', s.c)} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">{s.label}</p>
                  <p className={cn('text-lg font-bold', s.c)}>{s.value}</p>
                  {s.sub && <p className="text-[10px] text-slate-400">{s.sub}</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card className="shadow-sm border-slate-100">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-14 h-14 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">لا توجد نشاطات</p>
              {hasActive && <button onClick={resetFilters} className="mt-2 text-xs text-blue-500 hover:underline">مسح الفلاتر</button>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="text-right text-xs font-semibold text-slate-500 w-24">العملية</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500">التفاصيل</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 w-44">المستخدم</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 w-36">الجهاز / IP</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 w-36">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => {
                  const ac = ACTION_CONFIG[log.action] || ACTION_CONFIG.VIEW;
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ color: ac.color, backgroundColor: ac.bg }}>
                          {ac.icon}{ac.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-800">{log.description}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {ENTITY_EMOJI[log.entity] || '📌'} {ENTITY_LABELS[log.entity] || log.entity}
                            </span>
                            {log.entityId && (
                              <span className="text-[11px] text-slate-400 font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                                #{log.entityId.slice(0, 8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm flex-shrink-0">
                            <AvatarFallback className="text-xs bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold">
                              {log.user?.name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{log.user?.name || 'غير معروف'}</p>
                            <p className="text-[10px] text-slate-400 truncate">{log.user?.email || ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {log.ipAddress && (
                            <p className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                              <Globe className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {log.ipAddress}
                            </p>
                          )}
                          {log.userAgent && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1">
                              {uaIcon(log.userAgent)}{uaLabel(log.userAgent)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs text-slate-600 font-medium">{format(new Date(log.createdAt), 'dd MMM yyyy', { locale: ar })}</p>
                          <p className="text-[11px] text-slate-400">{format(new Date(log.createdAt), 'HH:mm:ss')}</p>
                          <p className="text-[10px] text-slate-300 mt-0.5">{formatDistanceToNow(new Date(log.createdAt), { locale: ar, addSuffix: true })}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              عرض <span className="font-semibold">{(page - 1) * limit + 1}–{Math.min(page * limit, meta.total)}</span> من{' '}
              <span className="font-semibold">{meta.total.toLocaleString()}</span> سجل
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1} className="h-8 w-8 p-0 text-xs">«</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8">
                <ChevronRight className="w-4 h-4" />السابق
              </Button>
              <span className="px-3 py-1 text-xs text-slate-600 bg-slate-100 rounded-lg font-medium">{page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="h-8">
                التالي<ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(meta.totalPages)} disabled={page === meta.totalPages} className="h-8 w-8 p-0 text-xs">»</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default ActivityLogsPage;
