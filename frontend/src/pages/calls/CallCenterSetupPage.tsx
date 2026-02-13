import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Phone, PhoneCall, Plus, Trash2, Edit3, Power,
    Server, Wifi, WifiOff, UserPlus, ArrowRight, Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { callCenterApi, type SipExtension, type AssignExtensionDto } from '@/api/callCenter';
import { ownerApi } from '@/api/owner.api';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';

interface ExtensionForm {
    userId: string;
    extension: string;
    displayName: string;
    password: string;
    ucmHost: string;
    ucmPort: number;
}

const defaultForm: ExtensionForm = {
    userId: '',
    extension: '',
    displayName: '',
    password: '',
    ucmHost: '',
    ucmPort: 8089,
};

export default function CallCenterSetupPage() {
    const { slug } = useParams<{ slug: string }>();
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ExtensionForm>(defaultForm);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Fetch all SIP extensions
    const { data: extensionsResult, isLoading } = useQuery({
        queryKey: ['sip-extensions'],
        queryFn: callCenterApi.listExtensions,
    });
    const extensions: SipExtension[] = (extensionsResult as any)?.data || extensionsResult || [];

    // Fetch team members for assignment
    const { data: users = [] } = useQuery({
        queryKey: ['owner-users'],
        queryFn: ownerApi.getUsers,
    });

    // Assign extension mutation
    const assignMutation = useMutation({
        mutationFn: (data: AssignExtensionDto) => callCenterApi.assignExtension(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sip-extensions'] });
            toast.success('تم تعيين Extension بنجاح');
            closeDialog();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'فشل في تعيين Extension');
        },
    });

    // Update extension mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<AssignExtensionDto> }) =>
            callCenterApi.updateExtension(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sip-extensions'] });
            toast.success('تم تحديث Extension');
            closeDialog();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'فشل في التحديث');
        },
    });

    // Delete extension mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => callCenterApi.deleteExtension(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sip-extensions'] });
            toast.success('تم حذف Extension');
            setDeleteId(null);
        },
        onError: () => toast.error('فشل في الحذف'),
    });

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setForm(defaultForm);
    };

    const openAddDialog = () => {
        setEditingId(null);
        // Pre-fill ucmHost from first existing extension if available
        const existingHost = extensions.length > 0 ? extensions[0].ucmHost : '';
        const existingPort = extensions.length > 0 ? extensions[0].ucmPort : 8089;
        setForm({ ...defaultForm, ucmHost: existingHost, ucmPort: existingPort });
        setIsDialogOpen(true);
    };

    const openEditDialog = (ext: SipExtension) => {
        setEditingId(ext.id);
        setForm({
            userId: ext.userId,
            extension: ext.extension,
            displayName: ext.displayName,
            password: '', // can't show encrypted password
            ucmHost: ext.ucmHost,
            ucmPort: ext.ucmPort,
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = () => {
        if (!form.extension || !form.ucmHost) {
            toast.error('رقم Extension و IP السنترال مطلوبة');
            return;
        }

        if (editingId) {
            const data: any = {
                extension: form.extension,
                displayName: form.displayName,
                ucmHost: form.ucmHost,
                ucmPort: form.ucmPort,
            };
            if (form.password) data.password = form.password;
            updateMutation.mutate({ id: editingId, data });
        } else {
            if (!form.userId || !form.password) {
                toast.error('اختر الموظف وأدخل كلمة مرور SIP');
                return;
            }
            assignMutation.mutate({
                userId: form.userId,
                extension: form.extension,
                displayName: form.displayName,
                password: form.password,
                ucmHost: form.ucmHost,
                ucmPort: form.ucmPort,
            });
        }
    };

    // Users who don't already have an extension
    const availableUsers = (users as any[]).filter(
        (u: any) => !extensions.some((ext) => ext.userId === u.id)
    );

    const hasExtensions = extensions.length > 0;
    const ucmHost = hasExtensions ? extensions[0].ucmHost : null;

    return (
        <div className="container mx-auto p-6 space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-primary" />
                        إعداد مركز الاتصالات
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        ربط السنترال (UCM/PBX) وتعيين الخطوط للموظفين
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link to={`/${slug}/calls`}>
                        <Button variant="outline" className="gap-2">
                            <PhoneCall className="h-4 w-4" />
                            سجل المكالمات
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Connection Status Card */}
            <Card className={hasExtensions
                ? 'border-green-200 bg-gradient-to-l from-green-50 to-white'
                : 'border-amber-200 bg-gradient-to-l from-amber-50 to-white'
            }>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasExtensions
                                ? 'bg-green-100 text-green-600'
                                : 'bg-amber-100 text-amber-600'
                                }`}>
                                {hasExtensions ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
                            </div>
                            <div>
                                <CardTitle className="text-base">
                                    {hasExtensions ? 'السنترال مربوط' : 'لم يتم ربط السنترال بعد'}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {hasExtensions
                                        ? `${ucmHost} — ${extensions.length} Extension معين`
                                        : 'اضغط "تعيين Extension" لبدء الإعداد'
                                    }
                                </CardDescription>
                            </div>
                        </div>
                        <Badge variant={hasExtensions ? 'default' : 'secondary'} className={
                            hasExtensions
                                ? 'bg-green-600 hover:bg-green-700'
                                : ''
                        }>
                            {hasExtensions ? 'متصل' : 'غير متصل'}
                        </Badge>
                    </div>
                </CardHeader>
                {hasExtensions && (
                    <CardContent className="pt-0">
                        <div className="flex gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4" />
                                <span>العنوان: <span dir="ltr" className="font-mono text-foreground">{ucmHost}:{extensions[0]?.ucmPort}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>Extensions: <span className="font-semibold text-foreground">{extensions.length}</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Power className="h-4 w-4 text-green-500" />
                                <span>نشط: <span className="font-semibold text-foreground">{extensions.filter(e => e.isActive).length}</span></span>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Extensions Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">خطوط الموظفين (SIP Extensions)</CardTitle>
                            <CardDescription className="text-xs">تعيين رقم Extension لكل موظف للاتصال عبر السنترال</CardDescription>
                        </div>
                        <Button onClick={openAddDialog} className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            تعيين Extension
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : extensions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Phone className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">لا توجد Extensions معينة</p>
                            <p className="text-sm mt-1">اضغط "تعيين Extension" لربط موظف بالسنترال</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {extensions.map((ext: any) => (
                                <div key={ext.id} className="flex items-center justify-between py-3 group">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-semibold text-primary">
                                                {ext.user?.name?.charAt(0) || ext.displayName?.charAt(0) || '?'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{ext.user?.name || ext.displayName}</p>
                                            <p className="text-xs text-muted-foreground">{ext.user?.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {/* Extension Number */}
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground">Extension</p>
                                            <p className="font-mono font-bold text-lg" dir="ltr">{ext.extension}</p>
                                        </div>

                                        {/* UCM Host */}
                                        <div className="text-center hidden md:block">
                                            <p className="text-xs text-muted-foreground">السنترال</p>
                                            <p className="font-mono text-sm" dir="ltr">{ext.ucmHost}:{ext.ucmPort}</p>
                                        </div>

                                        {/* Status */}
                                        <Badge variant={ext.isActive ? 'default' : 'secondary'} className={
                                            ext.isActive ? 'bg-green-600 hover:bg-green-700' : ''
                                        }>
                                            {ext.isActive ? 'نشط' : 'معطل'}
                                        </Badge>

                                        {/* Actions */}
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => openEditDialog(ext)}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => setDeleteId(ext.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Guide */}
            <Card className="border-blue-100 bg-blue-50/30">
                <CardContent className="py-4">
                    <h3 className="font-semibold text-sm mb-2 text-blue-900">📘 كيفية الربط</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>أدخل <strong>عنوان IP</strong> للسنترال (UCM/PBX) ورقم <strong>Port</strong> (عادة 8089)</li>
                        <li>عيّن <strong>Extension</strong> لكل موظف (رقم مثل 1001, 1002)</li>
                        <li>أدخل <strong>كلمة مرور SIP</strong> كما هي مسجلة في السنترال</li>
                        <li>بعد التعيين، يمكن للموظف إجراء واستقبال المكالمات من صفحة <strong>مركز الاتصالات</strong></li>
                    </ol>
                </CardContent>
            </Card>

            {/* ═══ Add/Edit Extension Dialog ═══ */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingId ? 'تعديل Extension' : 'تعيين Extension جديد'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingId
                                ? 'تعديل بيانات الخط'
                                : 'ربط موظف بخط اتصال عبر السنترال'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* User Select (only for new) */}
                        {!editingId && (
                            <div className="space-y-2">
                                <Label>الموظف</Label>
                                <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر الموظف..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.name} — {u.email}
                                            </SelectItem>
                                        ))}
                                        {availableUsers.length === 0 && (
                                            <div className="text-center py-2 text-sm text-muted-foreground">
                                                جميع الموظفين لديهم Extensions
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Extension Number */}
                        <div className="space-y-2">
                            <Label>رقم Extension</Label>
                            <Input
                                placeholder="مثال: 1001"
                                value={form.extension}
                                onChange={(e) => setForm({ ...form, extension: e.target.value })}
                                dir="ltr"
                                className="font-mono"
                            />
                        </div>

                        {/* Display Name */}
                        <div className="space-y-2">
                            <Label>اسم العرض</Label>
                            <Input
                                placeholder="اسم يظهر للمتصل"
                                value={form.displayName}
                                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                            />
                        </div>

                        {/* SIP Password */}
                        <div className="space-y-2">
                            <Label>{editingId ? 'كلمة مرور SIP جديدة (اختياري)' : 'كلمة مرور SIP'}</Label>
                            <Input
                                type="password"
                                placeholder={editingId ? 'اترك فارغ للإبقاء' : 'كلمة المرور من السنترال'}
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                dir="ltr"
                                className="font-mono"
                            />
                        </div>

                        {/* UCM Host */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <Label>عنوان السنترال (IP/Domain)</Label>
                                <Input
                                    placeholder="192.168.1.100"
                                    value={form.ucmHost}
                                    onChange={(e) => setForm({ ...form, ucmHost: e.target.value })}
                                    dir="ltr"
                                    className="font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Port</Label>
                                <Input
                                    type="number"
                                    placeholder="8089"
                                    value={form.ucmPort}
                                    onChange={(e) => setForm({ ...form, ucmPort: parseInt(e.target.value) || 8089 })}
                                    dir="ltr"
                                    className="font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={closeDialog}>إلغاء</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={assignMutation.isPending || updateMutation.isPending}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            {assignMutation.isPending || updateMutation.isPending
                                ? 'جاري الحفظ...'
                                : editingId ? 'حفظ التعديلات' : 'تعيين Extension'
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ═══ Delete Confirmation Dialog ═══ */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>حذف Extension</DialogTitle>
                        <DialogDescription>
                            هل تريد حذف هذا الخط؟ لن يتمكن الموظف من إجراء المكالمات بعد الحذف.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'جاري الحذف...' : 'حذف'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
