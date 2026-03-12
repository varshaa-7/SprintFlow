'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Tenant } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; tenantName: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tenant: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const tenant = localStorage.getItem('tenant');
    if (token && user && tenant) {
      setState({ token, user: JSON.parse(user), tenant: JSON.parse(tenant), isLoading: false });
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setState({ token: data.token, user: data.user, tenant: data.tenant, isLoading: false });
  };

  const register = async (payload: { email: string; password: string; name: string; tenantName: string }) => {
    const { data } = await api.post('/api/auth/register', payload);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('tenant', JSON.stringify(data.tenant));
    setState({ token: data.token, user: data.user, tenant: data.tenant, isLoading: false });
  };

  const logout = () => {
    localStorage.clear();
    setState({ user: null, tenant: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
