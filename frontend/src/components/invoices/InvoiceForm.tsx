import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Input, Label } from '@/components/ui';
import type { Invoice } from '@/types';

const invoiceItemSchema = z.object({
    description: z.string().min(1, 'الوصف مطلوب'),
    quantity: z.number().min(1, 'الكمية مطلوبة'),
    unitPrice: z.number().min(0, 'السعر غير صالح'),
});

const invoiceSchema = z.object({
    clientId: z.string().min(1, 'العميل مطلوب'),
    caseId: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    dueDate: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    items: z.array(invoiceItemSchema).min(1, 'أضف بند واحد على الأقل'),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    initialData?: Invoice;
    onSubmit: (data: InvoiceFormData) => void;
    isLoading?: boolean;
    clients?: Array<{ id: string; name: string }>;
    cases?: Array<{ id: string; title: string; caseNumber: string }>;
}

const statusOptions = [
    { value: 'DRAFT', label: 'مسودة' },
    { value: 'PENDING', label: 'قيد الانتظار' },
    { value: 'SENT', label: 'مرسلة' },
    { value: 'PAID', label: 'مدفوعة' },
    { value: 'OVERDUE', label: 'متأخرة' },
];

export function InvoiceForm({ initialData, onSubmit, isLoading, clients = [], cases = [] }: InvoiceFormProps) {
    // Prepare items from initialData or start with empty default
    const defaultItems = initialData?.items?.length
        ? initialData.items.map(item => ({
            description: item.description || '',
            quantity: item.quantity || 1,
            unitPrice: Number(item.unitPrice) || 0,
        }))
        : [{ description: '', quantity: 1, unitPrice: 0 }];

    const {
        register,
        control,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            clientId: initialData?.clientId || '',
            caseId: initialData?.caseId || '',
            description: initialData?.description || '',
            status: initialData?.status || 'PENDING',
            dueDate: initialData?.dueDate?.split('T')[0] || '',
            taxRate: initialData?.taxAmount ? Math.round((Number(initialData.taxAmount) / Number(initialData.amount)) * 100) : 15,
            items: defaultItems,
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items',
    });

    const items = watch('items');
    const taxRate = watch('taxRate') || 0;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-SA', {
            style: 'currency',
            currency: 'SAR',
        }).format(amount);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Client & Case */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="clientId">العميل *</Label>
                    <select
                        id="clientId"
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('clientId')}
                    >
                        <option value="">اختر العميل</option>
                        {clients.map((client) => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                    {errors.clientId && (
                        <p className="text-sm text-destructive">{errors.clientId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="caseId">القضية (اختياري)</Label>
                    <select
                        id="caseId"
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        {...register('caseId')}
                    >
                        <option value="">بدون قضية</option>
                        {cases.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.caseNumber} - {c.title}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">وصف الفاتورة</Label>
                <textarea
                    id="description"
                    placeholder="وصف اختياري للفاتورة..."
                    className="w-full min-h-[80px] px-3 py-2 rounded-md border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('description')}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="dueDate">تاريخ الاستحقاق</Label>
                    <Input
                        id="dueDate"
                        type="date"
                        {...register('dueDate')}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
                    <Input
                        id="taxRate"
                        type="number"
                        min="0"
                        max="100"
                        {...register('taxRate', { valueAsNumber: true })}
                    />
                </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
                <Label htmlFor="status">حالة الفاتورة</Label>
                <select
                    id="status"
                    className="w-full h-10 px-3 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    {...register('status')}
                >
                    {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>بنود الفاتورة *</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })}
                    >
                        <Plus className="w-4 h-4 ml-1" />
                        إضافة بند
                    </Button>
                </div>

                {fields.map((field, index) => (
                    <div key={field.id} className="bg-muted/30 rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <span className="text-sm font-medium">بند {index + 1}</span>
                            {fields.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => remove(index)}
                                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Input
                                placeholder="وصف الخدمة"
                                {...register(`items.${index}.description`)}
                            />
                            {errors.items?.[index]?.description && (
                                <p className="text-sm text-destructive">{errors.items[index]?.description?.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>الكمية</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>السعر (ر.س)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                                />
                            </div>
                        </div>

                        <div className="text-left font-medium">
                            {formatCurrency((items[index]?.quantity || 0) * (items[index]?.unitPrice || 0))}
                        </div>
                    </div>
                ))}

                {errors.items?.message && (
                    <p className="text-sm text-destructive">{errors.items.message}</p>
                )}
            </div>

            {/* Summary */}
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span>الضريبة ({taxRate}%)</span>
                    <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>الإجمالي</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" isLoading={isLoading}>
                    {initialData ? 'حفظ التغييرات' : 'إنشاء الفاتورة'}
                </Button>
            </div>
        </form>
    );
}

export default InvoiceForm;
