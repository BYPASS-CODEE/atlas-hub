import { apiClient } from './client.js';
import { Invoice, InvoiceItem } from '../types/index.js';

export const invoicesApi = {
  list: (params?: { status?: string; client_id?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.client_id) query.set('client_id', params.client_id);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return apiClient<{ success: boolean; invoices: Invoice[] }>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) =>
    apiClient<{ success: boolean; invoice: Invoice }>(`/invoices/${id}`),

  create: (payload: {
    client_id: string;
    project_id?: string;
    issue_date: string;
    due_date: string;
    tax_rate?: number;
    currency?: string;
    notes?: string;
    items: Omit<InvoiceItem, 'id' | 'invoice_id' | 'total'>[];
  }) =>
    apiClient<{ success: boolean; message: string; id: string; invoice_number: string }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status: string) =>
    apiClient<{ success: boolean; message: string }>(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  addPayment: (id: string, payload: { amount: number; payment_method: string; payment_date?: string; reference_id?: string; notes?: string }) =>
    apiClient<{ success: boolean; message: string; id: string }>(`/invoices/${id}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    apiClient<{ success: boolean; message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),
};
