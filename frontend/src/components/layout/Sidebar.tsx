import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Clock,
  BarChart3,
  Settings,
  Activity,
  Layers,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', to: '/projects', icon: FolderKanban },
    { name: 'Work Sessions', to: '/worklogs', icon: Clock },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-zinc-800/80 bg-zinc-950/70 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-md">
      <div className="p-4 space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white">DevPulse</span>
            <span className="text-[10px] block text-zinc-500 font-mono">v0.1.0-alpha</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                  )
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System status / workspace summary footer */}
      <div className="p-4 border-t border-zinc-900/90">
        <div className="rounded-lg bg-zinc-900/50 p-3 border border-zinc-800/60">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Workspace</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">Data isolated &amp; encrypted per authenticated developer.</p>
        </div>
      </div>
    </aside>
  );
}

