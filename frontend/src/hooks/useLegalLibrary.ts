import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalLibraryApi } from '@/api/legalLibrary';

// Stats
export const useLibraryStats = () =>
    useQuery({ queryKey: ['library-stats'], queryFn: legalLibraryApi.getStats });

// Regulations
export const useRegulations = (params?: any) =>
    useQuery({ queryKey: ['regulations', params], queryFn: () => legalLibraryApi.getRegulations(params) });

export const useRegulation = (id: string) =>
    useQuery({ queryKey: ['regulation', id], queryFn: () => legalLibraryApi.getRegulationById(id), enabled: !!id });

// Precedents
export const usePrecedents = (params?: any) =>
    useQuery({ queryKey: ['precedents', params], queryFn: () => legalLibraryApi.getPrecedents(params) });

export const usePrecedent = (id: string) =>
    useQuery({ queryKey: ['precedent', id], queryFn: () => legalLibraryApi.getPrecedentById(id), enabled: !!id });

// Terms
export const useTerms = (params?: any) =>
    useQuery({ queryKey: ['terms', params], queryFn: () => legalLibraryApi.getTerms(params) });

export const useTerm = (id: string) =>
    useQuery({ queryKey: ['term', id], queryFn: () => legalLibraryApi.getTermById(id), enabled: !!id });

// Global Search
export const useGlobalSearch = (q: string) =>
    useQuery({ queryKey: ['library-search', q], queryFn: () => legalLibraryApi.globalSearch(q), enabled: q.length > 2 });

// AI Search
export const useAiSearch = () => {
    return useMutation({ mutationFn: (query: string) => legalLibraryApi.aiSearch(query) });
};

// Bookmarks
export const useBookmarks = (folderId?: string) =>
    useQuery({ queryKey: ['bookmarks', folderId], queryFn: () => legalLibraryApi.getBookmarks(folderId) });

export const useAddBookmark = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => legalLibraryApi.addBookmark(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    });
};

export const useRemoveBookmark = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => legalLibraryApi.removeBookmark(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmarks'] }),
    });
};

// Folders
export const useFolders = () =>
    useQuery({ queryKey: ['bookmark-folders'], queryFn: legalLibraryApi.getFolders });

export const useCreateFolder = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => legalLibraryApi.createFolder(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['bookmark-folders'] }),
    });
};

// Case References
export const useCaseReferences = (caseId: string) =>
    useQuery({ queryKey: ['case-references', caseId], queryFn: () => legalLibraryApi.getCaseReferences(caseId), enabled: !!caseId });

export const useLinkToCase = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ caseId, data }: { caseId: string; data: any }) => legalLibraryApi.linkToCase(caseId, data),
        onSuccess: (_: any, vars: any) => qc.invalidateQueries({ queryKey: ['case-references', vars.caseId] }),
    });
};
