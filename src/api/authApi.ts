import { apiClient } from './client.js';
import { User } from '../types/index.js';

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User & { organization_id: string; company_name: string; plan?: string };
}

export const authApi = {
  register: (payload: { email: string; password: string; full_name: string; company_name: string; phone?: string }) =>
    apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getCurrentUser: () =>
    apiClient<{ success: boolean; user: User & { organization_id: string; company_name: string; plan: string } }>('/auth/me'),

  updateProfile: (payload: { full_name: string; phone?: string }) =>
    apiClient<{ success: boolean; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  changePassword: (payload: { current_password: string; new_password: string }) =>
    apiClient<{ success: boolean; message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};
