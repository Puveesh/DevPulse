import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Upload } from 'lucide-react';
import { Button } from '../../components/ui/Button';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    // Validate size (2MB)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage('Image size exceeds 2MB. Please select a smaller photo.');
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

  const handleRemove = async () => {
    if (!profileImage) return;
    try {
      setIsUploading(true);
      setErrorMessage(null);
      await onRemove();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center shadow-md">
          {profileImage ? (
            <img
              src={profileImage}
              alt={displayName || 'Developer Avatar'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-600/20 text-blue-400 font-bold text-xl font-mono">
              {getInitials(displayName)}
            </div>
          )}
        </div>

        {isUploading && (
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
          PNG, JPG, WEBP, or GIF up to 2MB. Displayed in the header and throughout your workspace.
        </p>

        {errorMessage && (
          <p className="text-xs text-red-400 font-medium pt-0.5">{errorMessage}</p>
        )}

        <div className="flex items-center gap-2 pt-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
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
              disabled={isUploading}
              onClick={handleRemove}
              className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
