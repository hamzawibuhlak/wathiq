import { useState, useRef, useCallback, useEffect } from 'react';
import {
    Mail, Send, Inbox, Plus, Trash2, CheckCheck, Clock,
    Paperclip, AtSign, Users, Forward, Reply, CornerUpLeft,
    X, Search, Eye, EyeOff, FileText, Image,
    MoreVertical, RefreshCw, MessageSquare, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    TooltipProvider, Tooltip, TooltipTrigger, TooltipContent,
} from '@/components/ui/tooltip';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    useInboxMessages, useSentMessages, useMessage, useMessagesUnreadCount,
    useRecipients, useSendMessage, useMarkAllMessagesAsRead, useDeleteMessage,
} from '@/hooks/use-notifications';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/stores/auth.store';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Message, Recipient } from '@/api/notifications';
import { messagesApi } from '@/api/notifications';
import toast from 'react-hot-toast';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Attachment {
    name: string;
    url: string;          // local blob URL (before upload) or remote URL (after)
    size: number;
    type: string;
    file?: File;           // raw File for upload
    uploaded?: boolean;   // true after server upload
    serverUrl?: string;   // URL returned from server
}

interface ComposeState {
    subject: string;
    content: string;
    receiverIds: string[];
    ccIds: string[];
    bccIds: string[];
    attachments: Attachment[];
    replyToId?: string;
    forwardFromId?: string;
    showCc: boolean;
    showBcc: boolean;
}

type ComposeMode = 'new' | 'reply' | 'forward' | 'bulk';

/* ─────────────────────────────────────────────
   RECIPIENT CHIP
───────────────────────────────────────────── */
function RecipientChip({ recipient, onRemove }: { recipient: Recipient; onRemove: () => void }) {
    const initials = recipient.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    return (
        <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full px-2 py-0.5 text-xs font-medium">
            <Avatar className="h-4 w-4">
                <AvatarImage src={recipient.avatar} />
                <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
            </Avatar>
            {recipient.name}
            <button onClick={onRemove} className="ml-0.5 hover:text-red-500 transition-colors">
                <X className="h-3 w-3" />
            </button>
        </span>
    );
}

