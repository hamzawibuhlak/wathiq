import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, X, User, MoreVertical, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent, UserAvatar } from '@/components/ui';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useToggleUserActive,
} from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

const userSchema = z.object({
    name: z.string().min(2, 'الاسم مطلوب'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
    role: z.enum(['ADMIN', 'LAWYER', 'SECRETARY'], { required_error: 'الدور مطلوب' }),
    phone: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

const roleLabels: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'مالك', color: 'bg-purple-100 text-purple-700' },
    ADMIN: { label: 'مدير', color: 'bg-blue-100 text-blue-700' },
    LAWYER: { label: 'محامي', color: 'bg-green-100 text-green-700' },
    SECRETARY: { label: 'سكرتير', color: 'bg-yellow-100 text-yellow-700' },
};

export function UsersPage() {
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const { data, isLoading } = useUsers({
        search: search || undefined,
        role: roleFilter || undefined,
    });

    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser(editingUser?.id || '');
    const deleteMutation = useDeleteUser();
    const toggleActiveMutation = useToggleUserActive();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
    });

    const users = data?.data || [];

    const handleOpenForm = (user?: UserType) => {
        if (user) {
            setEditingUser(user);
            setValue('name', user.name);
            setValue('email', user.email);
            setValue('role', user.role as 'ADMIN' | 'LAWYER' | 'SECRETARY');
            setValue('phone', user.phone || '');
            setValue('password', '********'); // placeholder
        } else {
            setEditingUser(null);
            reset();
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingUser(null);
        reset();
    };

    const onSubmit = (data: UserFormData) => {
        if (editingUser) {
            updateMutation.mutate(
                {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    phone: data.phone,
                },
                { onSuccess: handleCloseForm }
            );
        } else {
            createMutation.mutate(data, { onSuccess: handleCloseForm });
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = (id: string, currentStatus: boolean) => {
        toggleActiveMutation.mutate({ id, isActive: !currentStatus });
    };

    return (
        <div className="p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>إدارة المستخدمين</CardTitle>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="w-4 h-4 ml-2" />
                        إضافة مستخدم
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="بحث بالاسم أو البريد..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                        >
                            <option value="">جميع الأدوار</option>
                            <option value="ADMIN">مدير</option>
                            <option value="LAWYER">محامي</option>
                            <option value="SECRETARY">سكرتير</option>
                        </select>
                    </div>

                    {/* Users List */}
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                                    <div className="w-10 h-10 bg-muted rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="w-1/3 h-4 bg-muted rounded" />
                                        <div className="w-1/4 h-3 bg-muted rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">لا يوجد مستخدمين</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className={cn(
                                        'flex items-center justify-between p-4 border rounded-lg transition-colors',
                                        !user.isActive && 'opacity-60 bg-muted/30'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <UserAvatar
                                            name={user.name}
                                            avatar={user.avatar}
                                            size="md"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{user.name}</span>
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full', roleLabels[user.role]?.color)}>
                                                    {roleLabels[user.role]?.label}
                                                </span>
                                                {!user.isActive && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                        معطل
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {user.role !== 'OWNER' && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                                className="p-2 hover:bg-muted rounded transition-colors"
                                            >
                                                <MoreVertical className="w-5 h-5 text-muted-foreground" />
                                            </button>
                                            {openMenuId === user.id && (
                                                <div className="absolute left-0 top-full mt-1 w-40 bg-card rounded-lg shadow-lg border py-1 z-10">
                                                    <button
                                                        onClick={() => { handleOpenForm(user); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                        تعديل
                                                    </button>
                                                    <button
                                                        onClick={() => { handleToggleActive(user.id, user.isActive); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                    >
                                                        {user.isActive ? (
                                                            <>
                                                                <XCircle className="w-4 h-4" />
                                                                تعطيل
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-4 h-4" />
                                                                تفعيل
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => { handleDelete(user.id); setOpenMenuId(null); }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        حذف
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                            </h2>
                            <button onClick={handleCloseForm} className="p-2 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم *</Label>
                                <Input id="name" {...register('name')} error={errors.name?.message} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني *</Label>
                                <Input id="email" type="email" {...register('email')} error={errors.email?.message} />
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label htmlFor="password">كلمة المرور *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...register('password')}
                                        error={errors.password?.message}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="role">الدور *</Label>
                                <select
                                    id="role"
                                    {...register('role')}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                >
                                    <option value="">اختر الدور</option>
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                </select>
                                {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الجوال</Label>
                                <Input id="phone" type="tel" dir="ltr" className="text-right" {...register('phone')} />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={handleCloseForm}>
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={createMutation.isPending || updateMutation.isPending}
                                >
                                    {editingUser ? 'حفظ' : 'إضافة'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersPage;
