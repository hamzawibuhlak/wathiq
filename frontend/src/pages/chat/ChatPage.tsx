import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/api/chat.api';
import { useChatSocket } from '@/hooks/useChatSocket';
import { useChatStore } from '@/stores/chat.store';
import { useAuthStore } from '@/stores/auth.store';
import {
    MessageSquare, Search, Plus, Users, User as UserIcon, Send, Paperclip,
    Mic, X, Check, CheckCheck, Trash2, FileText, Download,
} from 'lucide-react';

// =============================================
// CHAT PAGE
// =============================================

export default function ChatPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const currentUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();

    // Fetch conversations
    const { data: conversations = [], isLoading: loadingConversations } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: chatApi.getConversations,
        refetchInterval: 10000,
    });

    // Online users polling
    const { data: onlineUserIds = [] } = useQuery({
        queryKey: ['chat-online-users'],
        queryFn: chatApi.getOnlineUsers,
        refetchInterval: 15000,
        staleTime: 0,
    });

    // Heartbeat - ping server every 10s to show we're online
    useEffect(() => {
        chatApi.heartbeat();
        const interval = setInterval(() => chatApi.heartbeat(), 10000);
        return () => clearInterval(interval);
    }, []);

    // Global chat socket for conversation list updates
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

    return (
        <div className="flex h-[calc(100vh-64px)] bg-gray-50" dir="rtl">
            {/* Conversation List */}
            <div className="w-80 border-l border-gray-200 flex flex-col bg-white shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-900">الدردشة</h2>
                        <button
                            onClick={() => setShowNewModal(true)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث في المحادثات..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {loadingConversations ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">لا توجد محادثات</p>
                            <button
                                onClick={() => setShowNewModal(true)}
                                className="mt-2 text-blue-500 text-sm hover:underline"
                            >
                                ابدأ محادثة جديدة
                            </button>
                        </div>
                    ) : (
                        filteredConversations.map((conv: any) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                isActive={selectedId === conv.id}
                                currentUserId={currentUser?.id || ''}
                                onlineUserIds={onlineUserIds}
                                onClick={() => {
                                    setSelectedId(conv.id);
                                    useChatStore.getState().clearUnread(conv.id);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
                {selectedId ? (
                    <ChatWindow conversationId={selectedId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                                <MessageSquare className="w-10 h-10 text-blue-400" />
                            </div>
                            <p className="text-lg font-medium text-gray-600">اختر محادثة للبدء</p>
                            <p className="text-sm text-gray-400 mt-1">أو أنشئ محادثة جديدة</p>
                        </div>
                    </div>
                )}
            </div>

            {/* New Conversation Modal */}
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
        </div>
    );
}

// =============================================
// CONVERSATION ITEM
// =============================================

function ConversationItem({
    conversation,
    isActive,
    currentUserId,
    onlineUserIds,
    onClick,
}: {
    conversation: any;
    isActive: boolean;
    currentUserId: string;
    onlineUserIds: string[];
    onClick: () => void;
}) {
    const unreadCount = useChatStore((s) => s.unreadCounts[conversation.id] || conversation.unreadCount || 0);

    const otherMember = conversation.type === 'DIRECT'
        ? conversation.members?.find((m: any) => m.userId !== currentUserId)
        : null;

    const name = conversation.type === 'GROUP'
        ? conversation.name
        : otherMember?.user?.name || 'مجهول';

    const memberIsOnline = otherMember ? onlineUserIds.includes(otherMember.userId) : false;

    const lastMessage = conversation.messages?.[0];
    const lastMessageText = lastMessage?.isDeleted
        ? 'تم حذف الرسالة'
        : lastMessage?.content || (lastMessage?.type === 'IMAGE' ? '📷 صورة' : lastMessage?.type === 'FILE' ? '📎 ملف' : lastMessage?.type === 'VOICE' ? '🎤 رسالة صوتية' : '');

    const timeStr = lastMessage?.createdAt
        ? new Date(lastMessage.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <button
            onClick={onClick}
            className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-right ${isActive ? 'bg-blue-50 border-r-3 border-blue-500' : ''
                }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${conversation.type === 'GROUP' ? 'bg-purple-500' : 'bg-blue-500'
                    }`}>
                    {conversation.type === 'GROUP' ? (
                        <Users className="w-5 h-5" />
                    ) : (
                        name.charAt(0)
                    )}
                </div>
                {conversation.type === 'DIRECT' && otherMember && (
                    <div className={`absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full border-2 border-white ${memberIsOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-gray-900 truncate">{name}</span>
                        {conversation.type === 'DIRECT' && (
                            <span className={`text-[10px] ${memberIsOnline ? 'text-green-500' : 'text-gray-400'}`}>
                                {memberIsOnline ? 'متصل' : 'غير متصل'}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 mr-2">{timeStr}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{lastMessageText}</p>
                    {unreadCount > 0 && (
                        <span className="shrink-0 mr-2 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

// =============================================
// CHAT WINDOW
// =============================================

function ChatWindow({ conversationId }: { conversationId: string }) {
    const currentUser = useAuthStore((s) => s.user);
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());

    // Fetch messages
    const { data: messages = [], isLoading } = useQuery({
        queryKey: ['chat-messages', conversationId],
        queryFn: () => chatApi.getMessages(conversationId),
        refetchInterval: 3000,
        staleTime: 0,
        refetchOnWindowFocus: true,
    });

    // Fetch conversation details
    const { data: conversations = [] } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: chatApi.getConversations,
    });

    const conversation = conversations.find((c: any) => c.id === conversationId);

    // WebSocket
    const { emitMarkRead } = useChatSocket({
        conversationId,
        onNewMessage: (message: any) => {
            if (message.conversationId === conversationId) {
                queryClient.setQueryData(
                    ['chat-messages', conversationId],
                    (old: any[] | undefined) => [...(old || []), message],
                );
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
                } else {
                    next.delete(userId);
                }
                return next;
            });
        },
        onMessageUpdated: (updated: any) => {
            queryClient.setQueryData(
                ['chat-messages', conversationId],
                (old: any[] | undefined) => old?.map((m) => (m.id === updated.id ? updated : m)) || [],
            );
        },
        onMessageDeleted: ({ messageId }: any) => {
            queryClient.setQueryData(
                ['chat-messages', conversationId],
                (old: any[] | undefined) => old?.filter((m) => m.id !== messageId) || [],
            );
        },
        onMessagesRead: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
        },
    });

    const scrollToBottom = useCallback(() => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    useEffect(() => {
        emitMarkRead();
        chatApi.markAsRead(conversationId);
    }, [conversationId, emitMarkRead]);

    const otherMember = conversation?.type === 'DIRECT'
        ? conversation?.members?.find((m: any) => m.userId !== currentUser?.id)
        : null;

    const headerTitle = conversation?.type === 'GROUP'
        ? conversation.name
        : otherMember?.user?.name || 'مجهول';

    const headerSubtitle = conversation?.type === 'GROUP'
        ? `${conversation.members?.length || 0} أعضاء`
        : useChatStore.getState().isOnline(otherMember?.userId || '') ? 'متصل الآن' : '';

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center gap-3 shadow-sm">
                <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${conversation?.type === 'GROUP' ? 'bg-purple-500' : 'bg-blue-500'
                        }`}>
                        {conversation?.type === 'GROUP' ? <Users className="w-5 h-5" /> : headerTitle.charAt(0)}
                    </div>
                    {conversation?.type === 'DIRECT' && otherMember &&
                        useChatStore.getState().isOnline(otherMember.userId) && (
                            <div className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        )}
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-gray-900">{headerTitle}</p>
                    {headerSubtitle && (
                        <p className="text-xs text-green-500">{headerSubtitle}</p>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                        <p>لا توجد رسائل. ابدأ المحادثة!</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message: any, index: number) => (
                            <MessageBubble
                                key={message.id}
                                message={message}
                                isOwn={message.senderId === currentUser?.id}
                                showSender={
                                    conversation?.type === 'GROUP' &&
                                    (index === 0 || messages[index - 1]?.senderId !== message.senderId)
                                }
                                conversationId={conversationId}
                            />
                        ))}
                    </>
                )}

                {/* Typing indicator */}
                {typingUsers.size > 0 && (
                    <div className="flex items-center gap-2 pr-4 py-1">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-400">
                            {Array.from(typingUsers.values()).join(' و ')} يكتب...
                        </span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput conversationId={conversationId} onMessageSent={scrollToBottom} />
        </div>
    );
}

// =============================================
// MESSAGE BUBBLE
// =============================================

function MessageBubble({
    message,
    isOwn,
    showSender,
    conversationId,
}: {
    message: any;
    isOwn: boolean;
    showSender: boolean;
    conversationId: string;
}) {
    const [showActions, setShowActions] = useState(false);
    const { emitDeleteMessage, emitReaction } = useChatSocket({ conversationId });

    const timeStr = new Date(message.createdAt).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
    });

    if (message.isDeleted) {
        return (
            <div className={`flex ${isOwn ? 'justify-start' : 'justify-end'} px-2`}>
                <div className="bg-gray-100 rounded-xl px-4 py-2 text-gray-400 text-sm italic">
                    تم حذف هذه الرسالة
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex ${isOwn ? 'justify-start' : 'justify-end'} px-2 group`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                {/* Sender name in groups */}
                {showSender && !isOwn && (
                    <p className="text-xs text-blue-600 font-medium mb-0.5 px-3">
                        {message.sender?.name}
                    </p>
                )}

                {/* Reply preview */}
                {message.replyTo && (
                    <div className={`mx-1 mb-1 px-3 py-1.5 rounded-lg text-xs border-r-2 ${isOwn ? 'bg-blue-100/50 border-blue-400' : 'bg-gray-100 border-gray-400'
                        }`}>
                        <p className="font-medium text-gray-600">{message.replyTo.sender?.name}</p>
                        <p className="text-gray-500 truncate">{message.replyTo.content}</p>
                    </div>
                )}

                <div
                    className={`rounded-2xl px-4 py-2 relative ${isOwn
                        ? 'bg-blue-500 text-white rounded-bl-md'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-100 rounded-br-md'
                        }`}
                >
                    {/* File/Image content */}
                    {message.type === 'IMAGE' && message.fileUrl && (
                        <a href={message.fileUrl} target="_blank" rel="noreferrer">
                            <img
                                src={message.fileUrl}
                                alt={message.fileName}
                                className="rounded-lg max-w-full max-h-60 mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        </a>
                    )}

                    {message.type === 'FILE' && message.fileUrl && (
                        <a
                            href={message.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 py-1 ${isOwn ? 'text-blue-100 hover:text-white' : 'text-blue-500 hover:text-blue-600'}`}
                        >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm underline truncate">{message.fileName}</span>
                            <Download className="w-3 h-3" />
                        </a>
                    )}

                    {message.type === 'VOICE' && (
                        <div className="flex items-center gap-2 py-1">
                            <Mic className="w-4 h-4" />
                            <div className="h-1 flex-1 bg-white/30 rounded-full">
                                <div className="h-full bg-white/70 rounded-full" style={{ width: '60%' }} />
                            </div>
                            <span className="text-xs">{message.audioDuration ? `${Math.floor(message.audioDuration / 60)}:${String(message.audioDuration % 60).padStart(2, '0')}` : '0:00'}</span>
                        </div>
                    )}

                    {/* Text content */}
                    {message.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}

                    {/* Time + status */}
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                        <span className="text-[11px]">{timeStr}</span>
                        {message.isEdited && <span className="text-[10px]">(معدّل)</span>}
                        {isOwn && (
                            message.receipts?.length > 0 ? (
                                <span className="flex items-center gap-0.5" title={`مقروء ${message.receipts[0]?.readAt ? new Date(message.receipts[0].readAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}`}>
                                    <CheckCheck className="w-3.5 h-3.5 text-green-300" />
                                    <span className="text-[9px] text-green-300">
                                        {message.receipts[0]?.readAt && new Date(message.receipts[0].readAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </span>
                            ) : (
                                <Check className="w-3 h-3" />
                            )
                        )}
                    </div>
                </div>

                {/* Reactions */}
                {message.reactions?.length > 0 && (
                    <div className="flex gap-1 mt-0.5 px-2">
                        {Object.entries(
                            message.reactions.reduce((acc: any, r: any) => {
                                acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                                return acc;
                            }, {}),
                        ).map(([emoji, count]) => (
                            <span key={emoji} className="bg-gray-100 rounded-full px-1.5 py-0.5 text-xs">
                                {emoji} {count as number > 1 && count as number}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            {showActions && (
                <div className={`flex items-center gap-0.5 self-center ${isOwn ? 'order-2 mr-1' : 'order-1 ml-1'}`}>
                    {['👍', '❤️', '😂'].map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => emitReaction(message.id, emoji)}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 text-xs"
                        >
                            {emoji}
                        </button>
                    ))}
                    {isOwn && (
                        <button
                            onClick={() => {
                                if (confirm('هل تريد حذف هذه الرسالة؟')) {
                                    emitDeleteMessage(message.id);
                                }
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 text-red-400"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// =============================================
// MESSAGE INPUT
// =============================================

function MessageInput({
    conversationId,
    onMessageSent,
}: {
    conversationId: string;
    onMessageSent?: () => void;
}) {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isTypingFlag, setIsTypingFlag] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const queryClient = useQueryClient();

    const { emitTyping } = useChatSocket({ conversationId });

    const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);

        if (!isTypingFlag) {
            setIsTypingFlag(true);
            emitTyping(true);
        }

        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            setIsTypingFlag(false);
            emitTyping(false);
        }, 2000);
    };

    const handleSend = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setIsSending(true);

        try {
            if (attachments.length > 0) {
                for (const att of attachments) {
                    await chatApi.sendMessage(conversationId, {
                        content: content.trim() || undefined,
                        type: att.mimeType?.startsWith('image/') ? 'IMAGE' : 'FILE',
                        fileUrl: att.url,
                        fileName: att.fileName,
                        fileSize: att.fileSize,
                        fileMimeType: att.mimeType,
                    });
                }
            } else {
                await chatApi.sendMessage(conversationId, { content: content.trim(), type: 'TEXT' });
            }

            setContent('');
            setAttachments([]);
            setIsTypingFlag(false);
            emitTyping(false);
            // Refetch messages to show the newly sent message
            queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            onMessageSent?.();
        } catch (err) {
            console.error('Send failed:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (file.size > 25 * 1024 * 1024) {
                alert('حجم الملف يجب أن يكون أقل من 25 ميجابايت');
                continue;
            }

            try {
                const result = await chatApi.uploadFile(file);
                setAttachments((prev) => [...prev, result]);
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        e.target.value = '';
    };

    return (
        <div className="bg-white border-t border-gray-200 p-3">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                    {attachments.map((att, index) => (
                        <div key={index} className="relative bg-gray-100 rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
                            <Paperclip className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-700 max-w-[120px] truncate">{att.fileName}</span>
                            <button
                                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                                className="text-red-400 hover:text-red-600"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2">
                {/* File upload */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <Paperclip className="w-5 h-5" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                />

                {/* Text input */}
                <div className="flex-1">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        placeholder="اكتب رسالة..."
                        rows={1}
                        className="w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-28 overflow-y-auto"
                        style={{ direction: 'rtl' }}
                    />
                </div>

                {/* Send */}
                <button
                    onClick={handleSend}
                    disabled={isSending || (!content.trim() && attachments.length === 0)}
                    className={`p-2.5 rounded-full transition-all ${content.trim() || attachments.length > 0
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm'
                        : 'text-gray-300 cursor-not-allowed'
                        }`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// =============================================
// NEW CONVERSATION MODAL
// =============================================

function NewConversationModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: (id: string) => void;
}) {
    const [tab, setTab] = useState<'dm' | 'group'>('dm');
    const [search, setSearch] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const { data: users = [] } = useQuery({
        queryKey: ['users-for-chat'],
        queryFn: chatApi.getUsers,
    });

    const currentUser = useAuthStore((s) => s.user);

    const filteredUsers = (users as any[]).filter(
        (u: any) => u.id !== currentUser?.id && u.name?.toLowerCase().includes(search.toLowerCase()),
    );

    const handleCreateDM = async (userId: string) => {
        setIsCreating(true);
        try {
            const conv = await chatApi.getOrCreateDM(userId);
            onCreated(conv.id);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) return;
        setIsCreating(true);
        try {
            const conv = await chatApi.createGroup({
                name: groupName,
                memberIds: selectedUsers,
            });
            onCreated(conv.id);
        } finally {
            setIsCreating(false);
        }
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-900">محادثة جديدة</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setTab('dm')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'dm' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                            }`}
                    >
                        <UserIcon className="w-4 h-4 inline ml-1" /> رسالة مباشرة
                    </button>
                    <button
                        onClick={() => setTab('group')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === 'group' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
                            }`}
                    >
                        <Users className="w-4 h-4 inline ml-1" /> مجموعة
                    </button>
                </div>

                {/* Group Name */}
                {tab === 'group' && (
                    <div className="px-4 pt-3">
                        <input
                            type="text"
                            placeholder="اسم المجموعة"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث عن مستخدم..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {filteredUsers.map((user: any) => (
                        <button
                            key={user.id}
                            onClick={() => (tab === 'dm' ? handleCreateDM(user.id) : toggleUser(user.id))}
                            disabled={isCreating}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors ${tab === 'group' && selectedUsers.includes(user.id) ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                                {user.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                            {tab === 'group' && selectedUsers.includes(user.id) && (
                                <Check className="w-5 h-5 text-blue-500" />
                            )}
                        </button>
                    ))}

                    {filteredUsers.length === 0 && (
                        <p className="text-center text-gray-400 text-sm py-8">لا يوجد مستخدمين</p>
                    )}
                </div>

                {/* Group Create Button */}
                {tab === 'group' && (
                    <div className="p-4 border-t">
                        <button
                            onClick={handleCreateGroup}
                            disabled={isCreating || !groupName.trim() || selectedUsers.length < 1}
                            className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCreating ? 'جاري الإنشاء...' : `إنشاء مجموعة (${selectedUsers.length} أعضاء)`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
