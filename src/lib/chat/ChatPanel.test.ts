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

// The choosing of emojis lies in a popover, which follows its size.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const { flushSync, mount, unmount, tick } = await import('svelte');
const { SvelteMap } = await import('svelte/reactivity');
const { Project } = await import('$lib/project/model/project.svelte');
const { menuState } = await import('$lib/ui/menu.svelte');
const { keptOf, writtenOf } = await import('./written');
const { default: ChatPanel } = await import('./ChatPanel.svelte');

/** What is written and not yet sent, kept outside the panel and followed, as the open project keeps it. */
function keeper(text = '') {
  const held = new SvelteMap([['draft', text]]);
  return {
    get text() {
      return held.get('draft')!;
    },
    set text(to: string) {
      held.set('draft', to);
    },
  };
}

function newProject() {
  const project = new Project(null);
  project.begin('Wrath');
  project.setMe({ id: 'hector', name: 'Hector' });
  return project;
}

/** A message of another, as their copy writes it. */
function theirs(project: InstanceType<typeof Project>, id: string, text: string, to?: string) {
  project.yChat.push([
    {
      id,
      author: { id: 'paris', name: 'Paris' },
      created: new Date().toISOString(),
      text,
      ...(to ? { to } : {}),
    },
  ]);
  flushSync();
}

interface SetUp {
  kept?: ReturnType<typeof keeper>;
  project?: InstanceType<typeof Project>;
  fresh?: () => ReadonlySet<string>;
}

function setUp(shared: boolean, { kept = keeper(), project = newProject(), fresh }: SetUp = {}) {
  const target = document.createElement('div');
  document.body.append(target);
  const props = { project, shared, onclose: () => {} };
  // The panel's `draft` is bound to the keeper, as the window binds it.
  Object.defineProperty(props, 'draft', {
    enumerable: true,
    get: () => kept.text,
    set: (to: string) => (kept.text = to),
  });
  if (fresh) Object.defineProperty(props, 'fresh', { enumerable: true, get: fresh });
  const panel = mount(ChatPanel, { target, props });
  flushSync();
  const done = () => {
    unmount(panel);
    target.remove();
  };
  const field = () => target.querySelector<HTMLElement>('[data-chat-field]')!;
  /** What stands in the field: its lines joined by line breaks. */
  const fieldText = () => [...field().querySelectorAll('p')].map((p) => p.textContent).join('\n');
  /** Writes in the field, as what is written comes back to it. */
  const write = (text: string) => {
    kept.text = keptOf({ ...writtenOf(kept.text), words: { text } });
    flushSync();
  };
  const message = (id: string) => target.querySelector<HTMLElement>(`[data-chat-message="${id}"]`)!;
  return { project, target, kept, field, fieldText, write, message, done };
}

const press = (
  el: HTMLElement,
  key: string,
  mods: { shiftKey?: boolean; ctrlKey?: boolean } = {},
) => {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...mods }));
  flushSync();
};

/**
 * Marks words of a message, as the pointer would: a range over a part of a
 * text node of its words. jsdom has no layout, so nothing is selected by a
 * press; the press only reads what is marked.
 */
