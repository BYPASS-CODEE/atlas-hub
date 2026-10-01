import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { authApi } from '../api/authApi.js';

interface AuthContextType {
  user: (User & { organization_id: string; company_name: string; plan?: string }) | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string; company_name: string; phone?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { organization_id: string; company_name: string; plan?: string }) | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('atlas_auth_token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = await authApi.getCurrentUser();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('atlas_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.token && res.user) {
      localStorage.setItem('atlas_auth_token', res.token);
      localStorage.setItem('atlas_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (payload: { email: string; password: string; full_name: string; company_name: string; phone?: string }) => {
    const res = await authApi.register(payload);
    if (res.success && res.token && res.user) {
      localStorage.setItem('atlas_auth_token', res.token);
      localStorage.setItem('atlas_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    localStorage.removeItem('atlas_auth_token');
    localStorage.removeItem('atlas_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    if (user) {
      const nextUser = { ...user, ...updated };
      setUser(nextUser);
      localStorage.setItem('atlas_user', JSON.stringify(nextUser));
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        isAdmin,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
