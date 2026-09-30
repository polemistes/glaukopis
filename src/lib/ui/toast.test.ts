import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toasts } from './toast.svelte';

describe('messages at the foot of the window', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const t of [...toasts.list]) toasts.dismiss(t.id);
  });
  afterEach(() => vi.useRealTimers());

  it('that come together are told as one', () => {
    const a = toasts.show({ kind: 'ok', message: '3 references added' });
    vi.advanceTimersByTime(100);
    const b = toasts.show({ kind: 'info', message: 'It is in your library already' });
    vi.advanceTimersByTime(100);
    toasts.show({ kind: 'info', message: 'The reference is cited', detail: 'in “Networks”' });
    expect(b).toBe(a);
    expect(toasts.list).toHaveLength(1);
    expect(toasts.list[0].more).toEqual([
      'It is in your library already',
      'The reference is cited: in “Networks”',
    ]);
    // And stay as long as the last of them would have.
    vi.advanceTimersByTime(4450);
    expect(toasts.list).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(toasts.list).toHaveLength(0);
  });

  it('that come apart, or ask for something, or tell of a failure, are told apart', () => {
    toasts.show({ kind: 'info', message: 'One' });
    vi.advanceTimersByTime(600);
    toasts.show({ kind: 'info', message: 'Two' });
    toasts.show({ kind: 'info', message: 'Deleted', action: { label: 'Undo', run: () => {} } });
    toasts.show({ kind: 'error', message: 'Failed' });
    expect(toasts.list.map((t) => t.message)).toEqual(['One', 'Two', 'Deleted', 'Failed']);
  });

  it('are four at the most, the oldest going first', () => {
    for (const message of ['1', '2', '3', '4', '5']) {
      toasts.show({ kind: 'error', message });
    }
    expect(toasts.list.map((t) => t.message)).toEqual(['2', '3', '4', '5']);
  });

  it('one that stays, stays when others join it', () => {
    toasts.show({ kind: 'info', message: 'Stays' }, 0);
    toasts.show({ kind: 'info', message: 'Joins' });
    vi.advanceTimersByTime(60_000);
    expect(toasts.list).toHaveLength(1);
  });
});
