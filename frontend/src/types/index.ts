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

export type WorkSessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface PauseInterval {
  id: string;
  pausedAt: string;
  resumedAt?: string | null;
}

export interface WorkSession {
  id: string;
  userId: string;
  projectId: string;
  projectName?: string | null;
  taskId?: string | null;
  title: string;
  initialNotes?: string | null;
  sessionNotes?: string | null;
  startedAt: string;
  endedAt?: string | null;
  totalDurationSeconds?: number | null;
  status: WorkSessionStatus;
  pauseIntervals?: PauseInterval[];
  createdAt: string;
  updatedAt: string;
}

export interface StartWorkSessionPayload {
  projectId: string;
  taskId?: string | null;
  title: string;
  initialNotes?: string | null;
}

export interface EndWorkSessionPayload {
  sessionNotes?: string | null;
  endedAt?: string;
}

export interface UpdateSessionNotesPayload {
  sessionNotes: string;
}


