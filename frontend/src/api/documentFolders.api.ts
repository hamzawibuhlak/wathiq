import api from './client';
import type { Document } from '@/types';

export interface DocumentFolder {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    parentId: string | null;
    clientId: string | null;
    tenantId: string;
    createdById: string | null;
    createdAt: string;
    updatedAt: string;
    children?: DocumentFolder[];
    _count?: {
        children: number;
        documentLinks: number;
    };
}

export interface BreadcrumbItem {
    id: string;
    name: string;
}

export const documentFoldersApi = {
    // Get folders (root or by parentId)
    getAll: (parentId?: string) =>
        api.get<{ data: DocumentFolder[] }>('/document-folders', {
            params: parentId ? { parentId } : {},
        }).then((res) => res.data),

    // Get folder by ID
    getById: (id: string) =>
        api.get<{ data: DocumentFolder }>(`/document-folders/${id}`).then((res) => res.data),

    // Get folder documents
    getDocuments: (folderId: string, page = 1, limit = 20) =>
        api.get<{ data: Document[]; meta: any }>(`/document-folders/${folderId}/documents`, {
            params: { page, limit },
        }).then((res) => res.data),

    // Get breadcrumb
    getBreadcrumb: (folderId: string) =>
        api.get<{ data: BreadcrumbItem[] }>(`/document-folders/${folderId}/breadcrumb`).then((res) => res.data),

    // Create folder
    create: (data: { name: string; color?: string; icon?: string; parentId?: string }) =>
        api.post<{ data: DocumentFolder; message: string }>('/document-folders', data).then((res) => res.data),

    // Update folder
    update: (id: string, data: { name?: string; color?: string; icon?: string; parentId?: string }) =>
        api.patch<{ data: DocumentFolder; message: string }>(`/document-folders/${id}`, data).then((res) => res.data),

    // Delete folder
    delete: (id: string) =>
        api.delete<{ message: string }>(`/document-folders/${id}`).then((res) => res.data),

    // Copy document shortcut to folder (original stays in place)
    linkDocument: (folderId: string, documentId: string) =>
        api.post<{ data: any; message: string }>(`/document-folders/${folderId}/link-document`, {
            documentId,
        }).then((res) => res.data),

    // Move document to folder (removes from root)
    moveDocument: (folderId: string, documentId: string) =>
        api.post<{ data: any; message: string }>(`/document-folders/${folderId}/move-document`, {
            documentId,
        }).then((res) => res.data),

    // Delete shortcut/copy from folder (original stays)
    unlinkDocument: (folderId: string, documentId: string) =>
        api.delete<{ message: string }>(`/document-folders/${folderId}/unlink-document/${documentId}`).then((res) => res.data),

    // Move document back to root documents
    moveToRoot: (documentId: string) =>
        api.post<{ data: any; message: string }>(`/document-folders/move-to-root/${documentId}`).then((res) => res.data),
};

export default documentFoldersApi;
