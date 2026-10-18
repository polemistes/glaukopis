import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { p, project, t } from '$lib/found/testing';
import { FakeWorker } from '$lib/util/fake-worker';
import type { Answerer } from '$lib/util/worker-client';
import { reader, type Asked } from './reader';

const states = new Map<string, Uint8Array>();
for (const [id, text] of [
  ['a', 'Sing the wrath of Achilles.'],
  ['b', 'No anger here, but wrath.'],
] as const)
  states.set(id, Y.encodeStateAsUpdate(project([p(t(text))]).pr.doc));

vi.mock('$lib/api/projects', () => ({
  projectLoad: async (id: string) => ({ state: states.get(id) ?? null, updates: [] }),
}));

const info = (id: string) => ({ id, name: id.toUpperCase(), modified: '1' });

vi.mock('$lib/state/projects.svelte', () => ({
  projects: {
    list: [info('a'), info('b')],
    loaded: true,
    lastOpened: 'a',
    load: async () => {},
    closed: async () => {},
  },
}));

vi.mock('$lib/state/router.svelte', () => ({ router: { go: () => {} } }));

const { everything, labelWordsOf } = await import('./everything.svelte');
const { projects } = await import('$lib/state/projects.svelte');

/** The workers made, each a reader; the first may be made to die when it is asked to read. */
const made: FakeWorker<Answerer<Asked>>[] = [];
let dieOnRead = false;

class TestWorker {
  constructor() {
    const answerer = reader();
    const worker: FakeWorker<Answerer<Asked>> = new FakeWorker<Answerer<Asked>>({
      answer(asked) {
        if (asked.kind === 'read' && dieOnRead) {
          dieOnRead = false;
          queueMicrotask(() => worker.die('out of memory'));
          return new Promise(() => {});
        }
        return answerer.answer(asked);
      },
    });
    made.push(worker);
    return worker;
  }
}

describe('the search through everything, with a worker that fails', () => {
  let error: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubGlobal('Worker', TestWorker);
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    error.mockRestore();
  });

  it('names the project it could not read, ends, and reads it again in a worker begun anew', async () => {
    everything.scope = 'all';
    everything.words = 'wrath';
    dieOnRead = true;
    await everything.search();
    // Not a spinner for ever: the round ends, with the project named.
    expect(everything.done).toBe(true);
    expect(everything.reading).toBeNull();
    expect(everything.unread).toEqual(['A']);
    expect(everything.found.map((f) => f.project)).toEqual(['b']);
    expect(made).toHaveLength(2);
    expect(made[0].terminated).toBe(true);

    // The next round reads both again, in the new worker, which has read nothing.
    await everything.search();
    expect(everything.unread).toEqual([]);
    expect(everything.found.map((f) => f.project)).toEqual(['a', 'b']);
    expect(made).toHaveLength(2);
  });

  it('forgets the projects that are gone, and the others when only the last is searched', async () => {
    everything.scope = 'all';
    everything.words = 'wrath';
    await everything.search();
    const worker = made.at(-1)!;
    const forgotten = () =>
      worker.posted
        .map((m) => (m as { question?: Asked }).question)
        .filter((q) => q?.kind === 'forget')
        .map((q) => q!.id);
    everything.scope = 'last';
    await everything.search();
    expect(forgotten()).toEqual(['b']);
    everything.scope = 'all';
    await everything.search();
    const list = projects.list;
    projects.list = [info('b') as (typeof list)[number]];
    await everything.search();
    expect(forgotten()).toEqual(['b', 'a']);
    projects.list = list;
  });
});

describe('the words a document shows, for the worker', () => {
  it('are those of its language, as the text in view has them', async () => {
    const said = await labelWordsOf({ language: 'nb' });
    expect(said.pointer.label).toBe('Figur');
    expect(said.citation.locators.chapter).toBe('kap.');
    expect(said.pointer.before).toBe('(');
    const english = await labelWordsOf({});
    expect(english.pointer.label).toBe('Figure');
    expect(english.citation.noDate).toBe('n.d.');
  });
});
