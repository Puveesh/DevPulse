import { useQuery } from '@tanstack/react-query';
import apiClient, { getAuthToken } from '../lib/api';
import type { ApiResponse, TodayAnalytics, WeeklyAnalytics } from '../types';

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function useTodayAnalytics(customTimezone?: string) {
  const token = getAuthToken();
  const tz = customTimezone || getUserTimezone();

  return useQuery({
    queryKey: ['analytics', 'today', tz],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TodayAnalytics>>(
        `/analytics/dashboard/today?timezone=${encodeURIComponent(tz)}`
      );
      return res.data.data;
    },
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds fresh cache
    refetchInterval: token ? 30000 : false, // Background sync every 30s
    refetchOnWindowFocus: true,
  });
}

export function useWeeklyAnalytics(customTimezone?: string, weekStart?: string) {
  const token = getAuthToken();
  const tz = customTimezone || getUserTimezone();

  return useQuery({
    queryKey: ['analytics', 'weekly', tz, weekStart || 'current'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('timezone', tz);
      if (weekStart) {
        params.set('weekStart', weekStart);
      }
      const res = await apiClient.get<ApiResponse<WeeklyAnalytics>>(
        `/analytics/dashboard/weekly?${params.toString()}`
      );
      return res.data.data;
    },
    enabled: !!token,
    staleTime: 1000 * 30,
    refetchInterval: token ? 30000 : false,
    refetchOnWindowFocus: true,
  });
}

