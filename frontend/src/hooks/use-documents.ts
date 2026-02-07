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
        mutationFn: async ({ id }: { id: string; fileName: string }) => {
            // Use the new download method that opens in a new tab
            documentsApi.download(id);
        },
        onSuccess: () => {
            toast.success('جارٍ تحميل المستند');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحميل المستند');
        },
    });
}
