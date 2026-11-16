import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The picker is mounted and used, so with the browser's Svelte: the tests
// otherwise run with the server's, in which nothing is followed.
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
// Choosing an emoji changes a setting, which is written a moment later.
vi.mock('$lib/api/system', async (original) => ({
  ...(await original<typeof import('$lib/api/system')>()),
  settingsSet: vi.fn(async () => {}),
}));

// The popover watches its own size; jsdom has nothing that does.
if (!('ResizeObserver' in globalThis))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );

const { flushSync, mount, unmount } = await import('svelte');
const { SvelteMap } = await import('svelte/reactivity');
const { default: EmojiPicker } = await import('./EmojiPicker.svelte');
const { EMOJIS } = await import('./emoji-list.generated');
const { settings } = await import('$lib/state/settings.svelte');
const { languages } = await import('$lib/i18n');

const GROUPS = [
  'smileys',
  'people',
  'nature',
  'food',
  'travel',
  'activities',
  'objects',
  'symbols',
] as const;

let done = () => {};
beforeEach(() => {
  settings.value.recentEmojis = [];
});
afterEach(() => {
  done();
  done = () => {};
  languages.current = 'en';
});

/** The picker mounted over a button, which has the focus; `open` is changed by `close()`. */
async function setUp(options: { stay?: boolean; open?: boolean } = {}) {
  const state = new SvelteMap<string, boolean>([['open', options.open ?? true]]);
  const picked: string[] = [];
  let closed = 0;
  const anchor = document.body.appendChild(document.createElement('button'));
  const target = document.body.appendChild(document.createElement('div'));
  anchor.focus();
  const picker = mount(EmojiPicker, {
    target,
    props: {
      get open() {
        return state.get('open')!;
      },
      anchor,
      onpick: (emoji: string) => picked.push(emoji),
      onclose: () => closed++,
      stay: options.stay,
    },
  });
  flushSync();
  // A moment later, as the picker takes the focus when it has been put where it lies over the rest.
  await Promise.resolve();
  done = () => {
    unmount(picker);
    target.remove();
    anchor.remove();
  };
  const root = () => document.querySelector<HTMLElement>('[data-emoji-picker]');
  const tabs = () => Array.from(document.querySelectorAll<HTMLElement>('[data-emoji-group]'));
  const emojis = () => Array.from(document.querySelectorAll<HTMLElement>('[data-emoji]'));
  const shown = () => emojis().map((b) => b.dataset.emoji);
  const tab = (id: string) => document.querySelector<HTMLElement>(`[data-emoji-group="${id}"]`)!;
  // Not by a selector: the selectors of jsdom do not match what an emoji is in an attribute.
  const emoji = (e: string) => emojis().find((button) => button.dataset.emoji === e)!;
  const click = (el: HTMLElement) => {
    el.click();
    flushSync();
  };
  const press = (el: Element, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    flushSync();
    return event;
  };
  const close = () => {
    state.set('open', false);
    flushSync();
  };
  return {
    anchor,
    picked,
    closed: () => closed,
    root,
    tabs,
    emojis,
    shown,
    tab,
    emoji,
    click,
    press,
    close,
  };
}