/* ─────────────────────────────────────────────
   RECIPIENT SELECTOR
───────────────────────────────────────────── */
function RecipientSelector({
    label,
    selectedIds,
    onAdd,
    onRemove,
    recipients,
    icon,
}: {
    label: string;
    selectedIds: string[];
    onAdd: (id: string) => void;
    onRemove: (id: string) => void;
    recipients: Recipient[];
    icon?: React.ReactNode;
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const selectedRecipients = recipients.filter(r => selectedIds.includes(r.id));
    const filtered = recipients.filter(
        r => !selectedIds.includes(r.id) &&
            (r.name.toLowerCase().includes(search.toLowerCase()) ||
                r.email.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="grid gap-1.5">
            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                {icon}
                {label}
            </Label>
            <div className="min-h-[38px] flex flex-wrap gap-1.5 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all relative">
                {selectedRecipients.map(r => (
                    <RecipientChip key={r.id} recipient={r} onRemove={() => onRemove(r.id)} />
                ))}
                <div className="relative flex-1 min-w-[120px]">
                    <input
                        value={search}
                        onChange={e => { setSearch(e.target.value); setOpen(true); }}
                        onFocus={() => setOpen(true)}
                        onBlur={() => setTimeout(() => setOpen(false), 150)}
                        placeholder={selectedIds.length === 0 ? `ابحث عن ${label}...` : ''}
                        className="w-full text-sm bg-transparent outline-none placeholder:text-slate-400"
                    />
                    {open && filtered.length > 0 && (
                        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden max-h-48">
                            <div className="overflow-y-auto max-h-48">
                                {filtered.map(r => (
                                    <button
                                        key={r.id}
                                        onMouseDown={() => { onAdd(r.id); setSearch(''); }}
                                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-right transition-colors"
                                    >
                                        <Avatar className="h-7 w-7 shrink-0">
                                            <AvatarImage src={r.avatar} />
                                            <AvatarFallback className="text-xs">
                                                {r.name.slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-right min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{r.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   MENTION TEXTAREA
───────────────────────────────────────────── */
function MentionTextarea({
    value,
    onChange,
    recipients,
    placeholder,
    rows = 6,
}: {
    value: string;
    onChange: (v: string) => void;
    recipients: Recipient[];
    placeholder?: string;
    rows?: number;
}) {
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [cursorPos, setCursorPos] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const mentionFiltered = recipients.filter(r =>
        r.name.toLowerCase().includes(mentionSearch.toLowerCase())
    ).slice(0, 6);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const pos = e.target.selectionStart;
        onChange(val);
        setCursorPos(pos);

        const textBeforeCursor = val.slice(0, pos);
        const match = textBeforeCursor.match(/@(\w*)$/);
        if (match) {
            setMentionSearch(match[1]);
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (recipient: Recipient) => {
        const textBeforeCursor = value.slice(0, cursorPos);
        const textAfterCursor = value.slice(cursorPos);
        const mentionStart = textBeforeCursor.lastIndexOf('@');
        const newText = textBeforeCursor.slice(0, mentionStart) + `@${recipient.name} ` + textAfterCursor;
        onChange(newText);
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    return (
        <div className="relative">
            <Textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                rows={rows}
                className="resize-none border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30 text-sm"
            />
            {showMentions && mentionFiltered.length > 0 && (
                <div className="absolute bottom-full mb-1 right-0 w-56 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden">
                    <div className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1">
                        <AtSign className="h-3 w-3" />
                        ذكر شخص
                    </div>
                    {mentionFiltered.map(r => (
                        <button
                            key={r.id}
                            onMouseDown={() => insertMention(r)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                        >
                            <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={r.avatar} />
                                <AvatarFallback className="text-[10px]">
                                    {r.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{r.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   FILE ATTACHMENT ZONE
───────────────────────────────────────────── */
function AttachmentZone({
    attachments,
    onAdd,
    onRemove,
}: {
    attachments: Attachment[];
    onAdd: (files: FileList) => void;
    onRemove: (idx: number) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getIcon = (type: string) => {
        if (type.startsWith('image/')) return <Image className="h-4 w-4 text-indigo-500" />;
        return <FileText className="h-4 w-4 text-indigo-500" />;
    };

    return (
        <div className="space-y-2">
            <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) onAdd(e.dataTransfer.files); }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all text-sm',
                    dragging
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10'
                )}
            >
                <Paperclip className="h-4 w-4 mx-auto mb-1 opacity-60" />
                <span>اسحب الملفات هنا أو انقر للرفع</span>
                <input ref={inputRef} type="file" multiple className="hidden"
                    onChange={e => e.target.files && onAdd(e.target.files)} />
            </div>
            {attachments.length > 0 && (
                <div className="space-y-1.5">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                            {getIcon(att.type)}
                            <span className="flex-1 text-xs font-medium truncate text-slate-700 dark:text-slate-300">{att.name}</span>
                            <span className="text-xs text-slate-400">{formatSize(att.size)}</span>
                            <button onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   COMPOSE DIALOG
───────────────────────────────────────────── */
function ComposeDialog({
    open,
    onOpenChange,
    initialState,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialState?: Partial<ComposeState & { mode: ComposeMode }>;
}) {
    const { data: recipients = [] } = useRecipients();
    const sendMessage = useSendMessage();
    const mode: ComposeMode = initialState?.mode || 'new';

    const [state, setState] = useState<ComposeState>({
        subject: '',
        content: '',
        receiverIds: [],
        ccIds: [],
        bccIds: [],
        attachments: [],
        showCc: false,
        showBcc: false,
    });

    useEffect(() => {
        if (open && initialState) {
            setState({
                subject: initialState.subject || '',
                content: initialState.content || '',
                receiverIds: initialState.receiverIds || [],
                ccIds: initialState.ccIds || [],
                bccIds: initialState.bccIds || [],
                attachments: initialState.attachments || [],
                replyToId: initialState.replyToId,
                forwardFromId: initialState.forwardFromId,
                showCc: !!(initialState.ccIds?.length),
                showBcc: !!(initialState.bccIds?.length),
            });
        }
    }, [open]);

    const update = <K extends keyof ComposeState>(key: K, val: ComposeState[K]) =>
        setState(s => ({ ...s, [key]: val }));

    const [uploading, setUploading] = useState(false);

    const handleFiles = (files: FileList) => {
        const newAtts: Attachment[] = Array.from(files).map(f => ({
            name: f.name,
            url: URL.createObjectURL(f),
            size: f.size,
            type: f.type,
            file: f,
            uploaded: false,
        }));
        setState(s => ({ ...s, attachments: [...s.attachments, ...newAtts] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (state.receiverIds.length === 0 || !state.subject.trim() || !state.content.trim()) return;

        setUploading(true);
        let finalContent = state.content;

        // Upload each file and append attachment block to content
        try {
            for (const att of state.attachments) {
                if (att.file && !att.uploaded) {
                    try {
                        const res = await messagesApi.uploadDocument(att.file);
                        const serverUrl = res.data?.url || '';
                        // Append structured attachment tag that we parse in the reader
                        finalContent += `\n[attachment name="${att.name}" size="${att.size}" type="${att.type}" url="${serverUrl}"]`;
                    } catch {
                        // If upload fails, mention it inline
                        finalContent += `\n[attachment name="${att.name}" size="${att.size}" type="${att.type}" url=""]`;
                    }
                }
            }
        } finally {
            setUploading(false);
        }

        const sends = state.receiverIds.map(receiverId =>
            sendMessage.mutateAsync({
                subject: state.subject,
                content: finalContent,
                receiverId,
            })
        );

        Promise.all(sends).then(() => {
            setState({
                subject: '', content: '', receiverIds: [], ccIds: [],
                bccIds: [], attachments: [], showCc: false, showBcc: false,
            });
            onOpenChange(false);
        }).catch(() => {});
    };

    const titleMap: Record<ComposeMode, { label: string; icon: React.ReactNode; color: string }> = {
        new:     { label: 'رسالة جديدة',     icon: <Plus className="h-4 w-4" />,    color: 'text-indigo-600' },
        reply:   { label: 'الرد على الرسالة', icon: <Reply className="h-4 w-4" />,   color: 'text-green-600' },
        forward: { label: 'تحويل الرسالة',    icon: <Forward className="h-4 w-4" />, color: 'text-amber-600' },
        bulk:    { label: 'رسالة جماعية',     icon: <Users className="h-4 w-4" />,   color: 'text-purple-600' },
    };
    const titleInfo = titleMap[mode];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <DialogTitle className={cn('flex items-center gap-2 text-lg', titleInfo.color)}>
                        {titleInfo.icon}
                        {titleInfo.label}
                        {mode === 'bulk' && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-xs mr-1">
                                جماعية
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-4 space-y-4">

                        {/* To */}
                        <RecipientSelector
                            label={mode === 'bulk' ? 'المستلمون (متعدد)' : 'إلى'}
                            selectedIds={state.receiverIds}
                            onAdd={id => update('receiverIds', [...state.receiverIds, id])}
                            onRemove={id => update('receiverIds', state.receiverIds.filter(x => x !== id))}
                            recipients={recipients}
                            icon={<Mail className="h-3 w-3" />}
                        />

                        {/* CC / BCC toggles */}
                        <div className="flex gap-3">
                            {!state.showCc && (
                                <button type="button" onClick={() => update('showCc', true)}
                                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors">
                                    <Eye className="h-3 w-3" />
                                    إضافة نسخة (CC)
                                </button>
                            )}
                            {!state.showBcc && (
                                <button type="button" onClick={() => update('showBcc', true)}
                                    className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 transition-colors">
                                    <EyeOff className="h-3 w-3" />
                                    إضافة نسخة مخفية (BCC)
                                </button>
                            )}
                        </div>

                        {/* CC */}
                        {state.showCc && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <RecipientSelector
                                    label="نسخة إلى (CC)"
                                    selectedIds={state.ccIds}
                                    onAdd={id => update('ccIds', [...state.ccIds, id])}
                                    onRemove={id => update('ccIds', state.ccIds.filter(x => x !== id))}
                                    recipients={recipients}
                                    icon={<Eye className="h-3 w-3" />}
                                />
                            </div>
                        )}

                        {/* BCC */}
                        {state.showBcc && (
                            <div className="animate-in slide-in-from-top-2 duration-200">
                                <RecipientSelector
                                    label="نسخة مخفية (BCC)"
                                    selectedIds={state.bccIds}
                                    onAdd={id => update('bccIds', [...state.bccIds, id])}
                                    onRemove={id => update('bccIds', state.bccIds.filter(x => x !== id))}
                                    recipients={recipients}
                                    icon={<EyeOff className="h-3 w-3" />}
                                />
                            </div>
                        )}

                        {/* Subject */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                الموضوع
                            </Label>
                            <Input
                                value={state.subject}
                                onChange={e => update('subject', e.target.value)}
                                placeholder="موضوع الرسالة..."
                                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/30"
                                required
                            />
                        </div>

                        {/* Content with @mention */}
                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                    الرسالة
                                </Label>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <AtSign className="h-3 w-3" />
                                    اكتب @ لذكر شخص
                                </span>
                            </div>
                            <MentionTextarea
                                value={state.content}
                                onChange={v => update('content', v)}
                                recipients={recipients}
                                placeholder="اكتب رسالتك هنا... (استخدم @ لذكر أحد الأعضاء)"
                                rows={6}
                            />
                        </div>

                        {/* Attachments */}
                        <div className="grid gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                                <Paperclip className="h-3 w-3" />
                                المرفقات
                            </Label>
                            <AttachmentZone
                                attachments={state.attachments}
                                onAdd={handleFiles}
                                onRemove={idx => update('attachments', state.attachments.filter((_, i) => i !== idx))}
                            />
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {state.receiverIds.length > 1 && (
                                <Badge variant="outline" className="text-purple-600 border-purple-200">
                                    <Users className="h-3 w-3 ml-1" />
                                    {state.receiverIds.length} مستلمين
                                </Badge>
                            )}
                            {state.attachments.length > 0 && (
                                <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                                    <Paperclip className="h-3 w-3 ml-1" />
                                    {state.attachments.length} مرفق
                                </Badge>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-600">
                                إلغاء
                            </Button>
                            <Button
                                type="submit"
                                disabled={sendMessage.isPending || uploading || state.receiverIds.length === 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 min-w-[120px]"
                            >
                                {(sendMessage.isPending || uploading) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {uploading ? 'جاري الرفع...' : 'إرسال'}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ─────────────────────────────────────────────
   MESSAGE LIST ITEM
───────────────────────────────────────────── */
function MessageItem({
    message,
    type,
    isSelected,
    onClick,
}: {
    message: Message;
    type: 'inbox' | 'sent';
    isSelected: boolean;
    onClick: () => void;
}) {
    const user = type === 'inbox' ? message.sender : message.receiver;
    const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';
    const isUnread = !message.isRead && type === 'inbox';

    return (
        <div
            onClick={onClick}
            className={cn(
                'group relative flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-800/60 transition-all duration-150',
                isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-r-[3px] border-r-indigo-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                isUnread && !isSelected && 'bg-blue-50/50 dark:bg-blue-950/20',
            )}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-900" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className={cn(
                        'text-sm truncate text-slate-800 dark:text-slate-200',
                        isUnread && 'font-semibold'
                    )}>
                        {user?.name || 'مستخدم'}
                    </span>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ar })}
                    </span>
                </div>
                <p className={cn(
                    'text-xs truncate mb-0.5',
                    isUnread ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'
                )}>
                    {message.subject}
                </p>
                <p className="text-xs truncate text-slate-400 dark:text-slate-500">
                    {message.content?.substring(0, 60)}...
                </p>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   ATTACHMENT CARD
───────────────────────────────────────────── */
function AttachmentCard({
    att,
    baseUrl: _baseUrl,
    formatSize,
}: {
    att: { name: string; size: string; type: string; url: string };
    baseUrl: string;
    formatSize: (s: string) => string;
}) {
    const [previewOpen, setPreviewOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isImage = att.type.startsWith('image/');
    const isPdf = att.type === 'application/pdf';
    // att.url = '/uploads/uuid.ext' — nginx proxies /uploads/ → backend (ServeStaticModule)
    // Use att.url directly, no need for /api/uploads/file/ prefix
    const fullUrl = att.url || null;

    const handleSaveToDocuments = async () => {
        if (!fullUrl) return;
        setSaving(true);
        try {
            // Fetch the file — /api/uploads/file/:name routes through nginx to backend
            const authState = (() => {
                try {
                    const d = localStorage.getItem('watheeq-auth');
                    return d ? JSON.parse(d)?.state?.token : null;
                } catch { return null; }
            })();

            const headers: Record<string, string> = {};
            if (authState) headers['Authorization'] = `Bearer ${authState}`;

            const response = await fetch(fullUrl, { headers });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            const file = new File([blob], att.name, { type: blob.type || att.type });

            const { documentsApi } = await import('@/api/documents.api');
            // Omit documentType so backend uses default (OTHER)
            await documentsApi.upload({
                file,
                title: att.name,
                description: 'محفوظ من الرسائل الداخلية',
            });
            setSaved(true);
            toast.success('تم حفظ الملف في المستندات ✓');
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('[SaveDoc]', err);
            toast.error('فشل حفظ الملف، حاول مجدداً');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/60 shadow-sm">

                {/* ── Image compact thumbnail ── */}
                {isImage && fullUrl && (
                    <div
                        className="cursor-zoom-in overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center"
                        style={{ height: 100 }}
                        onClick={() => setPreviewOpen(true)}
                    >
                        <img
                            src={fullUrl}
                            alt={att.name}
                            className="h-full w-full object-cover hover:scale-110 transition-transform duration-300"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* ── PDF placeholder (no iframe - blocked by security headers) ── */}
                {isPdf && fullUrl && (
                    <div
                        className="flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-red-50 dark:bg-red-950/20"
                        style={{ height: 80 }}
                        onClick={() => window.open(fullUrl, '_blank')}
                    >
                        <svg className="h-9 w-9 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z"/>
                            <text x="6" y="17" fontSize="5" fill="white" fontWeight="bold">PDF</text>
                        </svg>
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">انقر لفتح PDF</span>
                    </div>
                )}

                {/* ── Footer row ── */}
                <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                    {/* File info */}
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{att.name}</p>
                        <p className="text-[11px] text-slate-400">{formatSize(att.size)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">

                        {/* Preview / Open */}
                        {fullUrl && (
                            <button
                                onClick={() => isImage ? setPreviewOpen(true) : window.open(fullUrl, '_blank')}
                                title={isImage ? 'معاينة' : 'فتح PDF'}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">{isImage ? 'عرض' : 'فتح'}</span>
                            </button>
                        )}

                        {/* Download */}
                        {fullUrl && (
                            <a
                                href={fullUrl}
                                download={att.name}
                                title="تحميل"
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="hidden sm:inline">تحميل</span>
                            </a>
                        )}

                        {/* Save to Documents – always visible */}
                        {fullUrl && (
                            <button
                                onClick={handleSaveToDocuments}
                                disabled={saving || saved}
                                title={saved ? 'تم الحفظ!' : 'حفظ في المستندات'}
                                className={cn(
                                    'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors border',
                                    saved
                                        ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20'
                                )}
                            >
                                {saving ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : saved ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                ) : (
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                )}
                                <span>{saved ? 'تم الحفظ' : 'حفظ'}</span>
                            </button>
                        )}
                    </div>

                    {!fullUrl && <span className="text-xs text-red-400">خطأ في الرفع</span>}
                </div>
            </div>

            {/* Full-screen image preview */}
            {isImage && fullUrl && (
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden rounded-2xl">
                        <DialogHeader className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-row items-center justify-between">
                            <DialogTitle className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                                {att.name}
                            </DialogTitle>
                            <div className="flex items-center gap-2 shrink-0">
                                <a href={fullUrl} download={att.name}
                                    className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    تحميل
                                </a>
                                <button onClick={() => setPreviewOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </DialogHeader>
                        <div className="overflow-auto flex items-center justify-center bg-slate-900" style={{ maxHeight: 'calc(90vh - 60px)' }}>
                            <img src={fullUrl} alt={att.name} className="max-w-full max-h-full object-contain" />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}

/* ─────────────────────────────────────────────

   MESSAGE DETAIL PANEL
───────────────────────────────────────────── */
function MessageDetailPanel({
    messageId,
    type,
    onClose,
    onReply,
    onForward,
}: {
    messageId: string;
    type: 'inbox' | 'sent';
    onClose: () => void;
    onReply: (msg: Message) => void;
    onForward: (msg: Message) => void;
}) {
    const { data: message, isLoading } = useMessage(messageId);
    const deleteMessage = useDeleteMessage();
    const { can, isOwner } = usePermissions();
    const user = useAuthStore(s => s.user);

    const canDelete = isOwner ||
        can('messages', 'delete') ||
        (!!message && message.senderId === user?.id);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <span className="text-sm">جاري التحميل...</span>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                <MessageSquare className="h-12 w-12 opacity-30" />
                <span className="text-sm">الرسالة غير موجودة</span>
            </div>
        );
    }

    const handleDelete = () => {
        deleteMessage.mutate(messageId, { onSuccess: onClose });
    };

    const senderInitials = message.sender?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

    // Parse attachment tags from content
    const parseAttachments = (text: string) => {
        const attRegex = /\[attachment name="([^"]*)" size="([^"]*)" type="([^"]*)" url="([^"]*)"\]/g;
        const attachments: { name: string; size: string; type: string; url: string }[] = [];
        let match;
        while ((match = attRegex.exec(text)) !== null) {
            attachments.push({ name: match[1], size: match[2], type: match[3], url: match[4] });
        }
        return attachments;
    };

    const cleanContent = (text: string) =>
        text.replace(/\[attachment name="[^"]*" size="[^"]*" type="[^"]*" url="[^"]*"\]/g, '').trim();

    const renderContent = (text: string) => {
        const clean = cleanContent(text);
        const parts = clean.split(/(@[\w\u0600-\u06FF]+(?:\s[\w\u0600-\u06FF]+)?)/g);
        return parts.map((part, i) =>
            part.startsWith('@') ? (
                <span key={i} className="text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50 dark:bg-indigo-950/40 rounded px-0.5">
                    {part}
                </span>
            ) : <span key={i}>{part}</span>
        );
    };

    const renderAttachmentCards = (text: string) => {
        const atts = parseAttachments(text);
        if (atts.length === 0) return null;

        const formatSize = (bytes: string) => {
            const b = parseInt(bytes);
            if (isNaN(b)) return bytes;
            if (b < 1024) return `${b} B`;
            if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
            return `${(b / (1024 * 1024)).toFixed(1)} MB`;
        };

        // nginx proxies /uploads/ → backend (ServeStaticModule serves files directly)
        // att.url is already in the correct format: /uploads/uuid.ext

        return (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Paperclip className="h-3 w-3" />
                    المرفقات ({atts.length})
                </p>
                {atts.map((att, idx) => (
                    <AttachmentCard
                        key={idx}
                        att={att}
                        baseUrl=""
                        formatSize={formatSize}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-base truncate flex-1 ml-3">
                    {message.subject}
                </h2>
                <div className="flex items-center gap-1 shrink-0">
                    {/* Reply */}
                    {type === 'inbox' && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50"
                                        onClick={() => onReply(message)}>
                                        <Reply className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>رد على الرسالة</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Forward */}
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                                    onClick={() => onForward(message)}>
                                    <Forward className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>تحويل الرسالة</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* More actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            {type === 'inbox' && (
                                <DropdownMenuItem onClick={() => onReply(message)} className="gap-2 text-green-600">
                                    <Reply className="h-4 w-4" />
                                    رد على الرسالة
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onForward(message)} className="gap-2 text-amber-600">
                                <Forward className="h-4 w-4" />
                                تحويل الرسالة
                            </DropdownMenuItem>
                            {canDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleDelete}
                                        disabled={deleteMessage.isPending}
                                        className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        حذف الرسالة
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Sender info */}
            <div className="px-5 py-4 bg-gradient-to-b from-slate-50/80 to-transparent dark:from-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={message.sender?.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-semibold">
                            {senderInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                                {message.sender?.name}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                &lt;{message.sender?.email}&gt;
                            </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 opacity-60" />
                                إلى: <span className="font-medium text-slate-600 dark:text-slate-300 mr-1">{message.receiver?.name}</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 opacity-60" />
                                {format(new Date(message.createdAt), 'PPpp', { locale: ar })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Message Body */}
            <ScrollArea className="flex-1 px-5 py-5 overflow-y-auto">
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                    {renderContent(message.content)}
                </div>
                {renderAttachmentCards(message.content)}
            </ScrollArea>

            {/* Quick Reply Bar */}
            {type === 'inbox' && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <button
                        className="w-full flex items-center gap-2 text-sm text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-500 transition-all cursor-pointer"
                        onClick={() => onReply(message)}
                    >
                        <CornerUpLeft className="h-4 w-4 shrink-0" />
                        <span>اكتب ردك على {message.sender?.name}...</span>
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function MessagesPage() {
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
    const [search, setSearch] = useState('');
    const [composeOpen, setComposeOpen] = useState(false);
    const [composeInitial, setComposeInitial] = useState<Partial<ComposeState & { mode: ComposeMode }>>({});

    const { data: inboxData, isLoading: inboxLoading, refetch: refetchInbox } = useInboxMessages();
    const { data: sentData, isLoading: sentLoading, refetch: refetchSent } = useSentMessages();
    const { data: unreadData } = useMessagesUnreadCount();
    const markAllAsRead = useMarkAllMessagesAsRead();

    const inboxMessages = inboxData?.data || [];
    const sentMessages = sentData?.data || [];
    const unreadCount = unreadData?.count || 0;

    const currentMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;
    const isLoading = activeTab === 'inbox' ? inboxLoading : sentLoading;

    const filteredMessages = currentMessages.filter(m =>
        m.subject?.toLowerCase().includes(search.toLowerCase()) ||
        m.content?.toLowerCase().includes(search.toLowerCase()) ||
        m.sender?.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.receiver?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const openCompose = useCallback((mode: ComposeMode, msg?: Message) => {
        setComposeInitial({
            mode,
            subject: mode === 'reply' ? `رداً: ${msg?.subject || ''}` :
                     mode === 'forward' ? `تحويل: ${msg?.subject || ''}` : '',
            content: mode === 'forward' && msg
                ? `\n\n------- رسالة محولة -------\nمن: ${msg.sender?.name}\nالموضوع: ${msg.subject}\n\n${msg.content}`
                : '',
            receiverIds: mode === 'reply' && msg?.senderId ? [msg.senderId] : [],
            replyToId: mode === 'reply' ? msg?.id : undefined,
            forwardFromId: mode === 'forward' ? msg?.id : undefined,
        });
        setComposeOpen(true);
    }, []);

    const handleTabChange = (tab: 'inbox' | 'sent') => {
        setActiveTab(tab);
        setSelectedMessageId(null);
    };

    const handleRefresh = () => {
        if (activeTab === 'inbox') refetchInbox();
        else refetchSent();
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* ── Top Bar ── */}
            <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                        <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            الرسائل الداخلية
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            التواصل مع أعضاء الفريق
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={handleRefresh}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>تحديث</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* Bulk Message Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-950/20"
                        onClick={() => openCompose('bulk')}
                    >
                        <Users className="h-3.5 w-3.5" />
                        رسالة جماعية
                    </Button>

                    {/* Compose Button */}
                    <Button
                        size="sm"
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20"
                        onClick={() => openCompose('new')}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        رسالة جديدة
                    </Button>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── Sidebar ── */}
                <div className="w-80 shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-100 dark:border-slate-800">
                        <button
                            onClick={() => handleTabChange('inbox')}
                            className={cn(
                                'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2',
                                activeTab === 'inbox'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <Inbox className="h-4 w-4" />
                            الواردة
                            {unreadCount > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-indigo-500 text-white rounded-full flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('sent')}
                            className={cn(
                                'flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-all border-b-2',
                                activeTab === 'sent'
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}
                        >
                            <Send className="h-4 w-4" />
                            المرسلة
                        </button>
                    </div>

                    {/* Search */}
                    <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="relative">
                            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="البحث في الرسائل..."
                                className="w-full pr-8 pl-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Mark all read */}
                    {activeTab === 'inbox' && unreadCount > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {unreadCount} غير مقروءة
                            </span>
                            <button
                                onClick={() => markAllAsRead.mutate()}
                                disabled={markAllAsRead.isPending}
                                className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors disabled:opacity-50"
                            >
                                <CheckCheck className="h-3 w-3" />
                                قراءة الكل
                            </button>
                        </div>
                    )}

                    {/* Messages List */}
                    <ScrollArea className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                                <span className="text-sm">جاري التحميل...</span>
                            </div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Mail className="h-8 w-8 opacity-40" />
                                </div>
                                <span className="text-sm font-medium">
                                    {search ? 'لا توجد نتائج' : 'لا توجد رسائل'}
                                </span>
                                {!search && (
                                    <button
                                        onClick={() => openCompose('new')}
                                        className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
                                    >
                                        إرسال رسالة جديدة
                                    </button>
                                )}
                            </div>
                        ) : (
                            filteredMessages.map(msg => (
                                <MessageItem
                                    key={msg.id}
                                    message={msg}
                                    type={activeTab}
                                    isSelected={selectedMessageId === msg.id}
                                    onClick={() => setSelectedMessageId(msg.id)}
                                />
                            ))
                        )}
                    </ScrollArea>
                </div>

                {/* ── Detail Panel ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {selectedMessageId ? (
                        <MessageDetailPanel
                            messageId={selectedMessageId}
                            type={activeTab}
                            onClose={() => setSelectedMessageId(null)}
                            onReply={(msg) => openCompose('reply', msg)}
                            onForward={(msg) => openCompose('forward', msg)}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 select-none">
                            <div className="relative">
                                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center shadow-inner">
                                    <MessageSquare className="h-11 w-11 text-indigo-400 dark:text-indigo-500" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-indigo-500 flex items-center justify-center shadow-md">
                                    <Plus className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
                                    اختر رسالة لعرضها
                                </p>
                                <p className="text-sm text-slate-400 dark:text-slate-500">
                                    أو أنشئ رسالة جديدة للتواصل مع الفريق
                                </p>
                            </div>
                            <Button
                                variant="outline" size="sm"
                                className="gap-1.5 mt-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                onClick={() => openCompose('new')}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                رسالة جديدة
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Compose Dialog */}
            <ComposeDialog
                open={composeOpen}
                onOpenChange={setComposeOpen}
                initialState={composeInitial}
            />
        </div>
    );
}
