import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSlugPath } from '@/hooks/useSlugPath';
import {
    ArrowRight, Search, MessageSquare, ChevronDown, ChevronUp,
    User, Mail, Phone, Calendar, StickyNote, Link2, UserPlus,
    Briefcase, X, Send, Check, Trash2, Users,
} from 'lucide-react';
import {
    useFormSubmissions, useUpdateSubmissionStatus,
    useAnswerNotes, useAddAnswerNote, useDeleteAnswerNote,
    useDiscussion, useStartDiscussion, useAddDiscussionMessage, useInviteToDiscussion,
    useLinkSubmission, useConvertSubmissionToClient, useConvertSubmissionToCase,
} from '@/hooks/useForms';
import { useClients } from '@/hooks/use-clients';
import { useCases } from '@/hooks/use-cases';
import { useUsers } from '@/hooks/useUsers';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
    { value: 'NEW', label: 'جديد', color: 'bg-blue-100 text-blue-700' },
    { value: 'REVIEWED', label: 'تمت المراجعة', color: 'bg-amber-100 text-amber-700' },
    { value: 'PROCESSED', label: 'تم المعالجة', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'REJECTED', label: 'مرفوض', color: 'bg-red-100 text-red-700' },
];

// Drawer state
type DrawerState =
    | { kind: 'none' }
    | { kind: 'notes'; answerId: string; answerLabel: string }
    | { kind: 'discussion'; answerId: string; answerLabel: string; discussionId?: string }
    | { kind: 'link'; submissionId: string }
    | { kind: 'convert'; submissionId: string; mode: 'client' | 'case' };

