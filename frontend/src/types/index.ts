export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface AuthResponseData {
  accessToken: string;
  tokenType: string;
  expiresInMs: number;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface FieldError {
  field: string;
  message: string;
  rejectedValue?: unknown;
}

export interface ApiErrorResponse {
  success: boolean;
  status: number;
  error: string;
  message: string;
  path: string;
  validationErrors?: FieldError[];
  timestamp: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  repositoryUrl: string | null;
  techStack: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  repositoryUrl?: string;
  techStack?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  repositoryUrl?: string;
  techStack?: string;
  status?: ProjectStatus;
}

export interface PageResponse<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

export type WorkSessionStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export interface WorkSession {
  id: string;
  userId: string;
  projectId: string | null;
  projectName?: string | null;
  taskId: string | null;
  title: string;
  notes: string | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  status: WorkSessionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StartWorkSessionPayload {
  projectId?: string | null;
  taskId?: string | null;
  title: string;
  notes?: string | null;
}

export interface EndWorkSessionPayload {
  notes?: string | null;
  endedAt?: string;
}


