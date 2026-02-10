import { useQuery } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { CreditCard, FileText, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    ACTIVE: { label: 'نشط', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    TRIAL: { label: 'فترة تجريبية', color: 'bg-blue-100 text-blue-700', icon: Clock },
    EXPIRED: { label: 'منتهي', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    CANCELLED: { label: 'ملغي', color: 'bg-gray-100 text-gray-700', icon: AlertTriangle },
    NO_SUBSCRIPTION: { label: 'بدون اشتراك', color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle },
};

export default function BillingPage() {
    const { data: billing, isLoading } = useQuery({
        queryKey: ['owner-billing'],
        queryFn: ownerApi.getBilling,
    });

    const statusInfo = STATUS_LABELS[billing?.status] || STATUS_LABELS.NO_SUBSCRIPTION;
    const StatusIcon = statusInfo.icon;

    return (
        <div className="p-8 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    الاشتراك والفوترة
                </h1>
                <p className="text-sm text-gray-500 mt-1">إدارة خطة الاشتراك والفواتير</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Subscription Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-gray-900">الخطة الحالية</h2>
                            <span className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {statusInfo.label}
                            </span>
                        </div>

                        {billing?.plan ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">اسم الخطة</p>
                                    <p className="font-bold text-lg text-gray-900 mt-1">{billing.plan.nameAr || billing.plan.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">المبلغ</p>
                                    <p className="font-bold text-lg text-gray-900 mt-1">
                                        {billing.amount} {billing.currency || 'ر.س'}
                                        <span className="text-xs text-gray-400 font-normal mr-1">
                                            / {billing.billingCycle === 'ANNUAL' ? 'سنوياً' : 'شهرياً'}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">تاريخ التجديد</p>
                                    <p className="font-bold text-lg text-gray-900 mt-1">
                                        {billing.renewalDate
                                            ? new Date(billing.renewalDate).toLocaleDateString('ar-SA')
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6 text-gray-400">
                                <CreditCard className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                                <p className="font-medium">لا يوجد اشتراك حالي</p>
                                <p className="text-sm mt-1">تواصل مع الإدارة لتفعيل اشتراك</p>
                            </div>
                        )}

                        {billing?.plan && (
                            <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <PlanLimit label="المستخدمون" value={billing.plan.maxUsers} />
                                <PlanLimit label="القضايا" value={billing.plan.maxCases} />
                                <PlanLimit label="التخزين" value={`${billing.plan.maxStorageGB} GB`} />
                                <PlanLimit label="العملاء" value={billing.plan.maxClients} />
                            </div>
                        )}
                    </div>

                    {/* Invoices */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            الفواتير الأخيرة
                        </h2>

                        {billing?.invoices?.length > 0 ? (
                            <div className="space-y-3">
                                {billing.invoices.map((inv: any) => (
                                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50/50">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{inv.invoiceNumber}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(inv.dueDate).toLocaleDateString('ar-SA')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-medium text-gray-900">{inv.totalAmount} ر.س</p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${inv.status === 'PAID'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {inv.status === 'PAID' ? 'مدفوعة' : 'معلقة'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-6">لا توجد فواتير</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

function PlanLimit({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-bold text-gray-900">{value}</p>
        </div>
    );
}
