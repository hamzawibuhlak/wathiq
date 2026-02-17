import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formsApi } from '../api/forms';

// ══════════════════════════════════════════════════════════
// QUERIES
// ══════════════════════════════════════════════════════════

export function useForms(params?: any) {
    return useQuery({
        queryKey: ['forms', params],
        queryFn: () => formsApi.getAll(params),
    });
}

export function useForm(id: string) {
    return useQuery({
        queryKey: ['form', id],
        queryFn: () => formsApi.getById(id),
        enabled: !!id,
    });
}

export function useFormSubmissions(formId: string, params?: any) {
    return useQuery({
        queryKey: ['form-submissions', formId, params],
        queryFn: () => formsApi.getSubmissions(formId, params),
        enabled: !!formId,
    });
}

export function usePublicForm(slug: string) {
    return useQuery({
        queryKey: ['public-form', slug],
        queryFn: () => formsApi.getBySlug(slug),
        enabled: !!slug,
    });
}

// ══════════════════════════════════════════════════════════
// MUTATIONS
// ══════════════════════════════════════════════════════════

export function useCreateForm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => formsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forms'] });
        },
    });
}

export function useUpdateForm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => formsApi.update(id, data),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['forms'] });
            queryClient.invalidateQueries({ queryKey: ['form', variables.id] });
        },
    });
}

export function useDeleteForm() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => formsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['forms'] });
        },
    });
}

export function useSubmitPublicForm() {
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: any }) =>
            formsApi.submitPublic(slug, data),
    });
}

export function useUpdateSubmissionStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ submissionId, data }: { submissionId: string; data: any }) =>
            formsApi.updateSubmissionStatus(submissionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}