function markIn(row: HTMLElement, from: number, to: number) {
  const node = wordsNode(row);
  const range = document.createRange();
  range.setStart(node, from);
  range.setEnd(node, to);
  const selection = document.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

/** The first text node of the words of a message. */
const wordsNode = (row: HTMLElement) =>
  document.createTreeWalker(row.querySelector('.text')!, NodeFilter.SHOW_TEXT).nextNode()!;

/** A press of the pointer on an element, as far as the panel reads it, and the click it ends in. */
function pressOn(el: Element, { click = true } = {}) {
  el.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
  if (click) (el as HTMLElement).click();
  flushSync();
}

/** The items of the menu open now, by their labels. */
const menuLabels = () =>
  (menuState.current?.items ?? []).flatMap((i) =>
    'label' in i && i.kind !== 'heading' ? [i.label] : [],
  );

/** Chooses an item of the menu open now. */
function choose(label: string) {
  const item = menuState.current!.items.find((i) => 'label' in i && i.label === label);
  menuState.close();
  (item as { action: () => void }).action();
  flushSync();
}

describe('the panel of the chat', () => {
  it('sends with Enter, and not with Shift+Enter', () => {
    const { project, target, field, write, kept, done } = setUp(true);
    write('First line');
    press(field(), 'Enter', { shiftKey: true });
    expect(project.chat).toEqual([]);
    expect(writtenOf(kept.text).words.text).toBe('First line\n');
    write('First line\nsecond line');
    press(field(), 'Enter');
    expect(project.chat.map((m) => m.text)).toEqual(['First line\nsecond line']);
    expect(kept.text).toBe('');
    const shown = target.querySelector('[data-chat-message] .text')!.textContent;
    expect(shown).toBe('First line\nsecond line');
    expect(target.querySelector('[data-chat-name]')!.textContent).toBe('Hector');
    done();
  });

  it('finds what was written and not sent when it is shown again', () => {
    const kept = keeper();
    const first = setUp(true, { kept });
    first.write('Shall we begin');
    expect(writtenOf(kept.text).words.text).toBe('Shall we begin');
    // Another tab of the pane is shown, and then the chat again: the panel is made anew.
    first.done();
    const again = setUp(true, { kept, project: first.project });
    expect(again.fieldText()).toBe('Shall we begin');
    expect(again.target.querySelector<HTMLButtonElement>('[data-chat-send]')!.disabled).toBe(false);
    again.done();
  });

  it('reads what an earlier version kept of the field, plain words', () => {
    const { fieldText, done } = setUp(true, { kept: keeper('Plain words\nof before') });
    expect(fieldText()).toBe('Plain words\nof before');
    done();
  });

  it('keeps nothing of a message that was sent, or taken out of the field again', () => {
    const kept = keeper(keptOf({ words: { text: 'Shall we begin' } }));
    const { project, field, write, done } = setUp(true, { kept });
    press(field(), 'Enter');
    expect(project.chat.map((m) => m.text)).toEqual(['Shall we begin']);
    expect(kept.text).toBe('');
    write('On second thought');
    write('');
    expect(kept.text).toBe('');
    done();
  });

  it('sends what is set in the field with its marks, and draws them', () => {
    const kept = keeper(
      keptOf({ words: { text: 'Bold and plain', marks: [{ from: 0, to: 4, mark: 'strong' }] } }),
    );
    const { project, target, field, done } = setUp(true, { kept });
    expect(field().querySelector('strong')!.textContent).toBe('Bold');
    expect(target.querySelector('[data-chat-mark="strong"]')).not.toBeNull();
    press(field(), 'Enter');
    expect(project.chat[0].marks).toEqual([{ from: 0, to: 4, mark: 'strong' }]);
    const words = target.querySelector('[data-chat-message] .text')!;
    expect(words.querySelector('strong')!.textContent).toBe('Bold');
    expect(words.textContent).toBe('Bold and plain');
    done();
  });

  it('undoes in the field by an undo of its own, which never reaches the project’s', () => {
    const { field, write, kept, done } = setUp(true);
    write('Line');
    press(field(), 'Enter', { shiftKey: true });
    expect(writtenOf(kept.text).words.text).toBe('Line\n');
    const undo = new KeyboardEvent('keydown', {
      key: 'z',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });
    field().dispatchEvent(undo);
    flushSync();
    expect(undo.defaultPrevented).toBe(true);
    expect(writtenOf(kept.text).words.text).toBe('Line');
    press(field(), 'z', { ctrlKey: true, shiftKey: true });
    expect(writtenOf(kept.text).words.text).toBe('Line\n');
    done();
  });

  it('sets bold by its key, and shows its button pressed', () => {
    const { target, field, write, done } = setUp(true);
    write('Words');
    const bold = () => target.querySelector('[data-chat-mark="strong"]')!;
    expect(bold().getAttribute('aria-pressed')).toBe('false');
    press(field(), 'b', { ctrlKey: true });
    expect(bold().getAttribute('aria-pressed')).toBe('true');
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
    theirs(project, 'theirs', 'Theirs');
    const menus = [...target.querySelectorAll('[data-chat-message]')].map(
      (m) => !!m.querySelector('[data-chat-message-menu]'),
    );
    expect(menus).toEqual([true, false]);
    done();
  });

  it('places an answer under the message it answers, and the answer to it after it', () => {
    const { project, target, message, done } = setUp(true);
    const first = project.say('Shall we begin?')!;
    project.say('Something else');
    theirs(project, 'yes', 'Yes', first);
    project.say('Now?', 'yes');
    flushSync();
    const answers = target.querySelector(`[data-chat-answers="${first}"]`)!;
    expect(
      [...answers.querySelectorAll('[data-chat-message] .text')].map((p) => p.textContent),
    ).toEqual(['Yes', 'Now?']);
    // The answers stand before the message written after the first.
    const all = [...target.querySelectorAll('[data-chat-message] .text')].map((p) => p.textContent);
    expect(all).toEqual(['Shall we begin?', 'Yes', 'Now?', 'Something else']);
    expect(message('yes')).not.toBeNull();
    done();
  });

  it('answers by Answer on a message, with a line over the field that Escape takes away', () => {
    const { project, target, field, write, done } = setUp(true);
    theirs(project, 'q', 'Shall we go on with the second book?');
    target.querySelector<HTMLButtonElement>('[data-chat-message="q"] [data-chat-answer]')!.click();
    flushSync();
    const line = target.querySelector('[data-chat-answering]')!;
    expect(line.textContent).toContain('Paris');
    expect(line.textContent).toContain('Shall we go on with the second book?');
    write('Not yet');
    press(field(), 'Escape');
    expect(target.querySelector('[data-chat-answering]')).toBeNull();
    expect(project.chat).toHaveLength(1);
    target.querySelector<HTMLButtonElement>('[data-chat-message="q"] [data-chat-answer]')!.click();
    flushSync();
    press(field(), 'Enter');
    expect(project.chat[1]).toMatchObject({ text: 'Not yet', to: 'q' });
    expect(target.querySelector('[data-chat-answering]')).toBeNull();
    done();
  });

  it('changes one’s own message in the field, and says that it was changed', async () => {
    const { project, target, field, fieldText, write, kept, done } = setUp(true);
    const id = project.say('Frist')!;
    flushSync();
    write('Half written');
    target
      .querySelector<HTMLButtonElement>(`[data-chat-message="${id}"] [data-chat-message-menu]`)!
      .click();
    flushSync();
    expect(menuLabels()).toEqual(['Change', 'Delete']);
    choose('Change');
    expect(target.querySelector('[data-chat-editing]')).not.toBeNull();
    expect(fieldText()).toBe('Frist');
    write('First');
    press(field(), 'Enter');
    expect(project.chat.map((m) => m.text)).toEqual(['First']);
    expect(project.chat[0].edited).toBeTruthy();
    // What was being written before comes back.
    await tick();
    expect(writtenOf(kept.text)).toEqual({ words: { text: 'Half written' } });
    expect(target.querySelector('[data-chat-edited]')!.textContent).toBe('changed');
    expect(target.querySelector('[data-chat-message] .text')!.textContent).toBe('First');
    done();
  });

  it('gives a change up by Escape, the message as it was', () => {
    const { project, target, field, write, kept, done } = setUp(true);
    const id = project.say('As it was')!;
    flushSync();
    const row = target.querySelector<HTMLElement>(`[data-chat-message="${id}"]`)!;
    row.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(menuLabels()).toEqual(['Answer', 'React…', 'Change', 'Delete']);
    choose('Change');
    write('Not so');
    press(field(), 'Escape');
    expect(project.chat[0].text).toBe('As it was');
    expect(kept.text).toBe('');
    expect(target.querySelector('[data-chat-editing]')).toBeNull();
    done();
  });

  it('shows the reactions as chips, and a press gives or takes back one’s own', () => {
    const { project, target, done } = setUp(true);
    theirs(project, 'q', 'Good news');
    project.yChatReactions.set(JSON.stringify(['q', 'paris', '👍']), { name: 'Paris', when: '1' });
    flushSync();
    // Found by what the button says of itself: the selectors of the tests do not read emojis.
    const chip = () =>
      [...target.querySelectorAll<HTMLButtonElement>('[data-chat-reaction]')].find(
        (b) => b.dataset.chatReaction === '👍',
      )!;
    expect(chip().textContent).toBe('👍1');
    expect(chip().classList.contains('mine')).toBe(false);
    chip().click();
    flushSync();
    expect(chip().textContent).toBe('👍2');
    expect(chip().classList.contains('mine')).toBe(true);
    chip().click();
    flushSync();
    expect(chip().textContent).toBe('👍1');
    done();
  });

  it('gives a reaction chosen from the emojis by React', () => {
    const { project, target, done } = setUp(true);
    theirs(project, 'q', 'Good news');
    target.querySelector<HTMLButtonElement>('[data-chat-message="q"] [data-chat-react]')!.click();
    flushSync();
    [...document.querySelectorAll<HTMLButtonElement>('[data-emoji-picker] [data-emoji]')]
      .find((b) => b.dataset.emoji === '😀')!
      .click();
    flushSync();
    expect(project.chatReactions.map((r) => [r.message, r.emoji])).toEqual([['q', '😀']]);
    expect(document.querySelector('[data-emoji-picker]')).toBeNull();
    done();
  });

  it('shows who has read a message as circles, without its writer and oneself', () => {
    const { project, target, done } = setUp(true);
    const id = project.say('Read me')!;
    const created = project.chat[0].created;
    project.yChatRead.set('paris', { name: 'Paris Priam', read: { id, created }, when: '' });
    project.yChatRead.set('hector', { name: 'Hector', read: { id, created }, when: '' });
    flushSync();
    const read = target.querySelector(`[data-chat-message="${id}"] [data-chat-read]`)!;
    expect([...read.querySelectorAll('[data-chat-reader]')].map((c) => c.textContent)).toEqual([
      'PP',
    ]);
    expect(read.getAttribute('aria-label')).toBe('Read by Paris Priam');
    done();
  });

  it('has the tools by whether the project is shared and whose the message is', () => {
    const shared = setUp(true);
    shared.project.say('Mine');
    theirs(shared.project, 'theirs', 'Theirs');
    const tools = (s: ReturnType<typeof setUp>) =>
      [...s.target.querySelectorAll('[data-chat-message]')].map((m) =>
        ['[data-chat-react]', '[data-chat-answer]', '[data-chat-message-menu]'].map(
          (q) => !!m.querySelector(q),
        ),
      );
    expect(tools(shared)).toEqual([
      [true, true, true],
      [true, true, false],
    ]);
    const alone = setUp(false, { project: shared.project });
    expect(tools(alone)).toEqual([
      [false, false, true],
      [false, false, false],
    ]);
    shared.done();
    alone.done();
  });

  it('keeps the answers of a message taken back together, under a line', () => {
    const { project, target, done } = setUp(true);
    const id = project.say('Taken back')!;
    theirs(project, 'a', 'An answer', id);
    const taken = project.unsay(id)!;
    flushSync();
    expect(target.querySelector('[data-chat-gone]')!.textContent).toBe(
      'A message that was deleted',
    );
    expect(
      target.querySelector(`[data-chat-answers="${id}"] [data-chat-message="a"]`),
    ).not.toBeNull();
    project.resay(taken);
    flushSync();
    expect(target.querySelector('[data-chat-gone]')).toBeNull();
    done();
  });

  it('marks what is new, and has a button to what of it is not seen', async () => {
    const project = newProject();
    theirs(project, 'n', 'New');
    let fresh: ReadonlySet<string> = new Set(['n']);
    const { target, message, done } = setUp(true, { project, fresh: () => fresh });
    await tick();
    await tick();
    expect(message('n').hasAttribute('data-chat-new')).toBe(true);
    expect(target.querySelector('[data-chat-new-button]')!.textContent).toContain('1 new message');
    done();
    fresh = new Set();
    const again = setUp(true, { project, fresh: () => fresh });
    await tick();
    expect(again.message('n').hasAttribute('data-chat-new')).toBe(false);
    expect(again.target.querySelector('[data-chat-new-button]')).toBeNull();
    again.done();
  });

  it('quotes the words marked in a message when Answer is pressed on it', () => {
    const { project, target, field, write, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    markIn(message('q'), 15, 24);
    pressOn(message('q').querySelector('[data-chat-answer]')!);
    const line = target.querySelector('[data-chat-quoting]')!;
    expect(line.textContent).toContain('the wrath');
    expect(target.querySelector('[data-chat-answering]')).not.toBeNull();
    write('Why the wrath?');
    press(field(), 'Enter');
    const sent = project.chat[1];
    expect(sent).toMatchObject({ to: 'q', quote: { id: 'q', text: 'the wrath' } });
    expect(target.querySelector('[data-chat-quoting]')).toBeNull();
    const quote = message(sent.id).querySelector('[data-chat-quote]')!;
    expect(quote.textContent).toBe('the wrath');
    // The quote is not among the words of the message.
    expect(message(sent.id).querySelector('.text')!.textContent).toBe('Why the wrath?');
    done();
  });

  it('quotes the words of one message in an answer to another', () => {
    const { project, target, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    theirs(project, 'r', 'Not the anger?');
    markIn(message('q'), 0, 4);
    pressOn(message('r').querySelector('[data-chat-answer]')!);
    expect(target.querySelector('[data-chat-answering]')!.textContent).toContain('Not the anger?');
    expect(target.querySelector('[data-chat-quoting]')!.textContent).toContain('Sing');
    done();
  });

  it('quotes the words marked when the field is pressed, for a new message', () => {
    const { project, target, field, write, kept, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    markIn(message('q'), 6, 13);
    pressOn(field(), { click: false });
    expect(target.querySelector('[data-chat-quoting]')!.textContent).toContain('goddess');
    expect(target.querySelector('[data-chat-answering]')).toBeNull();
    expect(writtenOf(kept.text).quote).toEqual({ id: 'q', text: 'goddess' });
    // A press with nothing marked changes nothing.
    document.getSelection()!.removeAllRanges();
    pressOn(field(), { click: false });
    expect(writtenOf(kept.text).quote).toEqual({ id: 'q', text: 'goddess' });
    write('Which one?');
    press(field(), 'Enter');
    expect(project.chat[1]).toMatchObject({
      text: 'Which one?',
      quote: { id: 'q', text: 'goddess' },
    });
    expect('to' in project.chat[1]).toBe(false);
    done();
  });

  it('quotes nothing of a selection over two messages, or of an earlier press at a key', () => {
    const { project, target, field, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess');
    theirs(project, 'r', 'the wrath');
    const range = document.createRange();
    range.setStart(wordsNode(message('q')), 2);
    range.setEnd(wordsNode(message('r')), 3);
    const selection = document.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    pressOn(field(), { click: false });
    expect(target.querySelector('[data-chat-quoting]')).toBeNull();
    // Caught by a press that began nothing, then forgotten at a key.
    markIn(message('q'), 0, 4);
    pressOn(target.querySelector('[data-chat] .body')!, { click: false });
    field().dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    message('r').querySelector<HTMLButtonElement>('[data-chat-answer]')!.click();
    flushSync();
    expect(target.querySelector('[data-chat-answering]')).not.toBeNull();
    expect(target.querySelector('[data-chat-quoting]')).toBeNull();
    done();
  });

  it('quotes by Answer in the right-click menu what was marked when it was opened', () => {
    const { project, target, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    markIn(message('q'), 28, 36);
    pressOn(message('q'), { click: false });
    message('q').dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    // The menu is pressed outside the panel, after the selection has gone.
    document.getSelection()!.removeAllRanges();
    choose('Answer');
    expect(target.querySelector('[data-chat-quoting]')!.textContent).toContain('Achilles');
    done();
  });

  it('gives the quote up by Escape, with the answering, and by its ×, without it', () => {
    const { project, target, field, write, kept, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    markIn(message('q'), 15, 24);
    pressOn(message('q').querySelector('[data-chat-answer]')!);
    write('Half');
    press(field(), 'Escape');
    expect(writtenOf(kept.text)).toEqual({ words: { text: 'Half' } });
    markIn(message('q'), 15, 24);
    pressOn(message('q').querySelector('[data-chat-answer]')!);
    target.querySelector<HTMLButtonElement>('[data-chat-quoting] button')!.click();
    flushSync();
    expect(writtenOf(kept.text)).toEqual({ words: { text: 'Half' }, to: 'q' });
    done();
  });

  it('keeps the quote of a message changed, and catches none while it is', () => {
    const { project, target, field, write, message, done } = setUp(true);
    theirs(project, 'q', 'Sing, goddess, the wrath of Achilles');
    const id = project.say('Whch wrath?', undefined, { id: 'q', text: 'the wrath' })!;
    flushSync();
    message(id).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    choose('Change');
    markIn(message('q'), 0, 4);
    pressOn(field(), { click: false });
    expect(target.querySelector('[data-chat-quoting]')).toBeNull();
    write('Which wrath?');
    press(field(), 'Enter');
    expect(project.chat[1]).toMatchObject({
      text: 'Which wrath?',
      quote: { id: 'q', text: 'the wrath' },
    });
    done();
  });

  it('goes to the message a quote is from, and lights it; a quote of one taken back is words', () => {
    vi.useFakeTimers();
    const { project, message, done } = setUp(true);
    const from = project.say('Sing, goddess')!;
    const id = project.say('Which?', undefined, { id: from, text: 'goddess' })!;
    flushSync();
    const quote = message(id).querySelector<HTMLElement>('[data-chat-quote]')!;
    expect(quote.tagName).toBe('BUTTON');
    quote.click();
    flushSync();
    expect(message(from).hasAttribute('data-chat-lit')).toBe(true);
    vi.advanceTimersByTime(1600);
    flushSync();
    expect(message(from).hasAttribute('data-chat-lit')).toBe(false);
    project.unsay(from);
    flushSync();
    const words = message(id).querySelector<HTMLElement>('[data-chat-quote]')!;
    expect(words.tagName).not.toBe('BUTTON');
    expect(words.textContent).toBe('goddess');
    vi.useRealTimers();
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
