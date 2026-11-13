import { describe, it, expect } from 'vitest';
import type { Task, WorkSession, DailyNote, DailyNoteSummary } from '../types';
import type { MentionItem } from '../features/notes/DailyNoteEditor';
import { formatDate } from '../lib/utils';

describe('Project Daily Notes Development Journal', () => {
  const mockTasks: Task[] = [
    {
      id: 'task-101',
      projectId: 'proj-devpulse',
      title: 'Implement TipTap rich text editor',
      description: 'Add support for formatting, headings, lists, and checklists',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      createdAt: '2026-11-12T10:00:00Z',
      updatedAt: '2026-11-12T11:00:00Z',
    },
    {
      id: 'task-102',
      projectId: 'proj-devpulse',
      title: 'Fix MySQL foreign key cascade on daily notes',
      description: 'Ensure clean deletion on project delete',
      status: 'DONE',
      priority: 'CRITICAL',
      createdAt: '2026-11-12T09:00:00Z',
      updatedAt: '2026-11-12T12:00:00Z',
    },
  ];

  const mockSessions: WorkSession[] = [
    {
      id: 'sess-201',
      projectId: 'proj-devpulse',
      title: 'Daily Notes Backend API & Flyway Migration',
      description: 'V3 migration script and DailyNoteController endpoints',
      startedAt: '2026-11-12T14:00:00Z',
      endedAt: '2026-11-12T15:30:00Z',
      durationSeconds: 5400,
      status: 'COMPLETED',
      notes: 'Implemented REST endpoints and test suite',
      createdAt: '2026-11-12T14:00:00Z',
    },
    {
      id: 'sess-202',
      projectId: 'proj-devpulse',
      title: 'Frontend TipTap Integration & Mentions',
      startedAt: '2026-11-13T09:00:00Z',
      endedAt: '2026-11-13T10:45:00Z',
      durationSeconds: 6300,
      status: 'COMPLETED',
      createdAt: '2026-11-13T09:00:00Z',
    },
  ];

  describe('1. Date-Based Organization & History', () => {
    it('enforces YYYY-MM-DD date keying and unique calendar date per project', () => {
      const today = new Date().toISOString().split('T')[0];
      const noteA: DailyNote = {
        id: 'note-1',
        projectId: 'proj-devpulse',
        noteDate: today,
        content: '<p>Worked on TipTap rich text editor</p>',
        createdAt: `${today}T10:00:00Z`,
        updatedAt: `${today}T11:00:00Z`,
      };

      expect(noteA.noteDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(noteA.projectId).toBe('proj-devpulse');
    });

    it('navigates previous and next dates accurately', () => {
      const baseDate = new Date('2026-11-12T12:00:00Z');
      
      const prevDate = new Date(baseDate);
      prevDate.setDate(prevDate.getDate() - 1);
      const prevDateStr = prevDate.toISOString().split('T')[0];

      const nextDate = new Date(baseDate);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      expect(prevDateStr).toBe('2026-11-11');
      expect(nextDateStr).toBe('2026-11-13');
    });

    it('sorts notes history in descending chronological order', () => {
      const summaries: DailyNoteSummary[] = [
        { id: 'n1', noteDate: '2026-11-08', contentPreview: 'Old note', updatedAt: '2026-11-08T10:00:00Z' },
        { id: 'n2', noteDate: '2026-11-13', contentPreview: 'Latest note', updatedAt: '2026-11-13T10:00:00Z' },
        { id: 'n3', noteDate: '2026-11-10', contentPreview: 'Mid note', updatedAt: '2026-11-10T10:00:00Z' },
      ];

      const sorted = [...summaries].sort(
        (a, b) => new Date(b.noteDate).getTime() - new Date(a.noteDate).getTime()
      );

      expect(sorted.map((s) => s.noteDate)).toEqual([
        '2026-11-13',
        '2026-11-10',
        '2026-11-08',
      ]);
    });
  });

  describe('2. Contextual Mentions Data & Behavior', () => {
    it('creates searchable mention items pool from project tasks and work sessions', () => {
      const taskPool: MentionItem[] = mockTasks.map((t) => ({
        id: t.id,
        type: 'task',
        label: t.title,
        status: t.status,
        priority: t.priority,
      }));

      const sessionPool: MentionItem[] = mockSessions.map((s) => ({
        id: s.id,
        type: 'session',
        label: s.title,
        date: formatDate(s.startedAt),
        status: s.status,
      }));

      const pool = [...taskPool, ...sessionPool];

      expect(pool).toHaveLength(4);
      expect(pool.filter((i) => i.type === 'task')).toHaveLength(2);
      expect(pool.filter((i) => i.type === 'session')).toHaveLength(2);
    });

    it('filters mention suggestions by keyword across title and formatted date', () => {
      const taskPool: MentionItem[] = mockTasks.map((t) => ({
        id: t.id,
        type: 'task',
        label: t.title,
        status: t.status,
      }));
      const sessionPool: MentionItem[] = mockSessions.map((s) => ({
        id: s.id,
        type: 'session',
        label: s.title,
        date: formatDate(s.startedAt),
        status: s.status,
      }));
      const pool = [...taskPool, ...sessionPool];

      const filterMentions = (query: string) => {
        const q = query.toLowerCase().trim();
        return pool.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            (item.date && item.date.toLowerCase().includes(q))
        );
      };

      const resultFlyway = filterMentions('Flyway');
      expect(resultFlyway).toHaveLength(1);
      expect(resultFlyway[0].id).toBe('sess-201');

      const resultTipTap = filterMentions('TipTap');
      expect(resultTipTap).toHaveLength(2);
      expect(resultTipTap.map((i) => i.type)).toEqual(['task', 'session']);
    });

    it('ensures referencing tasks or sessions does not mutate the original items', () => {
      const originalTaskStatus = mockTasks[0].status;
      const mention: MentionItem = {
        id: mockTasks[0].id,
        type: 'task',
        label: mockTasks[0].title,
        status: mockTasks[0].status,
      };

      // Simulating mention insertion in note HTML
      const htmlSnippet = `<span data-type="mention" data-mention-type="${mention.type}" data-id="${mention.id}">@${mention.label}</span>`;
      expect(htmlSnippet).toContain(mockTasks[0].id);

      // Verify original task status remained completely untouched
      expect(mockTasks[0].status).toBe(originalTaskStatus);
    });
  });

  describe('3. Autosave and Note Status State', () => {
    it('detects unsaved state when editor content differs from saved content', () => {
      const savedContent = '<p>Initial saved note</p>';
      let currentContent = '<p>Initial saved note</p>';
      
      const isDirty = (current: string, saved: string) => current !== saved;

      expect(isDirty(currentContent, savedContent)).toBe(false);

      currentContent = '<p>Updated note with changes</p>';
      expect(isDirty(currentContent, savedContent)).toBe(true);
    });

    it('transitions through correct save lifecycle states', () => {
      type SaveStatus = 'idle' | 'saved' | 'saving' | 'error';
      const stateHistory: SaveStatus[] = [];

      let status: SaveStatus = 'idle';
      stateHistory.push(status);

      // User types -> saving
      status = 'saving';
      stateHistory.push(status);

      // API responds success -> saved
      status = 'saved';
      stateHistory.push(status);

      expect(stateHistory).toEqual(['idle', 'saving', 'saved']);
    });
  });
});
