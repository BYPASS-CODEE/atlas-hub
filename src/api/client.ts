export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('atlas_auth_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.error || (response.status === 403 
      ? 'شما اجازه دسترسی به این بخش را ندارید.' 
      : response.status === 401 
      ? 'نشست کاربری شما منقضی شده است. لطفاً مجدداً وارد شوید.' 
      : 'خطایی در ارتباط با سرور رخ داد.');

    if (response.status === 401) {
      localStorage.removeItem('atlas_auth_token');
      localStorage.removeItem('atlas_user');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register') && window.location.pathname !== '/') {
        window.location.href = '/login?session_expired=1';
      }
    }

    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
