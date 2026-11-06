import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { WorkSessionProvider } from './contexts/WorkSessionContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProjectsPage } from './features/projects/ProjectsPage';
import { ProjectDetailPage } from './features/projects/ProjectDetailPage';
import { WorkSessionsPage } from './features/worklog/WorkSessionsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { EmptyState } from './components/common/EmptyState';
import { Clock, BarChart3 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <WorkSessionProvider>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/worklogs" element={<WorkSessionsPage />} />
                  <Route
                    path="/analytics"
                    element={
                      <div className="space-y-6">
                        <div className="border-b border-zinc-800 pb-6">
                          <h1 className="text-2xl font-bold tracking-tight text-white">Developer Analytics</h1>
                          <p className="text-xs text-zinc-400 mt-1">Productivity velocity and time distribution.</p>
                        </div>
                        <EmptyState
                          icon={<BarChart3 className="w-8 h-8 text-emerald-400" />}
                          title="Productivity Insights"
                          description="Derived productivity graphs and weekly summary charts will compute automatically once development logs accumulate."
                        />
                      </div>
                    }
                  />
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </WorkSessionProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
