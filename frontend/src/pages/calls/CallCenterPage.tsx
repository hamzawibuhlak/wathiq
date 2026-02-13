import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Phone, PhoneCall, PhoneIncoming, PhoneOutgoing,
    Clock, Play, BarChart3, PhoneOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import api from '@/api/client';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface Call {
    id: string;
    direction: 'INBOUND' | 'OUTBOUND';
    from: string;
    to: string;
    status: string;
    duration: number | null;
    createdAt: string;
    user?: {
        id: string;
        name: string;
        avatar?: string;
    };
    recording?: {
        recordingUrl: string;
        duration: number;
    };
}

interface CallAnalytics {
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    answeredCalls: number;
    missedCalls: number;
    avgDuration: number;
    answerRate: number;
}

export default function CallCenterPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('week');

    // Fetch call history
    const { data: calls = [], isLoading: callsLoading } = useQuery<Call[]>({
        queryKey: ['calls', 'history'],
        queryFn: async () => {
            const res = await api.get('/calls/history');
            return res.data;
        },
    });

    // Fetch analytics
    const { data: analytics } = useQuery<CallAnalytics>({
        queryKey: ['calls', 'analytics', selectedPeriod],
        queryFn: async () => {
            const res = await api.get(`/calls/analytics?period=${selectedPeriod}`);
            return res.data;
        },
    });

    // Initiate call via Softphone WebRTC (dispatch custom event)
    const [isDialing, setIsDialing] = useState(false);

    const handleCall = () => {
        if (!phoneNumber.trim()) {
            toast.error('أدخل رقم الهاتف');
            return;
        }
        // Dispatch event to floating Softphone component
        window.dispatchEvent(new CustomEvent('softphone:dial', {
            detail: { number: phoneNumber.trim() },
        }));
        setIsDialing(true);
        setIsDialogOpen(false);
        setPhoneNumber('');
        toast.success('جاري الاتصال عبر الهاتف...');
        setTimeout(() => setIsDialing(false), 2000);
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return '-';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
            COMPLETED: { label: 'مكتملة', variant: 'default' },
            IN_PROGRESS: { label: 'جارية', variant: 'secondary' },
            RINGING: { label: 'يرن', variant: 'secondary' },
            QUEUED: { label: 'في الانتظار', variant: 'outline' },
            NO_ANSWER: { label: 'لم يرد', variant: 'destructive' },
            BUSY: { label: 'مشغول', variant: 'destructive' },
            FAILED: { label: 'فشلت', variant: 'destructive' },
            CANCELED: { label: 'ملغاة', variant: 'outline' },
        };
        const config = statusConfig[status] || { label: status, variant: 'outline' as const };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Phone className="h-8 w-8 text-primary" />
                        مركز الاتصالات
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        إدارة المكالمات الواردة والصادرة
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2">
                            <PhoneCall className="h-5 w-5" />
                            اتصال جديد
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إجراء مكالمة</DialogTitle>
                            <DialogDescription>
                                أدخل رقم الهاتف للاتصال
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="05xxxxxxxx"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="text-lg text-center"
                                dir="ltr"
                            />
                            <Button
                                onClick={handleCall}
                                className="w-full gap-2"
                                disabled={isDialing}
                            >
                                <Phone className="h-4 w-4" />
                                {isDialing ? 'جاري الاتصال...' : 'اتصال'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Analytics Cards */}
            <div className="flex gap-2 mb-4">
                {(['day', 'week', 'month'] as const).map((period) => (
                    <Button
                        key={period}
                        variant={selectedPeriod === period ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPeriod(period)}
                    >
                        {period === 'day' ? 'اليوم' : period === 'week' ? 'الأسبوع' : 'الشهر'}
                    </Button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي المكالمات</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.totalCalls || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">المكالمات الواردة</CardTitle>
                        <PhoneIncoming className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.inboundCalls || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">المكالمات الصادرة</CardTitle>
                        <PhoneOutgoing className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.outboundCalls || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">نسبة الإجابة</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics?.answerRate || 0}%</div>
                    </CardContent>
                </Card>
            </div>

            {/* Call History */}
            <Card>
                <CardHeader>
                    <CardTitle>سجل المكالمات</CardTitle>
                    <CardDescription>آخر المكالمات الواردة والصادرة</CardDescription>
                </CardHeader>
                <CardContent>
                    {callsLoading ? (
                        <div className="text-center py-8">جاري التحميل...</div>
                    ) : calls.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <PhoneOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>لا توجد مكالمات</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {calls.map((call) => (
                                <div
                                    key={call.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-full ${call.direction === 'INBOUND'
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {call.direction === 'INBOUND' ? (
                                                <PhoneIncoming className="h-5 w-5" />
                                            ) : (
                                                <PhoneOutgoing className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium" dir="ltr">
                                                {call.direction === 'INBOUND' ? call.from : call.to}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(call.createdAt), 'PPp', { locale: ar })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatDuration(call.duration)}</span>
                                            </div>
                                            {call.user && (
                                                <p className="text-sm text-muted-foreground">
                                                    {call.user.name}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(call.status)}
                                        {call.recording && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => window.open(call.recording?.recordingUrl, '_blank')}
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
