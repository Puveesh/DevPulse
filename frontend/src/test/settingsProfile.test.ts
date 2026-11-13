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
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      if (file.size > MAX_SIZE) {
        return { valid: false, error: 'Image size exceeds 2MB limit' };
      }
      return { valid: true, error: null };
    };

    // Valid PNG (1MB)
    expect(validateAvatar({ size: 1024 * 1024, type: 'image/png' })).toEqual({
      valid: true,
      error: null,
    });

    // Valid JPG (500KB)
    expect(validateAvatar({ size: 500 * 1024, type: 'image/jpeg' })).toEqual({
      valid: true,
      error: null,
    });

    // Invalid oversized (3MB)
    expect(validateAvatar({ size: 3 * 1024 * 1024, type: 'image/png' })).toEqual({
      valid: false,
      error: 'Image size exceeds 2MB limit',
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
});
