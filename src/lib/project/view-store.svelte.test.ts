import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { router } from '$lib/state/router.svelte';
import type { Camera } from './diagram/camera';
import { GIVEN, type Layout, type Pane, type Sizes, type StoredView } from './layout';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';
import { Folding } from './text/folding.svelte';

// The tests run with the server's Svelte, in which nothing is followed;
// the saving that follows the view is tested here, so the browser's.
vi.mock(
  'svelte',
  // @ts-expect-error: the browser's Svelte, as a file, has no types of its own.
  () => import('../../../node_modules/svelte/src/index-client.js'),
);
vi.mock(
  'svelte/reactivity',
  // @ts-expect-error: the same.
  () => import('../../../node_modules/svelte/src/reactivity/index-client.js'),
);
const { flushSync } = await import('svelte');
const { SAVE_AFTER, ViewStore } = await import('./view-store.svelte');

/** A project with two elements under its own. */
function made() {
  const p = new Project(null);
  p.begin('Wrath');
  const a = p.addChild(PROJECT, { title: 'The word' })!;
  const b = p.addChild(PROJECT, { title: 'The shield' })!;
  return { p, a, b };
}

/**
 * The parts of a view as the view holds them, in state of their own, with
 * a store over them, and what the store saved.
 */
function view(project: Project | null, saving?: (view: StoredView) => Promise<void>) {
  const state = $state({
    panes: [] as Pane[],
    cameras: {} as Record<string, Camera>,
    side: null as Layout['side'],
    lastSide: 'references' as Layout['lastSide'],
    outline: false,
    preview: false,
    sizes: { ...GIVEN } as Sizes,
    project,
  });
  const folding = new Folding();
  const saved: { id: string; view: StoredView }[] = [];
  const store = new ViewStore(
    'wrath',
    {
      layout: () => ({
        panes: state.panes,
        cameras: state.cameras,
        side: state.side,
        lastSide: state.lastSide,
        outline: state.outline,
        preview: state.preview,
        sizes: state.sizes,
      }),
      apply: (laid) => {
        state.panes = laid.panes;
        state.cameras = laid.cameras;
        state.side = laid.side;
        state.lastSide = laid.lastSide;
        state.outline = laid.outline;
        state.preview = laid.preview;
        state.sizes = laid.sizes;
      },
      project: () => state.project,
      folding: () => folding,
    },
    async (id, kept) => {
      saved.push({ id, view: kept });
      await saving?.(kept);
    },
  );
  return { state, folding, store, saved };
}

afterEach(() => {
  router.route = { view: 'projects' };
});

describe('the view of a project as it is kept', () => {
  it('is laid out as it was left', () => {
    const { p, a, b } = made();
    const v = view(p);
    v.store.read({
      panes: [
        { at: a, mode: 'text' },
        { at: b, mode: 'diagram' },
      ],
      cameras: { [b]: { cx: 1, cy: 2, k: 3 } },
      side: 'pictures',
      lastSide: 'pictures',
      outline: true,
      preview: true,
      sizes: { split: 0.3 },
      folded: [a],
    });
    expect(v.store.folded).toEqual([a]);
    v.store.arrange(p);
    expect(v.state.panes).toEqual([
      { at: a, mode: 'text' },
      { at: b, mode: 'diagram' },
    ]);
    expect(v.state.cameras).toEqual({ [b]: { cx: 1, cy: 2, k: 3 } });
    expect(v.state.side).toBe('pictures');
    expect(v.state.outline).toBe(true);
    expect(v.state.preview).toBe(true);
    expect(v.state.sizes).toEqual({ ...GIVEN, split: 0.3 });
  });

  it('is laid out as the project is first met where nothing was kept, or something unreadable', () => {
    const { p } = made();
    for (const kept of [undefined, null, {}, { folded: 'not a list' }]) {
      const v = view(p);
      v.store.read(kept);
      expect(v.store.folded).toEqual([]);
      v.store.arrange(p);
      expect(v.state.panes).toEqual([{ at: PROJECT, mode: 'diagram' }]);
      expect(v.state.side).toBeNull();
    }
  });

  it('shows first, and alone, the element the place in the application names', () => {
    const { p, a, b } = made();
    const v = view(p);
    v.store.read({
      panes: [
        { at: a, mode: 'diagram' },
        { at: b, mode: 'diagram' },
      ],
    });
    router.route = { view: 'project', project: 'wrath', at: b, mode: 'text' };
    v.store.arrange(p);
    expect(v.state.panes).toEqual([{ at: b, mode: 'text' }]);
    // A place elsewhere in the application names nothing in the project.
    router.route = { view: 'library' };
    v.store.arrange(p);
    expect(v.state.panes.map((pane) => pane.at)).toEqual([a, b]);
  });

  it('keeps the cameras and the folds of elements that are there, and not the review of changes', () => {
    const { p, a, b } = made();
    const v = view(p);
    v.state.panes = [{ at: a, mode: 'diagram' }];
    v.state.cameras = { [a]: { cx: 1, cy: 1, k: 1 }, gone: { cx: 9, cy: 9, k: 9 } };
    v.state.side = 'changes';
    v.state.lastSide = 'changes';
    v.folding.folded.add(b);
    v.folding.folded.add('gone');
    v.folding.folded.add(a);
    const kept = v.store.toStore();
    expect(kept.panes).toEqual([{ at: a, mode: 'diagram' }]);
    expect(kept.cameras).toEqual({ [a]: { cx: 1, cy: 1, k: 1 } });
    expect(kept.side).toBeNull();
    expect(kept.lastSide).toBe('changes');
    expect(kept.folded).toEqual([a, b].sort());
    // What is kept is a copy, not the state of the view.
    v.state.panes[0].at = b;
    expect(kept.panes).toEqual([{ at: a, mode: 'diagram' }]);
  });

  it('reads back as it was written', () => {
    const { p, a, b } = made();
    const v = view(p);
    v.state.panes = [
      { at: b, mode: 'text' },
      { at: PROJECT, mode: 'diagram', project: 'odyssey' },
    ];
    v.state.cameras = { [b]: { cx: 4, cy: 5, k: 0.5 } };
    v.state.side = 'found';
    v.state.lastSide = 'found';
    v.state.outline = true;
    v.state.sizes = { split: 0.4, preview: 500, references: 300 };
    v.folding.folded.add(a);
    const kept = JSON.parse(JSON.stringify(v.store.toStore()));

    const again = view(p);
    again.store.read(kept);
    again.store.arrange(p);
    expect(again.state.panes).toEqual(v.state.panes);
    expect(again.state.cameras).toEqual(v.state.cameras);
    expect(again.state.side).toBe('found');
    expect(again.state.outline).toBe(true);
    expect(again.state.sizes).toEqual({ split: 0.4, preview: 500, references: 300 });
    expect(again.store.folded).toEqual([a]);
  });
});

