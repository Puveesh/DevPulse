import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, ApiResponse, AuthResponseData, UpdateProfilePayload, UpdatePreferencesPayload } from '../types';
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
  updateProfile: (payload: UpdateProfilePayload) => Promise<User>;
  updatePreferences: (payload: UpdatePreferencesPayload) => Promise<User>;
  uploadAvatar: (dataUrlOrFile: string | File) => Promise<User>;
  removeAvatar: () => Promise<User>;
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

  const updateProfile = async (payload: UpdateProfilePayload): Promise<User> => {
    try {
      const res = await apiClient.put<ApiResponse<User>>('/users/profile', payload);
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to update profile');
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const updatePreferences = async (payload: UpdatePreferencesPayload): Promise<User> => {
    try {
      const res = await apiClient.put<ApiResponse<User>>('/users/preferences', payload);
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to update preferences');
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const uploadAvatar = async (dataUrlOrFile: string | File): Promise<User> => {
    try {
      let res;
      if (typeof dataUrlOrFile === 'string') {
        res = await apiClient.post<ApiResponse<User>>('/users/profile/avatar', {
          avatarDataUrl: dataUrlOrFile,
        });
      } else {
        const formData = new FormData();
        formData.append('file', dataUrlOrFile);
        res = await apiClient.post<ApiResponse<User>>('/users/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to upload avatar');
    } catch (err) {
      throw new Error(extractErrorMessage(err));
    }
  };

  const removeAvatar = async (): Promise<User> => {
    try {
      const res = await apiClient.delete<ApiResponse<User>>('/users/profile/avatar');
      if (res.data?.success && res.data.data) {
        setUser(res.data.data);
        return res.data.data;
      }
      throw new Error(res.data?.message || 'Failed to remove avatar');
    } catch (err) {
      throw new Error(extractErrorMessage(err));
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
    updateProfile,
    updatePreferences,
    uploadAvatar,
    removeAvatar,
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

