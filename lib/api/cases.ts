import { apiClient } from './client';
import type { Case } from '@/types';

export const casesService = {
  async getAll(): Promise<Case[]> {
    const response = await apiClient.get<Case[]>('/cases');
    return response.data;
  },

  async getById(id: string): Promise<Case> {
    const response = await apiClient.get<Case>(`/cases/${id}`);
    return response.data;
  },

  async create(data: Partial<Case>): Promise<Case> {
    const response = await apiClient.post<Case>('/cases', data);
    return response.data;
  },

  async update(id: string, data: Partial<Case>): Promise<Case> {
    const response = await apiClient.patch<Case>(`/cases/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/cases/${id}`);
  },
};
