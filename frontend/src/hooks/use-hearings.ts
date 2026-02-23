import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hearingsApi, HearingsFilters, CalendarFilters, CreateHearingData, UpdateHearingData } from '@/api/hearings.api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Extract tenant slug from current URL path
function getTenantSlug() {
    const parts = window.location.pathname.split('/');
    return parts[1] || '';
}

// List of hearings
export function useHearings(filters?: HearingsFilters) {
    return useQuery({
        queryKey: ['hearings', filters],
        queryFn: () => hearingsApi.getAll(filters),
        staleTime: 1000 * 60 * 2,
    });
}

// Single hearing
export function useHearing(id: string) {
    return useQuery({
        queryKey: ['hearings', id],
        queryFn: () => hearingsApi.getById(id),
        enabled: !!id,
    });
}

// Calendar hearings
export function useHearingsCalendar(filters: CalendarFilters) {
    return useQuery({
        queryKey: ['hearings', 'calendar', filters],
        queryFn: () => hearingsApi.getCalendar(filters),
        staleTime: 1000 * 60 * 5,
    });
}

// Upcoming hearings
export function useUpcomingHearings(days: number = 7) {
    return useQuery({
        queryKey: ['hearings', 'upcoming', days],
        queryFn: () => hearingsApi.getUpcoming(days),
        staleTime: 1000 * 60 * 5,
    });
}

// Create hearing
export function useCreateHearing() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: CreateHearingData) => hearingsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم إنشاء الجلسة بنجاح');
            navigate(`/${getTenantSlug()}/hearings`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء الجلسة');
        },
    });
}

// Update hearing
export function useUpdateHearing(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateHearingData) => hearingsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            queryClient.invalidateQueries({ queryKey: ['hearings', id] });
            toast.success('تم تحديث الجلسة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث الجلسة');
        },
    });
}

// Delete hearing
export function useDeleteHearing() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => hearingsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hearings'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم حذف الجلسة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف الجلسة');
        },
    });
}

// Send hearing reminder email
export function useSendHearingReminder() {
    return useMutation({
        mutationFn: (id: string) => hearingsApi.sendReminder(id),
        onSuccess: (data) => {
            toast.success(`تم إرسال التذكير إلى ${data.data?.sentTo || 'العميل'}`);
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'فشل إرسال التذكير';
            toast.error(message);
        },
    });
}

