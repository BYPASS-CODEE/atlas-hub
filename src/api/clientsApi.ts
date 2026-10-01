import { apiClient } from './client.js';
import { Client } from '../types/index.js';

export const clientsApi = {
  list: (params?: { search?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return apiClient<{ success: boolean; clients: Client[] }>(`/clients${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient<{ success: boolean; client: Client & { projects: any[]; invoices: any[] } }>(`/clients/${id}`),

  create: (payload: { company_name: string; contact_name: string; email: string; phone?: string; address?: string; status?: string; notes?: string }) =>
    apiClient<{ success: boolean; message: string; id: string }>('/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Client>) =>
    apiClient<{ success: boolean; message: string }>(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/clients/${id}`, {
      method: 'DELETE',
    }),
};
