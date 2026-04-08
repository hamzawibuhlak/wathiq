import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    profileApi,
    usersApi,
    firmApi,
    notificationsApi,
    invitationsApi,
    UpdateProfileData,
    ChangePasswordData,
    CreateUserData,
    UpdateUserData,
    UsersFilters,
    UpdateFirmData,
    NotificationSettings,
    CreateInvitationData,
    AcceptInvitationData,
} from '@/api/settings.api';
import { useAuthStore } from '@/stores/auth.store';
import toast from 'react-hot-toast';

// =====================
// Profile Hooks
// =====================

export function useProfile() {
    return useQuery({
        queryKey: ['profile'],
        queryFn: () => profileApi.getProfile(),
        staleTime: 1000 * 60 * 5,
    });
}

export function useUpdateProfile() {
    const queryClient = useQueryClient();
    const { setUser } = useAuthStore();

    return useMutation({
        mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            setUser(response.data);
            toast.success('تم تحديث الملف الشخصي بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث الملف الشخصي');
        },
    });
}

export function useChangePassword() {
    return useMutation({
        mutationFn: (data: ChangePasswordData) => profileApi.changePassword(data),
        onSuccess: () => {
            toast.success('تم تغيير كلمة المرور بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تغيير كلمة المرور');
        },
    });
}

export function useUploadAvatar() {
    const queryClient = useQueryClient();
    const { user, setUser } = useAuthStore();

    return useMutation({
        mutationFn: (file: File) => profileApi.uploadAvatar(file),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            // Update the auth store with the new avatar URL
            if (user && response.data?.avatarUrl) {
                setUser({ ...user, avatar: response.data.avatarUrl });
            }
            toast.success('تم تحديث الصورة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء رفع الصورة');
        },
    });
}

// =====================
// Users Hooks
// =====================

export function useUsers(filters?: UsersFilters) {
    return useQuery({
        queryKey: ['users', filters],
        queryFn: () => usersApi.getAll(filters),
        staleTime: 1000 * 60 * 2,
    });
}

export function useUser(id: string) {
    return useQuery({
        queryKey: ['users', id],
        queryFn: () => usersApi.getById(id),
        enabled: !!id,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserData) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم إضافة المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إضافة المستخدم');
        },
    });
}

export function useUpdateUser(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateUserData) => usersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم تحديث المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث المستخدم');
        },
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم حذف المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف المستخدم');
        },
    });
}

export function useToggleUserActive() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            usersApi.toggleActive(id, isActive),
        onSuccess: (_, { isActive }) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(isActive ? 'تم تفعيل المستخدم' : 'تم تعطيل المستخدم');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة المستخدم');
        },
    });
}

export function useUserStats() {
    return useQuery({
        queryKey: ['users', 'stats'],
        queryFn: () => usersApi.getStats(),
        staleTime: 1000 * 60 * 2,
    });
}

export function useChangeUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, role }: { id: string; role: string }) =>
            usersApi.changeRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم تغيير الدور بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تغيير الدور');
        },
    });
}

export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.deactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم تعطيل المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تعطيل المستخدم');
        },
    });
}

export function useReactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => usersApi.reactivate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('تم تفعيل المستخدم بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تفعيل المستخدم');
        },
    });
}

// =====================
// Invitations Hooks
// =====================

export function useInvitations(status?: string) {
    return useQuery({
        queryKey: ['invitations', status],
        queryFn: () => invitationsApi.getAll(status),
        staleTime: 1000 * 60 * 2,
    });
}

export function useInvitationStats() {
    return useQuery({
        queryKey: ['invitations', 'stats'],
        queryFn: () => invitationsApi.getStats(),
        staleTime: 1000 * 60 * 2,
    });
}

export function useVerifyInvitation(token: string) {
    return useQuery({
        queryKey: ['invitations', 'verify', token],
        queryFn: () => invitationsApi.verifyToken(token),
        enabled: !!token,
        retry: false,
    });
}

export function useCreateInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateInvitationData) => invitationsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            toast.success('تم إرسال الدعوة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إرسال الدعوة');
        },
    });
}

export function useAcceptInvitation() {
    return useMutation({
        mutationFn: (data: AcceptInvitationData) => invitationsApi.accept(data),
        onSuccess: () => {
            toast.success('تم قبول الدعوة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء قبول الدعوة');
        },
    });
}

export function useCancelInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invitationsApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            toast.success('تم إلغاء الدعوة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إلغاء الدعوة');
        },
    });
}

export function useResendInvitation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invitationsApi.resend(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            toast.success('تم إعادة إرسال الدعوة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ');
        },
    });
}

// =====================
// Firm Hooks
// =====================

export function useFirmSettings() {
    return useQuery({
        queryKey: ['firm-settings'],
        queryFn: () => firmApi.get(),
        staleTime: 1000 * 60 * 10,
    });
}

export function useUpdateFirmSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateFirmData) => firmApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firm-settings'] });
            toast.success('تم تحديث إعدادات المكتب بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث الإعدادات');
        },
    });
}

export function useUploadFirmLogo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => firmApi.uploadLogo(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firm-settings'] });
            toast.success('تم تحديث الشعار بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء رفع الشعار');
        },
    });
}

export function useUploadFirmLetterhead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (file: File) => firmApi.uploadLetterhead(file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['firm-settings'] });
            queryClient.invalidateQueries({ queryKey: ['firm'] });
            toast.success('تم رفع ورقة الهيد ليتر بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء رفع الهيد ليتر');
        },
    });
}

// =====================
// Notifications Hooks
// =====================

export function useNotificationSettings() {
    return useQuery({
        queryKey: ['notification-settings'],
        queryFn: () => notificationsApi.get(),
        staleTime: 1000 * 60 * 10,
    });
}

export function useUpdateNotificationSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<NotificationSettings>) => notificationsApi.update(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
            toast.success('تم تحديث تفضيلات الإشعارات بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث التفضيلات');
        },
    });
}
