import { describe, expect, it } from 'vitest';
import { has } from '$lib/i18n';
import {
  KEYS,
  TOGETHER,
  clashes,
  formatKeys,
  keyLabel,
  keyOf,
  keysFor,
  kindKeyOf,
  matches,
  wordsOf,
  shortcuts,
  type Place,
} from './keys.svelte';

const press = (key: string, more: Partial<KeyboardEventInit> & { code?: string } = {}) =>
  new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...more });

describe('the keys', () => {
  it('mean one thing wherever they hold, or say which takes precedence', () => {
    const found = clashes().map(
      ([a, b]) => `${a.keys}: ${a.id} (${a.place}) and ${b.id} (${b.place})`,
    );
    expect(found).toEqual([]);
  });

  it('find a clash that is not declared', () => {
    const found = clashes([
      { id: 'a', keys: 'Ctrl+,', place: 'everywhere' },
      { id: 'b', keys: 'Ctrl+,', place: 'writing' },
      { id: 'c', keys: 'Ctrl+F', place: 'library' },
      { id: 'd', keys: 'Ctrl+F', place: 'store' },
    ]);
    expect(found.map(([a, b]) => `${a.id}+${b.id}`)).toEqual(['a+b']);
  });

  it('are in force together both ways, wherever two places are', () => {
    const places = Object.keys(TOGETHER) as Place[];
    const oneWay = places.flatMap((a) =>
      places
        .filter((b) => TOGETHER[a].includes(b) && !TOGETHER[b].includes(a))
        .map((b) => `${a} has ${b}, but ${b} has not ${a}`),
    );
    expect(oneWay).toEqual([]);
    // The store of pictures has the keys that hold everywhere, whichever comes first in the table.
    for (const order of [
      ['everywhere', 'store'],
      ['store', 'everywhere'],
    ] as const) {
      const found = clashes(order.map((place, i) => ({ id: `k${i}`, keys: 'Ctrl+K', place })));
      expect(found.length, order.join(' before ')).toBe(1);
    }
  });

  it('have each a name of its own, and words for it', () => {
    const ids = KEYS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !has(wordsOf(id)))).toEqual([]);
    const places = [...new Set(KEYS.map((k) => k.place))];
    expect(places.filter((p) => !has(`keys-place-${p}`))).toEqual([]);
  });

  it('are known as they are pressed, on keyboards of other letters and signs too', () => {
    const entry = (keys: string) => ({ id: 'x', keys, place: 'everywhere' as const });
    expect(
      matches(entry('Ctrl+Shift+R'), press('R', { ctrlKey: true, shiftKey: true, code: 'KeyR' })),
    ).toBe(true);
    // A Greek keyboard writes ρ where the R is.
    expect(
      matches(entry('Ctrl+Shift+R'), press('Ρ', { ctrlKey: true, shiftKey: true, code: 'KeyR' })),
    ).toBe(true);
    // A Norwegian one has / over the 7.
    expect(
      matches(entry('Ctrl+/'), press('/', { ctrlKey: true, shiftKey: true, code: 'Digit7' })),
    ).toBe(true);
    expect(matches(entry('Ctrl+1'), press('1', { ctrlKey: true, code: 'Digit1' }))).toBe(true);
    // A French one writes & where the 1 is.
    expect(matches(entry('Ctrl+1'), press('&', { ctrlKey: true, code: 'Digit1' }))).toBe(true);
    expect(
      matches(entry('Ctrl+1'), press('1', { ctrlKey: true, shiftKey: true, code: 'Digit1' })),
    ).toBe(false);
    expect(matches(entry('F8'), press('F8'))).toBe(true);
    expect(matches(entry('Shift+F8'), press('F8'))).toBe(false);
    expect(matches(entry(''), press('x'))).toBe(false);
  });

  it('give a paragraph a kind by Ctrl+Alt and a digit, but not by AltGr, which writes', () => {
    const chord = (key: string, code: string, more: Partial<KeyboardEventInit> = {}) =>
      new KeyboardEvent('keydown', { key, code, ctrlKey: true, altKey: true, ...more });
    expect(kindKeyOf(chord('1', 'Digit1'))).toBe('1');
    expect(kindKeyOf(chord('0', 'Digit0'))).toBe('0');
    // A Mac writes a sign with Option and a digit: the digit under it is the key.
    expect(kindKeyOf(chord('¡', 'Digit1', { ctrlKey: false, metaKey: true }))).toBe('1');
    expect(kindKeyOf(chord('2', 'Digit2', { shiftKey: true }))).toBeNull();
    expect(kindKeyOf(chord('c', 'KeyC'))).toBeNull();
    expect(kindKeyOf(press('1', { ctrlKey: true, code: 'Digit1' }))).toBeNull();
    // On Windows, AltGr comes as Ctrl+Alt: with 2 on a Norwegian keyboard it writes @.
    const altGr = chord('@', 'Digit2');
    Object.defineProperty(altGr, 'getModifierState', { value: (m: string) => m === 'AltGraph' });
    expect(kindKeyOf(altGr)).toBeNull();
    expect(shortcuts.handle(altGr)).toBe(false);
    expect(keysFor('writing-kind-7')).toBe('Ctrl+Alt+7');
    expect(wordsOf('writing-kind-7')).toBe('keys-writing-kind');
    expect(wordsOf('writing-bold')).toBe('keys-writing-bold');
  });

  it('are a Latin letter that is written, wherever it is on the keyboard', () => {
    const entry = (keys: string) => ({ id: 'x', keys, place: 'everywhere' as const });
    // A German keyboard has its Z where others have the Y: Ctrl+Z there is undo, not redo.
    const z = press('z', { ctrlKey: true, code: 'KeyY' });
    expect(matches(entry('Ctrl+Z'), z)).toBe(true);
    expect(matches(entry('Ctrl+Y'), z)).toBe(false);
    // A Greek one writes ζ where the Z is, a Russian one я.
    expect(matches(entry('Ctrl+Z'), press('ζ', { ctrlKey: true, code: 'KeyZ' }))).toBe(true);
    expect(matches(entry('Ctrl+Z'), press('я', { ctrlKey: true, code: 'KeyZ' }))).toBe(true);
  });

  it('zoom the typesetting pane with + where it is a key and where it is over the =', () => {
    const larger = KEYS.filter((k) => k.id.startsWith('preview-zoom-in'));
    const any = (event: KeyboardEvent) => larger.some((k) => matches(k, event));
    // A Norwegian keyboard has + of its own; an English one over the =, with Shift.
    expect(any(press('+', { ctrlKey: true, code: 'Minus' }))).toBe(true);
    expect(any(press('+', { ctrlKey: true, shiftKey: true, code: 'Equal' }))).toBe(true);
    expect(any(press('=', { ctrlKey: true, code: 'Equal' }))).toBe(true);
    expect(any(press('-', { ctrlKey: true, code: 'Minus' }))).toBe(false);
  });

  it('give the letter of a key to a view that matches it, on a Greek or a Russian keyboard too', () => {
    const key = (key: string, code: string) => keyOf({ key, code });
    expect(key('a', 'KeyA')).toBe('a');
    expect(key('A', 'KeyA')).toBe('a');
    expect(key('α', 'KeyA')).toBe('a');
    expect(key('Α', 'KeyA')).toBe('a');
    expect(key('ф', 'KeyA')).toBe('a');
    expect(key('ψ', 'KeyC')).toBe('c');
    // Where the keyboard has another Latin letter, that letter: the A of a French keyboard is where others have the Q.
    expect(key('a', 'KeyQ')).toBe('a');
    expect(key('F3', 'F3')).toBe('f3');
    expect(key('Enter', 'Enter')).toBe('enter');
    // A sign is the sign, not the digit under it.
    expect(key('/', 'Digit7')).toBe('/');
    expect(key('&', 'Digit1')).toBe('&');
  });

  it('are shown as the computer names them', () => {
    const pc = (keys: string) => formatKeys(keys, false);
    const mac = (keys: string) => formatKeys(keys, true);
    for (const keys of ['Ctrl+Shift+Z', 'Ctrl+Alt+K', 'Alt+Shift+↓', 'F8', 'Enter', 'Ctrl+=']) {
      expect(pc(keys)).toBe(keys);
    }
    expect(mac('Ctrl+Shift+Z')).toBe('⇧⌘Z');
    expect(mac('Ctrl+Alt+K')).toBe('⌥⌘K');
    expect(mac('Ctrl+Alt+Shift+U')).toBe('⌥⇧⌘U');
    expect(mac('Alt+Shift+↓')).toBe('⌥⇧↓');
    expect(mac('Ctrl+Enter')).toBe('⌘↩');
    expect(mac('Shift+Tab')).toBe('⇧⇥');
    expect(mac('Ctrl+/')).toBe('⌘/');
    expect(mac('Ctrl+=')).toBe('⌘=');
    expect(mac('Ctrl+-')).toBe('⌘-');
    expect(mac("Ctrl+'")).toBe("⌘'");
    expect(mac('Shift+F8')).toBe('⇧F8');
    expect(mac('Del')).toBe('⌦');
    expect(mac('Esc')).toBe('⎋');
    expect(mac('Space')).toBe('Space');
    expect(mac('Ctrl')).toBe('⌘');
    expect(mac('@')).toBe('@');
    expect(mac('')).toBe('');
    // What is no keys is left as it is.
    expect(mac('Double-click')).toBe('Double-click');
    // Every key of the table is shown without a plus sign on a Mac, but where the key is one.
    for (const k of KEYS.filter((k) => k.keys)) {
      expect(mac(k.keys).replace(/\+$/, ''), k.id).not.toContain('+');
    }
    // Here, which is no Mac.
    expect(keyLabel(keysFor('sheet'))).toBe('Ctrl+/');
    expect(keysFor('palette')).toBe('Ctrl+K');
  });

  it('are written in menus and tooltips by the table, not by hand', () => {
    // A shortcut with Ctrl or Alt in it is taken from the table by `keysFor`, so that a key changed there is changed everywhere it is shown.
    const sources = import.meta.glob('/src/**/*.{ts,svelte}', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    expect(Object.keys(sources).length).toBeGreaterThan(100);
    const byHand = Object.entries(sources)
      .filter(([path]) => !path.endsWith('.test.ts') && !path.endsWith('shell/keys.svelte.ts'))
      .flatMap(([path, text]) =>
        [
          ...text.matchAll(
            /shortcut\s*(?:=\{?|:)[^\n]*?["'`]([^"'`\n]*(?:Ctrl|Alt)\+[^"'`\n]*)["'`]/g,
          ),
        ].map((m) => `${path}: ${m[1]}`),
      );
    expect(byHand).toEqual([]);
  });

  it('do what is bound, while it is bound, and leave what another has taken', () => {
    let done = 0;
    const unbind = shortcuts.bind({ preview: () => done++ });
    expect(shortcuts.handle(press('p', { ctrlKey: true }))).toBe(true);
    const taken = press('p', { ctrlKey: true });
    taken.preventDefault();
    expect(shortcuts.handle(taken)).toBe(false);
    unbind();
    expect(shortcuts.handle(press('p', { ctrlKey: true }))).toBe(false);
    expect(done).toBe(1);
  });

  it('leave what AltGr writes alone', () => {
    let done = 0;
    const unbind = shortcuts.bind({ 'review-accept': () => done++ });
    const altGr = press('y', { ctrlKey: true, altKey: true, code: 'KeyY' });
    Object.defineProperty(altGr, 'getModifierState', { value: (k: string) => k === 'AltGraph' });
    expect(shortcuts.handle(altGr)).toBe(false);
    expect(shortcuts.handle(press('y', { ctrlKey: true, altKey: true, code: 'KeyY' }))).toBe(true);
    unbind();
    expect(done).toBe(1);
  });
});
