import { describe, expect, it, vi } from 'vitest';
import { Project } from '$lib/project/model/project.svelte';
import { ProjectHistory } from './history.svelte';

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
