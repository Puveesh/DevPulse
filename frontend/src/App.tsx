import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
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
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { setAuthToken } from './lib/api';

/**
 * Handles seamless web redirection if an OAuth callback lands on /auth/callback.
 * Extracts token or errors and routes directly to the dashboard (or login/settings).
 */
function OAuthCallbackRedirect() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const action = searchParams.get('action');

  useEffect(() => {
    if (token) {
      setAuthToken(token);
    }
  }, [token]);

  if (error || message) {
    const target = action === 'REGISTER' ? '/register' : action === 'LINK' ? '/settings' : '/login';
    return <Navigate to={`${target}?${searchParams.toString()}`} replace />;
  }

  if (action === 'LINK') {
    return <Navigate to="/settings?linked=google" replace />;
  }

  const destination = token ? `/dashboard?token=${encodeURIComponent(token)}` : '/dashboard';
  return <Navigate to={destination} replace />;
}

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
              <Route path="/auth/callback" element={<OAuthCallbackRedirect />} />
              <Route path="/oauth/callback" element={<OAuthCallbackRedirect />} />

              {/* Protected Application Routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailPage />} />
                  <Route path="/worklogs" element={<WorkSessionsPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
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
