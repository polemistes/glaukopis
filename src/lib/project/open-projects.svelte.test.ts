import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/state/closing', () => ({ beforeClose: () => () => {} }));
vi.mock('$lib/state/projects.svelte', () => ({
  openProject: vi.fn(),
  projects: {},
  rememberOpened: vi.fn(),
}));
vi.mock('$lib/history/history.svelte', () => ({ historyOf: vi.fn() }));
vi.mock('$lib/sharing/sharing.svelte', () => ({ ProjectSharing: vi.fn() }));

const { OpenProjects } = await import('./open-projects.svelte');

function opener() {
  const calls: string[] = [];
  const project = (id: string) => ({
    nodes: new Map([['project', {}]]),
    node: () => ({}),
    close: vi.fn(async () => calls.push(`close ${id}`)),
    snapshot: vi.fn(),
  });
  return {
    calls,
    o: {
      closed: async () => {},
      open: vi.fn(async (id: string) => {
        calls.push(`open ${id}`);
        return {
          project: project(id) as never,
          info: { id, view: { at: 'x', mode: 'text' } } as never,
        };
      }),
      share: () => ({ sharing: null, shared: false, close: () => {} }),
      here: (id: string) => calls.push(`here ${id}`),
      away: (id: string) => calls.push(`away ${id}`),
      closing: () => {},
      saveView: vi.fn(async (id: string) => calls.push(`save ${id}`)),
      stop: () => {},
    },
  };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('the projects the sides show', () => {
  it('are opened once, however many sides show them, and let go by the last', async () => {
    const { o, calls } = opener();
    const open = new OpenProjects(o);
    const one = open.acquire('a');
    const two = open.acquire('a');
    expect(one).toBe(two);
    await settle();
    expect(one.state).toBe('open');
    expect(o.open).toHaveBeenCalledTimes(1);
    expect(one.left).toEqual({ at: 'x', mode: 'text' });
    await open.release('a');
    expect(calls).not.toContain('close a');
    await open.release('a');
    expect(calls.slice(-3)).toEqual(['away a', 'save a', 'close a']);
    expect(open.get('a')).toBeUndefined();
  });

  it('let go at once of a project let go while it was being opened', async () => {
    const { o, calls } = opener();
    const open = new OpenProjects(o);
    open.acquire('a');
    void open.release('a');
    await settle();
    expect(calls).not.toContain('here a');
  });
});
