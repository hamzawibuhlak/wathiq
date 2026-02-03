import { forwardRef } from 'react';
import type { Invoice } from '@/types';
import { formatDate } from '@/lib/utils';

interface CompanyInfo {
    name?: string;
    logo?: string;
    taxNumber?: string;
    commercialReg?: string;
    address?: string;
    city?: string;
    phone?: string;
    email?: string;
}

interface InvoiceTemplateProps {
    invoice: Invoice;
    company?: CompanyInfo;
}

export const InvoiceTemplate = forwardRef<HTMLDivElement, InvoiceTemplateProps>(
    ({ invoice, company }, ref) => {
        const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('ar-SA', {
                style: 'currency',
                currency: 'SAR',
            }).format(amount);
        };

        const tenantName = company?.name || 'مكتب وثيق للمحاماة';

        return (
            <div ref={ref} className="bg-white p-8 max-w-[800px] mx-auto" dir="rtl">
                {/* Header */}
                <div className="flex justify-between items-start mb-8 pb-4 border-b-2 border-gray-200">
                    <div>
                        {company?.logo ? (
                            <img src={company.logo} alt={tenantName} className="h-16 mb-2" />
                        ) : (
                            <h1 className="text-2xl font-bold text-gray-800">{tenantName}</h1>
                        )}
                        <div className="text-gray-500 text-sm space-y-1">
                            {(company?.address || company?.city) && (
                                <p>{[company.address, company.city].filter(Boolean).join('، ')}</p>
                            )}
                            {company?.phone && <p dir="ltr" className="text-right">{company.phone}</p>}
                            {company?.email && <p>{company.email}</p>}
                            {company?.taxNumber && (
                                <p>
                                    <span className="font-medium">الرقم الضريبي: </span>
                                    {company.taxNumber}
                                </p>
                            )}
                            {company?.commercialReg && (
                                <p>
                                    <span className="font-medium">السجل التجاري: </span>
                                    {company.commercialReg}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-left">
                        <h2 className="text-3xl font-bold text-primary mb-2">فاتورة</h2>
                        <p className="text-gray-600">
                            <span className="font-medium">رقم الفاتورة:</span> {invoice.invoiceNumber}
                        </p>
                        <p className="text-gray-600">
                            <span className="font-medium">التاريخ:</span> {formatDate(invoice.createdAt)}
                        </p>
                        {invoice.dueDate && (
                            <p className="text-gray-600">
                                <span className="font-medium">الاستحقاق:</span> {formatDate(invoice.dueDate)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Client Info */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-700 mb-2">فاتورة إلى:</h3>
                    <p className="font-bold text-lg">{invoice.client?.name}</p>
                    {invoice.client?.email && (
                        <p className="text-gray-600">{invoice.client.email}</p>
                    )}
                    {invoice.client?.phone && (
                        <p className="text-gray-600" dir="ltr" style={{ textAlign: 'right' }}>{invoice.client.phone}</p>
                    )}
                </div>

                {/* Case Info */}
                {invoice.case && (
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">القضية:</h3>
                        <p className="font-medium">{invoice.case.caseNumber} - {invoice.case.title}</p>
                    </div>
                )}

                {/* Description */}
                {invoice.description && (
                    <div className="mb-6">
                        <h3 className="font-semibold text-gray-700 mb-2">الوصف:</h3>
                        <p className="text-gray-600">{invoice.description}</p>
                    </div>
                )}

                {/* Items Table */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-right py-3 px-4 font-semibold">البيان</th>
                            <th className="text-center py-3 px-4 font-semibold">الكمية</th>
                            <th className="text-center py-3 px-4 font-semibold">السعر</th>
                            <th className="text-left py-3 px-4 font-semibold">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item, index) => (
                                <tr key={item.id || index} className="border-b">
                                    <td className="py-3 px-4">{item.description}</td>
                                    <td className="py-3 px-4 text-center">{item.quantity}</td>
                                    <td className="py-3 px-4 text-center">{formatCurrency(item.unitPrice)}</td>
                                    <td className="py-3 px-4 text-left">{formatCurrency(item.quantity * item.unitPrice)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr className="border-b">
                                <td className="py-3 px-4">خدمات قانونية</td>
                                <td className="py-3 px-4 text-center">1</td>
                                <td className="py-3 px-4 text-center">{formatCurrency(invoice.amount)}</td>
                                <td className="py-3 px-4 text-left">{formatCurrency(invoice.amount)}</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-64">
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">المجموع الفرعي</span>
                            <span className="font-medium">{formatCurrency(invoice.amount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                            <span className="text-gray-600">الضريبة (15%)</span>
                            <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between py-3 text-lg font-bold">
                            <span>الإجمالي</span>
                            <span className="text-primary">{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="flex justify-center mb-8">
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : invoice.status === 'OVERDUE'
                            ? 'bg-red-100 text-red-700'
                            : invoice.status === 'PENDING'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {invoice.status === 'PAID' ? 'مدفوعة' :
                            invoice.status === 'OVERDUE' ? 'متأخرة' :
                                invoice.status === 'PENDING' ? 'قيد الانتظار' : 'غير مدفوعة'}
                    </span>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm border-t pt-4">
                    <p>شكراً لتعاملكم معنا</p>
                    <p>{tenantName} - جميع الحقوق محفوظة</p>
                </div>
            </div>
        );
    }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
