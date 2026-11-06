import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient, { extractErrorMessage } from '../lib/api';
import type {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ApiResponse,
  ProjectStatus,
} from '../types';

interface ProjectFilters {
  status?: ProjectStatus | '';
  search?: string;
  page?: number;
  size?: number;
}

// Spring Data PagedModel or Page representation
interface SpringPage<T> {
  content?: T[];
  page?: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export function useProjects(filters: ProjectFilters = {}) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.size !== undefined) params.append('size', filters.size.toString());

      const res = await apiClient.get<ApiResponse<SpringPage<Project>>>(`/projects?${params.toString()}`);
      // Handle both PageImpl (data.content) and PagedModel (data.content)
      const data = res.data.data;
      const projects: Project[] = Array.isArray(data) ? data : data?.content || [];
      return projects;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      try {
        const res = await apiClient.post<ApiResponse<Project>>('/projects', payload);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateProjectPayload }) => {
      try {
        const res = await apiClient.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
        return res.data.data;
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await apiClient.delete(`/projects/${id}`);
      } catch (err) {
        throw new Error(extractErrorMessage(err));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

