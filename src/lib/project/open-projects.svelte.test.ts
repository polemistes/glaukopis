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
    nodes: new Map([
      ['project', {}],
      ['chapter', {}],
    ]),
    node: () => ({}),
    comments: new Map([['t1', { id: 't1', notes: [{ id: 'n1' }] }]]),
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
          info: {
            id,
            view: {
              at: 'x',
              mode: 'text',
              document: 'chapter',
              chat: { id: 'm1', created: '2026-11-13T09:00:00Z' },
              drafts: { chat: 'Shall we', 'answer:t1': 'Yes', 'answer:gone': 'No' },
              commenting: { element: 'chapter' },
            },
          } as never,
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

  it('bring back the element marked as the document, and keep it while it is there', async () => {
    const { o } = opener();
    const open = new OpenProjects(o);
    const one = open.acquire('a');
    await settle();
    expect(one.document).toBe('chapter');
    expect(one.toStore().document).toBe('chapter');
    one.document = 'gone';
    expect(one.toStore()).not.toHaveProperty('document');
    one.document = null;
    expect(one.toStore()).not.toHaveProperty('document');
  });

  it('bring back the message of the chat read last, and keep the one read since', async () => {
    const { o } = opener();
    const open = new OpenProjects(o);
    const one = open.acquire('a');
    await settle();
    expect(one.chatRead).toEqual({ id: 'm1', created: '2026-11-13T09:00:00Z' });
    one.chatRead = { id: 'm2', created: '2026-11-13T10:00:00Z' };
    expect(one.toStore().chat).toEqual({ id: 'm2', created: '2026-11-13T10:00:00Z' });
    one.chatRead = null;
    expect(one.toStore()).not.toHaveProperty('chat');
  });

  it('bring back what was written and not sent, and keep it until it is sent or given up', async () => {
    const { o } = opener();
    const open = new OpenProjects(o);
    const one = open.acquire('a');
    await settle();
    expect(one.drafts.of('chat')).toBe('Shall we');
    expect(one.drafts.of('answer:t1')).toBe('Yes');
    // An answer whose thread is gone is kept no more.
    expect(one.toStore().drafts).toEqual({ chat: 'Shall we', 'answer:t1': 'Yes' });
    one.drafts.write('chat', 'Shall we begin');
    one.drafts.write('note:t1:n1', 'Changed');
    one.drafts.write('note:t1:gone', 'Changed');
    one.drafts.drop('answer:t1');
    expect(one.toStore().drafts).toEqual({ chat: 'Shall we begin', 'note:t1:n1': 'Changed' });
    // A field emptied is still being written in, and is not kept.
    one.drafts.write('chat', '');
    expect(one.drafts.has('chat')).toBe(true);
    one.drafts.drop('note:t1:n1');
    expect(one.toStore()).not.toHaveProperty('drafts');
  });

  it('bring back the comment that was being begun, and keep it while it is', async () => {
    const { o } = opener();
    const open = new OpenProjects(o);
    const one = open.acquire('a');
    await settle();
    expect(one.commenting).toEqual({ element: 'chapter', passage: null });
    expect(one.toStore().commenting).toEqual({ element: 'chapter' });
    one.commenting = null;
    expect(one.toStore()).not.toHaveProperty('commenting');
  });

  it('are there when they are open with what they hold, or known not to open', async () => {
    const { o } = opener();
    const all = new OpenProjects(o);
    expect(all.there('a')).toBe(false);
    all.acquire('a');
    // Being opened, it is not there yet.
    expect(all.there('a')).toBe(false);
    await settle();
    expect(all.there('a')).toBe(true);

    // One that was joined and has not been fetched is open, with nothing in it: not there.
    o.open.mockImplementationOnce(async (id: string) => ({
      project: { nodes: new Map(), node: () => undefined, comments: new Map() } as never,
      info: { id, view: null } as never,
    }));
    all.acquire('joined');
    await settle();
    expect(all.get('joined')!.state).toBe('open');
    expect(all.there('joined')).toBe(false);

    // One that cannot be opened is as much there as it will be.
    o.open.mockImplementationOnce(async () => {
      throw new Error('unreadable');
    });
    all.acquire('broken');
    await settle();
    expect(all.there('broken')).toBe(true);
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
