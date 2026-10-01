import { apiClient } from './client.js';
import { SupportTicket, TicketMessage } from '../types/index.js';

export const ticketsApi = {
  list: (params?: { status?: string; category?: string; priority?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.category) query.set('category', params.category);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient<{ success: boolean; tickets: SupportTicket[] }>(`/tickets${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient<{ success: boolean; ticket: SupportTicket & { messages: TicketMessage[] } }>(`/tickets/${id}`),

  create: (payload: { client_id?: string; subject: string; description: string; category?: string; priority?: string }) =>
    apiClient<{ success: boolean; message: string; id: string; ticket_number: string }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addMessage: (id: string, message: string) =>
    apiClient<{ success: boolean; message: string; reply: TicketMessage }>(`/tickets/${id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  updateStatus: (id: string, status: string) =>
    apiClient<{ success: boolean; message: string }>(`/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};
