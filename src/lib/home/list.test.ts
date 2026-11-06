import { describe, expect, it, vi } from 'vitest';

const { settings } = vi.hoisted(() => ({
  settings: {
    value: { projectsList: false, projectsPaneWidth: 300 } as Record<string, unknown>,
    set: vi.fn((key: string, value: unknown) => Object.assign(settings.value, { [key]: value })),
  },
}));

vi.mock('$lib/state/settings.svelte', () => ({ settings }));
const { windowNew } = vi.hoisted(() => ({ windowNew: vi.fn(async () => {}) }));
vi.mock('$lib/api/system', () => ({ windowNew }));

import {
  listPane,
  listUi,
  newWindow,
  PANE_MAX,
  PANE_MIN,
  PANE_WIDTH,
  paneWidth,
  toggleProjectsPane,
  toList,
} from './list.svelte';

describe('the pane of projects', () => {
  it('is dragged wider and narrower within its limits', () => {
    expect(paneWidth(240, 30)).toBe(270);
    expect(paneWidth(240, -500)).toBe(PANE_MIN);
    expect(paneWidth(400, 500)).toBe(PANE_MAX);
    // A width that was never kept, or kept wrong, is the given one.
    expect(paneWidth(Number.NaN, 0)).toBe(PANE_WIDTH);
    expect(paneWidth(0, 10)).toBe(PANE_WIDTH + 10);
  });

  it('is opened and closed in its own window, and kept in the settings as the window closes', () => {
    listPane.begin();
    expect(listPane.now).toEqual({ shown: false, width: 300 });
    settings.set.mockClear();
    toggleProjectsPane();
    expect(listPane.shown).toBe(true);
    listPane.width = 320;
    // Not written while the window is open: another window has its own.
    expect(settings.set).not.toHaveBeenCalled();
    listPane.keep();
    expect(settings.value.projectsList).toBe(true);
    expect(settings.value.projectsPaneWidth).toBe(320);
  });

  it('begins in a new window as the window it came from has it', async () => {
    await newWindow('/project/p1');
    expect(windowNew).toHaveBeenLastCalledWith('/project/p1', { shown: true, width: 320 });
    (window as { __glaukopisWindow?: unknown }).__glaukopisWindow = {
      open: null,
      list: { shown: false, width: 200 },
    };
    listPane.begin();
    expect(listPane.now).toEqual({ shown: false, width: 200 });
    delete (window as { __glaukopisWindow?: unknown }).__glaukopisWindow;
  });
});

describe('up from the top of a project', () => {
  it('shows the list where it was hidden, and asks for the row of the project', () => {
    listPane.shown = false;
    toList('p1');
    expect(listPane.shown).toBe(true);
    expect(listUi.focusRow).toBe('p:p1');
  });
});

describe('the folders that are closed', () => {
  it('are closed and opened, and opened to show what is in them', () => {
    listUi.toggle('a');
    listUi.toggle('b');
    expect([...listUi.collapsed].sort()).toEqual(['a', 'b']);
    listUi.toggle('a');
    expect([...listUi.collapsed]).toEqual(['b']);
    const before = listUi.collapsed;
    // Nothing closed is asked for: nothing changes.
    listUi.reveal(['a', null]);
    expect(listUi.collapsed).toBe(before);
    listUi.reveal(['c', 'b']);
    expect(listUi.collapsed.size).toBe(0);
  });
});
