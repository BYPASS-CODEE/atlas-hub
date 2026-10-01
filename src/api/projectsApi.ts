import { apiClient } from './client.js';
import { Project } from '../types/index.js';

export const projectsApi = {
  list: (params?: { search?: string; status?: string; client_id?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.client_id) query.set('client_id', params.client_id);
    const qs = query.toString();
    return apiClient<{ success: boolean; projects: Project[] }>(`/projects${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient<{ success: boolean; project: Project & { tasks: any[]; members: any[] } }>(`/projects/${id}`),

  create: (payload: { name: string; client_id?: string; description?: string; status?: string; priority?: string; budget?: number; deadline?: string }) =>
    apiClient<{ success: boolean; message: string; id: string }>('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Project>) =>
    apiClient<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    }),
};
