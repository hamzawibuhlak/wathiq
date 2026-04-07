import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import { Clock, MapPin, Scale, Pencil, User, Users, Gavel, Hash, UserCheck, X } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { HearingStatusBadge } from './HearingStatusBadge';
import type { Hearing } from '@/types';
import { useUpdateHearing } from '@/hooks/use-hearings';
import { useLawyers } from '@/hooks/use-lawyers';
import toast from 'react-hot-toast';

// ─── ActionModal ──────────────────────────────────────────────────────────────
function ActionModal({
    title,
    icon,
    message,
    confirmLabel,
    confirmClass,
    showDatePicker,
    showLawyerPicker,
    lawyers,
    isPending,
    onConfirm,
    onClose,
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
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {icon}
                        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-5">{message}</p>

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

                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        السبب (اختياري)
                    </label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="اذكر السبب هنا..."
                        rows={2}
                        className="w-full border rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

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

// ─── HearingCard ──────────────────────────────────────────────────────────────
interface HearingCardProps {
    hearing: Hearing;
    onDelete?: (id: string) => void;
}

export function HearingCard({ hearing }: HearingCardProps) {
    const { p } = useSlugPath();
    const [activeModal, setActiveModal] = useState<'postpone' | 'transfer' | null>(null);

    const updateMutation = useUpdateHearing(hearing.id);
    const { data: lawyersData } = useLawyers();
    const lawyers = lawyersData?.data?.map((l: any) => ({ id: l.id, name: l.name })) || [];

    const date = new Date(hearing.hearingDate);
    const isToday = new Date().toDateString() === date.toDateString();
    const isActive = hearing.status === 'SCHEDULED' || hearing.status === 'POSTPONED';

    const lawyer = (hearing as any).assignedTo || hearing.case?.assignedTo;
    const opponentName = (hearing as any).opponentName || hearing.case?.opposingParty;

    // ── تأجيل ──────────────────────────────────────────────────────────────
    const handlePostpone = ({ reason, newDate }: { reason?: string; newDate?: string }) => {
        const updateData: any = { status: 'POSTPONED' };
        if (newDate) updateData.hearingDate = newDate;
        if (reason) updateData.notes = `[تأجيل] ${reason}`;

        updateMutation.mutate(updateData, {
            onSuccess: () => {
                setActiveModal(null);
                toast.success('تم تأجيل الجلسة');
            },
        });
    };

    // ── تغيير المحامي ──────────────────────────────────────────────────────
    const handleTransfer = ({ reason, newLawyerId }: { reason?: string; newLawyerId?: string }) => {
        if (!newLawyerId) return;
        const updateData: any = { assignedToId: newLawyerId };
        if (reason) updateData.notes = `[تحويل محامي] ${reason}`;

        updateMutation.mutate(updateData, {
            onSuccess: () => {
                setActiveModal(null);
                toast.success('تم تغيير المحامي المسؤول');
            },
        });
    };

    return (
        <>
            <div className={cn(
                'bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow',
                isToday && 'border-primary/50 bg-primary/5'
            )}>
                {/* Card Body */}
                <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full flex items-center justify-center bg-primary/10 overflow-hidden flex-shrink-0">
                                {lawyer?.avatar ? (
                                    <img src={lawyer.avatar} alt={lawyer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-7 h-7 text-primary" />
                                )}
                            </div>
                            <div>
                                {(hearing as any).hearingNumber && (
                                    <div className="flex items-center gap-1 text-xs text-primary font-medium mb-1">
                                        <Hash className="w-3 h-3" />
                                        {(hearing as any).hearingNumber}
                                    </div>
                                )}
                                <h3 className="font-semibold">{hearing.courtName || 'جلسة'}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="w-3.5 h-3.5" />
                                    {date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {formatDate(hearing.hearingDate)}
                                </div>
                            </div>
                        </div>

                        <HearingStatusBadge status={hearing.status} />
                    </div>

                    {/* Case Link */}
                    {hearing.case && (
                        <Link
                            to={p(`/cases/${hearing.case.id}`)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                        >
                            <Scale className="w-4 h-4 flex-shrink-0" />
                            {hearing.case.caseNumber} - {hearing.case.title}
                        </Link>
                    )}

                    {/* Client */}
                    {(hearing as any).client && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <User className="w-4 h-4 flex-shrink-0" />
                            <span>{(hearing as any).client.name}</span>
                        </div>
                    )}

                    {/* Location */}
                    {(hearing.courtName || (hearing as any).courtroom) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            {[hearing.courtName, (hearing as any).courtroom].filter(Boolean).join(' - ')}
                        </div>
                    )}

                    {/* Opponent */}
                    {opponentName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>الخصم: {opponentName}</span>
                        </div>
                    )}

                    {/* Judge */}
                    {(hearing as any).judgeName && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <Gavel className="w-4 h-4 flex-shrink-0" />
                            <span>القاضي: {(hearing as any).judgeName}</span>
                        </div>
                    )}

                    {/* Lawyer name */}
                    {lawyer && (
                        <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
                            المحامي: {lawyer.name}
                        </div>
                    )}
                </div>

                {/* ─── Action Buttons ─────────────────────────────────────────── */}
                <div className="border-t grid grid-cols-3 divide-x divide-x-reverse">
                    {/* تعديل */}
                    <Link
                        to={p(`/hearings/${hearing.id}/edit`)}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        تعديل
                    </Link>

                    {/* تأجيل — فقط للنشطة */}
                    {isActive ? (
                        <button
                            onClick={() => setActiveModal('postpone')}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            تأجيل
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-1.5 py-2.5 text-xs text-gray-300 cursor-not-allowed">
                            <Clock className="w-3.5 h-3.5" />
                            تأجيل
                        </div>
                    )}

                    {/* تغيير المحامي */}
                    <button
                        onClick={() => setActiveModal('transfer')}
                        className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-violet-600 hover:bg-violet-50 transition-colors"
                    >
                        <UserCheck className="w-3.5 h-3.5" />
                        تغيير المحامي
                    </button>
                </div>
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}
            {activeModal === 'postpone' && (
                <ActionModal
                    title="تأجيل الجلسة"
                    icon={
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                    }
                    message="سيتم تغيير الحالة إلى 'مؤجلة'. يمكنك تحديد موعد جديد أو تركه للتعديل لاحقاً."
                    confirmLabel="تأجيل"
                    confirmClass="bg-blue-600 hover:bg-blue-700"
                    showDatePicker
                    isPending={updateMutation.isPending}
                    onConfirm={handlePostpone}
                    onClose={() => setActiveModal(null)}
                />
            )}

            {activeModal === 'transfer' && (
                <ActionModal
                    title="تغيير المحامي المسؤول"
                    icon={
                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                            <UserCheck className="w-5 h-5 text-violet-600" />
                        </div>
                    }
                    message="اختر المحامي الجديد المسؤول عن حضور هذه الجلسة."
                    confirmLabel="تغيير"
                    confirmClass="bg-violet-600 hover:bg-violet-700"
                    showLawyerPicker
                    lawyers={lawyers}
                    isPending={updateMutation.isPending}
                    onConfirm={handleTransfer}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </>
    );
}

export default HearingCard;
