import api from './client'; // ✅ عدّلنا هنا

export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export const usersApi = {
    getAll: () => api.get<User[]>('/users'),

    getById: (id: string) => api.get<User>(`/users/${id}`),

    getLawyers: () => api.get<{ data: User[] }>('/users/lawyers'),

    create: (data: any) => api.post<User>('/users', data),

    update: (id: string, data: any) => api.patch<User>(`/users/${id}`, data),

    delete: (id: string) => api.delete(`/users/${id}`),
};