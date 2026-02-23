import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { tenantRolesApi, type TenantRole } from '@/api/tenantRoles';
import { Users, Plus, Power, X, Shield, Trash2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    OWNER: { label: 'مالك', color: 'bg-amber-100 text-amber-700' },
    ADMIN: { label: 'مدير', color: 'bg-blue-100 text-blue-700' },
    LAWYER: { label: 'محامي', color: 'bg-emerald-100 text-emerald-700' },
    SECRETARY: { label: 'سكرتير', color: 'bg-purple-100 text-purple-700' },
    ACCOUNTANT: { label: 'محاسب', color: 'bg-orange-100 text-orange-700' },
};

export default function UsersManagementPage() {
    const queryClient = useQueryClient();
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'LAWYER', tenantRoleId: '' });
    const [tenantRoles, setTenantRoles] = useState<TenantRole[]>([]);
    const [editUser, setEditUser] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', email: '', role: 'LAWYER', tenantRoleId: '' });
    const [createdUser, setCreatedUser] = useState<{ email: string; tempPassword: string } | null>(null);

    // Load tenant roles
    useEffect(() => {
        tenantRolesApi.getRoles().then(setTenantRoles).catch(() => { });
    }, []);

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['owner-users'],
        queryFn: ownerApi.getUsers,
    });

    const inviteMutation = useMutation({
        mutationFn: (data: typeof inviteForm) => ownerApi.inviteUser(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            setCreatedUser({ email: result.email, tempPassword: result.tempPassword });
            setShowInvite(false);
            setInviteForm({ name: '', email: '', role: 'LAWYER', tenantRoleId: '' });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل إنشاء الحساب'),
    });

    const toggleMutation = useMutation({
        mutationFn: (userId: string) => ownerApi.toggleUserStatus(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم تحديث حالة المستخدم');
        },
    });

    const changeRoleMutation = useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: string }) =>
            ownerApi.changeRole(userId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم تغيير الدور');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (userId: string) => ownerApi.deleteUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم حذف المستخدم');
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل حذف المستخدم'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: any }) => ownerApi.updateUser(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success('تم تحديث بيانات المستخدم');
            setEditUser(null);
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'فشل تحديث البيانات'),
    });

    const openEditModal = (user: any) => {
        setEditUser(user);
        setEditForm({
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'LAWYER',
            tenantRoleId: user.tenantRoleId || '',
        });
    };

    // Get tenant role name for display
    const getTenantRoleName = (tenantRoleId: string | null | undefined) => {
        if (!tenantRoleId) return null;
        const role = tenantRoles.find(r => r.id === tenantRoleId);
        return role ? role.name : null;
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        المستخدمون
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">إدارة حسابات الموظفين وصلاحياتهم</p>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"
                >
                    <Plus className="w-4 h-4" />
                    إضافة مستخدم
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الاسم</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">البريد</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الدور</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الصلاحيات</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">آخر دخول</th>
                            <th className="text-center text-xs font-medium text-gray-500 px-6 py-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">جاري التحميل...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-gray-400">لا يوجد مستخدمون</td></tr>
                        ) : users.map((user: any) => {
                            const roleInfo = ROLE_LABELS[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
                            const tenantRoleName = getTenantRoleName(user.tenantRoleId);
                            return (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium ${user.role === 'OWNER' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                                {user.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-400">{user.title || '—'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        {user.role === 'OWNER' ? (
                                            <span className={`text-xs px-2 py-1 rounded-full ${roleInfo.color}`}>
                                                {roleInfo.label} 👑
                                            </span>
                                        ) : (
                                            <select
                                                value={user.role}
                                                onChange={(e) => changeRoleMutation.mutate({ userId: user.id, role: e.target.value })}
                                                className="text-xs px-2 py-1 rounded-lg border border-gray-200 bg-white cursor-pointer"
                                            >
                                                <option value="ADMIN">مدير</option>
                                                <option value="LAWYER">محامي</option>
                                                <option value="SECRETARY">سكرتير</option>
                                                <option value="ACCOUNTANT">محاسب</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {tenantRoleName ? (
                                            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 flex items-center gap-1 w-fit">
                                                <Shield className="w-3 h-3" />
                                                {tenantRoleName}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.isActive ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ar-SA') : '—'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {user.role !== 'OWNER' && (
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"
                                                    title="تعديل المستخدم"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleMutation.mutate(user.id)}
                                                    className={`p-1.5 rounded-lg ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                                    title={user.isActive ? 'تعطيل' : 'تفعيل'}
                                                >
                                                    <Power className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm(`هل أنت متأكد من حذف ${user.name}؟`)) {
                                                            deleteMutation.mutate(user.id);
                                                        }
                                                    }}
                                                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                                                    title="حذف المستخدم"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" dir="rtl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">إضافة مستخدم جديد</h2>
                            <button onClick={() => setShowInvite(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                                <input
                                    value={inviteForm.name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="اسم المستخدم"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                                <select
                                    value={inviteForm.tenantRoleId || inviteForm.role}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const isLegacy = ['ADMIN', 'LAWYER', 'SECRETARY', 'ACCOUNTANT'].includes(val);
                                        if (isLegacy) {
                                            setInviteForm({ ...inviteForm, role: val, tenantRoleId: '' });
                                        } else {
                                            setInviteForm({ ...inviteForm, role: 'LAWYER', tenantRoleId: val });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    {tenantRoles.length > 0 ? (
                                        tenantRoles.map((tr) => (
                                            <option key={tr.id} value={tr.id}>
                                                {tr.name}
                                            </option>
                                        ))
                                    ) : (
                                        <>
                                            <option value="ADMIN">مدير</option>
                                            <option value="LAWYER">محامي</option>
                                            <option value="SECRETARY">سكرتير</option>
                                            <option value="ACCOUNTANT">محاسب</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <button
                                onClick={() => inviteMutation.mutate(inviteForm)}
                                disabled={inviteMutation.isPending || !inviteForm.name || !inviteForm.email}
                                className="w-full py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 text-sm font-medium"
                            >
                                {inviteMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" dir="rtl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-bold text-gray-900">تعديل بيانات المستخدم</h2>
                            <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {/* Avatar */}
                            <div className="flex justify-center">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold ${editUser.role === 'OWNER' ? 'bg-amber-500' : 'bg-blue-500'}`}>
                                    {editForm.name?.charAt(0) || '?'}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="اسم المستخدم"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الدور</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                    <option value="ACCOUNTANT">محاسب</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">الصلاحيات</label>
                                <select
                                    value={editForm.tenantRoleId}
                                    onChange={(e) => setEditForm({ ...editForm, tenantRoleId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    <option value="">بدون صلاحيات مخصصة</option>
                                    {tenantRoles.map((tr) => (
                                        <option key={tr.id} value={tr.id}>
                                            {tr.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={() => {
                                    const data: any = {
                                        name: editForm.name,
                                        email: editForm.email,
                                        role: editForm.role,
                                    };
                                    if (editForm.tenantRoleId) {
                                        data.tenantRoleId = editForm.tenantRoleId;
                                    } else {
                                        data.tenantRoleId = null;
                                    }
                                    updateMutation.mutate({ userId: editUser.id, data });
                                }}
                                disabled={updateMutation.isPending || !editForm.name || !editForm.email}
                                className="w-full py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                            >
                                {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Account Created Dialog */}
            {createdUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6" dir="rtl">
                        <div className="text-center mb-4">
                            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">✅</span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">تم إنشاء الحساب بنجاح</h3>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-800">
                                📧 تم إرسال بيانات تسجيل الدخول وكلمة المرور المؤقتة إلى
                            </p>
                            <p className="text-sm font-bold text-blue-900 mt-1">{createdUser.email}</p>
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={() => setCreatedUser(null)}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm font-medium"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
