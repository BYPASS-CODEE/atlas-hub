import { apiClient } from './client.js';

export const teamApi = {
  list: () =>
    apiClient<{ success: boolean; members: any[] }>('/team'),

  invite: (payload: { email: string; full_name: string; role: string; password?: string; phone?: string }) =>
    apiClient<{ success: boolean; message: string }>('/team/invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateRole: (userId: string, role: string) =>
    apiClient<{ success: boolean; message: string }>(`/team/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  remove: (userId: string) =>
    apiClient<{ success: boolean; message: string }>(`/team/${userId}`, {
      method: 'DELETE',
    }),
};

export const reportsApi = {
  getDashboardSummary: () =>
    apiClient<{ success: boolean; summary: any }>('/reports/dashboard-summary'),

  getAnalytics: () =>
    apiClient<{ success: boolean; report: any }>('/reports/analytics'),
};

export const notificationsApi = {
  list: () =>
    apiClient<{ success: boolean; notifications: any[]; unread_count: number }>('/notifications'),

  markAsRead: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiClient<{ success: boolean; message: string }>('/notifications/read-all', {
      method: 'PUT',
    }),
};

export const adminApi = {
  getOverview: () =>
    apiClient<{ success: boolean; stats: any; recent_audit_logs: any[] }>('/admin/overview'),

  getUsers: () =>
    apiClient<{ success: boolean; users: any[] }>('/admin/users'),

  updateUserStatus: (id: string, status: string) =>
    apiClient<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  updateUserRole: (id: string, role: string) =>
    apiClient<{ success: boolean; message: string }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),

  getOrganizations: () =>
    apiClient<{ success: boolean; organizations: any[] }>('/admin/organizations'),

  getAuditLogs: (params?: { page?: number; limit?: number; action?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.action) query.set('action', params.action);
    const qs = query.toString();
    return apiClient<{ success: boolean; logs: any[]; pagination: any }>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

export const contactApi = {
  send: (payload: { name: string; email: string; subject: string; message: string }) =>
    apiClient<{ success: boolean; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
