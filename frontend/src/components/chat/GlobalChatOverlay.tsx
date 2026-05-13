/**
 * GlobalChatOverlay — floating mini-chat windows, persists across all page navigation.
 *
 * KEY DESIGN DECISIONS:
 * 1. Each FloatingChatWindow is fully self-contained — minimize state is internal.
 * 2. Body uses style.display toggle (NOT conditional rendering) to avoid unmount cycles.
 * 3. Windows are positioned with individual `fixed` left values — no shared flex container.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import {
    MessageSquare, X, ChevronDown, ChevronUp,
    Users, Send, Smile, Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';

const QUICK_EMOJIS = ['😀','😂','❤️','👍','🎉','😢','😍','🔥','✨','😎','👏','🙏','💪','🤣','😊','🥰'];
const ALL_EMOJIS = [
    '😀','😁','😂','🤣','😃','😄','😅','😆','😇','😉','😊','😋','😌','😍','😎','😏',
    '😐','😑','😒','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠',
    '😡','😢','😤','😥','😦','😧','😨','😩','😪','😫','😬','😭','😮','😯','😰','😱',
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💕','💞','💓','💗','💖','💘','💝','💟',
    '👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👋','🤚','🖐️','✋','💪','🙏','👏',
    '🎉','🎊','🎈','🥳','🎁','🏆','✨','⭐','🌟','💫','🔥','⚡','🌈','🍕','🍔','🎸',
];

const WINDOW_WIDTH = 308; // px
const WINDOW_GAP   = 12;  // px gap between windows
const BOTTOM_OFFSET = 16; // px from bottom

// ═══════════════════════════════════════════════════════
// HEARTBEAT MANAGER
// ═══════════════════════════════════════════════════════
export function HeartbeatManager() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    useEffect(() => {
        if (!isAuthenticated) return;
        chatApi.heartbeat().catch(() => {});
        const id = setInterval(() => chatApi.heartbeat().catch(() => {}), 10000);
        return () => clearInterval(id);
    }, [isAuthenticated]);
    return null;
}

// ═══════════════════════════════════════════════════════
// GLOBAL CHAT OVERLAY
// ═══════════════════════════════════════════════════════
export function GlobalChatOverlay() {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const miniChats     = useChatStore((s) => s.miniChats);
    const closeMiniChat = useChatStore((s) => s.closeMiniChat);
    const currentUser   = useAuthStore((s) => s.user);
    const queryClient   = useQueryClient();

    const { data: conversations = [] } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: chatApi.getConversations,
        enabled: isAuthenticated,
        refetchInterval: 5000,
        staleTime: 0,
    });

    useChatSocket({
        onNewMessage: (message: any) => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            useChatStore.getState().incrementUnread(message.conversationId);
        },
    });

    if (!isAuthenticated || miniChats.length === 0) return null;

    return (
        <>
            {miniChats.map((mc, index) => {
                const conv = (conversations as any[]).find((c: any) => c.id === mc.id);
                if (!conv) return null;
                // Position each window independently — no shared flex container
                const leftPx = BOTTOM_OFFSET + index * (WINDOW_WIDTH + WINDOW_GAP);
                return (
                    <FloatingChatWindow
                        key={mc.id}
                        conversation={conv}
                        leftOffset={leftPx}
                        currentUserId={currentUser?.id || ''}
                        onClose={() => closeMiniChat(mc.id)}
                    />
                );
            })}
        </>
    );
}

// ═══════════════════════════════════════════════════════
// FLOATING CHAT WINDOW  — fully self-contained
// ═══════════════════════════════════════════════════════
interface FloatingProps {
    conversation: any;
    leftOffset: number;
    currentUserId: string;
    onClose: () => void;
}

function FloatingChatWindow({ conversation, leftOffset, currentUserId, onClose }: FloatingProps) {
    // ── Minimize state — stored in useRef to avoid stale closures ──────────────
    const minimizedRef = useRef(false);
    const [minimizedUI, setMinimizedUI] = useState(false); // only for header icon/body display

    const bodyRef = useRef<HTMLDivElement>(null);

    const doToggle = useCallback(() => {
        minimizedRef.current = !minimizedRef.current;
        setMinimizedUI(minimizedRef.current);               // re-render header icon
        if (bodyRef.current) {
            bodyRef.current.style.display = minimizedRef.current ? 'none' : 'flex';
        }
    }, []);

    // ── Conversation info ────────────────────────────────────────────────────
    const otherMember = conversation.type === 'DIRECT'
        ? conversation.members?.find((m: any) => m.userId !== currentUserId)
        : null;
    const name = conversation.type === 'GROUP'
        ? conversation.name
        : otherMember?.user?.name || 'مجهول';

    // ── Message state ────────────────────────────────────────────────────────
    const [content, setContent]     = useState('');
    const [isSending, setIsSending] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [emojiSearch, setEmojiSearch] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef   = useRef<HTMLInputElement>(null);
    const queryClient    = useQueryClient();

    const { data: messages = [], isLoading: loadingMsgs } = useQuery({
        queryKey: ['chat-messages-float', conversation.id],
        queryFn: () => chatApi.getMessages(conversation.id),
        enabled: !minimizedRef.current,
        refetchInterval: 2000,
        staleTime: 0,
    });

    const scrollToBottom = useCallback(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }, []);

    useChatSocket({
        conversationId: conversation.id,
        onNewMessage: (msg: any) => {
            if (msg.conversationId !== conversation.id) return;
            queryClient.setQueryData(
                ['chat-messages-float', conversation.id],
                (old: any[] | undefined) => {
                    if (!old) return [msg];
                    if (old.find(m => m.id === msg.id)) return old;
                    return [...old, msg];
                },
            );
            scrollToBottom();
            chatApi.markAsRead(conversation.id).catch(() => {});
            useChatStore.getState().clearUnread(conversation.id);
        },
    });

    useEffect(() => {
        scrollToBottom();
        chatApi.markAsRead(conversation.id).catch(() => {});
        useChatStore.getState().clearUnread(conversation.id);
    }, [conversation.id, scrollToBottom]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // ── Send message ─────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!content.trim()) return;
        setIsSending(true);
        const optimistic = {
            id: `tmp-${Date.now()}`,
            conversationId: conversation.id,
            senderId: currentUserId,
            content: content.trim(),
            type: 'TEXT',
            createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData(
            ['chat-messages-float', conversation.id],
            (old: any[] | undefined) => [...(old || []), optimistic],
        );
        const sent = content.trim();
        setContent('');
        scrollToBottom();
        try {
            const msg = await chatApi.sendMessage(conversation.id, { content: sent, type: 'TEXT' });
            queryClient.setQueryData(
                ['chat-messages-float', conversation.id],
                (old: any[] | undefined) => old?.map(m => m.id === optimistic.id ? msg : m) || [msg],
            );
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
        } catch {
            queryClient.setQueryData(
                ['chat-messages-float', conversation.id],
                (old: any[] | undefined) => old?.filter(m => m.id !== optimistic.id) || [],
            );
            setContent(sent);
            toast.error('فشل إرسال الرسالة');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            toast.loading('جارٍ رفع الملف...', { id: `upload-${conversation.id}` });
            const result = await chatApi.uploadFile(file);
            await chatApi.sendMessage(conversation.id, {
                type: file.type.startsWith('image/') ? 'IMAGE' : 'FILE',
                fileUrl: result.url,
                fileName: result.fileName || file.name,
                fileSize: result.fileSize || file.size,
                fileMimeType: result.mimeType || file.type,
            });
            queryClient.invalidateQueries({ queryKey: ['chat-messages-float', conversation.id] });
            toast.success('تم الإرسال', { id: `upload-${conversation.id}` });
        } catch {
            toast.error('فشل الرفع', { id: `upload-${conversation.id}` });
        }
        e.target.value = '';
    };

    const unreadCount = useChatStore((s) => s.unreadCounts[conversation.id] || 0);

    return (
        <div
            data-chat-window={conversation.id}
            style={{
                position: 'fixed',
                bottom: BOTTOM_OFFSET,
                left: leftOffset,
                width: WINDOW_WIDTH,
                zIndex: 9990,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 16,
                overflow: 'visible',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                background: 'rgba(15,12,41,0.98)',
                border: '1px solid rgba(99,102,241,0.4)',
            }}
        >
            {/* ── Header ── */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    borderRadius: minimizedUI ? 16 : '16px 16px 0 0',
                    userSelect: 'none',
                    cursor: 'pointer',
                }}
                onClick={doToggle}
            >
                {/* Avatar */}
                <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                    {conversation.type === 'GROUP' ? <Users size={14} /> : name.charAt(0)}
                </div>

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {name}
                    </p>
                    {unreadCount > 0 && (
                        <span style={{ fontSize: 11, color: '#c7d2fe' }}>{unreadCount} جديدة</span>
                    )}
                </div>

                {/* Controls — stopPropagation so they don't trigger the header's onClick */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {unreadCount > 0 && minimizedUI && (
                        <span style={{
                            background: '#ef4444', color: 'white', fontSize: 10,
                            borderRadius: 9999, padding: '1px 6px', fontWeight: 700,
                        }}>{unreadCount}</span>
                    )}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); doToggle(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)', display: 'flex',
                            alignItems: 'center', padding: 2, borderRadius: 4,
                        }}
                    >
                        {minimizedUI ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.7)', display: 'flex',
                            alignItems: 'center', padding: 2, borderRadius: 4,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* ── Body — always in DOM, toggled via display ── */}
            <div
                ref={bodyRef}
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                {/* Messages */}
                <div style={{
                    height: 280, overflowY: 'auto', padding: 12,
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    {loadingMsgs ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <div style={{
                                width: 24, height: 24, border: '2px solid rgba(99,102,241,0.3)',
                                borderTopColor: '#6366f1', borderRadius: '50%',
                                animation: 'spin 0.8s linear infinite',
                            }} />
                        </div>
                    ) : (messages as any[]).length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
                            <MessageSquare size={32} style={{ color: 'rgba(255,255,255,0.2)' }} />
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>ابدأ المحادثة!</span>
                        </div>
                    ) : (messages as any[]).map((msg: any) => {
                        const isOwn = msg.senderId === currentUserId;
                        if (msg.isDeleted) return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-start' : 'flex-end' }}>
                                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>تم حذف الرسالة</span>
                            </div>
                        );
                        return (
                            <div key={msg.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-start' : 'flex-end' }}>
                                <div style={{
                                    maxWidth: '85%', padding: '6px 12px',
                                    borderRadius: isOwn ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                                    fontSize: 13, color: 'white',
                                    background: isOwn
                                        ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                                        : 'rgba(255,255,255,0.1)',
                                    border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                }}>
                                    {!isOwn && conversation.type === 'GROUP' && (
                                        <p style={{ fontSize: 10, fontWeight: 600, margin: '0 0 2px', color: '#a5b4fc' }}>{msg.sender?.name}</p>
                                    )}
                                    {msg.type === 'IMAGE' && msg.fileUrl && (
                                        <img src={msg.fileUrl} alt="صورة" style={{ borderRadius: 8, maxWidth: '100%', maxHeight: 120, objectFit: 'cover', display: 'block', marginBottom: 4 }} />
                                    )}
                                    {msg.type === 'FILE' && msg.fileUrl && (
                                        <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: 4 }}>
                                            📎 {msg.fileName || 'ملف'}
                                        </a>
                                    )}
                                    {msg.content && <span>{msg.content}</span>}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Emoji picker */}
                {showEmoji && (
                    <div style={{ background: 'rgba(20,20,40,0.98)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={emojiSearch}
                                onChange={(e) => setEmojiSearch(e.target.value)}
                                style={{
                                    flex: 1, fontSize: 12, color: 'white', background: 'rgba(255,255,255,0.08)',
                                    border: 'none', outline: 'none', borderRadius: 6, padding: '4px 8px',
                                    direction: 'rtl',
                                }}
                            />
                            <button onClick={() => { setShowEmoji(false); setEmojiSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}>
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2, padding: 8, maxHeight: 112, overflowY: 'auto' }}>
                            {(emojiSearch ? ALL_EMOJIS.filter(e => e.includes(emojiSearch)) : QUICK_EMOJIS).map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => { setContent(p => p + emoji); setShowEmoji(false); setEmojiSearch(''); }}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontSize: 18, padding: 2, borderRadius: 4,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '0 0 16px 16px',
                }}>
                    <button
                        type="button"
                        onClick={() => { setShowEmoji(v => !v); setEmojiSearch(''); }}
                        style={{
                            background: showEmoji ? 'rgba(251,191,36,0.15)' : 'none',
                            border: 'none', cursor: 'pointer',
                            color: showEmoji ? '#fbbf24' : 'rgba(255,255,255,0.4)',
                            display: 'flex', alignItems: 'center', padding: 4, borderRadius: 8, flexShrink: 0,
                        }}
                    >
                        <Smile size={17} />
                    </button>

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: 'rgba(255,255,255,0.4)', display: 'flex',
                            alignItems: 'center', padding: 4, borderRadius: 8, flexShrink: 0,
                        }}
                    >
                        <Paperclip size={17} />
                    </button>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />

                    <input
                        type="text"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); if (e.key === 'Escape') setShowEmoji(false); }}
                        placeholder="اكتب رسالة..."
                        style={{
                            flex: 1, borderRadius: 10, padding: '6px 10px', fontSize: 13,
                            color: 'white', background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)', outline: 'none',
                            direction: 'rtl',
                        }}
                    />

                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={isSending || !content.trim()}
                        style={{
                            width: 32, height: 32, borderRadius: '50%', border: 'none',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            color: 'white', cursor: isSending || !content.trim() ? 'not-allowed' : 'pointer',
                            opacity: isSending || !content.trim() ? 0.4 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                    >
                        <Send size={15} />
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
