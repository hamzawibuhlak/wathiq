import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button, Input, Label } from '@/components/ui';
import toast from 'react-hot-toast';
import { accountingApi } from '@/api/accounting.api';
import { useQueryClient } from '@tanstack/react-query';
import { useAccounts, useExpenseCategories, accountingKeys } from '@/hooks/use-accounting';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ExpenseCategoryDialog({ open, onOpenChange }: Props) {
    const qc = useQueryClient();
    const { data: categories = [] } = useExpenseCategories();
    const { data: accounts = [] } = useAccounts('EXPENSE');

    const [name, setName] = useState('');
    const [accountId, setAccountId] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!name.trim()) { toast.error('يرجى إدخال اسم التصنيف'); return; }
        setSaving(true);
        try {
            await accountingApi.createExpenseCategory({
                name: name.trim(),
                accountId: accountId || undefined,
            });
            toast.success('تم إضافة التصنيف');
            qc.invalidateQueries({ queryKey: accountingKeys.expenseCategories() });
            setName('');
            setAccountId('');
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg[0] : msg || 'فشل في الإضافة');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>إدارة تصنيفات المصروفات</DialogTitle>
                    <DialogDescription>
                        أضف تصنيفات للمصروفات لتنظيمها (إيجار، رواتب، خدمات، ...)
                    </DialogDescription>
                </DialogHeader>

                {/* Add new category */}
                <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                        <Label>اسم التصنيف *</Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="مثال: إيجار المكتب"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>الحساب المرتبط (اختياري)</Label>
                        <select
                            value={accountId}
                            onChange={e => setAccountId(e.target.value)}
                            className="h-10 w-full px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="">— بدون ربط —</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.accountNumber} - {a.nameAr}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button onClick={handleAdd} disabled={saving} className="w-full">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Plus className="w-4 h-4 ml-2" />}
                        إضافة تصنيف
                    </Button>
                </div>

                {/* Existing categories */}
                <div className="border-t pt-3">
                    <Label className="mb-2 block">التصنيفات الموجودة ({categories.length})</Label>
                    {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            لا توجد تصنيفات بعد
                        </p>
                    ) : (
                        <div className="max-h-60 overflow-y-auto space-y-1.5">
                            {categories.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm">
                                    <span className="font-medium">{c.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
