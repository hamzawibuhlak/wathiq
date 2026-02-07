import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
    Plus, Search, X, User, MoreVertical, Pencil, Trash2, 
    CheckCircle, XCircle, Mail, Shield, UserPlus, RefreshCw 
} from 'lucide-react';
import { Button, Input, Label, Card, CardHeader, CardContent, UserAvatar } from '@/components/ui';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useDeactivateUser,
    useReactivateUser,
    useChangeUserRole,
    useUserStats,
    useInvitations,
    useCreateInvitation,
    useCancelInvitation,
    useResendInvitation,
} from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { User as UserType } from '@/types';

// Schemas
const userSchema = z.object({
    name: z.string().min(2, 'الاسم مطلوب'),
    email: z.string().email('البريد الإلكتروني غير صالح'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
    role: z.enum(['ADMIN', 'LAWYER', 'SECRETARY'], { required_error: 'الدور مطلوب' }),
    phone: z.string().optional(),
});

const inviteSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح'),
    role: z.enum(['ADMIN', 'LAWYER', 'SECRETARY'], { required_error: 'الدور مطلوب' }),
});

type UserFormData = z.infer<typeof userSchema>;
type InviteFormData = z.infer<typeof inviteSchema>;

const roleLabels: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'مالك', color: 'bg-purple-100 text-purple-700' },
    ADMIN: { label: 'مدير', color: 'bg-blue-100 text-blue-700' },
    LAWYER: { label: 'محامي', color: 'bg-green-100 text-green-700' },
    SECRETARY: { label: 'سكرتير', color: 'bg-yellow-100 text-yellow-700' },
};

const invitationStatusLabels: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'معلقة', color: 'bg-yellow-100 text-yellow-700' },
    ACCEPTED: { label: 'مقبولة', color: 'bg-green-100 text-green-700' },
    EXPIRED: { label: 'منتهية', color: 'bg-gray-100 text-gray-700' },
    CANCELLED: { label: 'ملغاة', color: 'bg-red-100 text-red-700' },
};

