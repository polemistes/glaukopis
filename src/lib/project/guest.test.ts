import { describe, expect, it } from 'vitest';
import type { ProjectInfo } from '$lib/api/projects';
import { GuestProject, type Opener } from './guest.svelte';
import { Project } from './model/project.svelte';
import { PROJECT } from './model/types';

/** A project as one opened from disk would be, of which the closing is counted. */
function opened(name: string) {
  const project = new Project(null);
  project.begin(name);
  let closed = 0;
  project.close = async () => {
    closed++;
  };
  return { project, closed: () => closed };
}

/** Until what was begun has gone as far as it can without being let through. */
const settle = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

/** What is waited for, until it is let through by hand. */
function gate() {
  let open = () => {};
  const passed = new Promise<void>((done) => (open = done));
  return { passed, open };
}

/**
 * An opener that opens the projects it is given, each when its gate is
 * opened, and writes down what it is asked, in order.
 */
function fakeOpener(made: Record<string, ReturnType<typeof opened>>) {
  const said: string[] = [];
  const gates = new Map<string, ReturnType<typeof gate>>();
  const gateOf = (id: string) => {
    if (!gates.has(id)) gates.set(id, gate());
    return gates.get(id)!;
  };
  const closing: Promise<void>[] = [];
  const opener: Opener = {
    closed: async (id) => {
      said.push(`closed ${id}`);
    },
    open: async (id) => {
      said.push(`open ${id}`);
      await gateOf(id).passed;
      const m = made[id];
      if (!m) throw new Error(`no project ${id}`);
      return { project: m.project, info: { id, name: id } as ProjectInfo };
    },
    share: (id) => {
      said.push(`share ${id}`);
      return { sharing: null, close: () => said.push(`unshare ${id}`) };
    },
    here: (id) => said.push(`here ${id}`),
    away: (id) => said.push(`away ${id}`),
    closing: (id, done) => {
      said.push(`closing ${id}`);
      closing.push(done);
    },
  };
  /** Lets the opening of a project through, and waits until what follows it is done. */
  const let_ = async (id: string) => {
    gateOf(id).open();
    await settle();
  };
  return { opener, said, let: let_, closing };
}

/** The project beside, with a project of the view of its own, and what failed. */
function beside(made: Record<string, ReturnType<typeof opened>>) {
  const own = new Project(null);
  own.begin('Own');
  const fake = fakeOpener(made);
  const failed: string[] = [];
  const guest = new GuestProject({
    own: () => own,
    onfail: (id) => failed.push(id),
    opener: fake.opener,
  });
  return { guest, own, fake, failed };
}

