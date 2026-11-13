import { describe, expect, it, vi } from 'vitest';

const panes = { document: true, tab: 'chat' };
const sides = { map: { project: 'a' } as { project: string } | null };
vi.mock('$lib/project/panes.svelte', () => ({ panes }));
vi.mock('$lib/project/sides.svelte', () => ({ sides }));
vi.mock('$lib/history/me.svelte', () => ({ me: () => ({ id: 'hector', name: 'Hector' }) }));

const { chatShown, chatUi, hasChat, tabShown, unreadCount } = await import('./chat.svelte');

const hector = { id: 'hector', name: 'Hector' };
const paris = { id: 'paris', name: 'Paris' };
const message = (id: string, author: typeof hector) => ({
  id,
  author,
  created: '2026-11-13T09:00:00Z',
  text: id,
});

/** A project open in the window, as far as the chat reads it. */
function open(id: string, { shared = false, chat = [] as ReturnType<typeof message>[] } = {}) {
  return {
    id,
    project: { chat, me: hector },
    sharing: { shared },
    chatRead: null as { id: string; created: string } | null,
  } as never;
}

describe('the chat of a project open', () => {
  it('is there while the project is shared, or holds messages', () => {
    expect(hasChat(open('a'))).toBe(false);
    expect(hasChat(open('a', { shared: true }))).toBe(true);
    expect(hasChat(open('a', { chat: [message('m', hector)] }))).toBe(true);
    expect(hasChat(undefined)).toBe(false);
  });

  it('is shown as the references where it is not there', () => {
    expect(tabShown('chat', open('a'))).toBe('references');
    expect(tabShown('chat', open('a', { shared: true }))).toBe('chat');
    expect(tabShown('comments', open('a'))).toBe('comments');
  });

  it('counts the messages of others after the one read last', () => {
    const one = open('a', {
      chat: [message('m1', paris), message('m2', hector), message('m3', paris)],
    }) as { chatRead: unknown };
    expect(unreadCount(one as never)).toBe(2);
    one.chatRead = { id: 'm2', created: '2026-11-13T09:00:00Z' };
    expect(unreadCount(one as never)).toBe(1);
  });

  it('is shown where the document pane is open at it, for a side of its project', () => {
    const shared = open('a', { shared: true });
    expect(chatShown(shared)).toBe(true);
    expect(chatShown(open('b', { shared: true }))).toBe(false);
    panes.tab = 'comments';
    expect(chatShown(shared)).toBe(false);
    panes.tab = 'chat';
    panes.document = false;
    expect(chatShown(shared)).toBe(false);
    panes.document = true;
    expect(chatShown(open('a'))).toBe(false);
  });

  it('is asked to be shown by the project', () => {
    const before = chatUi.asked;
    chatUi.show('a');
    expect(chatUi.project).toBe('a');
    expect(chatUi.asked).toBe(before + 1);
  });
});
