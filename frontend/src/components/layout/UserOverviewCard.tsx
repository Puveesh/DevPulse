import React, { useState } from 'react';
import type { User } from '../../types';
import { X, Settings, LogOut, Mail, Briefcase, Calendar, Sparkles, ZoomIn } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';
import { formatDate, getInitials } from '../../lib/utils';
import { Modal } from '../ui/Modal';

interface UserOverviewCardProps {
  user: User | null;
  onClose: () => void;
  onOpenLogout: () => void;
}

export const UserOverviewCard: React.FC<UserOverviewCardProps> = ({
  user,
  onClose,
  onOpenLogout,
}) => {
  const navigate = useNavigate();
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [user?.profileImage]);

  return (
    <>
      <div
        className="absolute right-0 top-full mt-2 w-80 sm:w-84 rounded-2xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-5 z-50 text-left animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-label="User Overview"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Developer Profile
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Close overview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col items-center text-center pt-4 pb-2">
          {/* Big Profile Photo */}
          <div className="relative group mb-3">
            <div
              className={`w-20 h-20 rounded-full border-2 border-blue-500/40 ring-4 ring-blue-500/10 shadow-lg overflow-hidden bg-zinc-900 flex items-center justify-center ${
                user?.profileImage && !imageError ? 'cursor-pointer hover:border-blue-400 transition-all' : ''
              }`}
              onClick={() => {
                if (user?.profileImage && !imageError) setIsPhotoPreviewOpen(true);
              }}
              title={user?.profileImage && !imageError ? 'Click to view enlarged photo' : undefined}
            >
              {user?.profileImage && !imageError ? (
                <>
                  <img
                    src={user.profileImage}
                    alt={user.displayName || 'Developer'}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                    <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400 font-bold text-2xl font-mono">
                  {getInitials(user?.displayName || user?.email)}
                </div>
              )}
            </div>
          </div>

          {/* User Details */}
          <h4 className="text-base font-semibold text-zinc-100 tracking-tight">
            {user?.displayName || 'Developer'}
          </h4>
          <p className="text-xs text-zinc-400 font-mono mt-0.5 flex items-center justify-center gap-1">
            <Mail className="w-3 h-3 text-zinc-500" />
            <span className="truncate max-w-[220px]">{user?.email}</span>
          </p>

          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5">
            {user?.professionalTitle && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Briefcase className="w-3 h-3" />
                {user.professionalTitle}
              </span>
            )}
            {user?.experienceLevel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                {user.experienceLevel}
              </span>
            )}
          </div>

          {/* Current Focus (if configured) */}
          {user?.currentFocus && (
            <div className="mt-3 p-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-xs text-zinc-300 w-full text-left">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block mb-0.5">
                Current Focus
              </span>
              <p className="italic text-zinc-200 line-clamp-2">{user.currentFocus}</p>
            </div>
          )}

          {/* Member Since */}
          {user?.createdAt && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <Calendar className="w-3 h-3 text-zinc-400" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center text-xs cursor-pointer"
            leftIcon={<Settings className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              navigate('/settings');
            }}
          >
            Developer Settings
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
            onClick={() => {
              onClose();
              onOpenLogout();
            }}
          >
            Log Out
          </Button>
        </div>
      </div>

      {/* Enlarged photo lightbox modal */}
      {user?.profileImage && (
        <Modal
          isOpen={isPhotoPreviewOpen}
          onClose={() => setIsPhotoPreviewOpen(false)}
          title={user?.displayName ? `${user.displayName} - Profile Photo` : 'Profile Photo'}
          className="max-w-md border-zinc-700/80 bg-zinc-950 shadow-2xl"
          position="center"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative max-h-[65vh] max-w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center">
              <img
                src={user.profileImage}
                alt={user.displayName || 'Profile Photo Preview'}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 flex items-center justify-between w-full text-xs text-zinc-400 px-1">
              <span className="font-medium text-zinc-300">{user.displayName || 'Developer'}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPhotoPreviewOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
