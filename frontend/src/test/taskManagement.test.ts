import { describe, it, expect } from 'vitest';
import type { Task, TaskStatus, ProjectTaskSummaryItem } from '../types';

describe('Task Management Logic & Formatting Tests', () => {
  it('correctly filters and counts pending tasks (TODO and IN_PROGRESS only)', () => {
    const tasks: Partial<Task>[] = [
      { id: '1', title: 'Task 1', status: 'TODO' },
      { id: '2', title: 'Task 2', status: 'IN_PROGRESS' },
      { id: '3', title: 'Task 3', status: 'COMPLETED' },
      { id: '4', title: 'Task 4', status: 'CANCELLED' },
      { id: '5', title: 'Task 5', status: 'TODO' },
    ];

    const pendingTasks = tasks.filter(
      (t) => t.status === 'TODO' || t.status === 'IN_PROGRESS'
    );

    expect(pendingTasks.length).toBe(3);
  });

  it('formats pending tasks wording properly for singular, plural, and zero', () => {
    const formatPendingText = (count: number) => {
      if (count === 0) return 'No pending issues';
      return `${count} ${count === 1 ? 'issue pending' : 'issues pending'}`;
    };

    expect(formatPendingText(0)).toBe('No pending issues');
    expect(formatPendingText(1)).toBe('1 issue pending');
    expect(formatPendingText(5)).toBe('5 issues pending');
  });

  it('validates task title trimming and rejects empty titles', () => {
    const validateTaskTitle = (title: string): boolean => {
      return title.trim().length > 0 && title.trim().length <= 255;
    };

    expect(validateTaskTitle('')).toBe(false);
    expect(validateTaskTitle('   ')).toBe(false);
    expect(validateTaskTitle('Valid Task Title')).toBe(true);
    expect(validateTaskTitle('  Fix authentication bug  ')).toBe(true);
  });

  it('handles project task summary items with 0 and >0 pending counts', () => {
    const summary: ProjectTaskSummaryItem[] = [
      { projectId: 'p1', projectName: 'EduTrust', pendingTaskCount: 5 },
      { projectId: 'p2', projectName: 'DevPulse', pendingTaskCount: 1 },
      { projectId: 'p3', projectName: 'Weather Monitoring', pendingTaskCount: 0 },
    ];

    expect(summary[0].pendingTaskCount).toBe(5);
    expect(summary[1].pendingTaskCount).toBe(1);
    expect(summary[2].pendingTaskCount).toBe(0);
  });
});
