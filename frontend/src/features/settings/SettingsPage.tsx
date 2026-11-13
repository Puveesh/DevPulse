import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import {
  User as UserIcon,
  Shield,
  Database,
  Sliders,
  Copy,
  Check,
  Lock,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  Globe,
  Briefcase,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { ProfileAvatarUpload } from './ProfileAvatarUpload';
import { TagMultiSelect } from './TagMultiSelect';

// Standard common timezones
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const SUGGESTED_LANGUAGES = [
  'Java',
  'Python',
  'TypeScript',
  'JavaScript',
  'Go',
  'Rust',
  'C++',
  'C',
  'Kotlin',
  'PHP',
  'Swift',
];

const SUGGESTED_TECHNOLOGIES = [
  'React',
  'Spring Boot',
  'FastAPI',
  'Node.js',
  'MySQL',
  'PostgreSQL',
  'Docker',
  'Git',
  'Electron',
  'Next.js',
  'TailwindCSS',
  'Redis',
];

export function SettingsPage() {
  const { user, updateProfile, updatePreferences, uploadAvatar, removeAvatar } = useAuth();

  // Mode toggles
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPreferences, setIsEditingPreferences] = useState(false);

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  // Status notifications
  const [statusNotification, setStatusNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Clipboard copy state
  const [isCopied, setIsCopied] = useState(false);

  // Form states for profile
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    bio: '',
    professionalTitle: '',
    experienceLevel: 'Intermediate',
    programmingLanguages: [] as string[],
    technologies: [] as string[],
    githubUrl: '',
    portfolioUrl: '',
    currentFocus: '',
  });

  // Validation errors
  const [profileErrors, setProfileErrors] = useState<{
    displayName?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  }>({});

  // Form states for preferences
  const [preferencesForm, setPreferencesForm] = useState({
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24-hour',
    weekStartDay: 'Monday',
    theme: 'dark',
  });

  // Initialize forms when user loads or changes
  useEffect(() => {
    if (user) {
      const langs = user.programmingLanguages
        ? user.programmingLanguages.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const techs = user.technologies
        ? user.technologies.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      setProfileForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        professionalTitle: user.professionalTitle || '',
        experienceLevel: user.experienceLevel || 'Intermediate',
        programmingLanguages: langs,
        technologies: techs,
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        currentFocus: user.currentFocus || '',
      });

      // Detect system timezone if none set
      const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      setPreferencesForm({
        timezone: user.timezone || systemTz,
        dateFormat: user.dateFormat || 'YYYY-MM-DD',
        timeFormat: user.timeFormat || '24-hour',
        weekStartDay: user.weekStartDay || 'Monday',
        theme: user.theme || 'dark',
      });
    }
  }, [user]);

  // Handle Copy Developer ID
  const handleCopyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(user.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // URL Validator Helper
  const isValidUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async () => {
    const errors: { displayName?: string; githubUrl?: string; portfolioUrl?: string } = {};

    if (!profileForm.displayName.trim()) {
      errors.displayName = 'Display name cannot be blank';
    }

    if (profileForm.githubUrl.trim() && !isValidUrl(profileForm.githubUrl)) {
      errors.githubUrl = 'Please enter a valid GitHub URL (e.g. https://github.com/username)';
    }

    if (profileForm.portfolioUrl.trim() && !isValidUrl(profileForm.portfolioUrl)) {
      errors.portfolioUrl = 'Please enter a valid Portfolio URL (e.g. https://myportfolio.dev)';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setProfileErrors({});
    setIsSavingProfile(true);
    setStatusNotification(null);

    // Normalize URLs
    const normalizeUrl = (u: string) => {
      const trimmed = u.trim();
      if (!trimmed) return '';
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    };

    try {
      await updateProfile({
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim() || null,
        professionalTitle: profileForm.professionalTitle.trim() || null,
        experienceLevel: profileForm.experienceLevel || null,
        programmingLanguages: profileForm.programmingLanguages.join(', '),
        technologies: profileForm.technologies.join(', '),
        githubUrl: normalizeUrl(profileForm.githubUrl) || null,
        portfolioUrl: normalizeUrl(profileForm.portfolioUrl) || null,
        currentFocus: profileForm.currentFocus.trim() || null,
      });

      setStatusNotification({
        type: 'success',
        message: 'Developer profile updated successfully across DevPulse.',
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to update developer profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Cancel Profile Handler
  const handleCancelProfile = () => {
    if (user) {
      const langs = user.programmingLanguages
        ? user.programmingLanguages.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const techs = user.technologies
        ? user.technologies.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      setProfileForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        professionalTitle: user.professionalTitle || '',
        experienceLevel: user.experienceLevel || 'Intermediate',
        programmingLanguages: langs,
        technologies: techs,
        githubUrl: user.githubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        currentFocus: user.currentFocus || '',
      });
    }
    setProfileErrors({});
    setIsEditingProfile(false);
  };

  // Save Preferences Handler
  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    setStatusNotification(null);

    try {
      await updatePreferences({
        timezone: preferencesForm.timezone,
        dateFormat: preferencesForm.dateFormat,
        timeFormat: preferencesForm.timeFormat,
        weekStartDay: preferencesForm.weekStartDay,
        theme: preferencesForm.theme,
      });

      setStatusNotification({
        type: 'success',
        message: 'Workspace preferences saved successfully.',
      });
      setIsEditingPreferences(false);
    } catch (err: any) {
      setStatusNotification({
        type: 'error',
        message: err.message || 'Failed to update workspace preferences.',
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  // Cancel Preferences Handler
  const handleCancelPreferences = () => {
    if (user) {
      setPreferencesForm({
        timezone: user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        dateFormat: user.dateFormat || 'YYYY-MM-DD',
        timeFormat: user.timeFormat || '24-hour',
        weekStartDay: user.weekStartDay || 'Monday',
        theme: user.theme || 'dark',
      });
    }
    setIsEditingPreferences(false);
  };

  // Build Timezone options (including system timezone if not already in list)
  const timezoneOptions = React.useMemo(() => {
    const list = [...COMMON_TIMEZONES];
    const systemTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (systemTz && !list.includes(systemTz)) {
      list.unshift(systemTz);
    }
    return list.map((tz) => ({
      label: tz === systemTz ? `${tz} (System Detected)` : tz,
      value: tz,
    }));
  }, []);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-300 pb-12">
      {/* Page Title */}
      <div className="border-b border-zinc-800/80 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage your account profile, authentication preferences, and developer workspace settings.
        </p>
      </div>

      {/* Global Status Notification */}
      {statusNotification && (
        <Alert
          variant={statusNotification.type === 'success' ? 'success' : 'error'}
          title={statusNotification.type === 'success' ? 'Settings Saved' : 'Error'}
          className="animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="flex items-center justify-between">
            <span>{statusNotification.message}</span>
            <button
              onClick={() => setStatusNotification(null)}
              className="text-xs underline hover:opacity-80 ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </Alert>
      )}

      <div className="space-y-6">
        {/* ========================================================================= */}
        {/* 1. DEVELOPER PROFILE CARD (Personal Info + Developer Info)                 */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-400" />
                <CardTitle>Developer Profile</CardTitle>
              </div>
              <CardDescription>Your personal account details, developer identity, and technical stack</CardDescription>
            </div>

            {/* Profile Edit Controls */}
            {!isEditingProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelProfile}
                  disabled={isSavingProfile}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6 pt-5">
            {/* SUBSECTION A: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Personal Information
                </span>
                <span className="h-px flex-1 bg-zinc-800/70" />
              </div>

              {/* Avatar Upload */}
              <ProfileAvatarUpload
                displayName={user?.displayName}
                profileImage={user?.profileImage}
                onUpload={async (dataUrl) => {
                  await uploadAvatar(dataUrl);
                  setStatusNotification({
                    type: 'success',
                    message: 'Profile picture updated successfully.',
                  });
                }}
                onRemove={async () => {
                  await removeAvatar();
                  setStatusNotification({
                    type: 'success',
                    message: 'Profile picture removed. Initials avatar active.',
                  });
                }}
              />

              {/* Personal Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Display Name */}
                {isEditingProfile ? (
                  <Input
                    label="Display Name"
                    value={profileForm.displayName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, displayName: e.target.value })
                    }
                    error={profileErrors.displayName}
                    placeholder="Your developer display name"
                  />
                ) : (
                  <div className="space-y-1.5 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Display Name</span>
                    <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-sm font-medium text-zinc-100">
                      {user?.displayName || '--'}
                    </div>
                  </div>
                )}

                {/* Email Address (Strictly Read-Only) */}
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <span className="block text-xs font-medium text-zinc-400">Email Address</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={user?.email || ''}
                      readOnly
                      disabled
                      className="flex h-9 w-full rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-1.5 pr-8 text-sm text-zinc-400 font-mono select-all cursor-not-allowed"
                    />
                    <Lock className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-3" />
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    System registered email. Non-editable without authentication verification workflow.
                  </p>
                </div>
              </div>

              {/* Developer Bio */}
              <div className="space-y-1.5 text-left">
                {isEditingProfile ? (
                  <Textarea
                    label="Developer Bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="A short introduction about yourself and your development interests."
                    rows={3}
                  />
                ) : (
                  <div className="space-y-1 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Developer Bio</span>
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-xs text-zinc-200 leading-relaxed min-h-[64px]">
                      {user?.bio || (
                        <span className="text-zinc-500 italic">
                          No developer bio added yet. Click &quot;Edit Profile&quot; to describe yourself.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Developer ID & Account Created */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Developer ID */}
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Developer ID</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={user?.id || ''}
                      readOnly
                      disabled
                      className="flex h-9 w-full rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-1.5 text-xs text-zinc-400 font-mono select-all cursor-not-allowed"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyId}
                      className="h-9 px-2.5 shrink-0"
                      title="Copy Developer ID"
                      leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    >
                      {isCopied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Account Created Date */}
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Account Created</span>
                  <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/70 flex items-center text-xs font-mono text-zinc-300">
                    {user?.createdAt ? formatDate(user.createdAt) : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* SUBSECTION B: Developer Information */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Developer Information
                </span>
                <span className="h-px flex-1 bg-zinc-800/70" />
              </div>

              {/* Professional Title & Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {isEditingProfile ? (
                  <Input
                    label="Professional Title"
                    value={profileForm.professionalTitle}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, professionalTitle: e.target.value })
                    }
                    placeholder="e.g. Full Stack Developer, Software Engineer"
                  />
                ) : (
                  <div className="space-y-1.5 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Professional Title</span>
                    <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-sm font-medium text-zinc-200">
                      <Briefcase className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
                      {user?.professionalTitle || (
                        <span className="text-zinc-500 italic text-xs">Not specified</span>
                      )}
                    </div>
                  </div>
                )}

                {isEditingProfile ? (
                  <Select
                    label="Experience Level"
                    value={profileForm.experienceLevel}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, experienceLevel: e.target.value })
                    }
                    options={[
                      { label: 'Beginner', value: 'Beginner' },
                      { label: 'Intermediate', value: 'Intermediate' },
                      { label: 'Advanced', value: 'Advanced' },
                      { label: 'Professional', value: 'Professional' },
                    ]}
                  />
                ) : (
                  <div className="space-y-1.5 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Experience Level</span>
                    <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-xs font-mono text-zinc-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                      <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold">
                        {user?.experienceLevel || 'Intermediate'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary Programming Languages */}
              <TagMultiSelect
                label="Primary Programming Languages"
                selectedTags={profileForm.programmingLanguages}
                onChange={(tags) =>
                  setProfileForm({ ...profileForm, programmingLanguages: tags })
                }
                suggestions={SUGGESTED_LANGUAGES}
                placeholder="Type language and press Enter (e.g. Java, Python)..."
                isEditing={isEditingProfile}
                helperText="Select or enter the core programming languages you develop in."
              />

              {/* Frameworks & Technologies */}
              <TagMultiSelect
                label="Frameworks & Technologies"
                selectedTags={profileForm.technologies}
                onChange={(tags) => setProfileForm({ ...profileForm, technologies: tags })}
                suggestions={SUGGESTED_TECHNOLOGIES}
                placeholder="Type technology and press Enter (e.g. React, Spring Boot)..."
                isEditing={isEditingProfile}
                helperText="Add the frameworks, databases, and development tooling in your stack."
              />

              {/* GitHub Profile & Portfolio Website */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* GitHub */}
                {isEditingProfile ? (
                  <Input
                    label="GitHub Profile URL"
                    value={profileForm.githubUrl}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, githubUrl: e.target.value })
                    }
                    placeholder="https://github.com/yourusername"
                    error={profileErrors.githubUrl}
                  />
                ) : (
                  <div className="space-y-1.5 text-left">
                    <span className="block text-xs font-medium text-zinc-400">GitHub Profile</span>
                    <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-200">
                      <div className="flex items-center gap-2 truncate">
                        <GitBranch className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono">
                          {user?.githubUrl || (
                            <span className="text-zinc-500 italic font-sans">Not connected</span>
                          )}
                        </span>
                      </div>
                      {user?.githubUrl && (
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 p-1 shrink-0"
                          title="Open GitHub Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Portfolio Website */}
                {isEditingProfile ? (
                  <Input
                    label="Portfolio Website"
                    value={profileForm.portfolioUrl}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, portfolioUrl: e.target.value })
                    }
                    placeholder="https://myportfolio.dev"
                    error={profileErrors.portfolioUrl}
                  />
                ) : (
                  <div className="space-y-1.5 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Portfolio Website</span>
                    <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center justify-between text-xs text-zinc-200">
                      <div className="flex items-center gap-2 truncate">
                        <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-mono">
                          {user?.portfolioUrl || (
                            <span className="text-zinc-500 italic font-sans">Not connected</span>
                          )}
                        </span>
                      </div>
                      {user?.portfolioUrl && (
                        <a
                          href={user.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 p-1 shrink-0"
                          title="Open Portfolio Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Current Focus */}
              <div className="space-y-1.5 text-left">
                {isEditingProfile ? (
                  <Textarea
                    label="Current Focus"
                    value={profileForm.currentFocus}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, currentFocus: e.target.value })
                    }
                    placeholder="e.g. Building desktop applications, exploring AI/ML, and improving backend architecture."
                    rows={2}
                  />
                ) : (
                  <div className="space-y-1 text-left">
                    <span className="block text-xs font-medium text-zinc-400">Current Focus</span>
                    <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 text-xs text-zinc-200 leading-relaxed min-h-[48px]">
                      {user?.currentFocus || (
                        <span className="text-zinc-500 italic">
                          Not specified. What are you currently learning or building?
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 2. WORKSPACE PREFERENCES CARD                                             */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <CardTitle>Workspace Preferences</CardTitle>
              </div>
              <CardDescription>Date, time, calendar defaults, and workspace localization</CardDescription>
            </div>

            {!isEditingPreferences ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPreferences(true)}
              >
                Edit Preferences
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreferences}
                  disabled={isSavingPreferences}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  disabled={isSavingPreferences}
                >
                  {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Timezone */}
              {isEditingPreferences ? (
                <Select
                  label="Timezone"
                  value={preferencesForm.timezone}
                  onChange={(e) =>
                    setPreferencesForm({ ...preferencesForm, timezone: e.target.value })
                  }
                  options={timezoneOptions}
                />
              ) : (
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Workspace Timezone</span>
                  <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-xs font-mono text-zinc-200">
                    <Globe className="w-3.5 h-3.5 text-blue-400 mr-2 shrink-0" />
                    {user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
                  </div>
                </div>
              )}

              {/* Date Format */}
              {isEditingPreferences ? (
                <Select
                  label="Date Format"
                  value={preferencesForm.dateFormat}
                  onChange={(e) =>
                    setPreferencesForm({ ...preferencesForm, dateFormat: e.target.value })
                  }
                  options={[
                    { label: 'YYYY-MM-DD (ISO 8601 - e.g. 2026-11-13)', value: 'YYYY-MM-DD' },
                    { label: 'DD/MM/YYYY (Day/Month/Year - e.g. 13/11/2026)', value: 'DD/MM/YYYY' },
                    { label: 'MM/DD/YYYY (Month/Day/Year - e.g. 11/13/2026)', value: 'MM/DD/YYYY' },
                  ]}
                />
              ) : (
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Date Format</span>
                  <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-xs font-mono text-zinc-200">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
                    {user?.dateFormat || 'YYYY-MM-DD'}
                  </div>
                </div>
              )}

              {/* Time Format */}
              {isEditingPreferences ? (
                <Select
                  label="Time Format"
                  value={preferencesForm.timeFormat}
                  onChange={(e) =>
                    setPreferencesForm({ ...preferencesForm, timeFormat: e.target.value })
                  }
                  options={[
                    { label: '24-hour (e.g. 14:30:00)', value: '24-hour' },
                    { label: '12-hour (e.g. 02:30:00 PM)', value: '12-hour' },
                  ]}
                />
              ) : (
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Time Format</span>
                  <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-xs font-mono text-zinc-200">
                    <Clock className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                    {user?.timeFormat || '24-hour'}
                  </div>
                </div>
              )}

              {/* Weekly Start Day */}
              {isEditingPreferences ? (
                <Select
                  label="Weekly Start Day"
                  value={preferencesForm.weekStartDay}
                  onChange={(e) =>
                    setPreferencesForm({ ...preferencesForm, weekStartDay: e.target.value })
                  }
                  options={[
                    { label: 'Monday (Default - ISO Calendar standard)', value: 'Monday' },
                    { label: 'Sunday', value: 'Sunday' },
                  ]}
                />
              ) : (
                <div className="space-y-1.5 text-left">
                  <span className="block text-xs font-medium text-zinc-400">Weekly Start Day</span>
                  <div className="h-9 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950/50 flex items-center text-xs font-mono text-zinc-200">
                    <Calendar className="w-3.5 h-3.5 text-purple-400 mr-2 shrink-0" />
                    {user?.weekStartDay || 'Monday'}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Info */}
            <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-zinc-300 block">Application Theme</span>
                <span className="text-[11px] text-zinc-400">
                  DevPulse runs on the high-contrast Dark developer theme optimized for code editors and session telemetry.
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-zinc-850 text-zinc-200 border border-zinc-700 font-mono text-[11px] shrink-0 self-start sm:self-auto">
                Dark (Default)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 3. AUTHENTICATION & SECURITY CARD                                         */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <CardTitle>Authentication &amp; Security</CardTitle>
            </div>
            <CardDescription>JWT token lifecycle, cookie encryption, and password security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span>Session Type</span>
                <span className="font-mono text-zinc-400">HttpOnly SameSite Cookie + Bearer JWT</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Token Expiration</span>
                <span className="font-mono text-zinc-400">24 hours (configurable)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Password Hashing</span>
                <span className="font-mono text-zinc-400">BCrypt (rounds: 10-12)</span>
              </div>
            </div>
            <Button variant="outline" size="sm" disabled>
              Change Password (Phase 2)
            </Button>
          </CardContent>
        </Card>

        {/* ========================================================================= */}
        {/* 4. READ-ONLY ACCOUNT INFORMATION CARD                                     */}
        {/* ========================================================================= */}
        <Card className="border-zinc-800/80 bg-zinc-900/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <CardTitle>Account Information &amp; Data Isolation</CardTitle>
            </div>
            <CardDescription>System-level configuration, database isolation, and security guarantees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* System Info Table */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 divide-y divide-zinc-850">
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Developer ID</span>
                <span className="font-mono text-zinc-300 select-all">{user?.id || '--'}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Registered Email</span>
                <span className="font-mono text-zinc-300">{user?.email || '--'}</span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Account Created Date</span>
                <span className="font-mono text-zinc-300">
                  {user?.createdAt ? formatDate(user.createdAt) : '--'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Account Status</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {user?.accountStatus || 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Authentication Method</span>
                <span className="font-mono text-zinc-300">
                  {user?.authMethod || 'JWT Bearer + HttpOnly Cookie'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Database Layer</span>
                <span className="font-mono text-zinc-300">
                  {user?.databaseInfo || 'MySQL 8.0 (Relational schema with Flyway migrations)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-zinc-400 font-medium">Data Isolation</span>
                <span className="font-mono text-zinc-300 text-right">
                  {user?.dataIsolation || 'Workspace data isolated by developer UUID'}
                </span>
              </div>
            </div>

            {/* Preserved Data Isolation Security Explanation */}
            <div className="p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40 text-zinc-400 leading-relaxed text-[11px]">
              <p>
                Your projects, tasks, daily notes, and work session telemetry are isolated by your unique developer ID.
                No cross-user access is permitted at the API or database layer. All data queries strictly bind to the
                authenticated user context derived from validated JWT tokens.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
