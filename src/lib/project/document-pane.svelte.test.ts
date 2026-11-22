import { afterEach, describe, expect, it, vi } from 'vitest';

// The pane follows what is asked of it through effects, so with the
// browser's Svelte: the tests otherwise run with the server's, in which
// nothing is followed.
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
const { DocumentPane } = await import('./document-pane.svelte');
const { arrivals, arrive } = await import('./pane-adding.svelte');
const { panes } = await import('./panes.svelte');
const { reviewAsk } = await import('$lib/review/asked.svelte');

/** A pane of a window with no side shown, or one of the project given, following. */
function following(id = '') {
  const pane = new DocumentPane({
    key: undefined,
    id,
    project: () => null,
    ownPane: () => undefined,
    holding: (element) => element,
    show: () => {},
    toText: () => {},
  });
  const stop = $effect.root(() => pane.follow());
  return { pane, stop };
}

afterEach(() => {
  arrivals.waiting = null;
  reviewAsk.asked = null;
  panes.document = false;
  panes.tab = 'references';
});

describe('the document pane', () => {
  it('shows the tab of the images where something came to them while it showed the references, and the other way', () => {
    const { stop } = following();
    panes.showTab('references');
    arrive('images', ['abc']);
    flushSync();
    expect(panes.document).toBe(true);
    expect(panes.tab).toBe('images');
    arrivals.waiting = null;
    arrive('references', ['lord']);
    flushSync();
    expect(panes.tab).toBe('references');
    stop();
  });

  it('opens where it was closed, at the tab where what came stands', () => {
    const { stop } = following();
    panes.document = false;
    arrive('images', ['abc']);
    flushSync();
    expect(panes.document).toBe(true);
    expect(panes.tab).toBe('images');
    stop();
  });

  it('stays at the tab it shows where what came stands there, and does not close it', () => {
    const { stop } = following();
    panes.showTab('references');
    arrive('references', ['lord']);
    flushSync();
    expect(panes.document).toBe(true);
    expect(panes.tab).toBe('references');
    stop();
  });

  it('leaves the tab where it is while nothing waits', () => {
    const { stop } = following();
    panes.showTab('comments');
    flushSync();
    expect(panes.tab).toBe('comments');
    stop();
  });

  it('opens the tab of changes for a review asked for from elsewhere, once the project asked for is the active one', () => {
    const asked = {
      project: 'p1',
      choice: {
        moment: { snapshot: new Uint8Array(), time: 0 },
        kind: 'named' as const,
        name: 'then',
      },
      own: true,
    };
    const other = following('p2');
    reviewAsk.ask(asked);
    flushSync();
    expect(panes.document).toBe(false);
    other.stop();
    const { stop } = following('p1');
    flushSync();
    expect(panes.document).toBe(true);
    expect(panes.tab).toBe('changes');
    // Until the review is there to be given the moment, what was asked waits.
    expect(reviewAsk.asked).toBe(asked);
    stop();
  });
});
