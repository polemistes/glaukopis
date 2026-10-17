import { beforeEach, describe, expect, it } from 'vitest';
import { toasts } from '$lib/ui/toast.svelte';
import { homeUndo, type HomeChange } from './undo.svelte';

/** A change that writes what is done to it into a log. */
function change(name: string, log: string[], fails = false): HomeChange {
  return {
    message: name,
    undo: async () => {
      if (fails) throw new Error('gone');
      log.push(`undo ${name}`);
    },
    redo: async () => {
      log.push(`redo ${name}`);
    },
  };
}

describe('the undo of the home', () => {
  beforeEach(() => {
    homeUndo.done = [];
    homeUndo.undone = [];
    for (const t of [...toasts.list]) toasts.dismiss(t.id);
  });

  it('undoes the last change first, and does it again', async () => {
    const log: string[] = [];
    homeUndo.remember(change('a', log));
    homeUndo.remember(change('b', log));
    await homeUndo.undo();
    await homeUndo.undo();
    await homeUndo.redo();
    expect(log).toEqual(['undo b', 'undo a', 'redo a']);
    expect(homeUndo.done.map((c) => c.message)).toEqual(['a']);
    expect(homeUndo.undone.map((c) => c.message)).toEqual(['b']);
  });

  it('forgets what was undone when something new is done', async () => {
    const log: string[] = [];
    homeUndo.remember(change('a', log));
    await homeUndo.undo();
    homeUndo.remember(change('c', log));
    await homeUndo.redo();
    expect(log).toEqual(['undo a']);
    expect(homeUndo.undone).toEqual([]);
  });

  it('offers the way back in its message', () => {
    homeUndo.remember(change('“Iliad” was moved to Greek', []));
    const shown = toasts.list[toasts.list.length - 1];
    expect(shown.message).toBe('“Iliad” was moved to Greek');
    expect(shown.action?.label).toBeTruthy();
  });

  it('says only the latest change, whose way back is the one its button takes', async () => {
    homeUndo.remember(change('a', []));
    homeUndo.remember(change('b', []));
    expect(toasts.list.map((t) => t.message)).toEqual(['b']);
    await homeUndo.undo();
    expect(toasts.list).toHaveLength(1);
  });

  it('remembers a quiet change without saying it, and says its undoing', async () => {
    const log: string[] = [];
    homeUndo.remember(change('placed', log), { quietly: true });
    expect(toasts.list).toHaveLength(0);
    await homeUndo.undo();
    expect(log).toEqual(['undo placed']);
    expect(toasts.list).toHaveLength(1);
  });

  it('does one change at a time, in the order asked', async () => {
    const log: string[] = [];
    homeUndo.remember(change('a', log));
    homeUndo.remember(change('b', log));
    await Promise.all([homeUndo.undo(), homeUndo.undo()]);
    expect(log).toEqual(['undo b', 'undo a']);
  });

  it('drops a change that cannot be undone, and says so', async () => {
    const log: string[] = [];
    homeUndo.remember(change('a', log, true));
    await homeUndo.undo();
    expect(homeUndo.done).toEqual([]);
    expect(homeUndo.undone).toEqual([]);
    expect(toasts.list.some((t) => t.kind === 'error')).toBe(true);
  });
});
