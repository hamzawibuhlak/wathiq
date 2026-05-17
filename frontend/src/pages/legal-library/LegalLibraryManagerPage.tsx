import { useState } from 'react';
import {
    BookOpen,
    Gavel,
    Library,
    Plus,
    Search,
    Edit3,
    Trash2,
    Save,
    Tag,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { legalLibraryApi } from '@/api/legalLibrary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingState } from '@/components/common/LoadingState';
import { cn } from '@/lib/utils';

// ── Enum options (must match Prisma) ─────────────────────────────
const REGULATION_CATEGORIES = [
    { value: 'CIVIL', label: 'مدني' },
    { value: 'COMMERCIAL', label: 'تجاري' },
    { value: 'LABOR', label: 'عمالي' },
    { value: 'CRIMINAL', label: 'جنائي' },
    { value: 'ADMINISTRATIVE_REG', label: 'إداري' },
    { value: 'FAMILY', label: 'أحوال شخصية' },
    { value: 'REAL_ESTATE', label: 'عقاري' },
    { value: 'INTELLECTUAL', label: 'ملكية فكرية' },
    { value: 'CORPORATE', label: 'شركات' },
    { value: 'BANKING', label: 'مصرفي' },
    { value: 'TAX', label: 'ضريبي' },
    { value: 'CYBER', label: 'سيبراني' },
    { value: 'ARBITRATION', label: 'تحكيم' },
    { value: 'PROCEDURES', label: 'مرافعات' },
    { value: 'NOTARY', label: 'توثيق' },
    { value: 'OTHER_REG', label: 'أخرى' },
];

const REGULATION_STATUSES = [
    { value: 'ACTIVE_REG', label: 'ساري' },
    { value: 'AMENDED', label: 'معدّل' },
    { value: 'REPEALED', label: 'ملغى' },
    { value: 'DRAFT_REG', label: 'مسودّة' },
];

const COURT_TYPES = [
    { value: 'SUPREME_COURT', label: 'المحكمة العليا' },
    { value: 'APPEAL_COURT', label: 'الاستئناف' },
    { value: 'GENERAL_COURT', label: 'العامة' },
    { value: 'COMMERCIAL_COURT', label: 'التجارية' },
    { value: 'LABOR_COURT', label: 'العمالية' },
    { value: 'ADMINISTRATIVE_COURT', label: 'الإدارية (ديوان المظالم)' },
    { value: 'FAMILY_COURT', label: 'الأحوال الشخصية' },
    { value: 'CRIMINAL_COURT', label: 'الجزائية' },
];

const OUTCOMES = [
    { value: 'FOR_PLAINTIFF', label: 'لصالح المدعي' },
    { value: 'FOR_DEFENDANT', label: 'لصالح المدعى عليه' },
    { value: 'PARTIAL', label: 'جزئي' },
    { value: 'DISMISSED', label: 'مرفوض' },
    { value: 'SETTLEMENT', label: 'صلح' },
];

export default function LegalLibraryManagerPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Library className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">إدارة المكتبة القانونية</h1>
                    <p className="text-sm text-muted-foreground">
                        إضافة وتعديل وحذف الأنظمة والسوابق والمصطلحات التي يستند إليها البحث الذكي
                    </p>
                </div>
            </div>

            <Tabs defaultValue="regulations" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-[600px]">
                    <TabsTrigger value="regulations">
                        <BookOpen className="w-4 h-4 ml-1.5" />
                        الأنظمة واللوائح
                    </TabsTrigger>
                    <TabsTrigger value="precedents">
                        <Gavel className="w-4 h-4 ml-1.5" />
                        السوابق القضائية
                    </TabsTrigger>
                    <TabsTrigger value="terms">
                        <Tag className="w-4 h-4 ml-1.5" />
                        المصطلحات
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="regulations" className="mt-6">
                    <RegulationsTab />
                </TabsContent>
                <TabsContent value="precedents" className="mt-6">
                    <PrecedentsTab />
                </TabsContent>
                <TabsContent value="terms" className="mt-6">
                    <TermsTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// REGULATIONS TAB
// ═══════════════════════════════════════════════════════════════
function RegulationsTab() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-regulations', search],
        queryFn: () => legalLibraryApi.getRegulations({ search: search || undefined, page: 1 }),
    });

    const items = data?.data || [];

    const deleteMutation = useMutation({
        mutationFn: (id: string) => legalLibraryApi.deleteRegulation(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-regulations'] });
            toast.success('تم الحذف');
        },
        onError: () => toast.error('فشل الحذف'),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث في الأنظمة..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="w-4 h-4 ml-1.5" />
                    إضافة نظام
                </Button>
            </div>

            {isLoading ? (
                <LoadingState />
            ) : items.length === 0 ? (
                <EmptyState icon={BookOpen} message="لا توجد أنظمة. اضغط 'إضافة نظام' لإضافة أوّل واحد." />
            ) : (
                <div className="bg-card rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-right py-3 px-4 font-semibold">العنوان</th>
                                <th className="text-right py-3 px-4 font-semibold">الرقم</th>
                                <th className="text-right py-3 px-4 font-semibold">التصنيف</th>
                                <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                                <th className="text-center py-3 px-4 font-semibold w-32">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((r: any) => (
                                <tr key={r.id} className="border-b hover:bg-muted/30">
                                    <td className="py-2.5 px-4 font-medium">{r.title}</td>
                                    <td className="py-2.5 px-4 text-muted-foreground">{r.number || '—'}</td>
                                    <td className="py-2.5 px-4">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                            {REGULATION_CATEGORIES.find((c) => c.value === r.category)?.label || r.category}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <span
                                            className={cn(
                                                'text-xs px-2 py-0.5 rounded',
                                                r.status === 'ACTIVE_REG'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : r.status === 'REPEALED'
                                                    ? 'bg-rose-50 text-rose-700'
                                                    : 'bg-amber-50 text-amber-700',
                                            )}
                                        >
                                            {REGULATION_STATUSES.find((s) => s.value === r.status)?.label || r.status}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setEditing(r)}
                                                className="p-1.5 hover:bg-muted rounded text-blue-600"
                                                title="تعديل"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`حذف "${r.title}"؟`)) deleteMutation.mutate(r.id);
                                                }}
                                                className="p-1.5 hover:bg-muted rounded text-rose-600"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(creating || editing) && (
                <RegulationDialog
                    initial={editing}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

function RegulationDialog({ initial, onClose }: { initial?: any; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!initial;
    const [form, setForm] = useState({
        title: initial?.title || '',
        titleEn: initial?.titleEn || '',
        number: initial?.number || '',
        issuedBy: initial?.issuedBy || '',
        issuedDate: initial?.issuedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        effectiveDate: initial?.effectiveDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        category: initial?.category || 'CIVIL',
        status: initial?.status || 'ACTIVE_REG',
        description: initial?.description || '',
        content: initial?.content || '',
        source: initial?.source || '',
        version: initial?.version || '',
        tags: (initial?.tags || []).join(', '),
    });

    const mutation = useMutation({
        mutationFn: (data: any) =>
            isEdit
                ? legalLibraryApi.updateRegulation(initial.id, data)
                : legalLibraryApi.createRegulation(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-regulations'] });
            toast.success(isEdit ? 'تم التحديث' : 'تمت الإضافة');
            onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشلت العملية'),
    });

    const submit = () => {
        if (!form.title || !form.description) {
            toast.error('العنوان والوصف مطلوبان');
            return;
        }
        mutation.mutate({
            ...form,
            issuedDate: new Date(form.issuedDate).toISOString(),
            effectiveDate: new Date(form.effectiveDate).toISOString(),
            tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل نظام' : 'إضافة نظام جديد'}</DialogTitle>
                    <DialogDescription>
                        أضف بيانات النظام كاملة — سيتمكن البحث الذكي من الاستناد إليها
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>العنوان بالعربية *</Label>
                            <Input
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                placeholder="نظام العمل"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>العنوان بالإنجليزية</Label>
                            <Input
                                value={form.titleEn}
                                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                                placeholder="Labor Law"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>رقم النظام</Label>
                            <Input
                                value={form.number}
                                onChange={(e) => setForm({ ...form, number: e.target.value })}
                                placeholder="م/51"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>الجهة المُصدِرة</Label>
                            <Input
                                value={form.issuedBy}
                                onChange={(e) => setForm({ ...form, issuedBy: e.target.value })}
                                placeholder="مجلس الوزراء"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>تاريخ الإصدار *</Label>
                            <Input
                                type="date"
                                value={form.issuedDate}
                                onChange={(e) => setForm({ ...form, issuedDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>تاريخ السريان *</Label>
                            <Input
                                type="date"
                                value={form.effectiveDate}
                                onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>التصنيف *</Label>
                            <Select
                                value={form.category}
                                onValueChange={(v) => setForm({ ...form, category: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REGULATION_CATEGORIES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>الحالة *</Label>
                            <Select
                                value={form.status}
                                onValueChange={(v) => setForm({ ...form, status: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {REGULATION_STATUSES.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>
                                            {s.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>الوصف *</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            placeholder="وصف موجز للنظام"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>المحتوى الكامل</Label>
                        <Textarea
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            rows={6}
                            placeholder="نص النظام كاملاً (يدعم HTML)"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                            <Label>المصدر</Label>
                            <Input
                                value={form.source}
                                onChange={(e) => setForm({ ...form, source: e.target.value })}
                                placeholder="هيئة الخبراء"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>الإصدار</Label>
                            <Input
                                value={form.version}
                                onChange={(e) => setForm({ ...form, version: e.target.value })}
                                placeholder="2024"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>الوسوم</Label>
                            <Input
                                value={form.tags}
                                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                                placeholder="عمل، أجور، إجازات"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button onClick={submit} disabled={mutation.isPending}>
                        <Save className="w-4 h-4 ml-1.5" />
                        {mutation.isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════
// PRECEDENTS TAB
// ═══════════════════════════════════════════════════════════════
function PrecedentsTab() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-precedents', search],
        queryFn: () => legalLibraryApi.getPrecedents({ search: search || undefined, page: 1 }),
    });

    const items = data?.data || [];

    const deleteMutation = useMutation({
        mutationFn: (id: string) => legalLibraryApi.deletePrecedent(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-precedents'] });
            toast.success('تم الحذف');
        },
        onError: () => toast.error('فشل الحذف'),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث في السوابق..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="w-4 h-4 ml-1.5" />
                    إضافة سابقة قضائية
                </Button>
            </div>

            {isLoading ? (
                <LoadingState />
            ) : items.length === 0 ? (
                <EmptyState icon={Gavel} message="لا توجد سوابق قضائية." />
            ) : (
                <div className="bg-card rounded-xl border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b">
                            <tr>
                                <th className="text-right py-3 px-4 font-semibold">رقم القضية</th>
                                <th className="text-right py-3 px-4 font-semibold">المحكمة</th>
                                <th className="text-right py-3 px-4 font-semibold">النوع</th>
                                <th className="text-right py-3 px-4 font-semibold">النتيجة</th>
                                <th className="text-center py-3 px-4 font-semibold w-32">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((p: any) => (
                                <tr key={p.id} className="border-b hover:bg-muted/30">
                                    <td className="py-2.5 px-4 font-mono text-xs">{p.caseNumber || '—'}</td>
                                    <td className="py-2.5 px-4">{p.court}</td>
                                    <td className="py-2.5 px-4">
                                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                                            {COURT_TYPES.find((c) => c.value === p.courtType)?.label || p.courtType}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-4">
                                        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded">
                                            {OUTCOMES.find((o) => o.value === p.outcome)?.label || p.outcome}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                onClick={() => setEditing(p)}
                                                className="p-1.5 hover:bg-muted rounded text-blue-600"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`حذف السابقة؟`)) deleteMutation.mutate(p.id);
                                                }}
                                                className="p-1.5 hover:bg-muted rounded text-rose-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {(creating || editing) && (
                <PrecedentDialog
                    initial={editing}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

function PrecedentDialog({ initial, onClose }: { initial?: any; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!initial;
    const [form, setForm] = useState({
        caseNumber: initial?.caseNumber || '',
        court: initial?.court || '',
        courtType: initial?.courtType || 'GENERAL_COURT',
        circuit: initial?.circuit || '',
        judgmentDate: initial?.judgmentDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        summary: initial?.summary || '',
        fullText: initial?.fullText || '',
        legalPrinciple: initial?.legalPrinciple || '',
        caseType: initial?.caseType || '',
        outcome: initial?.outcome || 'FOR_PLAINTIFF',
        keywords: (initial?.keywords || []).join(', '),
    });

    const mutation = useMutation({
        mutationFn: (data: any) =>
            isEdit
                ? legalLibraryApi.updatePrecedent(initial.id, data)
                : legalLibraryApi.createPrecedent(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-precedents'] });
            toast.success(isEdit ? 'تم التحديث' : 'تمت الإضافة');
            onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشلت العملية'),
    });

    const submit = () => {
        if (!form.court || !form.summary || !form.legalPrinciple || !form.caseType) {
            toast.error('المحكمة والملخص والمبدأ القانوني والنوع مطلوبة');
            return;
        }
        mutation.mutate({
            ...form,
            judgmentDate: new Date(form.judgmentDate).toISOString(),
            keywords: form.keywords ? form.keywords.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل سابقة قضائية' : 'إضافة سابقة قضائية'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>رقم القضية</Label>
                            <Input
                                value={form.caseNumber}
                                onChange={(e) => setForm({ ...form, caseNumber: e.target.value })}
                                placeholder="1445/123"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>المحكمة *</Label>
                            <Input
                                value={form.court}
                                onChange={(e) => setForm({ ...form, court: e.target.value })}
                                placeholder="محكمة الاستئناف بالرياض"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>نوع المحكمة *</Label>
                            <Select
                                value={form.courtType}
                                onValueChange={(v) => setForm({ ...form, courtType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COURT_TYPES.map((c) => (
                                        <SelectItem key={c.value} value={c.value}>
                                            {c.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>الدائرة</Label>
                            <Input
                                value={form.circuit}
                                onChange={(e) => setForm({ ...form, circuit: e.target.value })}
                                placeholder="الدائرة التجارية الأولى"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>تاريخ الحكم *</Label>
                            <Input
                                type="date"
                                value={form.judgmentDate}
                                onChange={(e) => setForm({ ...form, judgmentDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>نوع القضية *</Label>
                            <Input
                                value={form.caseType}
                                onChange={(e) => setForm({ ...form, caseType: e.target.value })}
                                placeholder="نزاع تجاري"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>الملخص *</Label>
                        <Textarea
                            value={form.summary}
                            onChange={(e) => setForm({ ...form, summary: e.target.value })}
                            rows={3}
                            placeholder="ملخص وقائع القضية والحكم"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>المبدأ القانوني *</Label>
                        <Textarea
                            value={form.legalPrinciple}
                            onChange={(e) => setForm({ ...form, legalPrinciple: e.target.value })}
                            rows={2}
                            placeholder="المبدأ القانوني الذي قررته المحكمة"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>النص الكامل</Label>
                        <Textarea
                            value={form.fullText}
                            onChange={(e) => setForm({ ...form, fullText: e.target.value })}
                            rows={5}
                            placeholder="النص الكامل للحكم (اختياري)"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>النتيجة *</Label>
                            <Select
                                value={form.outcome}
                                onValueChange={(v) => setForm({ ...form, outcome: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {OUTCOMES.map((o) => (
                                        <SelectItem key={o.value} value={o.value}>
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>الكلمات المفتاحية</Label>
                            <Input
                                value={form.keywords}
                                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                                placeholder="عقد، إخلال، تعويض"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button onClick={submit} disabled={mutation.isPending}>
                        <Save className="w-4 h-4 ml-1.5" />
                        {mutation.isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════
// TERMS TAB
// ═══════════════════════════════════════════════════════════════
function TermsTab() {
    const qc = useQueryClient();
    const [search, setSearch] = useState('');
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-terms', search],
        queryFn: () => legalLibraryApi.getTerms({ search: search || undefined }),
    });

    // Terms endpoint returns a bare array, regulations/precedents return { data, meta }
    const items = Array.isArray(data) ? data : (data?.data || []);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => legalLibraryApi.deleteTerm(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-terms'] });
            toast.success('تم الحذف');
        },
        onError: () => toast.error('فشل الحذف'),
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="ابحث في المصطلحات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pr-10"
                    />
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="w-4 h-4 ml-1.5" />
                    إضافة مصطلح
                </Button>
            </div>

            {isLoading ? (
                <LoadingState />
            ) : items.length === 0 ? (
                <EmptyState icon={Tag} message="لا توجد مصطلحات." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((t: any) => (
                        <div
                            key={t.id}
                            className="bg-card rounded-xl border p-4 hover:shadow-sm transition"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg">{t.termAr}</h3>
                                    {t.termEn && (
                                        <p className="text-xs text-muted-foreground" dir="ltr">
                                            {t.termEn}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setEditing(t)}
                                        className="p-1.5 hover:bg-muted rounded text-blue-600"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(`حذف "${t.termAr}"؟`)) deleteMutation.mutate(t.id);
                                        }}
                                        className="p-1.5 hover:bg-muted rounded text-rose-600"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                {t.definition}
                            </p>
                            {t.category && (
                                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded mt-2 inline-block">
                                    {t.category}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(creating || editing) && (
                <TermDialog
                    initial={editing}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}
        </div>
    );
}

function TermDialog({ initial, onClose }: { initial?: any; onClose: () => void }) {
    const qc = useQueryClient();
    const isEdit = !!initial;
    const [form, setForm] = useState({
        termAr: initial?.termAr || '',
        termEn: initial?.termEn || '',
        definition: initial?.definition || '',
        example: initial?.example || '',
        category: initial?.category || '',
        source: initial?.source || '',
        relatedTerms: (initial?.relatedTerms || []).join(', '),
    });

    const mutation = useMutation({
        mutationFn: (data: any) =>
            isEdit ? legalLibraryApi.updateTerm(initial.id, data) : legalLibraryApi.createTerm(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin-terms'] });
            toast.success(isEdit ? 'تم التحديث' : 'تمت الإضافة');
            onClose();
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشلت العملية'),
    });

    const submit = () => {
        if (!form.termAr || !form.definition) {
            toast.error('المصطلح والتعريف مطلوبان');
            return;
        }
        mutation.mutate({
            ...form,
            relatedTerms: form.relatedTerms
                ? form.relatedTerms.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [],
        });
    };

    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل مصطلح' : 'إضافة مصطلح'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>المصطلح بالعربية *</Label>
                            <Input
                                value={form.termAr}
                                onChange={(e) => setForm({ ...form, termAr: e.target.value })}
                                placeholder="إجارة"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>المصطلح بالإنجليزية</Label>
                            <Input
                                value={form.termEn}
                                onChange={(e) => setForm({ ...form, termEn: e.target.value })}
                                placeholder="Lease"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>التعريف *</Label>
                        <Textarea
                            value={form.definition}
                            onChange={(e) => setForm({ ...form, definition: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>مثال</Label>
                        <Textarea
                            value={form.example}
                            onChange={(e) => setForm({ ...form, example: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>التصنيف</Label>
                            <Input
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                placeholder="عقود"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>المصدر</Label>
                            <Input
                                value={form.source}
                                onChange={(e) => setForm({ ...form, source: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>مصطلحات ذات صلة</Label>
                        <Input
                            value={form.relatedTerms}
                            onChange={(e) => setForm({ ...form, relatedTerms: e.target.value })}
                            placeholder="بيع، إيجار، عقد"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button onClick={submit} disabled={mutation.isPending}>
                        <Save className="w-4 h-4 ml-1.5" />
                        {mutation.isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ═══════════════════════════════════════════════════════════════
// Empty state helper
// ═══════════════════════════════════════════════════════════════
function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
    return (
        <div className="bg-card rounded-xl border p-12 text-center">
            <Icon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}
