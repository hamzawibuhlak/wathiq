import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentFoldersApi } from '@/api/documentFolders.api';
import toast from 'react-hot-toast';

// List folders (root or by parentId)
export function useDocumentFolders(parentId?: string | null) {
    return useQuery({
        queryKey: ['document-folders', parentId || 'root'],
        queryFn: () => documentFoldersApi.getAll(parentId || undefined),
        staleTime: 1000 * 60 * 2,
    });
}

// Single folder
export function useDocumentFolder(id: string | null) {
    return useQuery({
        queryKey: ['document-folders', id],
        queryFn: () => documentFoldersApi.getById(id!),
        enabled: !!id,
    });
}

// Folder documents
export function useFolderDocuments(folderId: string | null, page = 1, limit = 20) {
    return useQuery({
        queryKey: ['folder-documents', folderId, page, limit],
        queryFn: () => documentFoldersApi.getDocuments(folderId!, page, limit),
        enabled: !!folderId,
        staleTime: 1000 * 60 * 2,
    });
}

// Breadcrumb
export function useFolderBreadcrumb(folderId: string | null) {
    return useQuery({
        queryKey: ['folder-breadcrumb', folderId],
        queryFn: () => documentFoldersApi.getBreadcrumb(folderId!),
        enabled: !!folderId,
    });
}

// Create folder
export function useCreateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; color?: string; icon?: string; parentId?: string }) =>
            documentFoldersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            toast.success('تم إنشاء المجلد بنجاح');
        },
        onError: () => {
            toast.error('فشل في إنشاء المجلد');
        },
    });
}

// Update folder
export function useUpdateFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; color?: string; icon?: string; parentId?: string } }) =>
            documentFoldersApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            toast.success('تم تحديث المجلد بنجاح');
        },
        onError: () => {
            toast.error('فشل في تحديث المجلد');
        },
    });
}

// Delete folder
export function useDeleteFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => documentFoldersApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            toast.success('تم حذف المجلد بنجاح');
        },
        onError: () => {
            toast.error('فشل في حذف المجلد');
        },
    });
}

// Link document to folder (copy/shortcut - stays in root too)
export function useLinkDocumentToFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId, documentId }: { folderId: string; documentId: string }) =>
            documentFoldersApi.linkDocument(folderId, documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
            toast.success('تم نسخ المستند للمجلد بنجاح');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'فشل في نسخ المستند';
            toast.error(message);
        },
    });
}

// Move document to folder (removes from root)
export function useMoveDocumentToFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId, documentId }: { folderId: string; documentId: string }) =>
            documentFoldersApi.moveDocument(folderId, documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
            toast.success('تم نقل المستند للمجلد بنجاح');
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'فشل في نقل المستند';
            toast.error(message);
        },
    });
}

// Delete copy/shortcut from folder (original document stays)
export function useUnlinkDocumentFromFolder() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ folderId, documentId }: { folderId: string; documentId: string }) =>
            documentFoldersApi.unlinkDocument(folderId, documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
            toast.success('تم حذف نسخة المستند من المجلد');
        },
        onError: () => {
            toast.error('فشل في حذف النسخة');
        },
    });
}

// Move document back to root/main documents page
export function useMoveDocumentToRoot() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (documentId: string) =>
            documentFoldersApi.moveToRoot(documentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
            queryClient.invalidateQueries({ queryKey: ['document-folders'] });
            queryClient.invalidateQueries({ queryKey: ['folder-documents'] });
            toast.success('تم نقل المستند للمجلد الأساسي');
        },
        onError: () => {
            toast.error('فشل في نقل المستند');
        },
    });
}
