import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { documentsApi } from '@/api/documents.api';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import {
    MessageSquare, Search, Plus, Users, Send, Paperclip,
    Mic, X, Check, CheckCheck, Trash2, Download,
    Smile, Reply, Forward, Edit3, MoreVertical, Maximize2, File as FileIcon,
    AtSign, Save, Eye, AlertCircle, Settings, Shield,
    UserMinus, UserPlus, Crown,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// EMOJI DATA
// ═══════════════════════════════════════════════════════
const EMOJI_CATEGORIES = [
    { label: '😊', name: 'مشاعر', emojis: ['😀','😁','😂','🤣','😃','😄','😅','😆','😇','😉','😊','😋','😌','😍','😎','😏','😐','😑','😒','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠','😡','😢','😤','😥','😦','😧','😨','😩','😪','😫','😬','😭','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','🥰','🥳','🥺','🤩','🤭','🤫','🤔','🤗'] },
    { label: '👍', name: 'إيماءات', emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','🤚','🖐️','✋','💪','🙏','👐','🤲','🤝','🙌','👏','🤜','🤛','✊','👊','🤦','🤷','💁','🙋','🙆','🙅','🤸','💆','🧘','🕺','👶','🧒','👦','👧','🧑','👨','👩','🧓','👴','👵','👨‍💼','👩‍💼'] },
    { label: '❤️', name: 'قلوب', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💘','💝','💟','♥️','❣️','💔','🔥','✨','⭐','🌟','💫','⚡','🎉','🎊','🎈','🥳','🎁','🏆','🥇','🎯','🎪','🎭','🎨','🎬','🎤','🎧','🎵','🎶','🎸','🎹','🎺','🎻'] },
    { label: '🐶', name: 'حيوانات', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🦆','🦅','🦉','🐺','🐴','🦄','🐝','🦋','🐌','🐛','🦗','🐞','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦀','🐡','🐠','🐟','🐬','🐳','🦈','🐊'] },
    { label: '🍕', name: 'طعام', emojis: ['🍕','🍔','🌮','🌯','🥗','🥙','🥚','🍳','🥞','🍖','🍗','🥩','🍜','🍝','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🧁','🍰','🎂','🍭','🍬','🍫','🍿','🍩','🍪','🍯','🥤','☕','🍵','🧃','🍺','🍻','🥂','🍷','🍸','🥃','🍹','🧉','🍾'] },
    { label: '✈️', name: 'أماكن', emojis: ['🌍','🌎','🌏','🗺️','🏠','🏡','🏢','🏥','🏦','🏨','🏪','🏫','🏬','🏭','🏯','🏰','⛪','🗼','🗽','🌄','🌅','🌆','🌇','🌉','🌌','🌃','🏙️','✈️','🚀','🛸','🚁','🚂','🚃','🚄','🚗','🚕','🚙','🚌','🏎️','🚓','🚑','🚒','🛻','🚚','🚜','⛵','🚢','🚤','🏊','🏖️','🏝️'] },
];

// ═══════════════════════════════════════════════════════
// MAIN CHAT PAGE
// ═══════════════════════════════════════════════════════
export default function ChatPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const currentUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const openMiniChat = useChatStore((s) => s.openMiniChat);

    const { data: conversations = [], isLoading: loadingConversations } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: chatApi.getConversations,
        refetchInterval: 10000,
    });

    const { data: onlineUserIds = [] } = useQuery({
        queryKey: ['chat-online-users'],
        queryFn: chatApi.getOnlineUsers,
        refetchInterval: 15000,
        staleTime: 0,
    });

    useChatSocket({
        onNewMessage: (message: any) => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            if (message.conversationId !== selectedId) {
                useChatStore.getState().incrementUnread(message.conversationId);
            }
        },
    });

    const filteredConversations = conversations.filter((conv: any) => {
        if (!searchQuery) return true;
        const name = conv.type === 'GROUP'
            ? conv.name
            : conv.members?.find((m: any) => m.userId !== currentUser?.id)?.user?.name;
        return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleDeleteConversation = async (convId: string) => {
        try {
            await chatApi.deleteConversation(convId);
            if (selectedId === convId) setSelectedId(null);
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast.success('تم حذف المحادثة');
        } catch {
            toast.error('فشل حذف المحادثة');
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden" dir="rtl"
            style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>

            {/* Sidebar */}
            <div className="w-80 flex flex-col shrink-0 border-l border-white/10"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-indigo-400" />
                            الدردشة
                        </h2>
                        <button onClick={() => setShowNewModal(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:scale-110 transition-all"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input type="text" placeholder="بحث في المحادثات..." value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-9 pl-3 py-2 text-sm rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-white/40">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">لا توجد محادثات</p>
                        </div>
                    ) : filteredConversations.map((conv: any) => (
                        <ConversationItem
                            key={conv.id}
                            conversation={conv}
                            isActive={selectedId === conv.id}
                            currentUserId={currentUser?.id || ''}
                            onlineUserIds={onlineUserIds}
                            onClick={() => { setSelectedId(conv.id); useChatStore.getState().clearUnread(conv.id); }}
                            onPopOut={() => openMiniChat(conv.id)}
                            onDelete={() => handleDeleteConversation(conv.id)}
                        />
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedId ? (
                    <ChatWindow conversationId={selectedId} conversations={conversations} />
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
                                <MessageSquare className="w-12 h-12 text-indigo-400" />
                            </div>
                            <p className="text-xl font-semibold text-white/80">اختر محادثة للبدء</p>
                            <button onClick={() => setShowNewModal(true)}
                                className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 hover:scale-105 transition-all"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                + محادثة جديدة
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showNewModal && (
                <NewConversationModal
                    onClose={() => setShowNewModal(false)}
                    onCreated={(id) => {
                        setSelectedId(id);
                        setShowNewModal(false);
                        queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
                    }}
                />
            )}

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
                .msg-appear { animation: msgAppear 0.25s ease; }
                @keyframes msgAppear { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
                @keyframes highlightPulse {
                    0% { background: rgba(99,102,241,0); }
                    30% { background: rgba(99,102,241,0.25); }
                    100% { background: rgba(99,102,241,0); }
                }
                .msg-highlight { animation: highlightPulse 1.8s ease; border-radius: 12px; }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// CONVERSATION ITEM
// ═══════════════════════════════════════════════════════
function ConversationItem({ conversation, isActive, currentUserId, onlineUserIds, onClick, onPopOut, onDelete }: {
    conversation: any; isActive: boolean; currentUserId: string; onlineUserIds: string[];
    onClick: () => void; onPopOut: () => void; onDelete: () => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const unreadCount = useChatStore((s) => s.unreadCounts[conversation.id] || conversation.unreadCount || 0);
    const otherMember = conversation.type === 'DIRECT' ? conversation.members?.find((m: any) => m.userId !== currentUserId) : null;
    const name = conversation.type === 'GROUP' ? conversation.name : otherMember?.user?.name || 'مجهول';
    const isOnline = otherMember ? onlineUserIds.includes(otherMember.userId) : false;
    const lastMsg = conversation.messages?.[0];
    const lastText = lastMsg?.isDeleted ? '🚫 تم حذف الرسالة' : lastMsg?.content || (lastMsg?.type === 'IMAGE' ? '📷 صورة' : lastMsg?.type === 'FILE' ? '📎 ملف' : '');
    const timeStr = lastMsg?.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : '';

    useEffect(() => {
        const handleClick = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <div className={`relative group flex items-center gap-3 px-3 py-3 cursor-pointer transition-all mx-2 rounded-xl mb-1 ${isActive ? 'bg-indigo-500/20 ring-1 ring-indigo-500/30' : 'hover:bg-white/5'}`}
            onClick={onClick}>
            <div className="relative shrink-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${conversation.type === 'GROUP' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-indigo-500 to-blue-500'}`}>
                    {conversation.type === 'GROUP' ? <Users className="w-5 h-5" /> : name.charAt(0)}
                </div>
                {conversation.type === 'DIRECT' && otherMember && (
                    <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white truncate">{name}</span>
                    <span className="text-xs text-white/40 shrink-0">{timeStr}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-white/50 truncate">{lastText || 'ابدأ المحادثة...'}</p>
                    {unreadCount > 0 && (
                        <span className="shrink-0 bg-indigo-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center font-bold">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
            <div ref={menuRef} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowMenu(v => !v)}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                </button>
                {showMenu && (
                    <div className="absolute left-0 top-8 z-20 rounded-xl shadow-xl overflow-hidden text-sm w-44"
                        style={{ background: 'rgba(30,30,50,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button onClick={() => { onPopOut(); setShowMenu(false); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-white/80 hover:bg-white/10 transition-colors">
                            <Maximize2 className="w-4 h-4" /> فتح منفصل
                        </button>
                        <hr className="border-white/10" />
                        <button onClick={() => { if (confirm('هل تريد حذف هذه المحادثة؟')) { onDelete(); setShowMenu(false); } }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" /> حذف المحادثة
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// CHAT WINDOW
// ═══════════════════════════════════════════════════════
function ChatWindow({ conversationId, conversations }: { conversationId: string; conversations: any[] }) {
    const currentUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
    const [replyTo, setReplyTo] = useState<any>(null);
    const [forwardMsg, setForwardMsg] = useState<any>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [showGroupSettings, setShowGroupSettings] = useState(false);

    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chat-messages', conversationId],
        queryFn: () => chatApi.getMessages(conversationId),
        refetchInterval: 1500, // fast polling as safety net if socket misses
        staleTime: 0,
    });

    const conversation = conversations.find((c: any) => c.id === conversationId);
    const { emitMarkRead } = useChatSocket({
        conversationId,
        onNewMessage: (message: any) => {
            if (message.conversationId === conversationId) {
                queryClient.setQueryData(['chat-messages', conversationId],
                    (old: any[] | undefined) => [...(old || []), message]);
                scrollToBottom();
                emitMarkRead();
            }
        },
        onUserTyping: ({ userId, isTyping }: any) => {
            setTypingUsers((prev) => {
                const next = new Map(prev);
                if (isTyping) {
                    const member = conversation?.members?.find((m: any) => m.userId === userId);
                    next.set(userId, member?.user?.name || 'مجهول');
                } else { next.delete(userId); }
                return next;
            });
        },
        onMessageUpdated: (updated: any) => {
            queryClient.setQueryData(['chat-messages', conversationId],
                (old: any[] | undefined) => old?.map((m) => m.id === updated.id ? updated : m) || []);
        },
        onMessageDeleted: ({ messageId }: any) => {
            queryClient.setQueryData(['chat-messages', conversationId],
                (old: any[] | undefined) => old?.map((m) => m.id === messageId ? { ...m, isDeleted: true, content: null } : m) || []);
        },
    });

    const scrollToBottom = useCallback(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, []);

    const scrollToMsg = useCallback((messageId: string) => {
        const el = document.querySelector(`[data-message-id="${messageId}"]`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('msg-highlight');
            setTimeout(() => el.classList.remove('msg-highlight'), 2000);
        }
    }, []);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
    useEffect(() => { emitMarkRead(); chatApi.markAsRead(conversationId); }, [conversationId, emitMarkRead]);

    const otherMember = conversation?.type === 'DIRECT' ? conversation?.members?.find((m: any) => m.userId !== currentUser?.id) : null;
    const headerTitle = conversation?.type === 'GROUP' ? conversation.name : otherMember?.user?.name || 'مجهول';

    const groupedMessages = useMemo(() => {
        const groups: { date: string; messages: any[] }[] = [];
        messages.forEach((msg: any) => {
            const d = new Date(msg.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
            const last = groups[groups.length - 1];
            if (!last || last.date !== d) groups.push({ date: d, messages: [msg] });
            else last.messages.push(msg);
        });
        return groups;
    }, [messages]);

    return (
        <div className="flex flex-col h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 shrink-0"
                style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ background: conversation?.type === 'GROUP' ? 'linear-gradient(135deg,#8b5cf6,#ec4899)' : 'linear-gradient(135deg,#6366f1,#3b82f6)' }}>
                    {conversation?.type === 'GROUP' ? <Users className="w-5 h-5" /> : headerTitle.charAt(0)}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-white">{headerTitle}</p>
                    <p className="text-xs text-white/50">
                        {conversation?.type === 'GROUP' ? `${conversation.members?.length || 0} أعضاء` : 'محادثة مباشرة'}
                    </p>
                </div>
                {conversation?.type === 'GROUP' && (
                    <button onClick={() => setShowGroupSettings(true)}
                        className="text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
                        <Settings className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white/30">
                        <MessageSquare className="w-12 h-12 mb-3" />
                        <p>لا توجد رسائل. ابدأ المحادثة!</p>
                    </div>
                ) : (
                    groupedMessages.map((group) => (
                        <div key={group.date}>
                            <div className="flex items-center gap-3 my-4">
                                <div className="flex-1 h-px bg-white/10" />
                                <span className="text-xs text-white/30 px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>{group.date}</span>
                                <div className="flex-1 h-px bg-white/10" />
                            </div>
                            {group.messages.map((message: any, idx: number) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isOwn={message.senderId === currentUser?.id}
                                    showSender={conversation?.type === 'GROUP' && (idx === 0 || group.messages[idx - 1]?.senderId !== message.senderId)}
                                    conversationId={conversationId}
                                    onReply={() => setReplyTo(message)}
                                    onForward={() => setForwardMsg(message)}
                                    onImageClick={(url) => setLightboxUrl(url)}
                                    onScrollToMsg={scrollToMsg}
                                />
                            ))}
                        </div>
                    ))
                )}
                {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2">
                        <div className="flex gap-1">
                            {[0, 150, 300].map((d) => (
                                <div key={d} className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                        </div>
                        <span className="text-xs text-white/40">{Array.from(typingUsers.values()).join(' و ')} يكتب...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <MessageInput conversationId={conversationId} conversation={conversation} replyTo={replyTo}
                onClearReply={() => setReplyTo(null)} onMessageSent={scrollToBottom} />

            {forwardMsg && (
                <ForwardModal message={forwardMsg} conversations={conversations}
                    onClose={() => setForwardMsg(null)}
                    onForwarded={() => { setForwardMsg(null); toast.success('تم تحويل الرسالة'); }} />
            )}
            {lightboxUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={() => setLightboxUrl(null)}>
                    <button className="absolute top-4 left-4 text-white/70 hover:text-white"><X className="w-8 h-8" /></button>
                    <img src={lightboxUrl} alt="معاينة" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />
                </div>
            )}
            {showGroupSettings && conversation?.type === 'GROUP' && (
                <GroupSettingsModal
                    conversation={conversation}
                    currentUserId={currentUser?.id || ''}
                    onClose={() => setShowGroupSettings(false)}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════
function MessageBubble({ message, isOwn, showSender, conversationId, onReply, onForward, onImageClick, onScrollToMsg }: {
    message: any; isOwn: boolean; showSender: boolean; conversationId: string;
    onReply: () => void; onForward: () => void; onImageClick: (url: string) => void;
    onScrollToMsg: (id: string) => void;
}) {
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content || '');
    const [saving, setSaving] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [reactionCategory, setReactionCategory] = useState(0);
    const reactionRef = useRef<HTMLDivElement>(null);
    const { emitDeleteMessage, emitReaction } = useChatSocket({ conversationId });
    const queryClient = useQueryClient();
    const timeStr = new Date(message.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) setShowReactionPicker(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSaveEdit = async () => {
        if (!editContent.trim()) return;
        setSaving(true);
        try {
            await chatApi.editMessage(message.id, editContent.trim());
            queryClient.setQueryData(['chat-messages', conversationId],
                (old: any[] | undefined) => old?.map((m) => m.id === message.id ? { ...m, content: editContent.trim(), isEdited: true } : m) || []);
            setIsEditing(false);
        } catch { toast.error('فشل تعديل الرسالة'); }
        finally { setSaving(false); }
    };

    const handleSaveToDocuments = async (fileUrl: string, fileName: string) => {
        try {
            const authState = (() => {
                try { const d = localStorage.getItem('watheeq-auth'); return d ? JSON.parse(d) : null; } catch { return null; }
            })();
            const token = authState?.state?.token || authState?.token;
            const response = await fetch(fileUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            if (!response.ok) throw new Error('فشل');
            const blob = await response.blob();
            const file = new File([blob], fileName || 'file', { type: blob.type });
            await documentsApi.upload({ file, title: fileName || 'ملف من الدردشة' });
            toast.success('تم الحفظ في المستندات ✅');
        } catch { toast.error('فشل الحفظ في المستندات'); }
    };

    if (message.isDeleted) {
        return (
            <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} px-2 mb-1`} data-message-id={message.id}>
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm italic"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                    <AlertCircle className="w-3.5 h-3.5" /> تم حذف هذه الرسالة
                </div>
            </div>
        );
    }

    return (
        <div data-message-id={message.id}
            className={`flex ${isOwn ? 'justify-start' : 'justify-end'} px-2 mb-1 group msg-appear`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => { setShowActions(false); setShowReactionPicker(false); }}>

            <div className={`max-w-[72%] ${isOwn ? 'order-1' : 'order-2'}`}>
                {showSender && !isOwn && (
                    <p className="text-xs font-semibold mb-1 px-3" style={{ color: '#818cf8' }}>{message.sender?.name}</p>
                )}

                {/* Reply Preview — CLICKABLE */}
                {message.replyTo && (
                    <div className={`mx-1 mb-1 px-3 py-1.5 rounded-lg text-xs border-r-2 cursor-pointer hover:opacity-80 transition-opacity ${isOwn ? 'border-indigo-400' : 'border-white/30'}`}
                        style={{ background: 'rgba(255,255,255,0.07)' }}
                        onClick={() => onScrollToMsg(message.replyTo.id)}>
                        <p className="font-medium text-white/60">{message.replyTo.sender?.name}</p>
                        <p className="text-white/40 truncate">{message.replyTo.content || '📎 مرفق'}</p>
                    </div>
                )}

                <div className={`rounded-2xl px-4 py-2.5 ${isOwn ? 'rounded-bl-sm' : 'rounded-br-sm'}`}
                    style={isOwn ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }
                        : { background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>

                    {message.content?.startsWith('↪️') && (
                        <p className="text-xs opacity-60 mb-1 flex items-center gap-1"><Forward className="w-3 h-3" /> مُحوَّل</p>
                    )}

                    {/* IMAGE */}
                    {message.type === 'IMAGE' && message.fileUrl && (
                        <div className="mb-2">
                            <img src={message.fileUrl} alt={message.fileName || 'صورة'}
                                className="rounded-lg max-w-full max-h-52 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => onImageClick(message.fileUrl)} />
                            <button onClick={() => handleSaveToDocuments(message.fileUrl, message.fileName || 'image.jpg')}
                                className="mt-1.5 flex items-center gap-1 text-xs opacity-70 hover:opacity-100 transition-opacity">
                                <Save className="w-3 h-3" /> حفظ في المستندات
                            </button>
                        </div>
                    )}

                    {/* FILE */}
                    {message.type === 'FILE' && message.fileUrl && (
                        <div className="mb-2">
                            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(255,255,255,0.15)' }}>
                                    {message.fileName?.endsWith('.pdf') ? <span className="text-red-400 font-bold text-xs">PDF</span> : <FileIcon className="w-5 h-5 text-white/70" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{message.fileName}</p>
                                    <p className="text-xs opacity-60">{message.fileSize ? `${(message.fileSize / 1024).toFixed(0)} KB` : ''}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-1.5 text-xs opacity-70">
                                <a href={message.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:opacity-100"><Eye className="w-3 h-3" /> فتح</a>
                                <a href={message.fileUrl} download={message.fileName} className="flex items-center gap-1 hover:opacity-100"><Download className="w-3 h-3" /> تحميل</a>
                                <button onClick={() => handleSaveToDocuments(message.fileUrl, message.fileName)} className="flex items-center gap-1 hover:opacity-100"><Save className="w-3 h-3" /> حفظ</button>
                            </div>
                        </div>
                    )}

                    {/* VOICE */}
                    {message.type === 'VOICE' && (
                        <div className="flex items-center gap-3 py-1 mb-1">
                            <Mic className="w-4 h-4" />
                            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <div className="h-full rounded-full w-3/5" style={{ background: 'rgba(255,255,255,0.6)' }} />
                            </div>
                        </div>
                    )}

                    {/* TEXT / EDIT */}
                    {isEditing ? (
                        <div>
                            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') setIsEditing(false); }}
                                className="w-full text-sm rounded-lg p-2 resize-none focus:outline-none"
                                style={{ background: 'rgba(0,0,0,0.2)', color: 'white', minWidth: '200px' }}
                                rows={2} autoFocus />
                            <div className="flex gap-2 mt-1">
                                <button onClick={handleSaveEdit} disabled={saving}
                                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30">{saving ? '...' : 'حفظ'}</button>
                                <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20">إلغاء</button>
                            </div>
                        </div>
                    ) : message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1 mt-1.5" style={{ opacity: 0.5, fontSize: '11px' }}>
                        <span>{timeStr}</span>
                        {message.isEdited && <span>(معدّل)</span>}
                        {isOwn && (message.receipts?.length > 0 ? <CheckCheck className="w-3.5 h-3.5 text-green-300 ml-0.5" /> : <Check className="w-3 h-3 ml-0.5" />)}
                    </div>
                </div>

                {/* Reactions display */}
                {message.reactions?.length > 0 && (
                    <div className="flex gap-1 mt-1 px-2 flex-wrap">
                        {Object.entries(message.reactions.reduce((acc: any, r: any) => { acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc; }, {})).map(([emoji, count]) => (
                            <button key={emoji} onClick={() => emitReaction(message.id, emoji)}
                                className="rounded-full px-2 py-0.5 text-xs hover:scale-110 transition-transform"
                                style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                                {emoji} {(count as number) > 1 && count as number}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Toolbar */}
            <div className={`flex flex-col gap-0.5 self-end mb-1 transition-opacity ${showActions ? 'opacity-100' : 'opacity-0'} ${isOwn ? 'order-2 ml-1' : 'order-1 mr-1'}`}>
                {/* FULL REACTION PICKER */}
                <div ref={reactionRef} className="relative">
                    <button onClick={() => setShowReactionPicker(v => !v)}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-yellow-400 transition-colors mb-0.5"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <Smile className="w-3.5 h-3.5" />
                    </button>
                    {showReactionPicker && (
                        <div className={`absolute ${isOwn ? 'left-0' : 'right-0'} bottom-8 z-20 rounded-xl overflow-hidden shadow-2xl w-64`}
                            style={{ background: 'rgba(20,20,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {/* Category tabs */}
                            <div className="flex border-b border-white/10">
                                {EMOJI_CATEGORIES.map((cat, i) => (
                                    <button key={i} onClick={() => setReactionCategory(i)}
                                        className={`flex-1 py-1.5 text-sm transition-colors ${reactionCategory === i ? 'bg-indigo-500/30' : 'hover:bg-white/5'}`}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            {/* Emoji grid */}
                            <div className="p-1.5 h-36 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-8 gap-0.5">
                                    {EMOJI_CATEGORIES[reactionCategory].emojis.map((emoji) => (
                                        <button key={emoji}
                                            onClick={() => { emitReaction(message.id, emoji); setShowReactionPicker(false); }}
                                            className="w-7 h-7 flex items-center justify-center rounded text-base hover:bg-white/10 hover:scale-125 transition-all">
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-0.5">
                    <button onClick={onReply} title="رد"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <Reply className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={onForward} title="تحويل"
                        className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <Forward className="w-3.5 h-3.5" />
                    </button>
                    {isOwn && !message.isDeleted && (
                        <>
                            <button onClick={() => { setIsEditing(true); setEditContent(message.content || ''); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-indigo-400 transition-colors"
                                style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm('هل تريد حذف هذه الرسالة؟')) emitDeleteMessage(message.id); }}
                                className="w-7 h-7 flex items-center justify-center rounded-full text-white/60 hover:text-red-400 transition-colors"
                                style={{ background: 'rgba(255,255,255,0.08)' }}>
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MESSAGE INPUT
// ═══════════════════════════════════════════════════════
function MessageInput({ conversationId, conversation, replyTo, onClearReply, onMessageSent }: {
    conversationId: string; conversation: any; replyTo: any;
    onClearReply: () => void; onMessageSent?: () => void;
}) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isTypingFlag, setIsTypingFlag] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [emojiCategory, setEmojiCategory] = useState(0);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionStart, setMentionStart] = useState(0);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();
    const currentUser = useAuthStore((s) => s.user);
    const { emitTyping } = useChatSocket({ conversationId });
    const members = conversation?.members?.map((m: any) => m.user).filter(Boolean) || [];

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];
        return members.filter((u: any) => u.name?.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6);
    }, [mentionQuery, members]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        const cursor = e.target.selectionStart;
        setContent(val);
        const textBefore = val.slice(0, cursor);
        const match = textBefore.match(/@(\w*)$/);
        if (match) { setMentionQuery(match[1]); setMentionStart(cursor - match[0].length); }
        else setMentionQuery(null);
        if (!isTypingFlag) { setIsTypingFlag(true); emitTyping(true); }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => { setIsTypingFlag(false); emitTyping(false); }, 2000);
        const ta = textareaRef.current;
        if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; }
    };

    const insertMention = (user: any) => {
        const cursor = textareaRef.current?.selectionStart || content.length;
        const newContent = `${content.slice(0, mentionStart)}@${user.name} ${content.slice(cursor)}`;
        setContent(newContent);
        setMentionQuery(null);
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const handleSend = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setIsSending(true);

        // Optimistic update for text messages (shows instantly)
        if (content.trim() && attachments.length === 0) {
            const optimisticMsg = {
                id: `temp-${Date.now()}`,
                conversationId,
                senderId: currentUser?.id || '',
                content: content.trim(),
                type: 'TEXT',
                createdAt: new Date().toISOString(),
                sender: { id: currentUser?.id, name: currentUser?.name || 'أنت' },
                replyTo: replyTo || null,
            };
            queryClient.setQueryData(
                ['chat-messages', conversationId],
                (old: any[] | undefined) => [...(old || []), optimisticMsg],
            );
            const sentContent = content.trim();
            setContent('');
            setIsTypingFlag(false);
            emitTyping(false);
            onClearReply();
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            onMessageSent?.();

            try {
                const msg = await chatApi.sendMessage(conversationId, { content: sentContent, type: 'TEXT', replyToId: replyTo?.id });
                queryClient.setQueryData(
                    ['chat-messages', conversationId],
                    (old: any[] | undefined) => old?.map(m => m.id === optimisticMsg.id ? msg : m) || [msg],
                );
                queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            } catch {
                queryClient.setQueryData(
                    ['chat-messages', conversationId],
                    (old: any[] | undefined) => old?.filter(m => m.id !== optimisticMsg.id) || [],
                );
                setContent(sentContent);
                toast.error('فشل إرسال الرسالة');
            } finally {
                setIsSending(false);
            }
            return;
        }

        // File attachments (no optimistic, wait for upload)
        try {
            for (const att of attachments) {
                await chatApi.sendMessage(conversationId, {
                    content: content.trim() || undefined,
                    type: att.mimeType?.startsWith('image/') ? 'IMAGE' : 'FILE',
                    fileUrl: att.url, fileName: att.fileName, fileSize: att.fileSize, fileMimeType: att.mimeType,
                    replyToId: replyTo?.id,
                });
            }
            setContent(''); setAttachments([]); setIsTypingFlag(false); emitTyping(false); onClearReply();
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            onMessageSent?.();
        } catch { toast.error('فشل إرسال الرسالة'); }
        finally { setIsSending(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && mentionQuery !== null) { setMentionQuery(null); return; }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        for (const file of Array.from(files)) {
            if (file.size > 25 * 1024 * 1024) { toast.error('الحجم يجب أن يكون أقل من 25 ميجابايت'); continue; }
            try { const result = await chatApi.uploadFile(file); setAttachments((prev) => [...prev, result]); }
            catch { toast.error('فشل رفع الملف'); }
        }
        e.target.value = '';
    };

    return (
        <div className="shrink-0 border-t border-white/10 p-3" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)' }}>
            {replyTo && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Reply className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-indigo-400">{replyTo.sender?.name}</p>
                        <p className="text-xs text-white/50 truncate">{replyTo.content || '📎 مرفق'}</p>
                    </div>
                    <button onClick={onClearReply} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
            )}

            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                    {attachments.map((att, idx) => (
                        <div key={idx} className="relative group">
                            {att.mimeType?.startsWith('image/') ? (
                                <img src={att.url} alt={att.fileName} className="w-16 h-16 object-cover rounded-lg" style={{ border: '1px solid rgba(255,255,255,0.2)' }} />
                            ) : (
                                <div className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/70"
                                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <Paperclip className="w-3 h-3" />
                                    <span className="max-w-[100px] truncate">{att.fileName}</span>
                                </div>
                            )}
                            <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="relative">
                {/* @Mention Dropdown */}
                {mentionQuery !== null && mentionSuggestions.length > 0 && (
                    <div className="absolute bottom-full mb-2 right-0 rounded-xl overflow-hidden shadow-2xl z-10 w-56"
                        style={{ background: 'rgba(20,20,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <p className="text-xs text-white/40 px-3 py-1.5 border-b border-white/10">@ ذكر</p>
                        {mentionSuggestions.map((user: any) => (
                            <button key={user.id} onClick={() => insertMention(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-white hover:bg-indigo-500/20 transition-colors">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold shrink-0">
                                    {user.name?.charAt(0)}
                                </div>
                                <span className="text-sm">{user.name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Emoji Picker */}
                {showEmoji && (
                    <div className="absolute bottom-full mb-2 left-0 rounded-xl overflow-hidden shadow-2xl z-10 w-80"
                        style={{ background: 'rgba(20,20,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}
                        onMouseLeave={() => setShowEmoji(false)}>
                        <div className="flex border-b border-white/10">
                            {EMOJI_CATEGORIES.map((cat, i) => (
                                <button key={i} onClick={() => setEmojiCategory(i)}
                                    className={`flex-1 py-2 text-base transition-colors ${emojiCategory === i ? 'bg-indigo-500/30' : 'hover:bg-white/5'}`}>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-2 h-48 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-9 gap-0.5">
                                {EMOJI_CATEGORIES[emojiCategory].emojis.map((emoji) => (
                                    <button key={emoji} onClick={() => { setContent(prev => prev + emoji); textareaRef.current?.focus(); }}
                                        className="w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-white/10 hover:scale-125 transition-all">
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Input Row */}
                <div className="flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()}
                        className="text-white/40 hover:text-indigo-400 p-2 rounded-full hover:bg-white/5 transition-all shrink-0">
                        <Paperclip className="w-5 h-5" />
                    </button>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />

                    <div className="flex-1 relative">
                        <textarea ref={textareaRef} value={content} onChange={handleChange} onKeyDown={handleKeyDown}
                            placeholder="اكتب رسالة... (@ للإشارة)" rows={1}
                            className="w-full resize-none rounded-2xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 pr-10"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', direction: 'rtl', minHeight: '42px', maxHeight: '120px', overflow: 'hidden' }} />
                        {content.includes('@') && (
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
                        )}
                    </div>

                    <button onClick={() => setShowEmoji(v => !v)}
                        className={`text-white/40 hover:text-yellow-400 p-2 rounded-full hover:bg-white/5 transition-all shrink-0 ${showEmoji ? 'text-yellow-400' : ''}`}>
                        <Smile className="w-5 h-5" />
                    </button>

                    <button onClick={handleSend} disabled={isSending || (!content.trim() && attachments.length === 0)}
                        className={`p-2.5 rounded-full transition-all shrink-0 ${content.trim() || attachments.length > 0 ? 'text-white shadow-lg hover:scale-110' : 'opacity-30 cursor-not-allowed'}`}
                        style={content.trim() || attachments.length > 0 ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : { background: 'rgba(255,255,255,0.1)' }}>
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// GROUP SETTINGS MODAL
// ═══════════════════════════════════════════════════════
function GroupSettingsModal({ conversation, currentUserId, onClose }: {
    conversation: any; currentUserId: string; onClose: () => void;
}) {
    const [tab, setTab] = useState<'info' | 'members' | 'add'>('info');
    const [groupName, setGroupName] = useState(conversation.name || '');
    const [isSaving, setIsSaving] = useState(false);
    const [searchUser, setSearchUser] = useState('');
    const queryClient = useQueryClient();

    const { data: allUsers = [] } = useQuery<any[]>({ queryKey: ['users-for-chat'], queryFn: chatApi.getUsers });

    const currentMember = conversation.members?.find((m: any) => m.userId === currentUserId);
    const isAdmin = currentMember?.isAdmin;

    const handleSaveName = async () => {
        if (!groupName.trim()) return;
        setIsSaving(true);
        try {
            await chatApi.updateGroup(conversation.id, { name: groupName.trim() });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast.success('تم تحديث اسم المجموعة');
        } catch { toast.error('فشل التحديث'); }
        finally { setIsSaving(false); }
    };

    const handleAddMember = async (userId: string) => {
        try {
            await chatApi.addMember(conversation.id, userId);
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast.success('تمت إضافة العضو');
        } catch (err: any) { toast.error(err?.response?.data?.message || 'فشلت الإضافة'); }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('هل تريد إزالة هذا العضو؟')) return;
        try {
            await chatApi.removeMember(conversation.id, userId);
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast.success('تمت إزالة العضو');
        } catch (err: any) { toast.error(err?.response?.data?.message || 'فشلت الإزالة'); }
    };

    const handleToggleAdmin = async (userId: string) => {
        try {
            await chatApi.toggleAdmin(conversation.id, userId);
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            toast.success('تم تحديث صلاحيات العضو');
        } catch (err: any) { toast.error(err?.response?.data?.message || 'فشل التحديث'); }
    };

    const activeMembers = conversation.members?.filter((m: any) => !m.leftAt) || [];
    const memberIds = activeMembers.map((m: any) => m.userId);
    const availableUsers = (allUsers as any[]).filter(u => !memberIds.includes(u.id) && u.id !== currentUserId
        && u.name?.toLowerCase().includes(searchUser.toLowerCase()));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="w-[420px] rounded-2xl overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                style={{ background: 'rgba(15,12,41,0.98)', border: '1px solid rgba(99,102,241,0.3)' }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-400" /> إعدادات المجموعة
                    </h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    {[{ key: 'info', label: 'معلومات' }, { key: 'members', label: `الأعضاء (${activeMembers.length})` }, { key: 'add', label: 'إضافة عضو' }].map(t => (
                        <button key={t.key} onClick={() => setTab(t.key as any)}
                            className={`flex-1 py-3 text-sm font-medium transition-all ${tab === t.key ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/70'}`}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {tab === 'info' && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">اسم المجموعة</label>
                                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                                    disabled={!isAdmin}
                                    className="w-full rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                            </div>
                            {isAdmin && (
                                <button onClick={handleSaveName} disabled={isSaving || !groupName.trim()}
                                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            )}
                            {!isAdmin && <p className="text-xs text-white/30 text-center">فقط المشرف يمكنه تعديل المجموعة</p>}
                        </div>
                    )}

                    {tab === 'members' && (
                        <div className="space-y-2">
                            {activeMembers.map((member: any) => (
                                <div key={member.userId} className="flex items-center gap-3 p-3 rounded-xl"
                                    style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                        {member.user?.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{member.user?.name}
                                            {member.userId === currentUserId && <span className="text-xs text-white/30 mr-1">(أنت)</span>}
                                        </p>
                                        {member.isAdmin && (
                                            <span className="text-xs text-yellow-400 flex items-center gap-1">
                                                <Crown className="w-3 h-3" /> مشرف
                                            </span>
                                        )}
                                    </div>
                                    {isAdmin && member.userId !== currentUserId && (
                                        <div className="flex gap-1">
                                            <button onClick={() => handleToggleAdmin(member.userId)} title={member.isAdmin ? 'إلغاء المشرف' : 'تعيين مشرف'}
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors hover:bg-white/10 ${member.isAdmin ? 'text-yellow-400' : 'text-white/40'}`}>
                                                <Shield className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleRemoveMember(member.userId)} title="إزالة"
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors">
                                                <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {tab === 'add' && (
                        <div>
                            {!isAdmin ? (
                                <p className="text-center text-white/30 py-8">فقط المشرف يمكنه إضافة أعضاء</p>
                            ) : (
                                <>
                                    <div className="relative mb-3">
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                        <input type="text" placeholder="بحث عن مستخدم..." value={searchUser}
                                            onChange={(e) => setSearchUser(e.target.value)}
                                            className="w-full pr-9 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    </div>
                                    <div className="space-y-1">
                                        {availableUsers.map((user: any) => (
                                            <button key={user.id} onClick={() => handleAddMember(user.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div className="flex-1 text-right">
                                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                                    <p className="text-xs text-white/40">{user.email}</p>
                                                </div>
                                                <UserPlus className="w-4 h-4 text-indigo-400 shrink-0" />
                                            </button>
                                        ))}
                                        {availableUsers.length === 0 && (
                                            <p className="text-center text-white/30 py-6 text-sm">لا يوجد مستخدمون متاحون</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// FORWARD MODAL
// ═══════════════════════════════════════════════════════
function ForwardModal({ message, conversations, onClose, onForwarded }: {
    message: any; conversations: any[]; onClose: () => void; onForwarded: () => void;
}) {
    const [selected, setSelected] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    const currentUser = useAuthStore((s) => s.user);

    const getName = (conv: any) => conv.type === 'GROUP'
        ? conv.name : conv.members?.find((m: any) => m.userId !== currentUser?.id)?.user?.name || 'مجهول';

    const handleForward = async () => {
        if (!selected) return;
        setIsSending(true);
        try { await chatApi.forwardMessage(message.id, selected); onForwarded(); }
        catch { toast.error('فشل تحويل الرسالة'); }
        finally { setIsSending(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="w-80 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}
                style={{ background: 'rgba(20,20,40,0.98)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <h3 className="text-white font-semibold">تحويل الرسالة</h3>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {conversations.map((conv: any) => (
                        <button key={conv.id} onClick={() => setSelected(conv.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors ${selected === conv.id ? 'bg-indigo-500/30 ring-1 ring-indigo-500/50' : 'hover:bg-white/5'}`}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                style={{ background: conv.type === 'GROUP' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'linear-gradient(135deg, #6366f1, #3b82f6)' }}>
                                {conv.type === 'GROUP' ? <Users className="w-4 h-4" /> : getName(conv).charAt(0)}
                            </div>
                            <span className="text-white text-sm">{getName(conv)}</span>
                        </button>
                    ))}
                </div>
                <div className="px-4 py-3 border-t border-white/10">
                    <button onClick={handleForward} disabled={!selected || isSending}
                        className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {isSending ? 'جارٍ التحويل...' : 'تحويل ↪️'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// NEW CONVERSATION MODAL
// ═══════════════════════════════════════════════════════
function NewConversationModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
    const [tab, setTab] = useState<'dm' | 'group'>('dm');
    const [search, setSearch] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const { data: users = [] } = useQuery({ queryKey: ['users-for-chat'], queryFn: chatApi.getUsers });
    const currentUser = useAuthStore((s) => s.user);

    const filteredUsers = (users as any[]).filter(
        (u: any) => u.id !== currentUser?.id && u.name?.toLowerCase().includes(search.toLowerCase()),
    );

    const handleCreateDM = async (userId: string) => {
        setIsCreating(true);
        try { const conv = await chatApi.getOrCreateDM(userId); onCreated(conv.id); }
        catch { toast.error('فشل إنشاء المحادثة'); }
        finally { setIsCreating(false); }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) return;
        setIsCreating(true);
        try { const conv = await chatApi.createGroup({ name: groupName, memberIds: selectedUsers }); onCreated(conv.id); }
        catch { toast.error('فشل إنشاء المجموعة'); }
        finally { setIsCreating(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
            <div className="w-96 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}
                style={{ background: 'rgba(15,12,41,0.98)', border: '1px solid rgba(99,102,241,0.3)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))' }}>
                    <h2 className="text-lg font-bold text-white">محادثة جديدة</h2>
                    <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex border-b border-white/10">
                    {[{ key: 'dm', label: 'فردية', icon: <MessageSquare className="w-4 h-4" /> },
                        { key: 'group', label: 'مجموعة', icon: <Users className="w-4 h-4" /> }].map(({ key, label, icon }) => (
                        <button key={key} onClick={() => setTab(key as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all ${tab === key ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/40 hover:text-white/70'}`}>
                            {icon} {label}
                        </button>
                    ))}
                </div>
                <div className="p-4">
                    {tab === 'group' && (
                        <input type="text" placeholder="اسم المجموعة" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                            className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 mb-3"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    )}
                    <div className="relative mb-3">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input type="text" placeholder="بحث عن مستخدم..." value={search} onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-9 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                        {filteredUsers.map((user: any) => (
                            <button key={user.id}
                                onClick={() => tab === 'dm' ? handleCreateDM(user.id) : setSelectedUsers(prev =>
                                    prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-right ${tab === 'group' && selectedUsers.includes(user.id) ? 'bg-indigo-500/20 ring-1 ring-indigo-500/40' : 'hover:bg-white/5'}`}>
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                    {user.name?.charAt(0)}
                                </div>
                                <div className="flex-1 text-right">
                                    <p className="text-sm font-medium text-white">{user.name}</p>
                                    <p className="text-xs text-white/40">{user.email}</p>
                                </div>
                                {tab === 'group' && selectedUsers.includes(user.id) && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                            </button>
                        ))}
                    </div>
                    {tab === 'group' && selectedUsers.length > 0 && (
                        <button onClick={handleCreateGroup} disabled={isCreating || !groupName.trim()}
                            className="mt-4 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40"
                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                            {isCreating ? 'جارٍ الإنشاء...' : `إنشاء (${selectedUsers.length} أعضاء)`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
