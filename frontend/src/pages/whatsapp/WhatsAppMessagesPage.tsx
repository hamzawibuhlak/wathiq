import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, WhatsAppMessage, MessagesFilters } from '@/api/whatsapp.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MessageSquare, Send, Clock, CheckCheck, AlertCircle, Phone, RefreshCw, QrCode, Smartphone, Wifi, WifiOff, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useWhatsAppQR, useWhatsAppStatus } from '@/hooks/use-websocket';

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
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>('DISCONNECTED');
    const [connectedPhone, setConnectedPhone] = useState<string | null>(null);

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

    // Fetch QR Status
    const { data: qrStatusData } = useQuery({
        queryKey: ['whatsapp-qr-status'],
        queryFn: () => whatsappApi.getQrStatus(),
    });

    useEffect(() => {
        if (qrStatusData) {
            setConnectionStatus(qrStatusData.data?.status || 'DISCONNECTED');
            setConnectedPhone(qrStatusData.data?.phone || null);
        }
    }, [qrStatusData]);

    // WebSocket Hooks
    useWhatsAppQR((data) => {
        setQrCode(data.qr);
        setConnectionStatus('QR_READY');
    });

    useWhatsAppStatus((data) => {
        setConnectionStatus(data.status);
        if (data.phone) setConnectedPhone(data.phone);
        if (data.status === 'CONNECTED') setQrCode(null);
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

    // QR Mutations
    const connectMutation = useMutation({
        mutationFn: whatsappApi.qrConnect,
        onSuccess: () => {
            toast.success('جاري إنشاء رمز QR...');
            setConnectionStatus('QR_PENDING');
        },
        onError: (error: any) => {
            toast.error(error.message || 'فشل بدء الاتصال');
        },
    });

    const disconnectMutation = useMutation({
        mutationFn: whatsappApi.qrDisconnect,
        onSuccess: () => {
            toast.success('تم قطع الاتصال');
            setConnectionStatus('DISCONNECTED');
            setQrCode(null);
            setConnectedPhone(null);
        },
        onError: () => {
            toast.error('فشل قطع الاتصال');
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
            </div>

            <Tabs defaultValue="messages" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="messages">الرسائل</TabsTrigger>
                    <TabsTrigger value="connection">الربط (QR Code)</TabsTrigger>
                </TabsList>

                <TabsContent value="messages" className="space-y-6 mt-6">
                    {/* Header Actions */}
                    <div className="flex justify-end gap-2">
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
                                            onChange={(e) =>
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
                </TabsContent>

                <TabsContent value="connection" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>ربط واتساب</CardTitle>
                            <CardDescription>
                                قم بمسح رمز الاستجابة السريعة (QR Code) لربط حساب واتساب الخاص بك
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Status Indicator */}
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                        {connectionStatus === 'CONNECTED' ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">حالة الاتصال</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {connectionStatus === 'CONNECTED'
                                                ? `متصل (${connectedPhone})`
                                                : connectionStatus === 'QR_PENDING' || connectionStatus === 'QR_READY'
                                                    ? 'جاري الربط...'
                                                    : 'غير متصل'}
                                        </p>
                                    </div>
                                </div>
                                {connectionStatus === 'CONNECTED' && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => disconnectMutation.mutate()}
                                        disabled={disconnectMutation.isPending}
                                    >
                                        <LogOut className="h-4 w-4 ml-2" />
                                        قطع الاتصال
                                    </Button>
                                )}
                            </div>

                            {/* Connection Action */}
                            {connectionStatus !== 'CONNECTED' && (
                                <div className="flex flex-col items-center justify-center space-y-6 py-8 border-2 border-dashed rounded-lg">
                                    {!qrCode ? (
                                        <div className="text-center space-y-4">
                                            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                <QrCode className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-medium">مسح الرمز (QR Code)</h3>
                                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                                    انقر على الزر أدناه لتوليد رمز الاستجابة السريعة، ثم قم بمسحه باستخدام تطبيق واتساب
                                                </p>
                                            </div>
                                            <Button
                                                onClick={() => connectMutation.mutate()}
                                                disabled={connectMutation.isPending || connectionStatus === 'QR_PENDING'}
                                            >
                                                {connectMutation.isPending ? 'جاري التحضير...' : 'بدء الربط'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-4">
                                            <div className="bg-white p-4 rounded-lg shadow-sm border mx-auto inline-block">
                                                <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="font-medium">امسح الرمز الآن</h3>
                                                <div className="text-sm text-muted-foreground space-y-1">
                                                    <p>1. افتح واتساب على هاتفك</p>
                                                    <p>2. اذهب إلى الإعدادات {'>'} الأجهزة المرتبطة</p>
                                                    <p>3. اضغط على "ربط جهاز" وامسح الرمز أعلاه</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => setQrCode(null)}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Informational Steps */}
                            <div className="grid md:grid-cols-3 gap-4 text-center">
                                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                                    <Smartphone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h4 className="font-medium text-sm">افتح التطبيق</h4>
                                    <p className="text-xs text-green-700 mt-1">افتح تطبيق واتساب على هاتفك الذكي</p>
                                </div>
                                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                                    <QrCode className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h4 className="font-medium text-sm">الأجهزة المرتبطة</h4>
                                    <p className="text-xs text-green-700 mt-1">اختر الأجهزة المرتبطة من القائمة</p>
                                </div>
                                <div className="p-4 rounded-lg bg-green-50 border border-green-100">
                                    <CheckCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                    <h4 className="font-medium text-sm">مسح الرمز</h4>
                                    <p className="text-xs text-green-700 mt-1">وجه الكاميرا نحو الرمز المعروض</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
