import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ownerApi } from '@/api/owner.api';
import { Users, Plus, Power, X } from 'lucide-react';
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
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', role: 'LAWYER' });

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['owner-users'],
        queryFn: ownerApi.getUsers,
    });

    const inviteMutation = useMutation({
        mutationFn: (data: typeof inviteForm) => ownerApi.inviteUser(data),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['owner-users'] });
            toast.success(`تم إنشاء الحساب بنجاح — كلمة المرور المؤقتة: ${result.tempPassword}`, { duration: 15000 });
            setShowInvite(false);
            setInviteForm({ name: '', email: '', role: 'LAWYER' });
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

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        المستخدمون والصلاحيات
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
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">الحالة</th>
                            <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">آخر دخول</th>
                            <th className="text-center text-xs font-medium text-gray-500 px-6 py-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-400">جاري التحميل...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-gray-400">لا يوجد مستخدمون</td></tr>
                        ) : users.map((user: any) => {
                            const roleInfo = ROLE_LABELS[user.role] || { label: user.role, color: 'bg-gray-100 text-gray-700' };
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
                                                    onClick={() => toggleMutation.mutate(user.id)}
                                                    className={`p-1.5 rounded-lg ${user.isActive ? 'text-red-500 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}
                                                    title={user.isActive ? 'تعطيل' : 'تفعيل'}
                                                >
                                                    <Power className="w-4 h-4" />
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
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                                >
                                    <option value="ADMIN">مدير</option>
                                    <option value="LAWYER">محامي</option>
                                    <option value="SECRETARY">سكرتير</option>
                                    <option value="ACCOUNTANT">محاسب</option>
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
        </div>
    );
}
