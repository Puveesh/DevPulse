import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

export function Navbar() {
  const { user, logout } = useAuth();

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
    <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-medium text-zinc-300">DevPulse Desktop Client</span>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          Desktop Runtime
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Quick action button */}
        <Link to="/projects?action=create">
          <Button size="sm" variant="outline" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            New Project
          </Button>
        </Link>

        {/* User profile dropdown / info */}
        <div className="flex items-center gap-3 pl-2 border-l border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400">
              {getInitials(user?.displayName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-zinc-200 leading-none">{user?.displayName}</p>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5 leading-none">{user?.email}</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 p-1.5 h-8 w-8"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
            <span className="sr-only">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
