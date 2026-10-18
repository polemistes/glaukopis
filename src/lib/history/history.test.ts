import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { FakeWorker } from '$lib/util/fake-worker';
import { Engine } from './engine';
import { ProjectHistory } from './history.svelte';
import { Host } from './protocol';
import { writeRecords } from './records';

vi.mock('$lib/api/history', () => ({
  historyMerge: vi.fn(async () => {}),
  historyRead: vi.fn(async () => new Uint8Array()),
  historyCut: vi.fn(async () => {}),
  historyRoom: vi.fn(async () => 0),
}));

describe('a history whose reading fails', () => {
  it('leaves nothing behind: the project is no longer followed, and a later question reads it again', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const project = new Project(null);
    project.begin('Wrath');
    const unfollowed = vi.fn();
    const follow = project.follow.bind(project);
    vi.spyOn(project, 'follow').mockImplementation((follower) => {
      const unfollow = follow(follower);
      return () => {
        unfollowed();
        unfollow();
      };
    });
    const read = vi.fn(() => Promise.reject(new Error('not a history')));
    const history = new ProjectHistory(project, 'p', { read });

    await expect(history.start()).rejects.toThrow('not a history');
    expect(project.follow).toHaveBeenCalledOnce();
    expect(unfollowed).toHaveBeenCalledOnce();
    expect(history.ready).toBe(false);

    // Asked again, it tries again, and fails again with the reason.
    const asked = read.mock.calls.length;
    await expect(history.people()).rejects.toThrow('not a history');
    expect(read.mock.calls.length).toBeGreaterThan(asked);
    expect(unfollowed).toHaveBeenCalledTimes(2);
    error.mockRestore();
  });

  it('of an archive leaves nothing behind either', async () => {
    const project = new Project(null);
    const read = vi.fn(() => Promise.reject(new Error('not an archive')));
    const history = new ProjectHistory(project, 'p', { archive: 'old', read });
    await expect(history.start()).rejects.toThrow('not an archive');
    // Begun anew, not the failure kept.
    await expect(history.start()).rejects.toThrow('not an archive');
    expect(read).toHaveBeenCalledTimes(2);
    expect(history.ready).toBe(false);
  });
});

/** A project, and its history read from an empty store. */
function opened() {
  const project = new Project(null);
  project.begin('Wrath');
  const read = vi.fn(async () => writeRecords([]));
  return { project, read, history: new ProjectHistory(project, 'p', { read }) };
}

describe('a history whose engine fails', () => {
  let error: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    error = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fails what was asked with the reason, instead of leaving it waiting, and reads anew when asked again', async () => {
    const load = vi.spyOn(Engine.prototype, 'load').mockImplementationOnce(() => {
      throw new Error('a record that cannot be applied');
    });
    const { history, read } = opened();
    await expect(history.people()).rejects.toThrow('a record that cannot be applied');
    expect(history.ready).toBe(false);
    expect(error).toHaveBeenCalled();
    // Asked again, the history is read anew, and answers.
    const reads = read.mock.calls.length;
    expect(await history.people()).toEqual([]);
    expect(read.mock.calls.length).toBeGreaterThan(reads);
    expect(load).toHaveBeenCalledTimes(2);
    history.stop();
  });

  describe('in a worker', () => {
    const made: FakeWorker<Host>[] = [];
    beforeEach(() => {
      made.length = 0;
      vi.stubGlobal(
        'Worker',
        class {
          constructor() {
            const worker = new FakeWorker(new Host(() => new Engine()));
            made.push(worker);
            return worker;
          }
        },
      );
    });

    it('that dies fails what waits on it, stops following the project, and a new one answers after', async () => {
      const { project, history } = opened();
      expect(await history.people()).toEqual([]);
      const worker = made[0];
      worker.hold();
      const waiting = history.people();
      await vi.waitFor(() => expect(worker.held.length).toBeGreaterThan(0));
      worker.die('out of memory');
      await expect(waiting).rejects.toThrow('the history failed: out of memory');
      expect(worker.terminated).toBe(true);
      expect(history.ready).toBe(false);
      // What is changed in the project is no longer told to an engine that is gone.
      const posted = made[0].posted.length;
      project.setTitle(PROJECT, 'Wrath and more');
      await Promise.resolve();
      expect(made[0].posted.length).toBe(posted);
      expect(made).toHaveLength(1);
      expect(await history.people()).toEqual([]);
      expect(made).toHaveLength(2);
      history.stop();
      expect(made[1].terminated).toBe(true);
    });

    it('read anew while a question waits answers it from the new reading, not as a failure', async () => {
      const { history } = opened();
      expect(await history.people()).toEqual([]);
      const worker = made[0];
      worker.hold();
      const waiting = history.people();
      await vi.waitFor(() => expect(worker.held.length).toBeGreaterThan(0));
      void history.restart();
      expect(await waiting).toEqual([]);
      expect(made).toHaveLength(2);
      history.stop();
    });

    it('stopped while a question waits fails it as closed', async () => {
      const { history } = opened();
      expect(await history.people()).toEqual([]);
      made[0].hold();
      const waiting = history.people();
      await vi.waitFor(() => expect(made[0].held.length).toBeGreaterThan(0));
      history.stop();
      await expect(waiting).rejects.toThrow('the history was closed');
    });
  });
});

describe('a history opened', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is read once when nothing is old enough to be kept less finely', async () => {
    const { project, history, read } = opened();
    const follow = vi.spyOn(project, 'follow');
    expect(await history.people()).toEqual([]);
    expect(read).toHaveBeenCalledOnce();
    expect(follow).toHaveBeenCalledOnce();
    expect(history.ready).toBe(true);
    history.stop();
  });

  it('is read anew when older history was merged on disk', async () => {
    const thin = vi
      .spyOn(Engine.prototype, 'thin')
      .mockReturnValueOnce([
        {
          first: 0,
          count: 2,
          time: 1,
          until: 2,
          record: { kind: 'change', here: true, time: 1, until: 2, update: new Uint8Array([0, 0]) },
        },
      ] as ReturnType<Engine['thin']>);
    const { history, read } = opened();
    expect(await history.people()).toEqual([]);
    expect(thin).toHaveBeenCalledOnce();
    expect(read).toHaveBeenCalledTimes(2);
    history.stop();
  });
});