export function UsersPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
    const [showForm, setShowForm] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Queries
    const params = {
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    };

    const { data: usersData, isLoading } = useUsers(params);
    const { data: statsData } = useUserStats();
    const { data: invitationsData, isLoading: invitationsLoading } = useInvitations();

    // Mutations
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser(editingUser?.id || '');
    const deleteMutation = useDeleteUser();
    const deactivateMutation = useDeactivateUser();
    const reactivateMutation = useReactivateUser();
    const changeRoleMutation = useChangeUserRole();
    const createInvitationMutation = useCreateInvitation();
    const cancelInvitationMutation = useCancelInvitation();
    const resendInvitationMutation = useResendInvitation();

    // Forms
    const userForm = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
    });

    const inviteForm = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: { role: 'LAWYER' },
    });

    const users = usersData?.data || [];
    const meta = usersData?.meta;
    const stats = statsData?.data;
    const invitations = invitationsData?.data || [];

    const handleOpenForm = (user?: UserType) => {
        if (user) {
            setEditingUser(user);
            userForm.setValue('name', user.name);
            userForm.setValue('email', user.email);
            userForm.setValue('role', user.role as 'ADMIN' | 'LAWYER' | 'SECRETARY');
            userForm.setValue('phone', user.phone || '');
        } else {
            setEditingUser(null);
            userForm.reset();
        }
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingUser(null);
        userForm.reset();
    };

    const onSubmitUser = (data: UserFormData) => {
        if (editingUser) {
            const updateData: any = {
                name: data.name,
                email: data.email,
                phone: data.phone,
            };
            updateMutation.mutate(updateData, { onSuccess: handleCloseForm });
        } else {
            createMutation.mutate(
                { ...data, password: data.password! },
                { onSuccess: handleCloseForm }
            );
        }
    };

    const onSubmitInvite = (data: InviteFormData) => {
        createInvitationMutation.mutate(data, {
            onSuccess: () => {
                setShowInviteForm(false);
                inviteForm.reset();
            },
        });
    };

    const handleDelete = (id: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = (user: UserType) => {
        if (user.isActive) {
            deactivateMutation.mutate(user.id);
        } else {
            reactivateMutation.mutate(user.id);
        }
        setOpenMenuId(null);
    };

    const handleChangeRole = (newRole: string) => {
        if (selectedUser) {
            changeRoleMutation.mutate(
                { id: selectedUser.id, role: newRole },
                { onSuccess: () => { setShowRoleModal(false); setSelectedUser(null); } }
            );
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">إجمالي المستخدمين</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">المستخدمين النشطين</div>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">المحامين</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.byRole?.LAWYER || 0}</div>
                    </Card>
                    <Card className="p-4">
                        <div className="text-sm text-muted-foreground">الدعوات المعلقة</div>
                        <div className="text-2xl font-bold text-yellow-600">
                            {invitations.filter(i => i.status === 'PENDING').length}
                        </div>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    {/* Tabs */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    activeTab === 'users' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                )}
                            >
                                <User className="w-4 h-4 inline-block ml-2" />
                                المستخدمين
                            </button>
                            <button
                                onClick={() => setActiveTab('invitations')}
                                className={cn(
                                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                    activeTab === 'invitations' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                                )}
                            >
                                <Mail className="w-4 h-4 inline-block ml-2" />
                                الدعوات
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowInviteForm(true)}>
                                <UserPlus className="w-4 h-4 ml-2" />
                                دعوة مستخدم
                            </Button>
                            <Button onClick={() => handleOpenForm()}>
                                <Plus className="w-4 h-4 ml-2" />
                                إضافة مستخدم
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {activeTab === 'users' ? (
                        <>
                            {/* Filters */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="بحث بالاسم أو البريد..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        className="pr-10"
                                    />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                                >
                                    <option value="">جميع الأدوار</option>
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value as 'all' | 'active' | 'inactive'); setPage(1); }}
                                    className="h-10 px-3 rounded-md border bg-background text-sm min-w-[120px]"
                                >
                                    <option value="all">جميع الحالات</option>
                                    <option value="active">نشط</option>
                                    <option value="inactive">معطل</option>
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
                                <>
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
                                                    <UserAvatar name={user.name} avatar={user.avatar} size="md" />
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
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
                                                            <div className="absolute left-0 top-full mt-1 w-44 bg-card rounded-lg shadow-lg border py-1 z-10">
                                                                <button
                                                                    onClick={() => { handleOpenForm(user); setOpenMenuId(null); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                                >
                                                                    <Pencil className="w-4 h-4" />
                                                                    تعديل
                                                                </button>
                                                                <button
                                                                    onClick={() => { setSelectedUser(user); setShowRoleModal(true); setOpenMenuId(null); }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                                                                >
                                                                    <Shield className="w-4 h-4" />
                                                                    تغيير الدور
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleActive(user)}
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

                                    {/* Pagination */}
                                    {meta && meta.totalPages > 1 && (
                                        <div className="flex justify-center gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page === 1}
                                                onClick={() => setPage(p => p - 1)}
                                            >
                                                السابق
                                            </Button>
                                            <span className="flex items-center px-4 text-sm">
                                                صفحة {page} من {meta.totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={page === meta.totalPages}
                                                onClick={() => setPage(p => p + 1)}
                                            >
                                                التالي
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        /* Invitations Tab */
                        <>
                            {invitationsLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="p-4 border rounded-lg animate-pulse">
                                            <div className="w-1/3 h-4 bg-muted rounded mb-2" />
                                            <div className="w-1/4 h-3 bg-muted rounded" />
                                        </div>
                                    ))}
                                </div>
                            ) : invitations.length === 0 ? (
                                <div className="text-center py-12">
                                    <Mail className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <p className="text-muted-foreground">لا توجد دعوات</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {invitations.map((invitation) => (
                                        <div
                                            key={invitation.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{invitation.email}</span>
                                                    <span className={cn('text-xs px-2 py-0.5 rounded-full', roleLabels[invitation.role]?.color)}>
                                                        {roleLabels[invitation.role]?.label}
                                                    </span>
                                                    <span className={cn('text-xs px-2 py-0.5 rounded-full', invitationStatusLabels[invitation.status]?.color)}>
                                                        {invitationStatusLabels[invitation.status]?.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    أرسلت بواسطة {invitation.inviter.name} - {new Date(invitation.createdAt).toLocaleDateString('ar-SA')}
                                                </p>
                                            </div>
                                            {invitation.status === 'PENDING' && (
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => resendInvitationMutation.mutate(invitation.id)}
                                                        disabled={resendInvitationMutation.isPending}
                                                    >
                                                        <RefreshCw className="w-4 h-4 ml-1" />
                                                        إعادة إرسال
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => cancelInvitationMutation.mutate(invitation.id)}
                                                        disabled={cancelInvitationMutation.isPending}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <X className="w-4 h-4 ml-1" />
                                                        إلغاء
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit User Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">
                                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                            </h2>
                            <button onClick={handleCloseForm} className="p-2 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={userForm.handleSubmit(onSubmitUser)} className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">الاسم *</Label>
                                <Input id="name" {...userForm.register('name')} />
                                {userForm.formState.errors.name && (
                                    <p className="text-sm text-destructive">{userForm.formState.errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">البريد الإلكتروني *</Label>
                                <Input id="email" type="email" {...userForm.register('email')} />
                                {userForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">{userForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            {!editingUser && (
                                <div className="space-y-2">
                                    <Label htmlFor="password">كلمة المرور *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...userForm.register('password')}
                                    />
                                    {userForm.formState.errors.password && (
                                        <p className="text-sm text-destructive">{userForm.formState.errors.password.message}</p>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="role">الدور *</Label>
                                <select
                                    id="role"
                                    {...userForm.register('role')}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                >
                                    <option value="">اختر الدور</option>
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                </select>
                                {userForm.formState.errors.role && (
                                    <p className="text-sm text-destructive">{userForm.formState.errors.role.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الجوال</Label>
                                <Input id="phone" type="tel" dir="ltr" className="text-right" {...userForm.register('phone')} />
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

            {/* Invite User Modal */}
            {showInviteForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">دعوة مستخدم جديد</h2>
                            <button onClick={() => { setShowInviteForm(false); inviteForm.reset(); }} className="p-2 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={inviteForm.handleSubmit(onSubmitInvite)} className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                سيتم إنشاء رابط دعوة للمستخدم لإنشاء حسابه
                            </p>
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">البريد الإلكتروني *</Label>
                                <Input id="invite-email" type="email" {...inviteForm.register('email')} />
                                {inviteForm.formState.errors.email && (
                                    <p className="text-sm text-destructive">{inviteForm.formState.errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="invite-role">الدور *</Label>
                                <select
                                    id="invite-role"
                                    {...inviteForm.register('role')}
                                    className="w-full h-10 px-3 rounded-md border bg-background text-sm"
                                >
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => { setShowInviteForm(false); inviteForm.reset(); }}>
                                    إلغاء
                                </Button>
                                <Button
                                    type="submit"
                                    isLoading={createInvitationMutation.isPending}
                                >
                                    إرسال الدعوة
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Role Modal */}
            {showRoleModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl w-full max-w-sm">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">تغيير الدور</h2>
                            <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="p-2 hover:bg-muted rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">
                                تغيير دور {selectedUser.name}
                            </p>
                            <div className="space-y-2">
                                {(['ADMIN', 'LAWYER', 'SECRETARY'] as const).map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => handleChangeRole(role)}
                                        disabled={selectedUser.role === role || changeRoleMutation.isPending}
                                        className={cn(
                                            'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
                                            selectedUser.role === role ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className={cn('text-xs px-2 py-0.5 rounded-full', roleLabels[role]?.color)}>
                                                {roleLabels[role]?.label}
                                            </span>
                                        </span>
                                        {selectedUser.role === role && (
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersPage;
