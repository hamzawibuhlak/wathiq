import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Mail,
    Send,
    Inbox,
    Plus,
    Trash2,
    CheckCheck,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    useInboxMessages,
    useSentMessages,
    useMessage,
    useMessagesUnreadCount,
    useRecipients,
    useSendMessage,
    useMarkAllMessagesAsRead,
    useDeleteMessage,
} from '@/hooks/use-notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import type { Message } from '@/api/notifications';

function ComposeDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [receiverId, setReceiverId] = useState('');
    const { data: recipients = [] } = useRecipients();
    const sendMessage = useSendMessage();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiverId || !subject.trim() || !content.trim()) return;

        sendMessage.mutate(
            { subject, content, receiverId },
            {
                onSuccess: () => {
                    setSubject('');
                    setContent('');
                    setReceiverId('');
                    onOpenChange(false);
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>رسالة جديدة</DialogTitle>
                    <DialogDescription>
                        إرسال رسالة داخلية لأحد أعضاء الفريق
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="receiver">المستلم</Label>
                            <Select value={receiverId} onValueChange={setReceiverId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر المستلم" />
                                </SelectTrigger>
                                <SelectContent>
                                    {recipients.map((recipient) => (
                                        <SelectItem key={recipient.id} value={recipient.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{recipient.name}</span>
                                                <span className="text-muted-foreground text-xs">
                                                    ({recipient.role})
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subject">الموضوع</Label>
                            <Input
                                id="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="موضوع الرسالة"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="content">الرسالة</Label>
                            <Textarea
                                id="content"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="اكتب رسالتك هنا..."
                                rows={6}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={sendMessage.isPending}>
                            <Send className="h-4 w-4 ml-2" />
                            إرسال
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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
    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '??';

    return (
        <div
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer border-b transition-colors',
                isSelected && 'bg-primary/5 border-r-2 border-r-primary',
                !message.isRead && type === 'inbox' && 'bg-blue-50',
                !isSelected && 'hover:bg-muted/50'
            )}
            onClick={onClick}
        >
            <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                        'text-sm truncate',
                        !message.isRead && type === 'inbox' && 'font-semibold'
                    )}>
                        {user?.name || 'مستخدم'}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(message.createdAt), {
                            addSuffix: true,
                            locale: ar,
                        })}
                    </span>
                </div>
                <p className={cn(
                    'text-sm truncate',
                    !message.isRead && type === 'inbox' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                    {message.subject}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                    {message.content.substring(0, 50)}...
                </p>
            </div>
            {!message.isRead && type === 'inbox' && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
            )}
        </div>
    );
}

function MessageDetail({
    messageId,
    onClose,
}: {
    messageId: string;
    onClose: () => void;
}) {
    const { data: message, isLoading } = useMessage(messageId);
    const deleteMessage = useDeleteMessage();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!message) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                الرسالة غير موجودة
            </div>
        );
    }

    const handleDelete = () => {
        deleteMessage.mutate(messageId, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">{message.subject}</h3>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={deleteMessage.isPending}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
            <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={message.sender?.avatar} />
                        <AvatarFallback>
                            {message.sender?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{message.sender?.name}</span>
                            <span className="text-muted-foreground text-sm">
                                ({message.sender?.email})
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>
                                {format(new Date(message.createdAt), 'PPpp', { locale: ar })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium">إلى: </span>
                    {message.receiver?.name} ({message.receiver?.email})
                </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
                <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
        </div>
    );
}

export default function MessagesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [composeOpen, setComposeOpen] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const activeTab = searchParams.get('tab') || 'inbox';

    const { data: inboxData, isLoading: inboxLoading } = useInboxMessages();
    const { data: sentData, isLoading: sentLoading } = useSentMessages();
    const { data: unreadData } = useMessagesUnreadCount();
    const markAllAsRead = useMarkAllMessagesAsRead();

    const inboxMessages = inboxData?.data || [];
    const sentMessages = sentData?.data || [];
    const unreadCount = unreadData?.count || 0;

    const currentMessages = activeTab === 'inbox' ? inboxMessages : sentMessages;
    const isLoading = activeTab === 'inbox' ? inboxLoading : sentLoading;

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">الرسائل الداخلية</h1>
                    <p className="text-muted-foreground">
                        التواصل مع أعضاء الفريق
                    </p>
                </div>
                <Button onClick={() => setComposeOpen(true)}>
                    <Plus className="h-4 w-4 ml-2" />
                    رسالة جديدة
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Messages List */}
                <Card className="lg:col-span-1">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">الرسائل</CardTitle>
                            {unreadCount > 0 && activeTab === 'inbox' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-auto p-1 text-xs"
                                    onClick={() => markAllAsRead.mutate()}
                                    disabled={markAllAsRead.isPending}
                                >
                                    <CheckCheck className="h-3 w-3 ml-1" />
                                    قراءة الكل
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs
                            defaultValue="inbox"
                            value={activeTab}
                            onValueChange={(v) => {
                                setSearchParams({ tab: v });
                                setSelectedMessageId(null);
                            }}
                        >
                            <div className="px-4 pb-2">
                                <TabsList className="w-full">
                                    <TabsTrigger value="inbox" className="flex-1 gap-2">
                                        <Inbox className="h-4 w-4" />
                                        الواردة
                                        {unreadCount > 0 && (
                                            <Badge variant="secondary" className="mr-1">
                                                {unreadCount}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="sent" className="flex-1 gap-2">
                                        <Send className="h-4 w-4" />
                                        المرسلة
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="h-[500px] overflow-y-auto">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                                    </div>
                                ) : currentMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                        <Mail className="h-8 w-8 mb-2 opacity-50" />
                                        <span className="text-sm">لا توجد رسائل</span>
                                    </div>
                                ) : (
                                    currentMessages.map((message) => (
                                        <MessageItem
                                            key={message.id}
                                            message={message}
                                            type={activeTab as 'inbox' | 'sent'}
                                            isSelected={selectedMessageId === message.id}
                                            onClick={() => setSelectedMessageId(message.id)}
                                        />
                                    ))
                                )}
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Message Detail */}
                <Card className="lg:col-span-2">
                    <CardContent className="p-0 h-[550px]">
                        {selectedMessageId ? (
                            <MessageDetail
                                messageId={selectedMessageId}
                                onClose={() => setSelectedMessageId(null)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <Mail className="h-12 w-12 mb-4 opacity-50" />
                                <p>اختر رسالة لعرضها</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ComposeDialog open={composeOpen} onOpenChange={setComposeOpen} />
        </div>
    );
}
