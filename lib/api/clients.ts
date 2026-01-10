import { apiClient } from './client';
import type { Client } from '@/types';

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const response = await apiClient.get<Client[]>('/clients');
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await apiClient.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async create(data: Partial<Client>): Promise<Client> {
    const response = await apiClient.post<Client>('/clients', data);
    return response.data;
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const response = await apiClient.patch<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/clients/${id}`);
  },
};
