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
      queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
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
      queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
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
      queryClient.invalidateQueries({ queryKey: ['recent-tasks'] });
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

export function useRecentTasks(limit: number = 10) {
  return useQuery({
    queryKey: ['recent-tasks', limit],
    queryFn: async (): Promise<Task[]> => {
      try {
        const res = await apiClient.get<ApiResponse<Task[]>>(`/tasks/recent?limit=${limit}`);
        if (res.data?.data) {
          return res.data.data;
        }
      } catch (err) {
        // Fallback: If /tasks/recent fails (e.g. temporary restart or network latency),
        // query project tasks directly across projects so the UI remains 100% resilient
        try {
          const projRes = await apiClient.get<ApiResponse<{ id: string; name: string }[]>>('/projects');
          const projects = projRes.data?.data || [];
          if (projects.length === 0) return [];

          const taskPromises = projects.slice(0, 10).map(async (p) => {
            try {
              const tRes = await apiClient.get<ApiResponse<Task[]>>(`/projects/${p.id}/tasks`);
              return (tRes.data?.data || []).map((t) => ({ ...t, projectName: p.name }));
            } catch {
              return [];
            }
          });

          const allTasks = (await Promise.all(taskPromises)).flat();
          return allTasks
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, limit);
        } catch {
          throw err;
        }
      }
      return [];
    },
    staleTime: 1000 * 30, // 30 seconds
    retry: 2,
  });
}

