import { apiClient } from './client.js';
import { Task, TaskComment } from '../types/index.js';

export const tasksApi = {
  list: (params?: { project_id?: string; status?: string; priority?: string; assignee_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.project_id) query.set('project_id', params.project_id);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.assignee_id) query.set('assignee_id', params.assignee_id);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient<{ success: boolean; tasks: Task[] }>(`/tasks${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient<{ success: boolean; task: Task & { comments: TaskComment[] } }>(`/tasks/${id}`),

  create: (payload: { project_id: string; title: string; description?: string; status?: string; priority?: string; assignee_id?: string; due_date?: string }) =>
    apiClient<{ success: boolean; message: string; id: string }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Task>) =>
    apiClient<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  addComment: (taskId: string, content: string) =>
    apiClient<{ success: boolean; message: string; comment: TaskComment }>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
};
