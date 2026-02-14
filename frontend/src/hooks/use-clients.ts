import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi, ClientsFilters } from '@/api/clients.api';
import type { CreateClientRequest } from '@/types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Extract tenant slug from current URL path
function getTenantSlug() {
    const parts = window.location.pathname.split('/');
    // URL pattern: /:slug/clients/...
    return parts[1] || '';
}

// List of clients (already exists, enhancing)
export function useClients(filters?: ClientsFilters) {
    return useQuery({
        queryKey: ['clients', filters],
        queryFn: () => clientsApi.getAll(filters),
        staleTime: 1000 * 60 * 5,
    });
}

// Single client
export function useClient(id: string) {
    return useQuery({
        queryKey: ['clients', id],
        queryFn: () => clientsApi.getById(id),
        enabled: !!id,
    });
}

// Create client
export function useCreateClient() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: CreateClientRequest) => clientsApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم إنشاء العميل بنجاح');
            navigate(`/${getTenantSlug()}/clients/${response.data.id}`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء العميل');
        },
    });
}

// Update client
export function useUpdateClient(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: Partial<CreateClientRequest>) => clientsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['clients', id] });
            toast.success('تم تحديث بيانات العميل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث بيانات العميل');
        },
    });
}

// Delete client
export function useDeleteClient() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (id: string) => clientsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم حذف العميل بنجاح');
            navigate(`/${getTenantSlug()}/clients`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف العميل');
        },
    });
}
