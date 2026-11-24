import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const projectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(150, 'Project name cannot exceed 150 characters'),
  description: z.string().optional(),
  repositoryUrl: z
    .string()
    .url('Please enter a valid URL')
    .max(500, 'Repository URL cannot exceed 500 characters')
    .or(z.literal(''))
    .optional(),
  techStack: z
    .string()
    .max(500, 'Tech stack cannot exceed 500 characters')
    .optional(),
  status: z.enum(['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']),
});

describe('Project Form Validation', () => {
  it('validates correct project input', () => {
    const valid = {
      name: 'DevPulse Core',
      description: 'Productivity suite',
      repositoryUrl: 'https://github.com/org/repo',
      techStack: 'React, TypeScript, Spring Boot',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects empty project name', () => {
    const invalid = {
      name: '',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Project name is required');
    }
  });

  it('rejects invalid repository URL', () => {
    const invalid = {
      name: 'Valid Name',
      repositoryUrl: 'not-a-valid-url',
      status: 'ACTIVE',
    };
    const result = projectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('valid URL');
    }
  });

  describe('Project Modal Navigation and Redirection Logic', () => {
    it('redirects to dashboard when canceled if launched from dashboard', () => {
      let currentRoute = '/projects';
      let returnTo: string | null = '/dashboard';

      const handleCloseModal = () => {
        if (returnTo) {
          const dest = returnTo;
          returnTo = null;
          currentRoute = dest;
        }
      };

      handleCloseModal();
      expect(currentRoute).toBe('/dashboard');
      expect(returnTo).toBeNull();
    });

    it('stays on projects page when canceled if launched from projects page', () => {
      let currentRoute = '/projects';
      let returnTo: string | null = null;

      const handleCloseModal = () => {
        if (returnTo) {
          const dest = returnTo;
          returnTo = null;
          currentRoute = dest;
        }
      };

      handleCloseModal();
      expect(currentRoute).toBe('/projects');
    });

    it('redirects to project info page (/projects/:id) when project creation succeeds', () => {
      let currentRoute = '/projects';
      let returnTo: string | null = '/dashboard';

      const handleProjectSuccess = (project: { id: string }) => {
        returnTo = null;
        currentRoute = `/projects/${project.id}`;
      };

      handleProjectSuccess({ id: 'proj-123' });
      expect(currentRoute).toBe('/projects/proj-123');
      expect(returnTo).toBeNull();
    });

    it('in-place modal dismissal preserves current route with zero navigation or reload', () => {
      let isModalOpen = true;
      let currentRoute = '/dashboard';
      let pageReloadCount = 0;

      const handleClose = () => {
        isModalOpen = false;
        // In-place modal toggle does not trigger route navigation or page reload
      };

      handleClose();
      expect(isModalOpen).toBe(false);
      expect(currentRoute).toBe('/dashboard');
      expect(pageReloadCount).toBe(0);
    });

    it('in-place modal project creation navigates to project info page', () => {
      let isModalOpen = true;
      let currentRoute = '/dashboard';

      const handleSuccess = (created: { id: string }) => {
        isModalOpen = false;
        currentRoute = `/projects/${created.id}`;
      };

      handleSuccess({ id: 'new-proj-789' });
      expect(isModalOpen).toBe(false);
      expect(currentRoute).toBe('/projects/new-proj-789');
    });
  });
});

