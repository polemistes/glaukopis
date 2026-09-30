import { describe, expect, it } from 'vitest';
import { has } from '$lib/i18n';
import { KEYS, clashes, matches, shortcuts } from './keys.svelte';

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

  it('have each a name of its own, and words for it', () => {
    const ids = KEYS.map((k) => k.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => !has(`keys-${id}`))).toEqual([]);
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
