import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, ApiResponse, AuthResponseData } from '../types';
import apiClient, { setAuthToken, getAuthToken, extractErrorMessage } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<User>>('/auth/me');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
      } else {
        setUser(null);
        setAuthToken(null);
        setToken(null);
      }
    } catch {
      setUser(null);
      setAuthToken(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/login', credentials);
      const data = res.data.data;
      if (data?.accessToken) {
        setAuthToken(data.accessToken);
        setToken(data.accessToken);
      }
      setUser(data.user);
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const register = async (payload: { email: string; password: string; displayName: string }) => {
    try {
      const res = await apiClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
      const data = res.data.data;
      if (data?.accessToken) {
        setAuthToken(data.accessToken);
        setToken(data.accessToken);
      }
      setUser(data.user);
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

