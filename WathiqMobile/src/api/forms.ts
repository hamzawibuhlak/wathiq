import apiService from '../services/api.service';
import { FormTemplate, FormSubmission } from '../types/models.types';

export const formsApi = {
    // Get all published forms
    getAll: () => apiService.get<FormTemplate[]>('/forms'),

    // Get form by ID
    getById: (id: string) => apiService.get<FormTemplate>(`/forms/${id}`),

    // Submit form
    submit: (formId: string, data: Record<string, any>) =>
        apiService.post<FormSubmission>(`/forms/${formId}/submit`, { data }),

    // Get submissions for a form
    getSubmissions: (formId: string) =>
        apiService.get<FormSubmission[]>(`/forms/${formId}/submissions`),
};
