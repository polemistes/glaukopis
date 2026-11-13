import { describe, expect, it, vi } from 'vitest';

// The panel is mounted and written in, so with the browser's Svelte: the
// tests otherwise run with the server's, in which nothing is followed.
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

const { flushSync, mount, unmount } = await import('svelte');
const { Project } = await import('$lib/project/model/project.svelte');
const { default: ChatPanel } = await import('./ChatPanel.svelte');

function setUp(shared: boolean) {
  const project = new Project(null);
  project.begin('Wrath');
  project.setMe({ id: 'hector', name: 'Hector' });
  const target = document.createElement('div');
  document.body.append(target);
  const panel = mount(ChatPanel, { target, props: { project, shared, onclose: () => {} } });
  flushSync();
  const done = () => {
    unmount(panel);
    target.remove();
  };
  return { project, target, done };
}

const press = (field: HTMLElement, key: string, shiftKey = false) => {
  field.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }));
  flushSync();
};

const write = (field: HTMLTextAreaElement, text: string) => {
  field.value = text;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
};

describe('the panel of the chat', () => {
  it('sends with Enter, and not with Shift+Enter', () => {
    const { project, target, done } = setUp(true);
    const field = target.querySelector<HTMLTextAreaElement>('[data-chat-field]')!;
    write(field, 'First line');
    press(field, 'Enter', true);
    expect(project.chat).toEqual([]);
    write(field, 'First line\nsecond line');
    press(field, 'Enter');
    expect(project.chat.map((m) => m.text)).toEqual(['First line\nsecond line']);
    expect(field.value).toBe('');
    const shown = target.querySelector('[data-chat-message] .text')!.textContent;
    expect(shown).toBe('First line\nsecond line');
    expect(target.querySelector('[data-chat-name]')!.textContent).toBe('Hector');
    done();
  });

  it('shows messages of one person written together under one name', () => {
    const { project, target, done } = setUp(true);
    project.say('One');
    project.say('Two');
    flushSync();
    expect(target.querySelectorAll('[data-chat-group]')).toHaveLength(1);
    expect(target.querySelectorAll('[data-chat-message]')).toHaveLength(2);
    done();
  });

  it('has a menu on one’s own messages only', () => {
    const { project, target, done } = setUp(true);
    project.say('Mine');
    project.yChat.push([
      {
        id: 'theirs',
        author: { id: 'paris', name: 'Paris' },
        created: new Date().toISOString(),
        text: 'Theirs',
      },
    ]);
    flushSync();
    const menus = [...target.querySelectorAll('[data-chat-message]')].map(
      (m) => !!m.querySelector('[data-chat-message-menu]'),
    );
    expect(menus).toEqual([true, false]);
    done();
  });

  it('while the project is shared, has the field and not the deleting of the conversation', () => {
    const { project, target, done } = setUp(true);
    project.say('Hello');
    flushSync();
    expect(target.querySelector('[data-chat-field]')).not.toBeNull();
    expect(target.querySelector('[data-chat-delete-all]')).toBeNull();
    done();
  });

  it('while it is not, shows the messages without the field, and can delete them', () => {
    const { project, target, done } = setUp(false);
    expect(target.querySelector('[data-chat-delete-all]')).toBeNull();
    project.say('Left from before');
    flushSync();
    expect(target.querySelector('[data-chat-field]')).toBeNull();
    expect(target.querySelector('[data-chat-delete-all]')).not.toBeNull();
    expect(target.querySelectorAll('[data-chat-message]')).toHaveLength(1);
    done();
  });
});
