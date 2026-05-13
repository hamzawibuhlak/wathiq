import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    MessageSquare, Send, CheckCheck, Clock, User, MessageCircle, 
    Instagram, Facebook, Twitter, UserCircle, Hash
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
// Need a placeholder api instance. Let's create an inline axios wrapper until full integration.
import axios from 'axios';

type SocialPlatform = 'ALL' | 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'TWITTER' | 'TELEGRAM';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const socialInboxApi = {
    getConversations: async (platform?: string) => {
        const token = useAuthStore.getState().token;
        const res = await axios.get(`${API_URL}/social-inbox/conversations`, {
            params: { platform: platform !== 'ALL' ? platform : undefined },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    getMessages: async (id: string) => {
        const token = useAuthStore.getState().token;
        const res = await axios.get(`${API_URL}/social-inbox/conversations/${id}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    sendMessage: async ({ id, content }: { id: string, content: string }) => {
        const token = useAuthStore.getState().token;
        const res = await axios.post(`${API_URL}/social-inbox/conversations/${id}/messages`, { content }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    assignConversation: async ({ id, assigneeId }: { id: string, assigneeId: string | null }) => {
        const token = useAuthStore.getState().token;
        const res = await axios.post(`${API_URL}/social-inbox/conversations/${id}/assign`, { assigneeId }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    getUsers: async () => {
        const token = useAuthStore.getState().token;
        // Mocking user fetch from standard users endpoint or using standard endpoint
        const res = await axios.get(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    }
};

const PlatformIcon = ({ platform, className = "h-5 w-5" }: { platform: string, className?: string }) => {
    switch (platform) {
        case 'WHATSAPP': return <MessageCircle className={cn("text-green-500", className)} />;
        case 'INSTAGRAM': return <Instagram className={cn("text-pink-500", className)} />;
        case 'FACEBOOK': return <Facebook className={cn("text-blue-600", className)} />;
        case 'TWITTER': return <Twitter className={cn("text-sky-500", className)} />;
        case 'TELEGRAM': return <Send className={cn("text-blue-400", className)} />;
        case 'TIKTOK': return <Hash className={cn("text-black rtl:ml-0.5", className)} />;
        default: return <MessageSquare className={className} />;
    }
};

export default function SocialInboxPage() {
    const [selectedTab, setSelectedTab] = useState<SocialPlatform>('ALL');
    const [selectedChat, setSelectedChat] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const queryClient = useQueryClient();
    const currentUser = useAuthStore(s => s.user);

    // Queries
    const { data: conversationsResponse = { data: [] }, isLoading: loadingConvs } = useQuery({
        queryKey: ['social-conversations', selectedTab],
        queryFn: () => socialInboxApi.getConversations(selectedTab),
    });

    const conversations = conversationsResponse.data || conversationsResponse; // handle array or paginated response

    const { data: messagesResponse = { data: [] }, isLoading: loadingMessages } = useQuery({
        queryKey: ['social-messages', selectedChat],
        queryFn: ({ queryKey }) => socialInboxApi.getMessages(queryKey[1] as string),
        enabled: !!selectedChat,
        refetchInterval: 5000,
    });

    const messages = messagesResponse.data || messagesResponse;

    const { data: usersResponse = { data: [] } } = useQuery({
        queryKey: ['users'],
        queryFn: socialInboxApi.getUsers,
    });
    
    // In many apps it responds with { data: [...] } or just [...]
    const users = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || [];

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mutations
    const sendMutation = useMutation({
        mutationFn: socialInboxApi.sendMessage,
        onMutate: async (newMsg) => {
            await queryClient.cancelQueries({ queryKey: ['social-messages', newMsg.id] });
            const previousMessages = queryClient.getQueryData(['social-messages', newMsg.id]);
            
            // Optimistic update
            queryClient.setQueryData(['social-messages', newMsg.id], (old: any) => {
                const oldArray = Array.isArray(old) ? old : old?.data || [];
                return [...oldArray, {
                    id: Math.random().toString(),
                    direction: 'OUTBOUND',
                    content: newMsg.content,
                    sender: currentUser,
                    createdAt: new Date().toISOString(),
                    status: 'PENDING'
                }];
            });
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
            return { previousMessages };
        },
        onSuccess: () => {
            setMessageInput('');
            queryClient.invalidateQueries({ queryKey: ['social-messages', selectedChat] });
            queryClient.invalidateQueries({ queryKey: ['social-conversations', selectedTab] });
        },
        onError: (_err, _newMsg, context) => {
            toast.error('فشل إرسال الرسالة');
            queryClient.setQueryData(['social-messages', selectedChat], context?.previousMessages);
        }
    });

    const assignMutation = useMutation({
        mutationFn: socialInboxApi.assignConversation,
        onSuccess: () => {
            toast.success('تم تحديث تعيين المحادثة');
            queryClient.invalidateQueries({ queryKey: ['social-conversations', selectedTab] });
        },
        onError: () => toast.error('فشل تحديث التعيين')
    });

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageInput.trim() || !selectedChat) return;
        sendMutation.mutate({ id: selectedChat, content: messageInput.trim() });
    };

    const activeConversation = Array.isArray(conversations) ? conversations.find(c => c.id === selectedChat) : null;

    return (
        <div className="flex h-[calc(100vh-80px)] gap-6 p-6 overflow-hidden bg-background">
            {/* Sidebar / Conversatons List */}
            <Card className="w-1/3 flex flex-col h-full overflow-hidden border-r shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        التواصل الاجتماعي
                    </CardTitle>
                    <CardDescription>
                        صندوق وارد موحد لجميع قنوات التواصل
                    </CardDescription>

                    {/* Platform Tabs */}
                    <div className="flex overflow-x-auto gap-2 pt-4 pb-1 no-scrollbar">
                        {(['ALL', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'TWITTER', 'TELEGRAM'] as SocialPlatform[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setSelectedTab(tab); setSelectedChat(null); }}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                                    selectedTab === tab 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                                )}
                            >
                                {tab === 'ALL' ? 'الكل' : tab === 'WHATSAPP' ? 'واتساب' : tab === 'INSTAGRAM' ? 'انستجرام' : tab === 'FACEBOOK' ? 'فيسبوك' : tab === 'TIKTOK' ? 'تيكتوك' : tab === 'TWITTER' ? 'تويتر' : 'تليجرام'}
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <ScrollArea className="flex-1">
                    {loadingConvs ? (
                        <div className="flex flex-col gap-2 p-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-20 bg-muted/60 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : (conversations || []).length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>لا توجد محادثات</p>
                        </div>
                    ) : Array.isArray(conversations) && conversations.map((conv: any) => (
                        <div
                            key={conv.id}
                            onClick={() => setSelectedChat(conv.id)}
                            className={cn(
                                "p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors flex gap-3",
                                selectedChat === conv.id && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                        >
                            <div className="relative">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={conv.clientAvatar} />
                                    <AvatarFallback>{conv.clientName.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                    <PlatformIcon platform={conv.platform} className="h-4 w-4" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-sm truncate pr-2">{conv.clientName}</h4>
                                    <span className="text-xs text-muted-foreground shrink-0">
                                        {format(new Date(conv.updatedAt || new Date()), 'hh:mm a', { locale: ar })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {conv.messages?.[0]?.content || "اضغط لعرض المحادثة..."}
                                </p>
                                {conv.assignedToId && (
                                    <div className="mt-2 flex justify-start">
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <UserCircle className="h-3 w-3" />
                                            مُعيّن لـ {conv.assignedTo?.name?.split(' ')[0]}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </Card>

            {/* Chat Panel */}
            <Card className="flex-1 flex flex-col h-full shadow-sm relative overflow-hidden">
                {!selectedChat ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-20 w-20 mb-6 opacity-10" />
                        <h2 className="text-xl font-semibold mb-2 text-foreground/70">صندوق الوارد الموحد</h2>
                        <p className="max-w-sm text-center">اختر محادثة من القائمة للتواصل مع العميل، أو قم بتعيينها لأحد موظفي خدمة العملاء.</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-muted/10 h-20 shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback>{activeConversation?.clientName?.substring(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-base">{activeConversation?.clientName}</h3>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <PlatformIcon platform={activeConversation?.platform} className="h-3 w-3" />
                                        {activeConversation?.platform === 'WHATSAPP' ? activeConversation?.externalId : 'رسالة'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="text-sm font-medium text-muted-foreground bg-muted/40 px-3 py-1.5 rounded-md flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <Select 
                                        value={activeConversation?.assignedToId || "UNASSIGNED"} 
                                        onValueChange={(val) => assignMutation.mutate({ id: selectedChat, assigneeId: val === "UNASSIGNED" ? null : val })}
                                    >
                                        <SelectTrigger className="border-none bg-transparent shadow-none h-auto p-0 focus:ring-0 w-[140px]">
                                            <SelectValue placeholder="تعيين لموظف" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNASSIGNED" className="text-muted-foreground">غير مُعيّن</SelectItem>
                                            {users.map((u: any) => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4 bg-[url('/bg-chat.png')] bg-repeat bg-opacity-5">
                            <div className="flex flex-col gap-4">
                                {loadingMessages ? (
                                    <div className="flex justify-center p-8"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
                                ) : Array.isArray(messages) && messages.map((msg: any) => {
                                    const isOutbound = msg.direction === 'OUTBOUND';
                                    return (
                                        <div key={msg.id} className={cn("flex w-full", isOutbound ? "justify-start" : "justify-end")}>
                                            <div className={cn(
                                                "max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative",
                                                isOutbound 
                                                    ? "bg-primary text-primary-foreground rounded-br-sm" 
                                                    : "bg-white dark:bg-slate-800 border rounded-bl-sm"
                                            )}>
                                                {/* Content */}
                                                <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
                                                    {msg.content}
                                                </p>

                                                {/* Meta Info */}
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-[10px] mt-2 select-none",
                                                    isOutbound ? "text-primary-foreground/70" : "text-muted-foreground"
                                                )}>
                                                    <span>{format(new Date(msg.createdAt), 'hh:mm a')}</span>
                                                    {isOutbound && (
                                                        <span className="flex items-center">
                                                            {msg.status === 'READ' ? <CheckCheck className="h-3 w-3 text-blue-300" /> : <CheckCheck className="h-3 w-3" />}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* AGENT SENDER TRACKING (Internal only) */}
                                                {isOutbound && msg.sender && (
                                                    <div className="mt-2 pt-1.5 border-t border-primary-foreground/10 text-[10px] flex items-center gap-1 text-primary-foreground/80 font-medium">
                                                        <UserCircle className="h-3.5 w-3.5" />
                                                        أُرسلت بواسطة: {msg.sender.name}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-4 border-t bg-background shrink-0">
                            <form onSubmit={handleSend} className="flex gap-2">
                                <Input 
                                    placeholder="اكتب رسالتك للعميل..." 
                                    className="flex-1 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    disabled={sendMutation.isPending}
                                />
                                <Button 
                                    type="submit" 
                                    disabled={!messageInput.trim() || sendMutation.isPending}
                                    className="rounded-full px-6 gap-2 shrink-0 bg-primary hover:bg-primary/90"
                                >
                                    <span>إرسال</span>
                                    <Send className="h-4 w-4 rtl:-scale-x-100" />
                                </Button>
                            </form>
                            <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
                                <Clock className="h-3 w-3" />
                                الردود ترسل مباشرة عبر {activeConversation?.platform === 'WHATSAPP' ? 'واتس اب' : activeConversation?.platform === 'INSTAGRAM'? 'انستجرام' : 'القناة المختارة'}
                            </p>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
