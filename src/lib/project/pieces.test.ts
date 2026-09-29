import { describe, expect, it } from 'vitest';
import { pieces } from './pieces';

describe('words with markup among them', () => {
  it('are cut where the variables stand', () => {
    const said = pieces((m) => `${m.tab} adds one under it · ${m.enter} adds one beside it`, {
      tab: 'Tab',
      enter: 'Enter',
    });
    expect(said).toEqual([
      { text: 'Tab', name: 'tab' },
      { text: ' adds one under it · ' },
      { text: 'Enter', name: 'enter' },
      { text: ' adds one beside it' },
    ]);
  });

  it('keep the order the translation gives them', () => {
    const said = pieces((m) => `With ${m.enter} beside it, with ${m.tab} under it`, {
      tab: 'Tab',
      enter: 'Enter',
    });
    expect(said.map((p) => p.name ?? p.text)).toEqual([
      'With ',
      'enter',
      ' beside it, with ',
      'tab',
      ' under it',
    ]);
  });

  it('are the words alone where no variable is marked', () => {
    expect(pieces(() => 'Nothing to press', {})).toEqual([{ text: 'Nothing to press' }]);
  });
});
