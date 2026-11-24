import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Upload, ZoomIn } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

interface ProfileAvatarUploadProps {
  displayName?: string;
  profileImage?: string | null;
  onUpload: (dataUrl: string) => Promise<void>;
  onRemove: () => Promise<void>;
  isEditing?: boolean;
}

export const ProfileAvatarUpload: React.FC<ProfileAvatarUploadProps> = ({
  displayName,
  profileImage,
  onUpload,
  onRemove,
  isEditing = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPhotoPreviewOpen, setIsPhotoPreviewOpen] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setErrorMessage(null);

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMessage('Invalid file type. Please upload a PNG, JPG, WEBP, or GIF image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate size (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage('Image size exceeds 5MB. Please select a smaller photo.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          await onUpload(dataUrl);
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to upload profile picture.');
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read image file.');
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload profile picture.');
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmRemove = async () => {
    if (!profileImage) return;
    try {
      setIsRemoving(true);
      setErrorMessage(null);
      await onRemove();
      setIsConfirmRemoveOpen(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60">
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          className="hidden"
        />

        {/* Avatar Display */}
        <div className="relative group shrink-0">
          <div
            className={`w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-md relative ${
              profileImage
                ? 'cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/30 transition-all'
                : ''
            }`}
            onClick={() => {
              if (profileImage) setIsPhotoPreviewOpen(true);
            }}
            title={profileImage ? 'Click to view full photo' : undefined}
            role={profileImage ? 'button' : undefined}
            tabIndex={profileImage ? 0 : undefined}
            onKeyDown={(e) => {
              if (profileImage && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                setIsPhotoPreviewOpen(true);
              }
            }}
          >
            {profileImage ? (
              <>
                <img
                  src={profileImage}
                  alt={displayName || 'Developer Avatar'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <ZoomIn className="w-5 h-5 text-white drop-shadow" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400 font-bold text-xl font-mono">
                {getInitials(displayName)}
              </div>
            )}
          </div>

          {(isUploading || isRemoving) && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center backdrop-blur-xs">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Upload & Management Controls */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-200">Profile Picture</span>
            {profileImage && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Custom Avatar Active
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            PNG, JPG, WEBP, or GIF up to 5MB. Click the photo to view it full size. Displayed in the header and throughout your workspace.
          </p>

          {errorMessage && (
            <p className="text-xs text-red-400 font-medium pt-0.5">{errorMessage}</p>
          )}

          <div className="flex items-center gap-2 pt-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isUploading || isRemoving}
              onClick={() => fileInputRef.current?.click()}
              leftIcon={profileImage ? <Camera className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            >
              {profileImage ? 'Change Photo' : 'Upload Photo'}
            </Button>

            {profileImage && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={isUploading || isRemoving}
                onClick={() => setIsConfirmRemoveOpen(true)}
                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      {profileImage && (
        <Modal
          isOpen={isPhotoPreviewOpen}
          onClose={() => setIsPhotoPreviewOpen(false)}
          title={displayName ? `${displayName} - Profile Photo` : 'Profile Photo'}
          className="max-w-md border-zinc-700/80 bg-zinc-950 shadow-2xl"
          position="center"
        >
          <div className="flex flex-col items-center justify-center p-2">
            <div className="relative max-h-[65vh] max-w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl flex items-center justify-center">
              <img
                src={profileImage}
                alt={displayName || 'Profile Photo Preview'}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="mt-4 flex items-center justify-between w-full text-xs text-zinc-400 px-1">
              <span className="font-medium text-zinc-300">{displayName || 'User Profile'}</span>
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

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={isConfirmRemoveOpen}
        onClose={() => {
          if (!isRemoving) setIsConfirmRemoveOpen(false);
        }}
        title={
          <div className="flex items-center gap-2.5 text-zinc-100">
            <div className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold">Remove Profile Photo?</span>
          </div>
        }
        className="max-w-md border-zinc-700/80 shadow-2xl"
        position="center"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to remove your profile photo? Your profile will revert to displaying your default initials avatar.
          </p>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isRemoving}
              onClick={() => setIsConfirmRemoveOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isRemoving}
              onClick={handleConfirmRemove}
              leftIcon={isRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            >
              {isRemoving ? 'Removing...' : 'Remove Photo'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};


