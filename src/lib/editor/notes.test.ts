import { describe, expect, it } from 'vitest';
import { blocksHtml } from '$lib/project/model/html';
import { paragraph, type Inline } from '$lib/project/model/text';
import { letters, NO_NOTES_BEFORE, numberNotes } from './notes';

const t = (text: string, marks: Record<string, Record<string, unknown>> = {}): Inline => ({
  kind: 'text',
  text,
  marks,
});
const note = (content: Inline[], place?: 'foot' | 'end'): Inline => ({
  kind: 'footnote',
  content,
  ...(place ? { place } : {}),
});

/** A text drawn as the text view draws it, with its notes numbered. */
function drawn(inlines: Inline[], before = NO_NOTES_BEFORE) {
  const root = document.createElement('div');
  root.innerHTML = blocksHtml([paragraph(inlines)]);
  numberNotes(root, before);
  return [...root.querySelectorAll<HTMLElement>('.footnote')].map((n) => [
    n.querySelector('.note-mark')?.textContent,
    n.querySelector('.note-text')?.innerHTML,
  ]);
}

describe('the notes of a text, where it is shown', () => {
  it('say what they say after their number', () => {
    expect(
      drawn([t('Wrath.'), note([t('So the '), t('scholia', { em: {} }), t('.')]), t(' Sing.')]),
    ).toEqual([['1', 'So the <em>scholia</em>.']]);
  });

  it('are numbered on from the notes before the element, those of a place of their own lettered by themselves', () => {
    expect(
      drawn(
        [
          t('One'),
          note([t('a')]),
          t('two'),
          note([t('b')], 'end'),
          t('three'),
          note([t('c')]),
          note([t('d')], 'foot'),
        ],
        { notes: 4, placed: 26 },
      ).map(([n]) => n),
    ).toEqual(['5', 'aa', '6', 'ab']);
  });

  it('are drawn as one, empty or not', () => {
    const root = document.createElement('div');
    root.innerHTML = blocksHtml([paragraph([t('Wrath'), note([])])]);
    expect(root.querySelector('.footnote')?.classList.contains('blank')).toBe(true);
  });

  it('are lettered a to z, then aa', () => {
    expect([1, 2, 26, 27, 52, 53].map(letters)).toEqual(['a', 'b', 'z', 'aa', 'az', 'ba']);
  });
});
