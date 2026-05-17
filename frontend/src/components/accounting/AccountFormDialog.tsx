import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button, Input, Label } from '@/components/ui';
import toast from 'react-hot-toast';
import { accountingApi } from '@/api/accounting.api';
import { useQueryClient } from '@tanstack/react-query';
import { accountingKeys } from '@/hooks/use-accounting';
import {
    Account, AccountType, ACCOUNT_TYPE_LABELS,
} from '@/types/accounting.types';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account?: Account | null; // when set, edit mode
    allAccounts?: Account[]; // for parent selection
}

export function AccountFormDialog({ open, onOpenChange, account, allAccounts = [] }: Props) {
    const isEdit = !!account;
    const qc = useQueryClient();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        accountNumber: '',
        nameAr: '',
        nameEn: '',
        accountType: 'ASSET' as AccountType,
        category: '',
        parentId: '',
        isActive: true,
    });

    useEffect(() => {
        if (account) {
            setForm({
                accountNumber: account.accountNumber || '',
                nameAr: account.nameAr || '',
                nameEn: account.nameEn || '',
                accountType: account.accountType,
                category: account.category || '',
                parentId: account.parentId || '',
                isActive: account.isActive ?? true,
            });
        } else {
            setForm({
                accountNumber: '',
                nameAr: '',
                nameEn: '',
                accountType: 'ASSET',
                category: '',
                parentId: '',
                isActive: true,
            });
        }
    }, [account, open]);

    // Flatten accounts for parent selection
    const flatAccounts: Account[] = [];
    const walk = (accs: Account[]) => {
        accs.forEach(a => {
            flatAccounts.push(a);
            if (a.childAccounts) walk(a.childAccounts);
        });
    };
    walk(allAccounts);

    const handleSubmit = async () => {
        if (!form.accountNumber || !form.nameAr || !form.accountType) {
            toast.error('يرجى تعبئة الحقول المطلوبة');
            return;
        }
        setSaving(true);
        try {
            const payload: any = {
                accountNumber: form.accountNumber,
                nameAr: form.nameAr,
                nameEn: form.nameEn || form.nameAr,
                accountType: form.accountType,
                category: form.category || form.accountType,
                isActive: form.isActive,
            };
            if (form.parentId) payload.parentId = form.parentId;

            if (isEdit && account) {
                await accountingApi.updateAccount(account.id, payload);
                toast.success('تم تعديل الحساب');
            } else {
                await accountingApi.createAccount(payload);
                toast.success('تم إضافة الحساب');
            }
            qc.invalidateQueries({ queryKey: accountingKeys.accounts() });
            onOpenChange(false);
        } catch (err: any) {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg[0] : msg || (isEdit ? 'فشل في التعديل' : 'فشل في الإضافة'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'تعديل حساب' : 'إضافة حساب جديد'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'قم بتعديل بيانات الحساب' : 'أضف حساباً جديداً إلى دليل الحسابات'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>رقم الحساب *</Label>
                            <Input
                                value={form.accountNumber}
                                onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                placeholder="1101"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>نوع الحساب *</Label>
                            <select
                                value={form.accountType}
                                onChange={e => setForm({ ...form, accountType: e.target.value as AccountType })}
                                className="h-10 w-full px-3 rounded-md border bg-background text-sm"
                            >
                                {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>اسم الحساب بالعربية *</Label>
                        <Input
                            value={form.nameAr}
                            onChange={e => setForm({ ...form, nameAr: e.target.value })}
                            placeholder="مثال: النقدية في الصندوق"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>اسم الحساب بالإنجليزية</Label>
                        <Input
                            value={form.nameEn}
                            onChange={e => setForm({ ...form, nameEn: e.target.value })}
                            placeholder="Cash on Hand"
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label>الحساب الأب (اختياري)</Label>
                        <select
                            value={form.parentId}
                            onChange={e => setForm({ ...form, parentId: e.target.value })}
                            className="h-10 w-full px-3 rounded-md border bg-background text-sm"
                        >
                            <option value="">— بدون حساب أب —</option>
                            {flatAccounts
                                .filter(a => a.id !== account?.id)
                                .map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.accountNumber} - {a.nameAr}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <Label>التصنيف</Label>
                        <Input
                            value={form.category}
                            onChange={e => setForm({ ...form, category: e.target.value })}
                            placeholder="CURRENT_ASSETS, FIXED_ASSETS, ..."
                            dir="ltr"
                        />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.isActive}
                            onChange={e => setForm({ ...form, isActive: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">حساب نشط</span>
                    </label>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
                    <Button onClick={handleSubmit} disabled={saving}>
                        {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                        {isEdit ? 'حفظ التعديلات' : 'إضافة'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