describe('the emoji picker', () => {
  it('shows a tab for each group of Unicode, named in the words of the interface, and the first group under them', async () => {
    const { tabs, shown, root } = await setUp();
    expect(root()).not.toBeNull();
    expect(tabs().map((tab) => tab.dataset.emojiGroup)).toEqual([...GROUPS]);
    expect(tabs().map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Smileys',
      'People',
      'Animals and nature',
      'Food and drink',
      'Travel and places',
      'Activities',
      'Objects',
      'Symbols',
    ]);
    expect(
      tabs().every((tab) => tab.getAttribute('role') === 'tab' && tab.querySelector('svg')),
    ).toBe(true);
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(shown()).toEqual([...EMOJIS.smileys]);
  });

  it('shows the group of the tab that is pressed, and only that', async () => {
    const { tab, click, shown, tabs } = await setUp();
    for (const id of GROUPS) {
      click(tab(id));
      expect(shown(), id).toEqual([...EMOJIS[id]]);
      expect(tabs().filter((t) => t.getAttribute('aria-selected') === 'true')).toEqual([tab(id)]);
    }
  });

  it('says its words in the language of the interface', async () => {
    languages.current = 'nb';
    const { tabs } = await setUp();
    expect(tabs().map((tab) => tab.getAttribute('aria-label'))).toEqual([
      'Smilefjes',
      'Mennesker',
      'Dyr og natur',
      'Mat og drikke',
      'Reise og steder',
      'Aktiviteter',
      'Gjenstander',
      'Symboler',
    ]);
  });

  it('is nowhere while it is not open', async () => {
    const { root } = await setUp({ open: false });
    expect(root()).toBeNull();
  });

  it('has Recently used first, and opens at it, only while there are emojis chosen', async () => {
    settings.value.recentEmojis = ['🍕', '🙂'];
    const { tabs, shown } = await setUp();
    expect(tabs().map((tab) => tab.dataset.emojiGroup)).toEqual(['recent', ...GROUPS]);
    expect(tabs()[0].getAttribute('aria-label')).toBe('Recently used');
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(shown()).toEqual(['🍕', '🙂']);
  });

  it('calls onpick with the emoji that is pressed, and closes', async () => {
    const { emoji, click, picked, closed } = await setUp();
    click(emoji('😀'));
    expect(picked).toEqual(['😀']);
    expect(closed()).toBe(1);
  });

  it('stays open after a choice where it is asked to, and says each emoji chosen', async () => {
    const { emoji, click, picked, closed, root } = await setUp({ stay: true });
    click(emoji('😀'));
    click(emoji('😂'));
    expect(picked).toEqual(['😀', '😂']);
    expect(closed()).toBe(0);
    expect(root()).not.toBeNull();
  });

  it('puts what is chosen first among the recently used, once, and keeps it in the settings', async () => {
    const { emoji, click, tab } = await setUp({ stay: true });
    click(emoji('😀'));
    click(emoji('😂'));
    expect(settings.value.recentEmojis).toEqual(['😂', '😀']);
    click(tab('food'));
    click(emoji('🍕'));
    click(tab('smileys'));
    click(emoji('😀'));
    expect(settings.value.recentEmojis).toEqual(['😀', '🍕', '😂']);
  });

  it('keeps no more than twenty-four of the recently used', async () => {
    const { emoji, click } = await setUp({ stay: true });
    for (const e of EMOJIS.smileys.slice(0, 30)) click(emoji(e));
    expect(settings.value.recentEmojis).toHaveLength(24);
    expect(settings.value.recentEmojis[0]).toBe(EMOJIS.smileys[29]);
  });

  it('shows the emojis chosen last as they were when it was opened, not shuffled by each choice', async () => {
    settings.value.recentEmojis = ['🍕', '🙂'];
    const { emoji, click, shown } = await setUp({ stay: true });
    click(emoji('🙂'));
    expect(settings.value.recentEmojis).toEqual(['🙂', '🍕']);
    expect(shown()).toEqual(['🍕', '🙂']);
  });

  it('shows the emojis chosen the last time when it is opened again', async () => {
    const first = await setUp();
    first.click(first.emoji('😀'));
    done();
    done = () => {};
    const again = await setUp();
    expect(again.tabs()[0].dataset.emojiGroup).toBe('recent');
    expect(again.shown()).toEqual(['😀']);
  });

  it('has the focus on the first emoji where it opens, and gives it back to where it was when it closes', async () => {
    const { emojis, anchor, close } = await setUp();
    expect(document.activeElement).toBe(emojis()[0]);
    close();
    expect(document.activeElement).toBe(anchor);
  });

  it('leaves the focus where something else put it, when it closes', async () => {
    const { anchor, close } = await setUp();
    const other = document.body.appendChild(document.createElement('input'));
    other.focus();
    close();
    expect(document.activeElement).toBe(other);
    expect(document.activeElement).not.toBe(anchor);
    other.remove();
  });

  it('keeps the focus on the emoji that was pressed, with stay', async () => {
    const { emoji, click } = await setUp({ stay: true });
    emoji('😂').focus();
    click(emoji('😂'));
    expect(document.activeElement).toBe(emoji('😂'));
  });

  it('closes on Escape', async () => {
    const { emojis, press, closed } = await setUp();
    const event = press(emojis()[0], 'Escape');
    expect(event.defaultPrevented).toBe(true);
    expect(closed()).toBe(1);
  });

  it('moves the focus through the grid by the arrows, eight to a row, and Home and End to the ends of a row', async () => {
    const { emojis, press } = await setUp();
    const at = () => emojis().indexOf(document.activeElement as HTMLElement);
    expect(at()).toBe(0);
    press(document.activeElement!, 'ArrowRight');
    expect(at()).toBe(1);
    press(document.activeElement!, 'ArrowDown');
    expect(at()).toBe(9);
    press(document.activeElement!, 'ArrowLeft');
    expect(at()).toBe(8);
    press(document.activeElement!, 'ArrowUp');
    expect(at()).toBe(0);
    press(document.activeElement!, 'ArrowUp');
    expect(at()).toBe(0);
    press(document.activeElement!, 'End');
    expect(at()).toBe(7);
    press(document.activeElement!, 'ArrowDown');
    press(document.activeElement!, 'Home');
    expect(at()).toBe(8);
  });

  it('does not let the arrows it uses go on to the window', async () => {
    const { emojis, press } = await setUp();
    const seen: string[] = [];
    const watch = (event: KeyboardEvent) => seen.push(event.key);
    window.addEventListener('keydown', watch);
    press(emojis()[0], 'ArrowRight');
    press(emojis()[1], 'a');
    window.removeEventListener('keydown', watch);
    expect(seen).toEqual(['a']);
  });

  it('can be reached by Tab as one tab and one emoji, the others being reached by the arrows', async () => {
    const { tabs, emojis, press } = await setUp();
    expect(tabs().map((tab) => tab.tabIndex)).toEqual([0, -1, -1, -1, -1, -1, -1, -1]);
    expect(emojis().filter((e) => e.tabIndex === 0)).toEqual([emojis()[0]]);
    press(emojis()[0], 'ArrowRight');
    expect(emojis().filter((e) => e.tabIndex === 0)).toEqual([emojis()[1]]);
  });

  it('moves among the tabs by the arrows left and right, showing the group of the tab that has the focus', async () => {
    const { tab, press, shown } = await setUp();
    tab('smileys').focus();
    press(tab('smileys'), 'ArrowRight');
    expect(document.activeElement).toBe(tab('people'));
    expect(shown()).toEqual([...EMOJIS.people]);
    expect(tab('people').tabIndex).toBe(0);
    expect(tab('smileys').tabIndex).toBe(-1);
    press(tab('people'), 'ArrowLeft');
    press(tab('smileys'), 'ArrowLeft');
    // From the first to the last, around.
    expect(document.activeElement).toBe(tab('symbols'));
    expect(shown()).toEqual([...EMOJIS.symbols]);
    press(tab('symbols'), 'Home');
    expect(document.activeElement).toBe(tab('smileys'));
    press(tab('smileys'), 'End');
    expect(document.activeElement).toBe(tab('symbols'));
  });

  it('puts the focus on the first emoji of a group only where it opens, not where a group is chosen', async () => {
    const { tab, click, emojis } = await setUp();
    tab('food').focus();
    click(tab('food'));
    expect(document.activeElement).toBe(tab('food'));
    expect(emojis()[0].tabIndex).toBe(0);
  });
});
