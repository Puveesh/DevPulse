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
  lastActivity?: string | null;
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

export interface ProjectDuration {
  projectId: string | null;
  projectName: string;
  durationSeconds: number;
}

export interface DailyActivity {
  date: string;
  day: string;
  durationSeconds: number;
  projects?: ProjectDuration[];
}

export interface TodaySession {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  startedAt: string;
  endedAt?: string | null;
  todayWorkingSeconds: number;
  totalDurationSeconds?: number | null;
  initialNotes?: string | null;
  sessionNotes?: string | null;
}

export interface TodayAnalytics {
  date: string;
  totalDurationSeconds: number;
  sessionCount: number;
  projectCount: number;
  activeSessionId: string | null;
  activeSessionTodayWorkingSeconds: number;
  projects: ProjectDuration[];
  sessions?: TodaySession[];
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  totalDurationSeconds: number;
  activeDays: number;
  mostActiveDay: string | null;
  projectCount: number;
  activeSessionId: string | null;
  activeSessionWeeklyWorkingSeconds: number;
  dailyActivity: DailyActivity[];
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface ProjectTaskSummaryItem {
  projectId: string;
  projectName: string;
  pendingTaskCount: number;
}

export interface ProjectTaskSummaryResponse {
  projects: ProjectTaskSummaryItem[];
}



