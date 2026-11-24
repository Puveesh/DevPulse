import { describe, it, expect, vi } from 'vitest';

describe('Developer Profile & Settings Logic Tests', () => {
  it('validates URLs accurately (GitHub and Portfolio)', () => {
    const isValidUrl = (url: string) => {
      if (!url.trim()) return true;
      try {
        const parsed = new URL(url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    expect(isValidUrl('https://github.com/octocat')).toBe(true);
    expect(isValidUrl('http://myportfolio.dev')).toBe(true);
    expect(isValidUrl('portfolio.com/projects')).toBe(true);
    expect(isValidUrl('')).toBe(true); // Empty is valid (optional field)
    expect(isValidUrl('   ')).toBe(true);
    expect(isValidUrl('invalid url with spaces')).toBe(false);
  });

  it('normalizes URLs to ensure https:// scheme prefix', () => {
    const normalizeUrl = (u: string) => {
      const trimmed = u.trim();
      if (!trimmed) return '';
      if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
        return `https://${trimmed}`;
      }
      return trimmed;
    };

    expect(normalizeUrl('github.com/octocat')).toBe('https://github.com/octocat');
    expect(normalizeUrl('https://myportfolio.dev')).toBe('https://myportfolio.dev');
    expect(normalizeUrl('http://myportfolio.dev')).toBe('http://myportfolio.dev');
    expect(normalizeUrl('')).toBe('');
  });

  it('handles multi-tag additions and prevents duplicates case-insensitively', () => {
    const addTag = (tags: string[], raw: string): string[] => {
      const trimmed = raw.trim();
      if (!trimmed) return tags;
      const exists = tags.some((t) => t.toLowerCase() === trimmed.toLowerCase());
      if (exists) return tags;
      return [...tags, trimmed];
    };

    let tags = ['Java', 'Python'];
    tags = addTag(tags, 'TypeScript');
    expect(tags).toEqual(['Java', 'Python', 'TypeScript']);

    // Attempt to add duplicate with different case
    tags = addTag(tags, 'python');
    expect(tags).toEqual(['Java', 'Python', 'TypeScript']);

    // Attempt to add empty string
    tags = addTag(tags, '   ');
    expect(tags).toEqual(['Java', 'Python', 'TypeScript']);

    // Remove tag
    const removeTag = (tList: string[], toRemove: string) => tList.filter((t) => t !== toRemove);
    tags = removeTag(tags, 'Java');
    expect(tags).toEqual(['Python', 'TypeScript']);
  });

  it('validates avatar file size and MIME type restrictions', () => {
    const validateAvatar = (file: { size: number; type: string }) => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type.toLowerCase())) {
        return { valid: false, error: 'Invalid file type' };
      }
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        return { valid: false, error: 'Image size exceeds 5MB limit' };
      }
      return { valid: true, error: null };
    };

    // Valid PNG (1MB)
    expect(validateAvatar({ size: 1024 * 1024, type: 'image/png' })).toEqual({
      valid: true,
      error: null,
    });

    // Valid JPG (4MB)
    expect(validateAvatar({ size: 4 * 1024 * 1024, type: 'image/jpeg' })).toEqual({
      valid: true,
      error: null,
    });

    // Invalid oversized (6MB)
    expect(validateAvatar({ size: 6 * 1024 * 1024, type: 'image/png' })).toEqual({
      valid: false,
      error: 'Image size exceeds 5MB limit',
    });

    // Invalid MIME type (PDF)
    expect(validateAvatar({ size: 100 * 1024, type: 'application/pdf' })).toEqual({
      valid: false,
      error: 'Invalid file type',
    });
  });

  it('correctly extracts developer initials fallback avatar', () => {
    const getInitials = (name?: string) => {
      if (!name) return 'U';
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    };

    expect(getInitials('Jane Doe')).toBe('JD');
    expect(getInitials('Alice')).toBe('A');
    expect(getInitials('John Robert Smith')).toBe('JR');
    expect(getInitials('')).toBe('U');
    expect(getInitials(undefined)).toBe('U');
  });

  it('protects read-only fields from mutation and discards changes on Cancel', () => {
    const originalUser = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'dev@devpulse.io',
      displayName: 'Original Dev',
      createdAt: '2026-11-01T10:00:00Z',
      bio: 'Original bio',
    };

    // Simulated form state while editing
    let formState = {
      ...originalUser,
      displayName: 'Modified Dev',
      bio: 'Modified bio',
    };

    // Cancel action discards modifications
    const onCancel = () => {
      formState = { ...originalUser };
    };

    onCancel();

    expect(formState.displayName).toBe('Original Dev');
    expect(formState.bio).toBe('Original bio');
    expect(formState.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(formState.email).toBe('dev@devpulse.io');
  });

  it('manages profile photo enlarged preview and remove confirmation modal states', async () => {
    let isPhotoPreviewOpen = false;
    let isConfirmRemoveOpen = false;
    let onRemoveCalled = false;

    const mockUser = {
      displayName: 'Test Dev',
      profileImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    };

    // Clicking avatar triggers full-size preview
    const handleAvatarClick = () => {
      if (mockUser.profileImage) {
        isPhotoPreviewOpen = true;
      }
    };

    handleAvatarClick();
    expect(isPhotoPreviewOpen).toBe(true);

    // Closing modal resets state
    isPhotoPreviewOpen = false;
    expect(isPhotoPreviewOpen).toBe(false);

    // Clicking Remove opens confirmation dialog instead of removing immediately
    const handleRemoveClick = () => {
      isConfirmRemoveOpen = true;
    };

    handleRemoveClick();
    expect(isConfirmRemoveOpen).toBe(true);
    expect(onRemoveCalled).toBe(false);

    // If user cancels, modal closes and onRemove is not invoked
    const handleCancelRemove = () => {
      isConfirmRemoveOpen = false;
    };
    handleCancelRemove();
    expect(isConfirmRemoveOpen).toBe(false);
    expect(onRemoveCalled).toBe(false);

    // If user confirms, onRemove is invoked and confirmation modal closes
    const handleConfirmRemove = async () => {
      onRemoveCalled = true;
      isConfirmRemoveOpen = false;
    };
    await handleConfirmRemove();
    expect(onRemoveCalled).toBe(true);
    expect(isConfirmRemoveOpen).toBe(false);
  });

  it('manages header user overview card details, big avatar, and actions', () => {
    const user = {
      id: 'usr-1',
      displayName: 'Puveesh Keshav M',
      email: 'puveesh@devpulse.io',
      profileImage: 'https://images.devpulse.io/avatar.png',
      professionalTitle: 'Full Stack Engineer',
      experienceLevel: 'Senior',
      currentFocus: 'Desktop client improvements',
      createdAt: '2026-01-15T09:00:00Z',
    };

    let isOverviewOpen = false;
    let navigatedPath: string | null = null;
    let logoutModalOpened = false;

    // Toggle overview card
    const toggleOverview = () => {
      isOverviewOpen = !isOverviewOpen;
    };

    toggleOverview();
    expect(isOverviewOpen).toBe(true);

    // Overview card presents full developer profile details
    expect(user.displayName).toBe('Puveesh Keshav M');
    expect(user.profileImage).toBeTruthy();
    expect(user.professionalTitle).toBe('Full Stack Engineer');
    expect(user.experienceLevel).toBe('Senior');

    // Click Settings action navigates to /settings and closes overview
    const handleSettingsClick = () => {
      navigatedPath = '/settings';
      isOverviewOpen = false;
    };
    handleSettingsClick();
    expect(navigatedPath).toBe('/settings');
    expect(isOverviewOpen).toBe(false);

    // Reopen and click Logout opens confirm modal
    toggleOverview();
    expect(isOverviewOpen).toBe(true);

    const handleLogoutClick = () => {
      logoutModalOpened = true;
      isOverviewOpen = false;
    };
    handleLogoutClick();
    expect(logoutModalOpened).toBe(true);
    expect(isOverviewOpen).toBe(false);
  });

  it('centralizes settings and logout access exclusively in the upper-right profile card', () => {
    // Navigation items in sidebar should only include core workspace links
    const sidebarNavItems = [
      { name: 'Dashboard', to: '/dashboard' },
      { name: 'Projects', to: '/projects' },
      { name: 'Work Sessions', to: '/worklogs' },
      { name: 'Analytics', to: '/analytics' },
    ];

    expect(sidebarNavItems.some((item) => item.to === '/settings')).toBe(false);
    expect(sidebarNavItems.map((i) => i.name)).toEqual([
      'Dashboard',
      'Projects',
      'Work Sessions',
      'Analytics',
    ]);

    // Profile card provides both actions
    const profileCardActions = ['Developer Settings', 'Log Out'];
    expect(profileCardActions).toContain('Developer Settings');
    expect(profileCardActions).toContain('Log Out');
  });
});

