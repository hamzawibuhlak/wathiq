import { Link, useParams } from 'react-router-dom';
import {
    ArrowRight,
    Users,
    Pencil,
    Mail,
    Phone,
    MapPin,
    Building2,
    CreditCard,
    Scale,
    AlertTriangle,
    CalendarDays,
    FileText,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { useClient } from '@/hooks/use-clients';
import { formatDate, formatCurrency } from '@/lib/utils';
import { CaseStatusBadge } from '@/components/cases';
import { HearingStatusBadge } from '@/components/hearings';
import { useAuthStore } from '@/stores/auth.store';

// Invoice status badge component
function InvoiceStatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { label: string; className: string }> = {
        PENDING: { label: 'معلقة', className: 'bg-yellow-100 text-yellow-700' },
        PAID: { label: 'مدفوعة', className: 'bg-green-100 text-green-700' },
        OVERDUE: { label: 'متأخرة', className: 'bg-red-100 text-red-700' },
        CANCELLED: { label: 'ملغاة', className: 'bg-gray-100 text-gray-600' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return (
        <span className={`text-xs px-2 py-1 rounded-full ${config.className}`}>
            {config.label}
        </span>
    );
}

export function ClientDetailsPage() {
    const { id } = useParams<{ id: string }>();

    const { data: clientData, isLoading: clientLoading, error } = useClient(id!);
    const { user } = useAuthStore();
    const isLawyer = user?.role === 'LAWYER';

    const client = clientData?.data;

    if (clientLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-32 h-8 bg-muted rounded" />
                </div>
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                            <div className="w-1/2 h-6 bg-muted rounded" />
                            <div className="w-1/3 h-4 bg-muted rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !client) {
        return (
            <div className="space-y-6">
                <Link to="/clients">
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للعملاء
                    </Button>
                </Link>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">العميل غير موجود</h3>
                    <p className="text-muted-foreground">لم يتم العثور على العميل المطلوب</p>
                </div>
            </div>
        );
    }

    const isCompany = client.companyName || client.commercialReg;
    const cases = (client as any).cases || [];
    const hearings = (client as any).hearings || [];
    const invoices = (client as any).invoices || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/clients">
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4 ml-2" />
                            العملاء
                        </Button>
                    </Link>
                </div>
                <Link to={`/clients/${id}/edit`}>
                    <Button variant="outline">
                        <Pencil className="w-4 h-4 ml-2" />
                        تعديل
                    </Button>
                </Link>
            </div>

            {/* Client Header */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Avatar */}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 ${isCompany ? 'bg-purple-100' : 'bg-primary/10'
                            }`}>
                            {isCompany ? (
                                <Building2 className="w-10 h-10 text-purple-600" />
                            ) : (
                                <Users className="w-10 h-10 text-primary" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold">{client.name}</h1>
                                <span className={`text-xs px-2 py-1 rounded-full ${client.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {client.isActive ? 'نشط' : 'غير نشط'}
                                </span>
                            </div>
                            <p className="text-muted-foreground mb-4">
                                {isCompany ? 'شركة' : 'فرد'} • عميل منذ {formatDate(client.createdAt)}
                            </p>

                            {/* Contact Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {client.email && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <a href={`mailto:${client.email}`} className="hover:text-primary">
                                            {client.email}
                                        </a>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <a href={`tel:${client.phone}`} className="hover:text-primary" dir="ltr">
                                            {client.phone}
                                        </a>
                                    </div>
                                )}
                                {(client.city || client.address) && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{[client.city, client.address].filter(Boolean).join(' - ')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className={`grid w-full ${isLawyer ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
                    <TabsTrigger value="cases">
                        القضايا ({(client._count as any)?.cases || 0})
                    </TabsTrigger>
                    <TabsTrigger value="hearings">
                        الجلسات ({(client._count as any)?.hearings || 0})
                    </TabsTrigger>
                    {!isLawyer && (
                        <TabsTrigger value="invoices">
                            الفواتير ({(client._count as any)?.invoices || 0})
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-muted-foreground" />
                                معلومات إضافية
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isCompany ? (
                                <>
                                    {client.companyName && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">الاسم التجاري</p>
                                            <p className="font-medium">{client.companyName}</p>
                                        </div>
                                    )}
                                    {client.commercialReg && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">السجل التجاري</p>
                                            <p className="font-medium">{client.commercialReg}</p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                client.nationalId && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">رقم الهوية</p>
                                        <p className="font-medium">{client.nationalId}</p>
                                    </div>
                                )
                            )}
                            {client.notes && (
                                <div>
                                    <p className="text-sm text-muted-foreground">ملاحظات</p>
                                    <p className="text-sm">{client.notes}</p>
                                </div>
                            )}
                            {!client.nationalId && !client.companyName && !client.notes && (
                                <p className="text-muted-foreground text-sm">لا توجد معلومات إضافية</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Cases Tab */}
                <TabsContent value="cases" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Scale className="w-5 h-5 text-muted-foreground" />
                                القضايا
                            </CardTitle>
                            <Link to={`/cases/new?clientId=${id}`}>
                                <Button size="sm">إضافة قضية</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {cases.length > 0 ? (
                                <div className="space-y-3">
                                    {cases.map((c: any) => (
                                        <Link
                                            key={c.id}
                                            to={`/cases/${c.id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{c.title}</p>
                                                <p className="text-xs text-muted-foreground">{c.caseNumber}</p>
                                            </div>
                                            <CaseStatusBadge status={c.status} />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    لا توجد قضايا لهذا العميل
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hearings Tab */}
                <TabsContent value="hearings" className="mt-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                                الجلسات
                            </CardTitle>
                            <Link to={`/hearings/new?clientId=${id}`}>
                                <Button size="sm">إضافة جلسة</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {hearings.length > 0 ? (
                                <div className="space-y-3">
                                    {hearings.map((h: any) => (
                                        <Link
                                            key={h.id}
                                            to={`/hearings/${h.id}/edit`}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {h.courtName || 'جلسة'} {h.courtroom && `- ${h.courtroom}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(h.hearingDate)} • {h.case?.caseNumber || ''}
                                                </p>
                                            </div>
                                            <HearingStatusBadge status={h.status} />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm text-center py-8">
                                    لا توجد جلسات مجدولة لهذا العميل
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invoices Tab - Hidden from lawyers */}
                {!isLawyer && (
                    <TabsContent value="invoices" className="mt-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    الفواتير
                                </CardTitle>
                                <Link to={`/invoices/new?clientId=${id}`}>
                                    <Button size="sm">إضافة فاتورة</Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {invoices.length > 0 ? (
                                    <div className="space-y-3">
                                        {invoices.map((inv: any) => (
                                            <Link
                                                key={inv.id}
                                                to={`/invoices/${inv.id}`}
                                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        استحقاق: {formatDate(inv.dueDate)} • {inv.case?.caseNumber || ''}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-semibold text-sm">
                                                        {formatCurrency(inv.amount)}
                                                    </span>
                                                    <InvoiceStatusBadge status={inv.status} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-sm text-center py-8">
                                        لا توجد فواتير لهذا العميل
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}

export default ClientDetailsPage;

