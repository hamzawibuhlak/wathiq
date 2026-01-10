import { apiClient } from './client';
import type { Case } from '@/types';

export const casesService = {
  async getAll(): Promise<Case[]> {
    const response = await apiClient.get<Case[]>('/api/cases');
    return response.data;
  },

  async getById(id: string): Promise<Case> {
    const response = await apiClient.get<Case>(`/api/cases/${id}`);
    return response.data;
  },

  async create(data: Partial<Case>): Promise<Case> {
    const response = await apiClient.post<Case>('/api/cases', data);
    return response.data;
  },

  async update(id: string, data: Partial<Case>): Promise<Case> {
    const response = await apiClient.patch<Case>(`/api/cases/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/cases/${id}`);
  },
};
