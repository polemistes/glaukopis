import { describe, expect, it } from 'vitest';
import type { DocumentFormat, KindFamily, Look } from '$lib/api/documents';
import { setValue, valueOf, type Row, type Setting } from '$lib/ui/settings/rows';
import { lengthsOk, lookRows, lookWords, setKindLook, unsaid } from './formatEditor.svelte';

describe('what a format says of a kind', () => {
  const format = () => ({}) as DocumentFormat;

  it('is made when the first measure is said, and dropped when nothing is left', () => {
    const f = format();
    setKindLook(f, 'epigraph', 'italic', true);
    expect(f.kinds).toEqual({ epigraph: { italic: true } });
    setKindLook(f, 'epigraph', 'indentLeft', '2cm');
    setKindLook(f, 'scene', 'bold', false);
    expect(f.kinds).toEqual({
      epigraph: { italic: true, indentLeft: '2cm' },
      scene: { bold: false },
    });
    setKindLook(f, 'epigraph', 'italic', undefined);
    setKindLook(f, 'epigraph', 'indentLeft', '');
    expect(f.kinds).toEqual({ scene: { bold: false } });
    setKindLook(f, 'scene', 'bold', null);
    expect(f.kinds).toBeUndefined();
    // Leaving unsaid what was never said changes nothing.
    setKindLook(f, 'scene', 'bold', undefined);
    expect(f.kinds).toBeUndefined();
  });

  it('knows a length that is not written with its unit', () => {
    expect(lengthsOk(undefined)).toBe(true);
    expect(lengthsOk({})).toBe(true);
    expect(lengthsOk({ indentLeft: '1.27cm', spaceAfter: '12pt', firstLine: '' })).toBe(true);
    expect(lengthsOk({ spaceBefore: '12' })).toBe(false);
    expect(lengthsOk({ indentRight: 'wide' })).toBe(false);
    expect(unsaid('')).toBe(true);
    expect(unsaid(undefined)).toBe(true);
    expect(unsaid(0)).toBe(false);
    expect(unsaid(false)).toBe(false);
  });

  it('says a look in a few words, and nothing of what is unsaid', () => {
    expect(lookWords(undefined, 'paragraph')).toBe('');
    expect(lookWords({}, 'paragraph')).toBe('');
    expect(
      lookWords(
        { italic: true, size: 10, align: 'center', indentLeft: '2cm', keepWithNext: true },
        'paragraph',
      ),
    ).toBe('10 pt, italic, centred, 2cm in on the left, kept with the next');
    expect(lookWords({ bold: false, case: 'smallcaps', text: '#' }, 'paragraph')).toBe(
      'not bold, small capitals, “#” in a break',
    );
    // Words have no alignment, no indents and no page of their own.
    expect(
      lookWords({ underline: true, align: 'right', newPage: true, monospace: true }, 'words'),
    ).toBe('underlined, letters of equal width');
  });
});

describe('the rows of a look', () => {
  const rows = (family: KindFamily, sign = false): Row<Look>[] =>
    lookRows<Look>(
      family,
      {
        get: (l) => l,
        set: (l, key, value) => {
          if (unsaid(value)) delete l[key];
          else (l as Record<string, unknown>)[key] = value;
        },
      },
      { sign },
    );
  const labels = (family: KindFamily) =>
    rows(family)
      .map((r) => ('label' in r ? r.label : ''))
      .filter(Boolean);
  const row = (family: KindFamily, label: string) =>
    rows(family).find((r) => 'label' in r && r.label === label) as Setting<Look>;

  it('are every measure for a kind of paragraph, and for words those words can have', () => {
    expect(labels('paragraph')).toEqual([
      'Italic',
      'Bold',
      'Underlined',
      'Letters',
      'Alignment',
      'Indent on the left',
      'Indent on the right',
      'First line',
      'Space before',
      'Space after',
      'Size',
      'Letters of equal width',
      'Kept with the next',
      'Begins a new page',
    ]);
    expect(labels('words')).toEqual([
      'Italic',
      'Bold',
      'Underlined',
      'Letters',
      'Letters of equal width',
      'Size',
    ]);
    // A break has a row for its sign besides.
    expect(labels('paragraph')).toHaveLength(rows('paragraph', true).length - 1);
  });

  it('say a measure as the base, yes or no, and leave it unsaid again', () => {
    const look: Look = {};
    const italic = row('paragraph', 'Italic');
    expect(valueOf(italic, look)).toBe('');
    setValue(italic, look, 'yes');
    expect(look).toEqual({ italic: true });
    setValue(italic, look, 'no');
    expect(look).toEqual({ italic: false });
    setValue(italic, look, '');
    expect(look).toEqual({});

    const size = row('words', 'Size');
    expect(valueOf(size, look)).toBeNull();
    setValue(size, look, 11);
    expect(look.size).toBe(11);
    setValue(size, look, null);
    expect(look.size).toBeUndefined();

    const indent = row('paragraph', 'Indent on the left');
    setValue(indent, look, ' 2cm ');
    expect(look.indentLeft).toBe('2cm');
    setValue(indent, look, '');
    expect(look.indentLeft).toBeUndefined();

    const letters = row('paragraph', 'Letters');
    expect(valueOf(letters, look)).toBe('');
    setValue(letters, look, 'upper');
    expect(look.case).toBe('upper');
    setValue(letters, look, '');
    expect(look).toEqual({});
  });
});
