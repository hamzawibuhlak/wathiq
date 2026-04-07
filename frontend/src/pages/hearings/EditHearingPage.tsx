import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { ArrowRight, CalendarDays, Trash2, Clock, XCircle, UserCheck } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { HearingForm, HearingFormData } from '@/components/hearings';
import { useHearing, useUpdateHearing, useDeleteHearing } from '@/hooks/use-hearings';
import { useCases } from '@/hooks/use-cases';
import { useLawyers } from '@/hooks/use-lawyers';
import { useClients } from '@/hooks/use-clients';
import toast from 'react-hot-toast';

// ─── Action Modal ─────────────────────────────────────────────────────────────
function ActionModal({
    title, icon, message, confirmLabel, confirmClass,
    showDatePicker, showLawyerPicker, lawyers,
    onConfirm, onClose, isPending,
}: {
    title: string;
    icon: React.ReactNode;
    message: string;
    confirmLabel: string;
    confirmClass: string;
    showDatePicker?: boolean;
    showLawyerPicker?: boolean;
    lawyers?: Array<{ id: string; name: string }>;
    isPending?: boolean;
    onConfirm: (data: { reason?: string; newDate?: string; newLawyerId?: string }) => void;
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newLawyerId, setNewLawyerId] = useState('');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                    {icon}
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                </div>
                <p className="text-sm text-gray-500 mb-5">{message}</p>

                {/* Date Picker (for postpone) */}
                {showDatePicker && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            الموعد الجديد (اختياري)
                        </label>
                        <input
                            type="datetime-local"
                            value={newDate}
                            onChange={e => setNewDate(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                )}

                {/* Lawyer Picker (for transfer) */}
                {showLawyerPicker && lawyers && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            المحامي الجديد <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={newLawyerId}
                            onChange={e => setNewLawyerId(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                        >
                            <option value="">اختر المحامي...</option>
                            {lawyers.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Reason */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        السبب (اختياري)
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="اذكر السبب هنا..."
                        rows={3}
                        className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={() => onConfirm({
                            reason: reason || undefined,
                            newDate: newDate || undefined,
                            newLawyerId: newLawyerId || undefined,
                        })}
                        disabled={isPending || (showLawyerPicker && !newLawyerId)}
                        className={`px-4 py-2 text-sm rounded-xl text-white font-medium transition-colors disabled:opacity-50 ${confirmClass}`}
                    >
                        {isPending ? '...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export function EditHearingPage() {
    const { id } = useParams<{ id: string }>();
    const { p, nav } = useSlugPath();

    const { data: hearingData, isLoading: hearingLoading } = useHearing(id!);
    const updateMutation = useUpdateHearing(id!);
    const deleteMutation = useDeleteHearing();
    const { data: casesData, isLoading: casesLoading } = useCases({ limit: 100 });
    const { data: lawyersData, isLoading: lawyersLoading } = useLawyers();
    const { data: clientsData, isLoading: clientsLoading } = useClients({ limit: 100 });

    const [activeModal, setActiveModal] = useState<'postpone' | 'cancel' | 'transfer' | null>(null);

    const cases = casesData?.data?.map((c) => ({
        id: c.id,
        title: c.title,
        caseNumber: c.caseNumber,
        clientId: c.clientId,
    })) || [];

    const lawyers = lawyersData?.data || [];
    const clients = clientsData?.data?.map((c) => ({ id: c.id, name: c.name })) || [];

    const handleSubmit = (data: HearingFormData) => {
        updateMutation.mutate(
            {
                hearingNumber: data.hearingNumber,
                hearingDate: data.hearingDate,
                clientId: data.clientId || undefined,
                caseId: data.caseId || undefined,
                assignedToId: data.assignedToId,
                opponentName: data.opponentName || undefined,
                courtName: data.courtName || undefined,
                judgeName: data.judgeName || undefined,
                notes: data.notes || undefined,
                status: data.status,
            },
            { onSuccess: () => nav('/hearings') }
        );
    };

    const handleDelete = () => {
        if (window.confirm('هل أنت متأكد من حذف هذه الجلسة؟')) {
            deleteMutation.mutate(id!, { onSuccess: () => nav('/hearings') });
        }
    };

    // ── تأجيل الجلسة ─────────────────────────────────────────────────
    const handlePostpone = ({ reason, newDate }: { reason?: string; newDate?: string }) => {
        const updateData: any = { status: 'POSTPONED' };
        if (newDate) updateData.hearingDate = newDate;
        if (reason) updateData.notes = `[تأجيل] ${reason}`;

        updateMutation.mutate(updateData, {
            onSuccess: () => {
                setActiveModal(null);
                toast.success('تم تأجيل الجلسة بنجاح');
            },
        });
    };

    // ── إلغاء الجلسة ─────────────────────────────────────────────────
    const handleCancel = ({ reason }: { reason?: string }) => {
        const updateData: any = { status: 'CANCELLED' };
        if (reason) updateData.notes = `[إلغاء] ${reason}`;

        updateMutation.mutate(updateData, {
            onSuccess: () => {
                setActiveModal(null);
                toast.success('تم إلغاء الجلسة');
            },
        });
    };

    // ── تحويل لمحامٍ آخر ─────────────────────────────────────────────
    const handleTransfer = ({ reason, newLawyerId }: { reason?: string; newLawyerId?: string }) => {
        if (!newLawyerId) return;
        const updateData: any = { assignedToId: newLawyerId };
        if (reason) updateData.notes = `[تحويل محامي] ${reason}`;

        updateMutation.mutate(updateData, {
            onSuccess: () => {
                setActiveModal(null);
                toast.success('تم تحويل الجلسة للمحامي الجديد');
            },
        });
    };

    const isLoading = hearingLoading || casesLoading || lawyersLoading || clientsLoading;
    const hearing = hearingData?.data;
    const isActive = hearing?.status === 'SCHEDULED' || hearing?.status === 'POSTPONED';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Link to={p('/hearings')}>
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للجلسات
                    </Button>
                </Link>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    isLoading={deleteMutation.isPending}
                >
                    <Trash2 className="w-4 h-4 ml-2" />
                    حذف الجلسة
                </Button>
            </div>

            {/* Quick Actions — تظهر فقط للجلسات المجدولة أو المؤجلة */}
            {hearing && isActive && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                    <p className="w-full text-xs text-amber-700 font-semibold mb-1">⚡ إجراءات سريعة</p>

                    <button
                        onClick={() => setActiveModal('postpone')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                    >
                        <Clock className="w-4 h-4" />
                        تأجيل الجلسة
                    </button>

                    <button
                        onClick={() => setActiveModal('cancel')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                    >
                        <XCircle className="w-4 h-4" />
                        إلغاء الجلسة
                    </button>

                    <button
                        onClick={() => setActiveModal('transfer')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-violet-50 text-violet-700 border border-violet-200 rounded-xl hover:bg-violet-100 transition-colors"
                    >
                        <UserCheck className="w-4 h-4" />
                        تحويل لمحامٍ آخر
                    </button>
                </div>
            )}

            {/* Form Card */}
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-primary" />
                            تعديل الجلسة
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4 animate-pulse">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <div className="w-24 h-4 bg-muted rounded" />
                                        <div className="w-full h-10 bg-muted rounded" />
                                    </div>
                                ))}
                            </div>
                        ) : hearing ? (
                            <HearingForm
                                initialData={hearing}
                                onSubmit={handleSubmit}
                                isLoading={updateMutation.isPending}
                                cases={cases}
                                clients={clients}
                                lawyers={lawyers}
                            />
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                الجلسة غير موجودة
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Modals ── */}
            {activeModal === 'postpone' && (
                <ActionModal
                    title="تأجيل الجلسة"
                    icon={
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                    }
                    message="سيتم تغيير حالة الجلسة إلى 'مؤجلة'. يمكنك تحديد موعد جديد أو تركه للتعديل لاحقاً."
                    confirmLabel="تأجيل"
                    confirmClass="bg-blue-600 hover:bg-blue-700"
                    showDatePicker
                    isPending={updateMutation.isPending}
                    onConfirm={handlePostpone}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'cancel' && (
                <ActionModal
                    title="إلغاء الجلسة"
                    icon={
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-red-600" />
                        </div>
                    }
                    message="سيتم تغيير حالة الجلسة إلى 'ملغاة'. يمكن التراجع عن هذا الإجراء من خلال التعديل."
                    confirmLabel="إلغاء الجلسة"
                    confirmClass="bg-red-600 hover:bg-red-700"
                    isPending={updateMutation.isPending}
                    onConfirm={handleCancel}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'transfer' && (
                <ActionModal
                    title="تحويل الجلسة لمحامٍ آخر"
                    icon={
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-violet-600" />
                        </div>
                    }
                    message="اختر المحامي الجديد المسؤول عن حضور هذه الجلسة."
                    confirmLabel="تحويل"
                    confirmClass="bg-violet-600 hover:bg-violet-700"
                    showLawyerPicker
                    lawyers={lawyers.map((l: any) => ({ id: l.id, name: l.name }))}
                    isPending={updateMutation.isPending}
                    onConfirm={handleTransfer}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </div>
    );
}

export default EditHearingPage;
