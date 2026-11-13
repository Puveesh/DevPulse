import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { extractErrorMessage } from '../lib/api';
import type { DailyNote, DailyNoteSummary, SaveDailyNotePayload, ApiResponse } from '../types';

export function useDailyNote(projectId?: string, date?: string) {
  return useQuery({
    queryKey: ['daily-notes', projectId, date],
    queryFn: async () => {
      if (!projectId || !date) return null;
      try {
        const res = await apiClient.get<ApiResponse<DailyNote | null>>(
          `/projects/${projectId}/daily-notes/${date}`
        );
        return res.data.data;
      } catch {
        return null;
      }
    },
    enabled: !!projectId && !!date,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useDailyNotesHistory(projectId?: string) {
  return useQuery({
    queryKey: ['daily-notes', projectId, 'history'],
    queryFn: async () => {
      if (!projectId) return [];
      try {
        const res = await apiClient.get<ApiResponse<DailyNoteSummary[]>>(
          `/projects/${projectId}/daily-notes`
        );
        return res.data.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!projectId,
    staleTime: 1000 * 30,
  });
}

export function useSaveDailyNote(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, content }: { date: string; content: string }) => {
      if (!projectId) throw new Error('Project ID is required');
      try {
        const res = await apiClient.put<ApiResponse<DailyNote>>(
          `/projects/${projectId}/daily-notes/${date}`,
          { noteDate: date, content } as SaveDailyNotePayload
        );
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(['daily-notes', projectId, variables.date], data);
      }
      queryClient.invalidateQueries({ queryKey: ['daily-notes', projectId, 'history'] });
    },
  });
}

export function useDeleteDailyNote(projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (date: string) => {
      if (!projectId) throw new Error('Project ID is required');
      try {
        await apiClient.delete<ApiResponse<void>>(`/projects/${projectId}/daily-notes/${date}`);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: (_, date) => {
      queryClient.setQueryData(['daily-notes', projectId, date], null);
      queryClient.invalidateQueries({ queryKey: ['daily-notes', projectId, 'history'] });
    },
  });
}
