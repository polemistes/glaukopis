import { describe, expect, it, vi } from 'vitest';

// The host is mounted, and follows what it reads, so with the browser's
// Svelte: the tests otherwise run with the server's, in which nothing is
// followed.
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

// The chat of project `a` is shown: the document pane is open at it, for its side.
const panes = { document: true, tab: 'chat' };
const sides = { map: { project: 'a' } };
const opens: { id: string }[] = [];
vi.mock('$lib/project/panes.svelte', () => ({ panes }));
vi.mock('$lib/project/sides.svelte', () => ({ sides }));
vi.mock('$lib/history/me.svelte', () => ({ me: () => ({ id: 'hector', name: 'Hector' }) }));
vi.mock('$lib/project/open-projects.svelte', () => ({
  openProjects: { all: () => opens, get: (id: string) => opens.find((o) => o.id === id) },
}));

const { flushSync, mount, unmount } = await import('svelte');
const { Project } = await import('$lib/project/model/project.svelte');
const { settings } = await import('$lib/state/settings.svelte');
const { default: ChatHost } = await import('./ChatHost.svelte');

/** A shared project open in the window, with a message of another and one's own mark of before in it. */
function shared() {
  const project = new Project(null);
  project.begin('Wrath');
  project.setMe({ id: 'hector', name: 'Hector' });
  project.yChat.push([
    {
      id: 'm1',
      author: { id: 'paris', name: 'Paris' },
      created: '2026-11-16T09:00:00Z',
      text: 'Hi',
    },
  ]);
  project.yChatRead.set('hector', {
    name: 'Hector',
    read: { id: 'before', created: '2026-11-15T09:00:00Z' },
    when: '',
  });
  project.yChatRead.set('paris', {
    name: 'Paris',
    read: { id: 'm1', created: '2026-11-16T09:00:00Z' },
    when: '',
  });
  const open = { id: 'a', project, sharing: { shared: true }, chatRead: null as unknown };
  opens.splice(0, opens.length, open);
  return { project, open };
}

/** Where each person has read to, as the project keeps it. */
const marks = (project: InstanceType<typeof Project>) =>
  Object.fromEntries(project.chatReaders.map((r) => [r.id, r.read.id]));

function host() {
  const target = document.createElement('div');
  document.body.append(target);
  const mounted = mount(ChatHost, { target, props: {} });
  flushSync();
  return () => {
    unmount(mounted);
    target.remove();
  };
}

describe('the host of the chats, and the setting of reading told', () => {
  it('writes one’s mark into the project while the setting is on', () => {
    settings.value.chatReadShown = true;
    const { project, open } = shared();
    const done = host();
    expect(marks(project)).toEqual({ hector: 'm1', paris: 'm1' });
    expect(open.chatRead).toEqual({ id: 'm1', created: '2026-11-16T09:00:00Z' });
    done();
  });

  it('off, writes none and takes one’s earlier mark out, and on again writes it', () => {
    settings.value.chatReadShown = false;
    const { project, open } = shared();
    const done = host();
    expect(marks(project)).toEqual({ paris: 'm1' });
    // The mark of this computer, which counts the unread, is kept as ever.
    expect(open.chatRead).toEqual({ id: 'm1', created: '2026-11-16T09:00:00Z' });
    project.yChat.push([
      {
        id: 'm2',
        author: { id: 'paris', name: 'Paris' },
        created: '2026-11-16T09:01:00Z',
        text: 'Hm',
      },
    ]);
    flushSync();
    expect(marks(project)).toEqual({ paris: 'm1' });
    settings.value.chatReadShown = true;
    flushSync();
    expect(marks(project)).toEqual({ hector: 'm2', paris: 'm1' });
    done();
  });

  it('takes nothing out of a project that is not shared now', () => {
    settings.value.chatReadShown = false;
    const { project, open } = shared();
    open.sharing.shared = false;
    const done = host();
    expect(marks(project)).toEqual({ hector: 'before', paris: 'm1' });
    done();
    settings.value.chatReadShown = true;
  });
});
