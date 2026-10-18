import { describe, expect, it } from 'vitest';
import { safeFileName } from './file-name';

describe('a name a file may have on every system', () => {
  it('makes the signs no system takes spaces, as the core does', () => {
    expect(safeFileName('Iliad: a "reading"?', 'x')).toBe('Iliad a reading');
    expect(safeFileName('Ἰλιάς/Ὀδύσσεια', 'x')).toBe('Ἰλιάς Ὀδύσσεια');
    expect(safeFileName('Notes on Od. 9/10', 'x')).toBe('Notes on Od. 9 10');
    expect(safeFileName('Iliad 1: 1–100', 'x')).toBe('Iliad 1 1–100');
    expect(safeFileName('a\\b*c<d>e|f', 'x')).toBe('a b c d e f');
    expect(safeFileName('tab\there\nand\u0000null\u007f', 'x')).toBe('tab here and null');
  });

  it('takes dots and spaces off its ends, and gives the fallback where nothing is left', () => {
    expect(safeFileName('  ...  ', 'untitled')).toBe('untitled');
    expect(safeFileName('', 'untitled')).toBe('untitled');
    expect(safeFileName('/:?', 'untitled')).toBe('untitled');
    expect(safeFileName('.hidden', 'x')).toBe('hidden');
    expect(safeFileName('Ends so... ', 'x')).toBe('Ends so');
  });

  it('gives a device name of Windows an underscore, in any case and before any dot', () => {
    for (const name of ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM9', 'LPT1', 'LPT9'])
      expect(safeFileName(name, 'x')).toBe(`${name}_`);
    expect(safeFileName('con', 'x')).toBe('con_');
    expect(safeFileName('Con', 'x')).toBe('Con_');
    expect(safeFileName('nul.txt', 'x')).toBe('nul_.txt');
    expect(safeFileName('Aux. notes', 'x')).toBe('Aux_. notes');
    expect(safeFileName('Con .notes', 'x')).toBe('Con_ .notes');
  });

  it('leaves names that only begin like a device name', () => {
    expect(safeFileName('COM0', 'x')).toBe('COM0');
    expect(safeFileName('COM10', 'x')).toBe('COM10');
    expect(safeFileName('Console', 'x')).toBe('Console');
    expect(safeFileName('Con brio', 'x')).toBe('Con brio');
    expect(safeFileName('Nullity', 'x')).toBe('Nullity');
  });

  it('cuts a long name to 120 characters, counting a character beyond the basic plane as one', () => {
    expect(safeFileName('a'.repeat(200), 'x')).toBe('a'.repeat(120));
    expect(Array.from(safeFileName('𝔄'.repeat(200), 'x'))).toHaveLength(120);
    expect(safeFileName(`${'a'.repeat(118)} .b`, 'x')).toBe('a'.repeat(118));
  });
});
