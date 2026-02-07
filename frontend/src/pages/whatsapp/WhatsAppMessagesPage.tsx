import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, WhatsAppMessage, MessagesFilters } from '@/api/whatsapp.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { MessageSquare, Send, Clock, CheckCheck, AlertCircle, Phone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SENT: 'bg-blue-100 text-blue-800',
    DELIVERED: 'bg-green-100 text-green-800',
    READ: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    PENDING: 'قيد الإرسال',
    SENT: 'تم الإرسال',
    DELIVERED: 'تم التوصيل',
    READ: 'تمت القراءة',
    FAILED: 'فشل الإرسال',
};

const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
        case 'PENDING':
            return <Clock className="h-4 w-4" />;
        case 'SENT':
            return <Send className="h-4 w-4" />;
        case 'DELIVERED':
        case 'READ':
            return <CheckCheck className="h-4 w-4" />;
        case 'FAILED':
            return <AlertCircle className="h-4 w-4" />;
        default:
            return null;
    }
};

export default function WhatsAppMessagesPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [filters, setFilters] = useState<MessagesFilters>({ page: 1, limit: 20 });
    const [newMessage, setNewMessage] = useState({
        phone: '',
        message: '',
    });

    // Fetch messages
    const { data: messagesData, isLoading, refetch } = useQuery({
        queryKey: ['whatsapp-messages', filters],
        queryFn: () => whatsappApi.getMessages(filters),
    });

    // Fetch stats
    const { data: statsData } = useQuery({
        queryKey: ['whatsapp-stats'],
        queryFn: () => whatsappApi.getStats(),
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: whatsappApi.sendMessage,
        onSuccess: () => {
            toast.success('تم إرسال الرسالة بنجاح');
            setIsDialogOpen(false);
            setNewMessage({ phone: '', message: '' });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-messages'] });
            queryClient.invalidateQueries({ queryKey: ['whatsapp-stats'] });
        },
        onError: () => {
            toast.error('فشل إرسال الرسالة');
        },
    });

    const handleSendMessage = () => {
        if (!newMessage.phone || !newMessage.message) {
            toast.error('يرجى إدخال رقم الهاتف والرسالة');
            return;
        }
        sendMessageMutation.mutate(newMessage);
    };

    const stats = statsData?.data;
    const messages = messagesData?.data || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-7 w-7 text-green-600" />
                        رسائل واتساب
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إرسال وإدارة رسائل واتساب للعملاء
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => refetch()}>
                        <RefreshCw className="h-4 w-4 ml-2" />
                        تحديث
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-green-600 hover:bg-green-700">
                                <Send className="h-4 w-4 ml-2" />
                                إرسال رسالة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>إرسال رسالة واتساب</DialogTitle>
                                <DialogDescription>
                                    أرسل رسالة نصية مباشرة عبر واتساب
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">رقم الهاتف</Label>
                                    <Input
                                        id="phone"
                                        placeholder="966512345678"
                                        value={newMessage.phone}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            setNewMessage({ ...newMessage, phone: e.target.value })
                                        }
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        أدخل الرقم بصيغة دولية (مثال: 966512345678)
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message">الرسالة</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="اكتب رسالتك هنا..."
                                        value={newMessage.message}
                                        onChange={(e) =>
                                            setNewMessage({ ...newMessage, message: e.target.value })
                                        }
                                        rows={4}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleSendMessage}
                                    disabled={sendMessageMutation.isPending}
                                >
                                    {sendMessageMutation.isPending ? 'جاري الإرسال...' : 'إرسال'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>إجمالي الرسائل</CardDescription>
                        <CardTitle className="text-2xl">{stats?.totalMessages || 0}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>تم الإرسال</CardDescription>
                        <CardTitle className="text-2xl text-blue-600">
                            {stats?.sentMessages || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>تم التوصيل</CardDescription>
                        <CardTitle className="text-2xl text-green-600">
                            {stats?.deliveredMessages || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>فشل الإرسال</CardDescription>
                        <CardTitle className="text-2xl text-red-600">
                            {stats?.failedMessages || 0}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">تصفية الرسائل</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-48">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        status: value === 'all' ? undefined : value,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="الحالة" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">جميع الحالات</SelectItem>
                                    <SelectItem value="PENDING">قيد الإرسال</SelectItem>
                                    <SelectItem value="SENT">تم الإرسال</SelectItem>
                                    <SelectItem value="DELIVERED">تم التوصيل</SelectItem>
                                    <SelectItem value="READ">تمت القراءة</SelectItem>
                                    <SelectItem value="FAILED">فشل الإرسال</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-48">
                            <Select
                                value={filters.direction || 'all'}
                                onValueChange={(value) =>
                                    setFilters({
                                        ...filters,
                                        direction: value === 'all' ? undefined : (value as 'OUTBOUND' | 'INBOUND'),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="الاتجاه" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="OUTBOUND">صادر</SelectItem>
                                    <SelectItem value="INBOUND">وارد</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Messages Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">سجل الرسائل</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>لا توجد رسائل</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الهاتف</TableHead>
                                    <TableHead>العميل</TableHead>
                                    <TableHead className="max-w-[300px]">الرسالة</TableHead>
                                    <TableHead>الاتجاه</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead>التاريخ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {messages.map((msg: WhatsAppMessage) => (
                                    <TableRow key={msg.id}>
                                        <TableCell className="font-mono" dir="ltr">
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                {msg.phone}
                                            </div>
                                        </TableCell>
                                        <TableCell>{msg.client?.name || '-'}</TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            {msg.message}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {msg.direction === 'OUTBOUND' ? 'صادر' : 'وارد'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[msg.status]}>
                                                <StatusIcon status={msg.status} />
                                                <span className="mr-1">{statusLabels[msg.status]}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm', {
                                                locale: ar,
                                            })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
