import { describe, expect, it, vi } from 'vitest';

const { settings } = vi.hoisted(() => ({
  settings: {
    value: { projectsPane: false },
    set: vi.fn((key: string, value: unknown) => Object.assign(settings.value, { [key]: value })),
  },
}));

vi.mock('$lib/state/settings.svelte', () => ({ settings }));

import {
  listUi,
  PANE_MAX,
  PANE_MIN,
  PANE_WIDTH,
  paneWidth,
  toggleProjectsPane,
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

  it('is opened and closed, and the settings remember it', () => {
    toggleProjectsPane();
    expect(settings.set).toHaveBeenLastCalledWith('projectsPane', true);
    toggleProjectsPane();
    expect(settings.set).toHaveBeenLastCalledWith('projectsPane', false);
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
