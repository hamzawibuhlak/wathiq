import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    profileApi,
    usersApi,
    firmApi,
    notificationsApi,
    UpdateProfileData,
    ChangePasswordData,
    CreateUserData,
    UpdateUserData,
    UsersFilters,
    UpdateFirmData,
    NotificationSettings,
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
