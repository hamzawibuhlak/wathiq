import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi, DocumentsFilters, UploadDocumentData } from '@/api/documents.api';
import toast from 'react-hot-toast';

// List of documents
export function useDocuments(filters?: DocumentsFilters) {
    return useQuery({
        queryKey: ['documents', filters],
        queryFn: () => documentsApi.getAll(filters),
        staleTime: 1000 * 60 * 2,
    });
}

// Single document
export function useDocument(id: string) {
    return useQuery({
        queryKey: ['documents', id],
        queryFn: () => documentsApi.getById(id),
        enabled: !!id,
    });
}

// Upload document
export function useUploadDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: UploadDocumentData) => documentsApi.upload(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('تم رفع المستند بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء رفع المستند');
        },
    });
}

// Delete document
export function useDeleteDocument() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => documentsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            toast.success('تم حذف المستند بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف المستند');
        },
    });
}

// Download document
export function useDownloadDocument() {
    return useMutation({
        mutationFn: async ({ id, fileName }: { id: string; fileName: string }) => {
            const blob = await documentsApi.download(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        },
        onSuccess: () => {
            toast.success('تم تحميل المستند');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحميل المستند');
        },
    });
}