describe('the saving of the view', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is done under the project, and not before there is a project', async () => {
    const { p, a } = made();
    const none = view(null);
    await none.store.save();
    expect(none.saved).toEqual([]);

    const v = view(p);
    v.state.panes = [{ at: a, mode: 'text' }];
    await v.store.save();
    expect(v.saved.map((s) => s.id)).toEqual(['wrath']);
    expect(v.saved[0].view.panes).toEqual([{ at: a, mode: 'text' }]);
  });

  it('that fails is said in the log, and does not throw', async () => {
    const { p } = made();
    const said = vi.spyOn(console, 'error').mockImplementation(() => {});
    const v = view(p, async () => {
      throw new Error('disk full');
    });
    await expect(v.store.save()).resolves.toBeUndefined();
    expect(said).toHaveBeenCalledWith(new Error('disk full'));
    said.mockRestore();
  });

  it('follows each part of the view a moment after it changes, a camera by its entry too', async () => {
    const { p, a, b } = made();
    const v = view(p);
    v.store.read({ panes: [{ at: a, mode: 'diagram' }] });
    v.store.arrange(p);
    const stop = $effect.root(() => v.store.follow());
    flushSync();
    await vi.advanceTimersByTimeAsync(SAVE_AFTER);
    expect(v.saved.length).toBe(1);

    const changes: (() => void)[] = [
      () => (v.state.panes[0] = { at: b, mode: 'diagram' }),
      () => (v.state.panes[0] = { at: b, mode: 'text' }),
      () => (v.state.side = 'history'),
      () => (v.state.lastSide = 'history'),
      () => (v.state.outline = true),
      () => (v.state.preview = true),
      // An entry of the cameras written, as the diagram writes it.
      () => (v.state.cameras[b] = { cx: 1, cy: 2, k: 2 }),
      () => (v.state.cameras[b] = { cx: 1, cy: 2, k: 3 }),
      () => (v.state.sizes.split = 0.6),
      () => (v.state.sizes.preview = 400),
      () => (v.state.sizes.references = 300),
      () => v.folding.folded.add(a),
    ];
    for (const [i, change] of changes.entries()) {
      change();
      flushSync();
      // Not at once: a moment after.
      await vi.advanceTimersByTimeAsync(SAVE_AFTER - 1);
      expect(v.saved.length, `change ${i}`).toBe(1 + i);
      await vi.advanceTimersByTimeAsync(1);
      expect(v.saved.length, `change ${i}`).toBe(2 + i);
    }
    expect(v.saved.at(-1)!.view.cameras).toEqual({ [b]: { cx: 1, cy: 2, k: 3 } });
    stop();
  });

  it('is put off while the view goes on changing, and done once', async () => {
    const { p, a, b } = made();
    const v = view(p);
    v.state.panes = [{ at: a, mode: 'diagram' }];
    const stop = $effect.root(() => v.store.follow());
    flushSync();
    for (const k of [1, 2, 3, 4]) {
      v.state.cameras[b] = { cx: 0, cy: 0, k };
      flushSync();
      await vi.advanceTimersByTimeAsync(SAVE_AFTER / 2);
    }
    expect(v.saved.length).toBe(0);
    await vi.advanceTimersByTimeAsync(SAVE_AFTER);
    expect(v.saved.length).toBe(1);
    // A save asked for meanwhile, as when the window loses the focus, takes the place of the one waiting.
    v.state.outline = true;
    flushSync();
    await v.store.save();
    await vi.advanceTimersByTimeAsync(SAVE_AFTER * 2);
    expect(v.saved.length).toBe(2);
    stop();
  });

  it('is not followed while there is no project', async () => {
    const v = view(null);
    const stop = $effect.root(() => v.store.follow());
    flushSync();
    v.state.outline = true;
    flushSync();
    await vi.advanceTimersByTimeAsync(SAVE_AFTER * 2);
    expect(v.saved).toEqual([]);
    stop();
  });
});
