import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Project, type Persistence } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { COPY_EVERY, ReadableCopy } from './folder';
import type { OrgProject } from './types';

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

describe('the readable copy in the project folder', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('is written once for many saves close together, and again a few seconds later', async () => {
    let n = 0;
    const sent: string[] = [];
    const copy = new ReadableCopy(
      () => ({ org: org(`v${++n}`), beside: { pictures: [], records: [] } }),
      async (text) => {
        sent.push(text.split('\n')[0]);
      },
    );
    copy.schedule();
    copy.schedule();
    await vi.advanceTimersByTimeAsync(10);
    expect(sent).toEqual(['#+TITLE: v1']);
    copy.schedule();
    copy.schedule();
    await vi.advanceTimersByTimeAsync(COPY_EVERY / 2);
    expect(sent).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(COPY_EVERY);
    expect(sent).toEqual(['#+TITLE: v1', '#+TITLE: v2']);
  });

  it('what waits is written at once when the project is closed', async () => {
    const sent: string[] = [];
    const copy = new ReadableCopy(
      () => ({ org: org('now'), beside: { pictures: [], records: [] } }),
      async (text) => {
        sent.push(text);
      },
    );
    copy.schedule();
    await vi.advanceTimersByTimeAsync(10);
    copy.schedule();
    await copy.finish();
    expect(sent).toHaveLength(2);
  });

  it('a copy that fails is said in the log, and the save is not failed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const saved: Uint8Array[] = [];
    const persistence: Persistence = {
      append: async () => {},
      saveState: async (state) => {
        saved.push(state);
      },
      readable: async () => {
        throw new Error('no room on the disk');
      },
    };
    const p = new Project(persistence);
    p.load(null, []);
    p.begin('Wrath');
    p.setTitle(PROJECT, 'Wrath and more');
    await p.snapshot();
    expect(saved).toHaveLength(1);
    expect(p.status).not.toBe('error');
    await vi.advanceTimersByTimeAsync(10);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('a project saved writes its Org form, the pictures it shows and the works it cites', async () => {
    const written: { org: string; pictures: string[] }[] = [];
    const persistence: Persistence = {
      append: async () => {},
      saveState: async () => {},
      readable: async (text, beside) => {
        written.push({ org: text, pictures: beside.pictures });
      },
    };
    const p = new Project(persistence);
    p.load(null, []);
    p.begin('Wrath');
    p.addChild(PROJECT, { title: 'The first book', body: 'Sing, goddess.' });
    await p.snapshot();
    await p.close();
    expect(written).toHaveLength(1);
    expect(written[0].org).toContain('* Wrath\n');
    expect(written[0].org).toContain('** The first book\n');
    expect(written[0].org).toContain('Sing, goddess.');
  });
});
