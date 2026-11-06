import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { extractErrorMessage } from '../lib/api';
import type {
  WorkSession,
  StartWorkSessionPayload,
  EndWorkSessionPayload,
  ApiResponse,
} from '../types';

export function useActiveSession() {
  return useQuery({
    queryKey: ['work-sessions', 'active'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<WorkSession | null>>('/work-sessions/active');
        return res.data.data;
      } catch {
        return null;
      }
    },
    refetchInterval: 10000, // Sync active session state across windows/tabs every 10s
  });
}

export function useRecentSessions() {
  return useQuery({
    queryKey: ['work-sessions', 'recent'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<WorkSession[]>>('/work-sessions/recent');
        return res.data.data || [];
      } catch {
        return [];
      }
    },
  });
}

export function useTodayDuration() {
  return useQuery({
    queryKey: ['work-sessions', 'today-duration'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<number>>('/work-sessions/today-duration');
        return res.data.data ?? 0;
      } catch {
        return 0;
      }
    },
    refetchInterval: 15000,
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartWorkSessionPayload) => {
      try {
        const res = await apiClient.post<ApiResponse<WorkSession>>('/work-sessions/start', payload);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
    },
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload?: EndWorkSessionPayload }) => {
      try {
        const res = await apiClient.post<ApiResponse<WorkSession>>(`/work-sessions/${id}/end`, payload || {});
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
    },
  });
}

export function useCancelSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.post<ApiResponse<WorkSession>>(`/work-sessions/${id}/cancel`);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
    },
  });
}
