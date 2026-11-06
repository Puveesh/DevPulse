import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { getAuthToken, extractErrorMessage } from '../lib/api';
import type {
  WorkSession,
  StartWorkSessionPayload,
  EndWorkSessionPayload,
  UpdateSessionNotesPayload,
  ApiResponse,
  PageResponse,
} from '../types';

export function useActiveSession() {
  const token = getAuthToken();
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
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds fresh cache to avoid repeated queries on navigation
    refetchInterval: token ? 15000 : false, // Gentle 15s fallback poll
    refetchOnWindowFocus: true,
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
    staleTime: 1000 * 10,
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
    onSuccess: (data) => {
      if (data) {
        // Synchronously update active session in cache with confirmed backend timestamp
        queryClient.setQueryData(['work-sessions', 'active'], data);
      }
      queryClient.invalidateQueries({ queryKey: ['work-sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
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
    onSuccess: (data) => {
      if (data) {
        // Immediately synchronize confirmed paused state and timestamps
        queryClient.setQueryData(['work-sessions', 'active'], data);
      }
      queryClient.invalidateQueries({ queryKey: ['work-sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => {
      // Reconcile with actual backend state on failure
      queryClient.invalidateQueries({ queryKey: ['work-sessions', 'active'] });
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
    onSuccess: (data) => {
      if (data) {
        // Immediately synchronize confirmed active state
        queryClient.setQueryData(['work-sessions', 'active'], data);
      }
      queryClient.invalidateQueries({ queryKey: ['work-sessions', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => {
      // Reconcile with actual backend state on failure
      queryClient.invalidateQueries({ queryKey: ['work-sessions', 'active'] });
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
      } catch (err: unknown) {
        const message = extractErrorMessage(err);
        // Idempotent client reconciliation: if session is already completed, reconcile immediately
        if (message.toLowerCase().includes('already completed')) {
          queryClient.setQueryData(['work-sessions', 'active'], null);
          queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['analytics'] });
          return null as unknown as WorkSession;
        }
        throw new Error(message);
      }
    },
    onSuccess: () => {
      // Immediately clear active session so timer and card indicators disappear without delay
      queryClient.setQueryData(['work-sessions', 'active'], null);
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: () => {
      // Reconcile active session on error
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
