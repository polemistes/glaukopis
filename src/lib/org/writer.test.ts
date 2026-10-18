import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FakeWorker } from '$lib/util/fake-worker';
import type { Answerer } from '$lib/util/worker-client';
import { FINISH_WAIT, ReadableCopy, writeElsewhere } from './folder';
import type { OrgProject } from './types';
import { writeProject } from './write';

const org = (title: string): OrgProject => ({
  title,
  language: null,
  elements: [],
  elementKinds: [],
  paragraphKinds: [],
  templates: {},
  links: [],
  comments: [],
  references: [],
});

const made: FakeWorker<Answerer<OrgProject>>[] = [];
/** What the next worker made does when it is asked: write, or die. */
let mood: 'write' | 'die' = 'write';

class TestWorker {
  constructor() {
    const how = mood;
    const worker: FakeWorker<Answerer<OrgProject>> = new FakeWorker<Answerer<OrgProject>>({
      answer(o) {
        if (how === 'die') {
          queueMicrotask(() => worker.die('out of memory'));
          return new Promise(() => {});
        }
        return writeProject(o);
      },
    });
    made.push(worker);
    return worker;
  }
}

describe('the writer of the readable copy, in a thread of its own', () => {
  let error: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubGlobal('Worker', TestWorker);
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    error.mockRestore();
    warn.mockRestore();
  });

  it('that dies fails the copy it was writing, and the next is written by another', async () => {
    mood = 'die';
    await expect(writeElsewhere(org('Wrath'))).rejects.toThrow('out of memory');
    expect(made[0].terminated).toBe(true);
    mood = 'write';
    expect(await writeElsewhere(org('Wrath'))).toContain('#+TITLE: Wrath');
    expect(made).toHaveLength(2);
  });

  it('a project closed does not wait for ever on a copy that is not written', async () => {
    vi.useFakeTimers();
    const sent: string[] = [];
    const copy = new ReadableCopy(
      () => ({ org: org('now'), beside: { pictures: [], records: [] } }),
      (text) => {
        sent.push(text);
        return new Promise(() => {});
      },
    );
    copy.schedule();
    await vi.advanceTimersByTimeAsync(10);
    copy.schedule();
    let finished = false;
    void copy.finish().then(() => (finished = true));
    await vi.advanceTimersByTimeAsync(FINISH_WAIT - 10);
    expect(finished).toBe(false);
    await vi.advanceTimersByTimeAsync(20);
    expect(finished).toBe(true);
    expect(warn).toHaveBeenCalled();
    // What was due after it is not written once the project is gone.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(sent).toHaveLength(1);
  });
});
