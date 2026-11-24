import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { LogoutConfirmModal } from '../common/LogoutConfirmModal';
import { ProjectModal } from '../../features/projects/ProjectModal';
import { UserOverviewCard } from './UserOverviewCard';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isUserOverviewOpen, setIsUserOverviewOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserOverviewOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsUserOverviewOpen(false);
      }
    }
    if (isUserOverviewOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUserOverviewOpen]);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-zinc-300">DevPulse Desktop Client</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick action button */}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="cursor-pointer"
          >
            New Project
          </Button>

          {/* User profile dropdown / info */}
          <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsUserOverviewOpen((prev) => !prev)}
                className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer p-1 rounded-lg hover:bg-zinc-800/40 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50"
                title="View user overview"
                aria-expanded={isUserOverviewOpen}
                aria-haspopup="dialog"
              >
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.displayName || 'Developer'}
                    className="w-8 h-8 rounded-full object-cover border border-blue-500/30"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400">
                    {getInitials(user?.displayName)}
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-medium text-zinc-200 leading-none">{user?.displayName}</p>
                </div>
              </button>

              {isUserOverviewOpen && (
                <UserOverviewCard
                  user={user}
                  onClose={() => setIsUserOverviewOpen(false)}
                  onOpenLogout={() => {
                    setIsUserOverviewOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />

      <ProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={(project) => navigate(`/projects/${project.id}`)}
      />
    </>
  );
}
