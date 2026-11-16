import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mounted, and changed under it: with the browser's Svelte.
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
const { default: HelpView } = await import('./HelpView.svelte');
const { helpUi } = await import('./help-ui.svelte');
const { openHelp, toggleHelp } = await import('./open');
const { settingsUi } = await import('$lib/settings/settings-ui.svelte');
const { keysUi } = await import('$lib/shell/keys.svelte');
const { router } = await import('$lib/state/router.svelte');
const { languages } = await import('$lib/i18n');

HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false;
};

let done = () => {};

beforeEach(() => {
  helpUi.hide();
  helpUi.left = null;
  settingsUi.hide();
  keysUi.sheet = false;
  languages.current = 'en';
});
afterEach(() => {
  done();
  done = () => {};
  document.body.innerHTML = '';
  helpUi.hide();
});

const settle = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
  flushSync();
};

/** The window of Help, mounted, and opened at a place. */
async function opened(place: string | null) {
  const target = document.body.appendChild(document.createElement('div'));
  const view = mount(HelpView, { target });
  done = () => unmount(view);
  helpUi.show(place);
  await settle();
  return target;
}

async function reopen(place: string | null) {
  helpUi.hide();
  flushSync();
  helpUi.show(place);
  await settle();
}

const current = (target: HTMLElement) =>
  target.querySelector<HTMLElement>('[data-help-chapter][aria-current="page"]')?.dataset
    .helpChapter;
const field = (target: HTMLElement) => target.querySelector<HTMLInputElement>('[data-help-find]')!;

function type(target: HTMLElement, words: string) {
  const input = field(target);
  input.value = words;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

function press(el: HTMLElement, key: string, more: KeyboardEventInit = {}) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...more });
  el.dispatchEvent(event);
  flushSync();
  return event;
}

describe('the window of Help', () => {
  it('opens at the chapter of the part about where the writer is, with its parts in the contents', async () => {
    const target = await opened('The notebook');
    expect(target.querySelector('[data-help]')).not.toBeNull();
    expect(current(target)).toBe('the-notebook');
    const text = target.querySelector('[data-help-text]')!;
    expect(text.querySelector('h2')!.textContent).toBe('The notebook');
    expect(text.querySelectorAll('h2')).toHaveLength(1);
    const parts = [...target.querySelectorAll<HTMLElement>('[data-help-part]')].map(
      (p) => p.textContent,
    );
    expect(parts).toContain('From Firefox');
    expect(target.querySelector('[data-help-previous]')!.textContent).toContain('The library');
    expect(target.querySelector('[data-help-next]')!.textContent).toContain('The document pane');
  });

  it('opens at the beginning of the guide where the place says nothing', async () => {
    const target = await opened(null);
    expect(current(target)).toBe('a-guide-to-glaukopis');
    expect(target.querySelector('[data-help-previous]')).toBeNull();
  });

  it('opens at the chapter that holds a part, where the part is not a chapter', async () => {
    const target = await opened('The files of the library');
    expect(current(target)).toBe('the-library');
  });

  it('shows a chapter pressed in the contents, and the one after at its foot', async () => {
    const target = await opened('A first project');
    target.querySelector<HTMLElement>('[data-help-chapter="the-diagram"]')!.click();
    flushSync();
    expect(current(target)).toBe('the-diagram');
    expect(target.querySelector('[data-help-text] h2')!.textContent).toBe('The diagram');
    target.querySelector<HTMLElement>('[data-help-next]')!.click();
    flushSync();
    expect(current(target)).toBe('the-text');
  });

  it('finds words, goes to the part with Enter, and marks them in the text', async () => {
    const target = await opened('A first project');
    type(target, 'plugin Firefox');
    const hits = [...target.querySelectorAll<HTMLElement>('[data-help-hit]')];
    expect(hits.length).toBeGreaterThan(0);
    expect(target.querySelector('[data-help-chapter]')).toBeNull();
    const notebook = hits.findIndex((h) => h.dataset.helpHit === 'from-firefox');
    expect(notebook).toBeGreaterThanOrEqual(0);
    for (let i = 0; i < notebook; i++) press(field(target), 'ArrowDown');
    expect(hits[notebook].getAttribute('aria-selected')).toBe('true');
    press(field(target), 'Enter');
    await settle();
    const text = target.querySelector('[data-help-text]')!;
    expect(text.querySelector('h2')!.textContent).toBe('The notebook');
    const marks = [...text.querySelectorAll('mark[data-help-mark]')].map((m) => m.textContent);
    expect(marks).toContain('Firefox');
    expect(marks).toContain('plugin');
  });

  it('says so where nothing is found', async () => {
    const target = await opened(null);
    type(target, 'zzqxj');
    expect(target.querySelector('[data-help-hit]')).toBeNull();
    expect(target.textContent).toContain('Nothing found');
  });

  it('empties the field on Escape where it holds words, and leaves Escape to close Help where it is empty', async () => {
    const target = await opened(null);
    type(target, 'notebook');
    const emptied = press(field(target), 'Escape');
    expect(emptied.defaultPrevented).toBe(true);
    expect(field(target).value).toBe('');
    expect(target.querySelector('[data-help-chapter]')).not.toBeNull();
    expect(target.querySelector('mark[data-help-mark]')).toBeNull();
    const closing = press(field(target), 'Escape');
    expect(closing.defaultPrevented).toBe(false);
  });

  it('goes to the field on Ctrl+F', async () => {
    const target = await opened(null);
    const page = target.querySelector<HTMLElement>('[data-help-text]')!;
    const event = press(page, 'f', { ctrlKey: true });
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(field(target));
  });

  it('opens again where it was left, at the same place, and at the part about another place', async () => {
    const target = await opened('The diagram');
    target.querySelector<HTMLElement>('[data-help-chapter="comments"]')!.click();
    flushSync();
    await reopen('The diagram');
    expect(current(target)).toBe('comments');
    await reopen('The library');
    expect(current(target)).toBe('the-library');
  });

  it('speaks the language of the interface in its own words', async () => {
    languages.current = 'nb';
    const target = await opened(null);
    expect(field(target).placeholder).toBe('Finn i veiledningen');
    expect(target.querySelector('[data-help-next]')!.textContent).toContain('Neste kapittel');
  });
});

describe('one window over the view at a time', () => {
  it('closes the settings and the sheet of keys when Help opens, and Help when they open', () => {
    router.replace({ view: 'library' });
    settingsUi.show();
    keysUi.sheet = true;
    openHelp();
    expect(helpUi.open).toBe(true);
    expect(helpUi.place).toBe('The library');
    expect(settingsUi.open).toBe(false);
    expect(keysUi.sheet).toBe(false);
    settingsUi.toggle();
    expect(helpUi.open).toBe(false);
    toggleHelp();
    expect(helpUi.open).toBe(true);
    keysUi.toggleSheet();
    expect(helpUi.open).toBe(false);
    toggleHelp();
    toggleHelp();
    expect(helpUi.open).toBe(false);
  });
});
