import apiService from '../services/api.service';

export const authApi = {
    login: (slug: string, email: string, password: string) =>
        apiService.login(slug, email, password),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        apiService.post('/auth/change-password', data),

    getProfile: () => apiService.get<any>('/auth/profile'),
};