describe('the project beside', () => {
  it('is opened when asked for, shared, and counted as open here', async () => {
    const iliad = opened('Iliad');
    const { guest, fake } = beside({ iliad });
    const turning = guest.turnTo('iliad');
    // Not there until it is open.
    expect(guest.current).toBeNull();
    expect(guest.projectOf({ at: PROJECT, mode: 'diagram', project: 'iliad' })).toBeNull();
    await fake.let('iliad');
    await turning;
    expect(guest.current?.id).toBe('iliad');
    expect(guest.current?.project).toBe(iliad.project);
    expect(fake.said).toEqual(['closed iliad', 'open iliad', 'share iliad', 'here iliad']);
  });

  it('is what a pane naming it shows; a pane naming none shows the project of the view', async () => {
    const iliad = opened('Iliad');
    const { guest, own, fake } = beside({ iliad });
    const turning = guest.turnTo('iliad');
    await fake.let('iliad');
    await turning;
    expect(guest.projectOf({ at: PROJECT, mode: 'text', project: 'iliad' })).toBe(iliad.project);
    expect(guest.projectOf({ at: PROJECT, mode: 'text' })).toBe(own);
    // Another project than the one open beside: none, until it is open.
    expect(guest.projectOf({ at: PROJECT, mode: 'text', project: 'odyssey' })).toBeNull();
    expect(guest.projectOf(undefined)).toBeNull();
  });

  it('asked for again while it opens, is opened once', async () => {
    const iliad = opened('Iliad');
    const { guest, fake } = beside({ iliad });
    const first = guest.turnTo('iliad');
    const again = guest.turnTo('iliad');
    await fake.let('iliad');
    await Promise.all([first, again]);
    expect(fake.said.filter((s) => s.startsWith('open'))).toEqual(['open iliad']);
    // And once open, asking for it again does nothing.
    await guest.turnTo('iliad');
    expect(fake.said.filter((s) => s.startsWith('open'))).toEqual(['open iliad']);
    expect(iliad.closed()).toBe(0);
  });

  it('turned to another, lets go of the one before: out of touch, closed, and said to be closing', async () => {
    const iliad = opened('Iliad');
    const odyssey = opened('Odyssey');
    const { guest, fake } = beside({ iliad, odyssey });
    const first = guest.turnTo('iliad');
    await fake.let('iliad');
    await first;
    fake.said.length = 0;
    const second = guest.turnTo('odyssey');
    // The one before is let go of at once.
    expect(guest.current).toBeNull();
    expect(fake.said.slice(0, 3)).toEqual(['away iliad', 'unshare iliad', 'closing iliad']);
    expect(iliad.closed()).toBe(1);
    await fake.let('odyssey');
    await second;
    expect(guest.current?.id).toBe('odyssey');
    // And with none asked for, only let go of.
    await guest.turnTo(null);
    expect(guest.current).toBeNull();
    expect(odyssey.closed()).toBe(1);
  });

  it('no longer asked for while it opens, is let go of once it is open', async () => {
    const iliad = opened('Iliad');
    const odyssey = opened('Odyssey');
    const { guest, fake } = beside({ iliad, odyssey });
    const first = guest.turnTo('iliad');
    // It is being read when the other is asked for.
    await settle();
    expect(fake.said).toContain('open iliad');
    const second = guest.turnTo('odyssey');
    await fake.let('odyssey');
    await second;
    expect(guest.current?.id).toBe('odyssey');
    // The first arrives late: it is closed, and never counted as open here.
    await fake.let('iliad');
    await first;
    expect(guest.current?.id).toBe('odyssey');
    expect(iliad.closed()).toBe(1);
    expect(fake.said).not.toContain('here iliad');
    expect(fake.said).toContain('closing iliad');
  });

  it('when the view goes, is let go of, and one still opening is let go of when it is open', async () => {
    const iliad = opened('Iliad');
    const odyssey = opened('Odyssey');
    const { guest, fake } = beside({ iliad, odyssey });
    const first = guest.turnTo('iliad');
    await fake.let('iliad');
    await first;
    await guest.leave();
    expect(guest.current).toBeNull();
    expect(iliad.closed()).toBe(1);

    // Gone while another is being opened: it is closed when it arrives, and not shown.
    const late = beside({ odyssey });
    const opening = late.guest.turnTo('odyssey');
    await settle();
    await late.guest.leave();
    await late.fake.let('odyssey');
    await opening;
    expect(late.guest.current).toBeNull();
    expect(odyssey.closed()).toBe(1);
    expect(late.fake.said).not.toContain('here odyssey');
    // Nothing is opened for the view once it has gone.
    await late.guest.turnTo('iliad');
    expect(late.fake.said).not.toContain('open iliad');
  });

  it('that cannot be opened is said to have failed, once, and nothing is beside', async () => {
    const { guest, fake, failed } = beside({});
    const turning = guest.turnTo('lost');
    await fake.let('lost');
    await turning;
    expect(failed).toEqual(['lost']);
    expect(guest.current).toBeNull();

    // A failure of one no longer asked for is not said.
    const other = beside({});
    const first = other.guest.turnTo('lost');
    await settle();
    void other.guest.turnTo(null);
    await other.fake.let('lost');
    await first;
    expect(other.failed).toEqual([]);
  });
});
