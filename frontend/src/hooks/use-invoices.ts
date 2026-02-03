import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, InvoicesFilters, CreateInvoiceData, UpdateInvoiceData } from '@/api/invoices.api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// List of invoices
export function useInvoices(filters?: InvoicesFilters) {
    return useQuery({
        queryKey: ['invoices', filters],
        queryFn: () => invoicesApi.getAll(filters),
        staleTime: 1000 * 60 * 2,
    });
}

// Single invoice
export function useInvoice(id: string) {
    return useQuery({
        queryKey: ['invoices', id],
        queryFn: () => invoicesApi.getById(id),
        enabled: !!id,
    });
}

// Invoice stats
export function useInvoiceStats() {
    return useQuery({
        queryKey: ['invoices', 'stats'],
        queryFn: () => invoicesApi.getStats(),
        staleTime: 1000 * 60 * 5,
    });
}

// Create invoice
export function useCreateInvoice() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (data: CreateInvoiceData) => invoicesApi.create(data),
        onSuccess: (response) => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم إنشاء الفاتورة بنجاح');
            navigate(`/invoices/${response.data.id}`);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء الفاتورة');
        },
    });
}

// Update invoice
export function useUpdateInvoice(id: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UpdateInvoiceData) => invoicesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['invoices', id] });
            toast.success('تم تحديث الفاتورة بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث الفاتورة');
        },
    });
}

// Delete invoice
export function useDeleteInvoice() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
        mutationFn: (id: string) => invoicesApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم حذف الفاتورة بنجاح');
            navigate('/invoices');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف الفاتورة');
        },
    });
}

// Mark as paid
export function useMarkInvoiceAsPaid() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => invoicesApi.markAsPaid(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
            toast.success('تم تحديث حالة الدفع');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة الدفع');
        },
    });
}
