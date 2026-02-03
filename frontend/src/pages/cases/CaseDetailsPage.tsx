import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import {
    ArrowRight,
    Scale,
    Pencil,
    Calendar,
    User,
    Building2,
    FileText,
    Receipt,
    Clock,
    AlertTriangle,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { CaseStatusBadge } from '@/components/cases';
import { useCase } from '@/hooks/use-cases';
import { formatDate, cn } from '@/lib/utils';

type TabType = 'overview' | 'hearings' | 'documents' | 'invoices';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'نظرة عامة', icon: Scale },
    { id: 'hearings', label: 'الجلسات', icon: Calendar },
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'invoices', label: 'الفواتير', icon: Receipt },
];

const caseTypeLabels: Record<string, string> = {
    CIVIL: 'مدني',
    CRIMINAL: 'جنائي',
    COMMERCIAL: 'تجاري',
    LABOR: 'عمالي',
    FAMILY: 'أحوال شخصية',
    ADMINISTRATIVE: 'إداري',
};

const priorityLabels: Record<string, { label: string; className: string }> = {
    HIGH: { label: 'عالية', className: 'text-red-600' },
    MEDIUM: { label: 'متوسطة', className: 'text-yellow-600' },
    LOW: { label: 'منخفضة', className: 'text-green-600' },
};

