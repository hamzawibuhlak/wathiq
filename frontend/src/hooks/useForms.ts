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

export function useAnswerNotes(answerId: string | null) {
    return useQuery({
        queryKey: ['form-answer-notes', answerId],
        queryFn: () => formsApi.listAnswerNotes(answerId!),
        enabled: !!answerId,
    });
}

export function useDiscussion(discussionId: string | null) {
    return useQuery({
        queryKey: ['form-discussion', discussionId],
        queryFn: () => formsApi.getDiscussion(discussionId!),
        enabled: !!discussionId,
    });
}

export function useEditorAnswers(params: { caseId?: string; clientId?: string }) {
    const enabled = !!(params.caseId || params.clientId);
    return useQuery({
        queryKey: ['form-editor-answers', params],
        queryFn: () => formsApi.getEditorAnswers(params),
        enabled,
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

export function useManageFormAccess() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { add?: string[]; remove?: string[] } }) =>
            formsApi.manageAccess(id, data),
        onSuccess: (_data, v) => {
            queryClient.invalidateQueries({ queryKey: ['form', v.id] });
            queryClient.invalidateQueries({ queryKey: ['forms'] });
        },
    });
}

export function useSetAnswerVisibility() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ answerId, userIds }: { answerId: string; userIds: string[] }) =>
            formsApi.setAnswerVisibility(answerId, userIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}

export function useGenerateFormOtp() {
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { recipientEmail?: string; recipientPhone?: string; deliveryMethod?: string };
        }) => formsApi.generateOtp(id, data),
    });
}

export function useSubmitPublicForm() {
    return useMutation({
        mutationFn: ({ slug, data }: { slug: string; data: any }) =>
            formsApi.submitPublic(slug, data),
    });
}

export function useVerifyPublicOtp() {
    return useMutation({
        mutationFn: ({ slug, code }: { slug: string; code: string }) =>
            formsApi.verifyOtpPublic(slug, code),
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

export function useLinkSubmission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            submissionId,
            data,
        }: {
            submissionId: string;
            data: { clientId?: string | null; caseId?: string | null; hearingId?: string | null };
        }) => formsApi.linkSubmission(submissionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}

export function useConvertSubmissionToClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (submissionId: string) => formsApi.convertToClient(submissionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });
}

export function useConvertSubmissionToCase() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ submissionId, clientId }: { submissionId: string; clientId?: string }) =>
            formsApi.convertToCase(submissionId, { clientId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
            queryClient.invalidateQueries({ queryKey: ['cases'] });
        },
    });
}

export function useAddAnswerNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ answerId, content }: { answerId: string; content: string }) =>
            formsApi.addAnswerNote(answerId, content),
        onSuccess: (_data, v) => {
            queryClient.invalidateQueries({ queryKey: ['form-answer-notes', v.answerId] });
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}

export function useDeleteAnswerNote() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ answerId, noteId }: { answerId: string; noteId: string }) =>
            formsApi.deleteAnswerNote(answerId, noteId),
        onSuccess: (_data, v) => {
            queryClient.invalidateQueries({ queryKey: ['form-answer-notes', v.answerId] });
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}

export function useStartDiscussion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            answerId,
            data,
        }: {
            answerId: string;
            data: { inviteeIds?: string[]; message?: string };
        }) => formsApi.startDiscussion(answerId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['form-submissions'] });
        },
    });
}

export function useAddDiscussionMessage() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, content }: { id: string; content: string }) =>
            formsApi.addDiscussionMessage(id, content),
        onSuccess: (_data, v) => {
            queryClient.invalidateQueries({ queryKey: ['form-discussion', v.id] });
        },
    });
}

export function useInviteToDiscussion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, userIds }: { id: string; userIds: string[] }) =>
            formsApi.inviteToDiscussion(id, userIds),
        onSuccess: (_data, v) => {
            queryClient.invalidateQueries({ queryKey: ['form-discussion', v.id] });
        },
    });
}
