import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { extractErrorMessage } from '../lib/api';
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
  ProjectTaskSummaryResponse,
  ProjectTaskSummaryItem,
  ApiResponse,
} from '../types';

export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await apiClient.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`);
      return res.data.data || [];
    },
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      try {
        const res = await apiClient.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, payload);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-task-summary'] });
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      try {
        const res = await apiClient.patch<ApiResponse<Task>>(
          `/projects/${projectId}/tasks/${taskId}/status`,
          { status }
        );
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-task-summary'] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, payload }: { taskId: string; payload: UpdateTaskPayload }) => {
      try {
        const res = await apiClient.patch<ApiResponse<Task>>(
          `/projects/${projectId}/tasks/${taskId}`,
          payload
        );
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-task-summary'] });
    },
  });
}

export function useProjectTaskSummary() {
  return useQuery({
    queryKey: ['project-task-summary'],
    queryFn: async (): Promise<ProjectTaskSummaryItem[]> => {
      const res = await apiClient.get<ApiResponse<ProjectTaskSummaryResponse>>('/dashboard/project-task-summary');
      return res.data.data?.projects || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
