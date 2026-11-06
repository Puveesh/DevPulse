import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { extractErrorMessage } from '../lib/api';
import type {
  WorkSession,
  StartWorkSessionPayload,
  EndWorkSessionPayload,
  UpdateSessionNotesPayload,
  ApiResponse,
  PageResponse,
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
    refetchInterval: 5000,
  });
}

export function useWorkSessions(page = 0, size = 20) {
  return useQuery({
    queryKey: ['work-sessions', 'list', page, size],
    queryFn: async () => {
      try {
        const res = await apiClient.get<ApiResponse<PageResponse<WorkSession> | WorkSession[]>>(
          `/work-sessions?page=${page}&size=${size}`
        );
        const data = res.data.data;
        if (Array.isArray(data)) {
          return { content: data, totalElements: data.length };
        }
        return {
          content: data.content || [],
          totalElements: data.page?.totalElements || data.content?.length || 0,
        };
      } catch {
        return { content: [], totalElements: 0 };
      }
    },
  });
}

export function useWorkSession(id?: string) {
  return useQuery({
    queryKey: ['work-sessions', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<ApiResponse<WorkSession>>(`/work-sessions/${id}`);
      return res.data.data;
    },
    enabled: !!id,
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

export function usePauseSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.post<ApiResponse<WorkSession>>(`/work-sessions/${id}/pause`);
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

export function useResumeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await apiClient.post<ApiResponse<WorkSession>>(`/work-sessions/${id}/resume`);
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

export function useUpdateSessionNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateSessionNotesPayload }) => {
      try {
        const res = await apiClient.patch<ApiResponse<WorkSession>>(`/work-sessions/${id}/notes`, payload);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['work-sessions', variables.id] });
    },
  });
}
