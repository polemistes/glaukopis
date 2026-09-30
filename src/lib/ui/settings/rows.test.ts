import { describe, expect, it } from 'vitest';
import { lengthOk, rowsOf, setValue, valueOf, type Setting } from './rows';

interface Format {
  page: { size: string; margin: string };
  bold: boolean;
  limit: number | null;
}

const format = (): Format => ({ page: { size: 'a4', margin: '2.5cm' }, bold: false, limit: null });
const { toggle, length, number, choice } = rowsOf<Format>();

describe('the rows of a form of settings', () => {
  it('read and write their values by paths', () => {
    const f = format();
    const size = choice('Size', 'page.size', [['a4', 'A4']]) as Setting<Format>;
    const margin = length('Margin', 'page.margin') as Setting<Format>;
    const bold = toggle('Bold', 'bold') as Setting<Format>;
    expect(valueOf(size, f)).toBe('a4');
    expect(valueOf(margin, f)).toBe('2.5cm');
    setValue(size, f, 'letter');
    setValue(bold, f, true);
    expect(f).toEqual({ page: { size: 'letter', margin: '2.5cm' }, bold: true, limit: null });
  });

  it('read and write them by functions of their own', () => {
    const f = format();
    let said = '';
    const row = toggle('Upper', {
      get: (f) => f.page.size === f.page.size.toUpperCase(),
      set: (f, v) => (said = v ? f.page.size.toUpperCase() : f.page.size),
    }) as Setting<Format>;
    expect(valueOf(row, f)).toBe(false);
    setValue(row, f, true);
    expect(said).toBe('A4');
  });

  it('say what they are, with what more is said of them', () => {
    const when = (f: Format) => f.bold;
    expect(number('Limit', 'limit', { nullable: true, zero: 'none', when })).toEqual({
      kind: 'number',
      label: 'Limit',
      at: 'limit',
      nullable: true,
      zero: 'none',
      when,
    });
  });

  it('know a length when they see one', () => {
    for (const ok of ['2.5cm', '12pt', ' 1in ', '0,5 mm', '-3pt']) expect(lengthOk(ok)).toBe(true);
    for (const bad of ['', '2.5', 'cm', '2.5 px', '1..2cm']) expect(lengthOk(bad)).toBe(false);
  });
});
