import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesApi, CasesFilters, CreateCaseData, UpdateCaseData } from '@/api/cases.api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Extract tenant slug from current URL path
function getTenantSlug() {
    const parts = window.location.pathname.split('/');
    return parts[1] || '';
}

// List of cases
export function useCases(filters?: CasesFilters) {
    return useQuery({
        queryKey: ['cases', filters],
        queryFn: () => casesApi.getAll(filters),
        staleTime: 1000 * 60 * 2, // 2 minutes
    });
}

// Single case
export function useCase(id: string) {
    return useQuery({
        queryKey: ['cases', id],
        queryFn: () => casesApi.getById(id),
        enabled: !!id,
    });
}

// Create case
export function useCreateCase() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: CreateCaseData) => casesApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم إنشاء القضية بنجاح');
            navigate(`/${getTenantSlug()}/cases/${response.data.id}`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء القضية');
        },
    });
}

// Update case
export function useUpdateCase(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateCaseData) => casesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['cases', id] });
            toast.success('تم تحديث القضية بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث القضية');
        },
    });
}

// Delete case
export function useDeleteCase() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (id: string) => casesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cases'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم حذف القضية بنجاح');
            navigate(`/${getTenantSlug()}/cases`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف القضية');
        },
    });
}

// Case stats
export function useCaseStats() {
    return useQuery({
        queryKey: ['cases', 'stats'],
        queryFn: () => casesApi.getStats(),
        staleTime: 1000 * 60 * 5,
    });
}
