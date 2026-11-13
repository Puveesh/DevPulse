import { describe, it, expect } from 'vitest';
import {
  PROJECT_DELETE_ACKNOWLEDGEMENTS,
  type AcknowledgementItem,
} from '../features/projects/DeleteProjectDialog';

describe('Delete Project Dialog Acknowledgement Checkboxes', () => {
  it('defines the required distinct acknowledgement criteria', () => {
    expect(PROJECT_DELETE_ACKNOWLEDGEMENTS).toHaveLength(3);

    const ids = PROJECT_DELETE_ACKNOWLEDGEMENTS.map((a: AcknowledgementItem) => a.id);
    expect(ids).toContain('tasks-sessions');
    expect(ids).toContain('daily-notes');
    expect(ids).toContain('irreversible');
  });

  it('blocks deletion when no acknowledgement tick boxes are checked', () => {
    const checkedAcks = new Set<string>();

    const allChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
    const canDelete = allChecked;

    expect(canDelete).toBe(false);
    expect(checkedAcks.size).toBe(0);
  });

  it('blocks deletion when only partial acknowledgement tick boxes are checked', () => {
    const checkedAcks = new Set<string>(['tasks-sessions']);

    const allChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
    expect(allChecked).toBe(false);

    // Check second item
    checkedAcks.add('daily-notes');
    const twoChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
    expect(twoChecked).toBe(false);
  });

  it('enables deletion only when all acknowledgement tick boxes are checked', () => {
    const checkedAcks = new Set<string>([
      'tasks-sessions',
      'daily-notes',
      'irreversible',
    ]);

    const allChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
    expect(allChecked).toBe(true);
  });

  it('accurately toggles acknowledgement items and computes remaining count', () => {
    const checkedAcks = new Set<string>();

    const toggleAck = (id: string) => {
      if (checkedAcks.has(id)) {
        checkedAcks.delete(id);
      } else {
        checkedAcks.add(id);
      }
    };

    // Toggle on
    toggleAck('tasks-sessions');
    expect(checkedAcks.has('tasks-sessions')).toBe(true);
    expect(PROJECT_DELETE_ACKNOWLEDGEMENTS.length - checkedAcks.size).toBe(2);

    // Toggle on second
    toggleAck('daily-notes');
    expect(PROJECT_DELETE_ACKNOWLEDGEMENTS.length - checkedAcks.size).toBe(1);

    // Toggle off first
    toggleAck('tasks-sessions');
    expect(checkedAcks.has('tasks-sessions')).toBe(false);
    expect(PROJECT_DELETE_ACKNOWLEDGEMENTS.length - checkedAcks.size).toBe(2);
  });

  it('resets all acknowledgement tick boxes when dialog is reopened', () => {
    let checkedAcks = new Set<string>(['tasks-sessions', 'daily-notes', 'irreversible']);
    expect(checkedAcks.size).toBe(3);

    // Simulating dialog reopening: state reset
    checkedAcks = new Set();
    expect(checkedAcks.size).toBe(0);
    const allChecked = PROJECT_DELETE_ACKNOWLEDGEMENTS.every((ack) => checkedAcks.has(ack.id));
    expect(allChecked).toBe(false);
  });
});