export default function FormSubmissionsPage() {
    const { id } = useParams();
    const { p } = useSlugPath();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [drawer, setDrawer] = useState<DrawerState>({ kind: 'none' });

    const { data, isLoading } = useFormSubmissions(id || '', {
        search: search || undefined,
        status: statusFilter || undefined,
    });
    const updateStatusMutation = useUpdateSubmissionStatus();

    const form = data?.form;
    const submissions = data?.submissions || [];

    const handleStatusChange = (submissionId: string, status: string) => {
        updateStatusMutation.mutate(
            { submissionId, data: { status } },
            {
                onSuccess: () => toast.success('تم تحديث الحالة'),
                onError: () => toast.error('فشل تحديث الحالة'),
            },
        );
    };

    const getStatusBadge = (status: string) => {
        const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
        return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${opt.color}`}>{opt.label}</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <Link to={p('/forms')} className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">إجابات: {form?.title || '...'}</h1>
                    <p className="text-sm text-gray-400">{submissions.length} إجابة</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث بالاسم أو البريد..."
                        className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">كل الحالات</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="text-center py-20 text-gray-400">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-3" />
                </div>
            )}

            {/* Empty */}
            {!isLoading && submissions.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد إجابات بعد</h3>
                    <p className="text-gray-400">شارك رابط النموذج مع العملاء لتلقي الإجابات</p>
                </div>
            )}

            {/* Submissions List */}
            {!isLoading && submissions.length > 0 && (
                <div className="space-y-3">
                    {submissions.map((sub: any) => (
                        <div key={sub.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            {/* Header Row */}
                            <button
                                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-right"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <User className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-900 text-sm truncate">
                                            {sub.submitterName || 'مجهول'}
                                        </div>
                                        <div className="text-xs text-gray-400 font-mono">{sub.code}</div>
                                    </div>
                                    {/* Linked badges */}
                                    <div className="flex items-center gap-1.5">
                                        {sub.linkedClient && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium">
                                                عميل: {sub.linkedClient.name}
                                            </span>
                                        )}
                                        {sub.linkedCase && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                                                قضية: {sub.linkedCase.title}
                                            </span>
                                        )}
                                        {sub.convertedToClient && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                                                حُوّل إلى عميل
                                            </span>
                                        )}
                                        {sub.convertedToCase && (
                                            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                                                حُوّل إلى قضية
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {getStatusBadge(sub.status)}
                                    <span className="text-xs text-gray-400">
                                        {new Date(sub.submittedAt).toLocaleDateString('ar-SA')}
                                    </span>
                                    {expandedId === sub.id ? (
                                        <ChevronUp className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    )}
                                </div>
                            </button>

                            {/* Details */}
                            {expandedId === sub.id && (
                                <div className="border-t border-gray-100 px-4 py-5 space-y-4">
                                    {/* Submitter Info */}
                                    <div className="flex flex-wrap gap-4 text-sm mb-2">
                                        {sub.submitterEmail && (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Mail className="w-4 h-4" /> {sub.submitterEmail}
                                            </span>
                                        )}
                                        {sub.submitterPhone && (
                                            <span className="flex items-center gap-1.5 text-gray-500">
                                                <Phone className="w-4 h-4" /> {sub.submitterPhone}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 text-gray-400">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(sub.submittedAt).toLocaleString('ar-SA')}
                                        </span>
                                    </div>

                                    {/* Submission actions */}
                                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-100">
                                        <button
                                            onClick={() => setDrawer({ kind: 'link', submissionId: sub.id })}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                                        >
                                            <Link2 className="w-3.5 h-3.5" />
                                            ربط بقضية/عميل
                                        </button>
                                        {!sub.convertedToClient && (
                                            <button
                                                onClick={() => setDrawer({ kind: 'convert', submissionId: sub.id, mode: 'client' })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 text-gray-600"
                                            >
                                                <UserPlus className="w-3.5 h-3.5" />
                                                تحويل إلى عميل
                                            </button>
                                        )}
                                        {!sub.convertedToCase && (
                                            <button
                                                onClick={() => setDrawer({ kind: 'convert', submissionId: sub.id, mode: 'case' })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 text-gray-600"
                                            >
                                                <Briefcase className="w-3.5 h-3.5" />
                                                تحويل إلى قضية
                                            </button>
                                        )}
                                    </div>

                                    {/* Answers */}
                                    <div className="space-y-3">
                                        {(sub.answers || []).map((answer: any) => (
                                            <AnswerCard
                                                key={answer.id}
                                                answer={answer}
                                                onOpenNotes={() => setDrawer({
                                                    kind: 'notes',
                                                    answerId: answer.id,
                                                    answerLabel: answer.field?.label || 'حقل',
                                                })}
                                                onOpenDiscussion={() => setDrawer({
                                                    kind: 'discussion',
                                                    answerId: answer.id,
                                                    answerLabel: answer.field?.label || 'حقل',
                                                    discussionId: answer.discussion?.id,
                                                })}
                                            />
                                        ))}
                                    </div>

                                    {/* Status Change */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <span className="text-xs text-gray-500">تغيير الحالة:</span>
                                        {STATUS_OPTIONS.map(s => (
                                            <button
                                                key={s.value}
                                                onClick={() => handleStatusChange(sub.id, s.value)}
                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${sub.status === s.value
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ═══ DRAWERS ═══ */}
            {drawer.kind === 'notes' && (
                <NotesDrawer
                    answerId={drawer.answerId}
                    answerLabel={drawer.answerLabel}
                    onClose={() => setDrawer({ kind: 'none' })}
                />
            )}

            {drawer.kind === 'discussion' && (
                <DiscussionDrawer
                    answerId={drawer.answerId}
                    answerLabel={drawer.answerLabel}
                    discussionId={drawer.discussionId}
                    onClose={() => setDrawer({ kind: 'none' })}
                />
            )}

            {drawer.kind === 'link' && (
                <LinkSubmissionModal
                    submissionId={drawer.submissionId}
                    onClose={() => setDrawer({ kind: 'none' })}
                />
            )}

            {drawer.kind === 'convert' && (
                <ConvertSubmissionModal
                    submissionId={drawer.submissionId}
                    mode={drawer.mode}
                    onClose={() => setDrawer({ kind: 'none' })}
                />
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// ANSWER CARD
// ══════════════════════════════════════════════════════════

function AnswerCard({ answer, onOpenNotes, onOpenDiscussion }: {
    answer: any;
    onOpenNotes: () => void;
    onOpenDiscussion: () => void;
}) {
    const notesCount = answer.notes?.length || 0;
    const messagesCount = answer.discussion?._count?.messages || 0;
    const discussionOpen = !!answer.discussion;
    const restricted = (answer.visibleToUsers?.length || 0) > 0;

    return (
        <div className="bg-gray-50 rounded-lg p-3 group/answer">
            <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 truncate">
                        {answer.field?.label || 'حقل'}
                    </p>
                    {restricted && (
                        <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                            <Users className="w-3 h-3" />
                            مقيّد
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover/answer:opacity-100 transition-opacity">
                    <button
                        onClick={onOpenNotes}
                        title="الملاحظات"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-white hover:text-indigo-600 transition-colors"
                    >
                        <StickyNote className="w-3 h-3" />
                        {notesCount > 0 && <span>{notesCount}</span>}
                    </button>
                    <button
                        onClick={onOpenDiscussion}
                        title="المناقشة"
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-gray-500 hover:bg-white hover:text-indigo-600 transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" />
                        {discussionOpen && <span>{messagesCount}</span>}
                    </button>
                </div>
            </div>
            <p className="text-sm text-gray-800 break-words">
                {answer.valueText ||
                    (answer.valueNumber !== null && answer.valueNumber !== undefined ? answer.valueNumber : '') ||
                    (answer.valueBoolean !== null && answer.valueBoolean !== undefined
                        ? (answer.valueBoolean ? 'نعم' : 'لا')
                        : '') ||
                    (answer.valueDate ? new Date(answer.valueDate).toLocaleDateString('ar-SA') : '') ||
                    (answer.valueJson ? JSON.stringify(answer.valueJson) : '') ||
                    '—'}
            </p>
        </div>
    );
}

// ══════════════════════════════════════════════════════════
// NOTES DRAWER
// ══════════════════════════════════════════════════════════

function NotesDrawer({ answerId, answerLabel, onClose }: {
    answerId: string;
    answerLabel: string;
    onClose: () => void;
}) {
    const { data: notes, isLoading } = useAnswerNotes(answerId);
    const addNote = useAddAnswerNote();
    const deleteNote = useDeleteAnswerNote();
    const [content, setContent] = useState('');

    const handleAdd = () => {
        if (!content.trim()) return;
        addNote.mutate(
            { answerId, content: content.trim() },
            {
                onSuccess: () => {
                    setContent('');
                    toast.success('تمت إضافة الملاحظة');
                },
                onError: () => toast.error('فشل إضافة الملاحظة'),
            },
        );
    };

    return (
        <DrawerShell title="ملاحظات الحقل" subtitle={answerLabel} onClose={onClose}>
            {isLoading ? (
                <p className="text-sm text-gray-400 text-center py-8">جاري التحميل...</p>
            ) : !notes || notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">لا توجد ملاحظات بعد</p>
            ) : (
                <div className="space-y-3 mb-4">
                    {notes.map((note: any) => (
                        <div key={note.id} className="bg-gray-50 rounded-lg p-3 group/note">
                            <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                        {(note.author?.name || '?').charAt(0)}
                                    </div>
                                    <span className="text-xs font-medium text-gray-700">{note.author?.name}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(note.createdAt).toLocaleString('ar-SA')}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteNote.mutate({ answerId, noteId: note.id })}
                                    className="opacity-0 group-hover/note:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="border-t border-gray-100 pt-3">
                <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="اكتب ملاحظة..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                />
                <button
                    onClick={handleAdd}
                    disabled={!content.trim() || addNote.isPending}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    <Send className="w-4 h-4" />
                    إضافة ملاحظة
                </button>
            </div>
        </DrawerShell>
    );
}

// ══════════════════════════════════════════════════════════
// DISCUSSION DRAWER
// ══════════════════════════════════════════════════════════

function DiscussionDrawer({ answerId, answerLabel, discussionId, onClose }: {
    answerId: string;
    answerLabel: string;
    discussionId?: string;
    onClose: () => void;
}) {
    const { data: discussion, isLoading } = useDiscussion(discussionId || null);
    const startDiscussion = useStartDiscussion();
    const addMessage = useAddDiscussionMessage();
    const inviteToDiscussion = useInviteToDiscussion();
    const { data: usersRes } = useUsers();

    const [message, setMessage] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);

    const users: any[] = Array.isArray(usersRes) ? usersRes : ((usersRes as any)?.data || []);
    const participantIds = new Set((discussion?.participants || []).map((p: any) => p.id));
    const availableUsers = users.filter(u => !participantIds.has(u.id));

    const handleStart = () => {
        startDiscussion.mutate(
            {
                answerId,
                data: {
                    inviteeIds: selectedInvitees,
                    message: message.trim() || undefined,
                },
            },
            {
                onSuccess: () => {
                    setMessage('');
                    setSelectedInvitees([]);
                    toast.success('تم بدء المناقشة');
                },
                onError: () => toast.error('فشل بدء المناقشة'),
            },
        );
    };

    const handleSend = () => {
        if (!message.trim() || !discussionId) return;
        addMessage.mutate(
            { id: discussionId, content: message.trim() },
            {
                onSuccess: () => setMessage(''),
                onError: () => toast.error('فشل إرسال الرسالة'),
            },
        );
    };

    const handleInvite = () => {
        if (!discussionId || selectedInvitees.length === 0) return;
        inviteToDiscussion.mutate(
            { id: discussionId, userIds: selectedInvitees },
            {
                onSuccess: () => {
                    setSelectedInvitees([]);
                    setShowInvite(false);
                    toast.success('تم إرسال الدعوات');
                },
                onError: () => toast.error('فشل إرسال الدعوات'),
            },
        );
    };

    return (
        <DrawerShell title="مناقشة الحقل" subtitle={answerLabel} onClose={onClose}>
            {!discussionId ? (
                // Start new discussion
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        لم تبدأ مناقشة على هذا الحقل بعد. ابدأ الآن ودعوة زملاء للنقاش.
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">دعوة (اختياري)</label>
                        <UserMultiSelect
                            users={users}
                            selected={selectedInvitees}
                            onToggle={(uid) => setSelectedInvitees(prev =>
                                prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]
                            )}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">رسالة أولى (اختياري)</label>
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="ابدأ النقاش..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                    <button
                        onClick={handleStart}
                        disabled={startDiscussion.isPending}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                        بدء المناقشة
                    </button>
                </div>
            ) : isLoading ? (
                <p className="text-sm text-gray-400 text-center py-8">جاري التحميل...</p>
            ) : (
                <div className="space-y-4">
                    {/* Participants */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">المشاركون:</span>
                            {(discussion?.participants || []).map((p: any) => (
                                <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                                    {p.name}
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowInvite(v => !v)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                            دعوة
                        </button>
                    </div>

                    {/* Invite row */}
                    {showInvite && (
                        <div className="bg-indigo-50/50 rounded-lg p-3 space-y-3">
                            <UserMultiSelect
                                users={availableUsers}
                                selected={selectedInvitees}
                                onToggle={(uid) => setSelectedInvitees(prev =>
                                    prev.includes(uid) ? prev.filter(i => i !== uid) : [...prev, uid]
                                )}
                            />
                            <button
                                onClick={handleInvite}
                                disabled={selectedInvitees.length === 0 || inviteToDiscussion.isPending}
                                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                            >
                                إرسال الدعوات
                            </button>
                        </div>
                    )}

                    {/* Messages */}
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {(discussion?.messages || []).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6">لا توجد رسائل بعد</p>
                        ) : (
                            (discussion?.messages || []).map((m: any) => (
                                <div key={m.id} className="flex items-start gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 flex-shrink-0">
                                        {(m.author?.name || '?').charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-gray-700">{m.author?.name}</span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(m.createdAt).toLocaleString('ar-SA')}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-2">
                                            {m.content}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Compose */}
                    <div className="border-t border-gray-100 pt-3">
                        <textarea
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="اكتب رسالة..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || addMessage.isPending}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            إرسال
                        </button>
                    </div>
                </div>
            )}
        </DrawerShell>
    );
}

// ══════════════════════════════════════════════════════════
// LINK SUBMISSION MODAL
// ══════════════════════════════════════════════════════════

function LinkSubmissionModal({ submissionId, onClose }: { submissionId: string; onClose: () => void }) {
    const [clientId, setClientId] = useState<string>('');
    const [caseId, setCaseId] = useState<string>('');
    const [search, setSearch] = useState('');

    const { data: clientsRes } = useClients({ search: search || undefined });
    const { data: casesRes } = useCases({ search: search || undefined });
    const linkMutation = useLinkSubmission();

    const clients = clientsRes?.data || [];
    const cases = casesRes?.data || [];

    const handleLink = () => {
        if (!clientId && !caseId) {
            toast.error('اختر عميلاً أو قضية');
            return;
        }
        linkMutation.mutate(
            {
                submissionId,
                data: {
                    clientId: clientId || undefined,
                    caseId: caseId || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success('تم الربط بنجاح');
                    onClose();
                },
                onError: () => toast.error('فشل الربط'),
            },
        );
    };

    return (
        <ModalShell title="ربط الإجابة" onClose={onClose}>
            <p className="text-sm text-gray-500 mb-4">
                اربط هذه الإجابة بعميل أو قضية موجودة دون إنشاء سجلات جديدة.
            </p>

            <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">العميل</label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1">
                        {clients.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">لا يوجد عملاء</p>
                        ) : (
                            clients.slice(0, 20).map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setClientId(clientId === c.id ? '' : c.id)}
                                    className={`w-full text-right px-3 py-2 rounded text-xs transition-colors ${clientId === c.id
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {c.name}
                                    <span className="text-gray-400 ml-1">({c.code})</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2">القضية</label>
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1">
                        {cases.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">لا توجد قضايا</p>
                        ) : (
                            cases.slice(0, 20).map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setCaseId(caseId === c.id ? '' : c.id)}
                                    className={`w-full text-right px-3 py-2 rounded text-xs transition-colors ${caseId === c.id
                                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                        }`}
                                >
                                    {c.title}
                                    <span className="text-gray-400 ml-1">({c.code})</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleLink}
                    disabled={linkMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    <Check className="w-4 h-4" />
                    ربط
                </button>
            </div>
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════════════
// CONVERT SUBMISSION MODAL
// ══════════════════════════════════════════════════════════

function ConvertSubmissionModal({ submissionId, mode, onClose }: {
    submissionId: string;
    mode: 'client' | 'case';
    onClose: () => void;
}) {
    const convertToClient = useConvertSubmissionToClient();
    const convertToCase = useConvertSubmissionToCase();
    const { data: clientsRes } = useClients();
    const [clientId, setClientId] = useState<string>('');
    const [search, setSearch] = useState('');

    const clients = (clientsRes?.data || []).filter((c: any) =>
        !search || c.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleConvert = () => {
        if (mode === 'client') {
            convertToClient.mutate(submissionId, {
                onSuccess: () => {
                    toast.success('تم إنشاء العميل');
                    onClose();
                },
                onError: () => toast.error('فشل التحويل'),
            });
        } else {
            convertToCase.mutate(
                { submissionId, clientId: clientId || undefined },
                {
                    onSuccess: () => {
                        toast.success('تم إنشاء القضية');
                        onClose();
                    },
                    onError: () => toast.error('فشل التحويل'),
                },
            );
        }
    };

    return (
        <ModalShell
            title={mode === 'client' ? 'تحويل إلى عميل جديد' : 'تحويل إلى قضية جديدة'}
            onClose={onClose}
        >
            {mode === 'client' ? (
                <p className="text-sm text-gray-500 mb-5">
                    سيتم إنشاء عميل جديد بناءً على البيانات المُدخلة في النموذج (الاسم، البريد، الجوال، إلخ).
                </p>
            ) : (
                <>
                    <p className="text-sm text-gray-500 mb-4">
                        اختر عميلاً موجوداً لربط القضية به، أو اتركه فارغاً وسيتم إنشاء عميل جديد تلقائياً.
                    </p>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ابحث عن عميل..."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-1 mb-5">
                        <button
                            onClick={() => setClientId('')}
                            className={`w-full text-right px-3 py-2 rounded text-xs transition-colors ${clientId === ''
                                ? 'bg-indigo-100 text-indigo-700 font-medium'
                                : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            إنشاء عميل جديد من البيانات
                        </button>
                        {clients.slice(0, 20).map((c: any) => (
                            <button
                                key={c.id}
                                onClick={() => setClientId(c.id)}
                                className={`w-full text-right px-3 py-2 rounded text-xs transition-colors ${clientId === c.id
                                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                                    : 'hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                {c.name}
                                <span className="text-gray-400 ml-1">({c.code})</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    إلغاء
                </button>
                <button
                    onClick={handleConvert}
                    disabled={convertToClient.isPending || convertToCase.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                    <Check className="w-4 h-4" />
                    تأكيد التحويل
                </button>
            </div>
        </ModalShell>
    );
}

// ══════════════════════════════════════════════════════════
// SHARED UI SHELLS
// ══════════════════════════════════════════════════════════

function DrawerShell({ title, subtitle, onClose, children }: {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex justify-start">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-96 bg-white h-full shadow-xl overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                    <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate">{title}</h3>
                        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

function ModalShell({ title, onClose, children }: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

function UserMultiSelect({ users, selected, onToggle }: {
    users: any[];
    selected: string[];
    onToggle: (id: string) => void;
}) {
    return (
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-1">
            {users.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">لا يوجد مستخدمون</p>
            ) : (
                users.map(u => (
                    <button
                        key={u.id}
                        onClick={() => onToggle(u.id)}
                        className={`w-full text-right px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${selected.includes(u.id)
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-700'
                            }`}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                            }`}>
                            {selected.includes(u.id) && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span>{u.name}</span>
                        <span className="text-gray-400 text-[10px]">{u.email}</span>
                    </button>
                ))
            )}
        </div>
    );
}