export function CaseDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const { data, isLoading, error } = useCase(id!);
    const caseData = data?.data;

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="flex items-center gap-4">
                    <div className="w-32 h-8 bg-muted rounded" />
                </div>
                <div className="bg-card rounded-xl border p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="w-16 h-16 bg-muted rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="w-1/2 h-6 bg-muted rounded" />
                            <div className="w-1/3 h-4 bg-muted rounded" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="p-4 bg-muted/50 rounded-lg">
                                <div className="w-16 h-3 bg-muted rounded mb-2" />
                                <div className="w-24 h-5 bg-muted rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || !caseData) {
        return (
            <div className="space-y-6">
                <Link to="/cases">
                    <Button variant="ghost" size="sm">
                        <ArrowRight className="w-4 h-4 ml-2" />
                        العودة للقضايا
                    </Button>
                </Link>
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">القضية غير موجودة</h3>
                    <p className="text-muted-foreground">لم يتم العثور على القضية المطلوبة</p>
                </div>
            </div>
        );
    }

    const priority = priorityLabels[caseData.priority || 'MEDIUM'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/cases">
                        <Button variant="ghost" size="sm">
                            <ArrowRight className="w-4 h-4 ml-2" />
                            القضايا
                        </Button>
                    </Link>
                </div>
                <Link to={`/cases/${id}/edit`}>
                    <Button variant="outline">
                        <Pencil className="w-4 h-4 ml-2" />
                        تعديل
                    </Button>
                </Link>
            </div>

            {/* Case Header Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Icon */}
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Scale className="w-8 h-8 text-primary" />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h1 className="text-2xl font-bold">{caseData.title}</h1>
                                <CaseStatusBadge status={caseData.status} />
                            </div>
                            <p className="text-muted-foreground mb-4">{caseData.caseNumber}</p>

                            {caseData.description && (
                                <p className="text-muted-foreground mb-4">{caseData.description}</p>
                            )}

                            {/* Quick Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">النوع</p>
                                    <p className="font-medium">{caseTypeLabels[caseData.caseType] || caseData.caseType}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">الأولوية</p>
                                    <p className={cn('font-medium', priority.className)}>{priority.label}</p>
                                </div>
                                {caseData.client && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">العميل</p>
                                        <p className="font-medium">{caseData.client.name}</p>
                                    </div>
                                )}
                                {caseData.courtName && (
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground mb-1">المحكمة</p>
                                        <p className="font-medium">{caseData.courtName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <div className="border-b">
                <nav className="flex gap-4 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[300px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Case Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">تفاصيل القضية</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Building2 className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">المحكمة</p>
                                        <p className="font-medium">{caseData.courtName || 'غير محدد'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">الخصم</p>
                                        <p className="font-medium">{caseData.opposingParty || 'غير محدد'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">تاريخ الإيداع</p>
                                        <p className="font-medium">
                                            {caseData.filingDate ? formatDate(caseData.filingDate) : 'غير محدد'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">تاريخ الإنشاء</p>
                                        <p className="font-medium">{formatDate(caseData.createdAt)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Client Info */}
                        {caseData.client && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">معلومات العميل</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                            <User className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{caseData.client.name}</p>
                                            <p className="text-sm text-muted-foreground">{caseData.client.email}</p>
                                        </div>
                                    </div>
                                    {caseData.client.phone && (
                                        <p className="text-sm">
                                            <span className="text-muted-foreground">الهاتف: </span>
                                            {caseData.client.phone}
                                        </p>
                                    )}
                                    <Link to={`/clients/${caseData.client.id}`}>
                                        <Button variant="outline" size="sm" className="w-full">
                                            عرض ملف العميل
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === 'hearings' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">الجلسات ({caseData.hearings?.length || 0})</CardTitle>
                            <Link to={`/hearings/new?caseId=${caseData.id}`}>
                                <Button size="sm">
                                    إضافة جلسة
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {caseData.hearings && caseData.hearings.length > 0 ? (
                                <div className="space-y-3">
                                    {caseData.hearings.map((hearing: any) => (
                                        <div key={hearing.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{hearing.courtName || 'جلسة'}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(hearing.hearingDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'px-2 py-1 text-xs rounded-full',
                                                    hearing.status === 'SCHEDULED' && 'bg-blue-100 text-blue-700',
                                                    hearing.status === 'COMPLETED' && 'bg-green-100 text-green-700',
                                                    hearing.status === 'POSTPONED' && 'bg-yellow-100 text-yellow-700',
                                                    hearing.status === 'CANCELLED' && 'bg-red-100 text-red-700'
                                                )}>
                                                    {hearing.status === 'SCHEDULED' && 'مجدولة'}
                                                    {hearing.status === 'COMPLETED' && 'منتهية'}
                                                    {hearing.status === 'POSTPONED' && 'مؤجلة'}
                                                    {hearing.status === 'CANCELLED' && 'ملغية'}
                                                </span>
                                                <Link to={`/hearings/${hearing.id}`}>
                                                    <Button variant="ghost" size="sm">عرض</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <p className="text-muted-foreground">لا توجد جلسات مسجلة لهذه القضية</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'documents' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">المستندات ({caseData.documents?.length || 0})</CardTitle>
                            <Link to={`/documents?caseId=${caseData.id}`}>
                                <Button size="sm">
                                    رفع مستند
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {caseData.documents && caseData.documents.length > 0 ? (
                                <div className="space-y-3">
                                    {caseData.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{doc.title || doc.fileName}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(doc.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link to={`/documents/${doc.id}`}>
                                                <Button variant="ghost" size="sm">عرض</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <p className="text-muted-foreground">لا توجد مستندات مرفقة</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {activeTab === 'invoices' && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">الفواتير ({caseData.invoices?.length || 0})</CardTitle>
                            <Link to={`/invoices/new?caseId=${caseData.id}&clientId=${caseData.clientId}`}>
                                <Button size="sm">
                                    إنشاء فاتورة
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {caseData.invoices && caseData.invoices.length > 0 ? (
                                <div className="space-y-3">
                                    {caseData.invoices.map((invoice: any) => (
                                        <div key={invoice.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                    <Receipt className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{invoice.invoiceNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {invoice.totalAmount?.toLocaleString('ar-SA')} ر.س
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    'px-2 py-1 text-xs rounded-full',
                                                    invoice.status === 'PAID' && 'bg-green-100 text-green-700',
                                                    invoice.status === 'SENT' && 'bg-blue-100 text-blue-700',
                                                    invoice.status === 'DRAFT' && 'bg-gray-100 text-gray-700',
                                                    invoice.status === 'OVERDUE' && 'bg-red-100 text-red-700'
                                                )}>
                                                    {invoice.status === 'PAID' && 'مدفوعة'}
                                                    {invoice.status === 'SENT' && 'مرسلة'}
                                                    {invoice.status === 'DRAFT' && 'مسودة'}
                                                    {invoice.status === 'OVERDUE' && 'متأخرة'}
                                                </span>
                                                <Link to={`/invoices/${invoice.id}`}>
                                                    <Button variant="ghost" size="sm">عرض</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Receipt className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <p className="text-muted-foreground">لا توجد فواتير لهذه القضية</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

export default CaseDetailsPage;
