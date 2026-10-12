import type { Node } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import type { Decoration } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';
import {
  canSplitPassage,
  languageOverPassage,
  passageBrackets,
  passageLanguage,
  passageToText,
  selectPassage,
  splitPassage,
} from './brackets';
import { passages } from './passages';
import { bodySchema } from './schema';

const { doc, paragraph, passage } = bodySchema.nodes;

/** What a decoration is, which it keeps in its type: a widget has `toDOM`, a node decoration its attributes. */
const typeOf = (d: Decoration) =>
  (d as unknown as { type: { toDOM?: unknown; attrs?: Record<string, string> } }).type;

const p = (kind: string, words: string, attrs: Record<string, unknown> = {}) =>
  paragraph.create({ kind, ...attrs }, bodySchema.text(words));

/** A text whose shape is kept after every change, as the editor keeps it. */
function state(children: Node[], at?: number) {
  let s = EditorState.create({ doc: doc.create(null, children), plugins: [passages()] });
  if (at !== undefined) s = s.apply(s.tr.setSelection(TextSelection.create(s.doc, at)));
  return s;
}

/** The shape of a text, written out as `passages.test.ts` writes it. */
function shape(node: Node): string {
  const out: string[] = [];
  node.forEach((child) => {
    if (child.type === passage) {
      const kinds: string[] = [];
      child.forEach((para) => kinds.push(para.attrs.kind as string));
      out.push(`${child.attrs.family}[${kinds.join(' ')}]`);
    } else out.push(child.attrs.kind as string);
  });
  return out.join(' ');
}

describe('what is said of a passage from its bracket', () => {
  const verse = () =>
    passage.create({ family: 'verse', numbering: 'counted', every: 3, side: 'right' }, [
      p('line', 'If only the Argo', { number: '45' }),
      p('line', 'had never flown'),
      p('line', 'through the dark rocks'),
    ]);

  it('selects the whole passage', () => {
    const s = state([p('text', 'Before'), verse()], 2);
    let next = s;
    expect(selectPassage(8)(s, (tr) => (next = s.apply(tr)))).toBe(true);
    const { from, to } = next.selection;
    expect(next.doc.textBetween(from, to, '/')).toBe(
      'If only the Argo/had never flown/through the dark rocks',
    );
    // Nothing where no passage begins.
    expect(selectPassage(0)(s)).toBe(false);
  });

  it('makes every paragraph of the passage text, so that the passage goes, and leaves the cursor in its paragraph', () => {
    const s = state([p('text', 'Before'), verse()], 2);
    const next = s.apply(
      (() => {
        let tr = s.tr;
        passageToText(8)(s, (t) => (tr = t));
        return tr;
      })(),
    );
    expect(shape(next.doc)).toBe('text text text text');
    // The numbers given by hand stay with their paragraphs, for when the lines are lines again.
    expect(next.doc.child(1).attrs.number).toBe('45');
    expect(next.selection.from).toBe(2);
  });

  it('splits the passage before the paragraph the cursor is in, with an empty paragraph of text between the halves, which keep the settings', () => {
    // The cursor in the second line: after "Before" (8), the passage (1), the first line (18), into the second.
    const s = state([p('text', 'Before'), verse()], 30);
    expect(canSplitPassage(s)).toBe(true);
    let next = s;
    expect(splitPassage(s, (tr) => (next = s.apply(tr)))).toBe(true);
    expect(shape(next.doc)).toBe('text verse[line] text verse[line line]');
    for (const i of [1, 3]) {
      expect(next.doc.child(i).attrs).toMatchObject({
        family: 'verse',
        numbering: 'counted',
        every: 3,
        side: 'right',
      });
    }
    expect(next.doc.child(2).content.size).toBe(0);
    // The cursor stays in its line, which now begins the second half.
    expect(next.selection.$from.parent.textContent).toBe('had never flown');
    // Not before the first paragraph, and not outside a passage.
    expect(canSplitPassage(state([p('text', 'Before'), verse()], 10))).toBe(false);
    expect(splitPassage(state([p('text', 'Before'), verse()], 10))).toBe(false);
    expect(canSplitPassage(state([p('text', 'Before')], 2))).toBe(false);
  });

  it('gives the whole passage a language, reads it, and takes it away again', () => {
    const s = state([verse()]);
    expect(passageLanguage(s, 0)).toBeNull();
    let next = s;
    languageOverPassage(0, 'grc')(s, (tr) => (next = s.apply(tr)));
    expect(passageLanguage(next, 0)).toBe('grc');
    next.doc.child(0).descendants((node) => {
      if (node.isText) expect(node.marks.map((m) => m.attrs.tag)).toEqual(['grc']);
    });
    // Left selected, so that what was given it is seen.
    expect(next.selection.from).toBe(1);
    expect(next.selection.to).toBe(next.doc.child(0).nodeSize - 1);
    let gone = next;
    languageOverPassage(0, null)(next, (tr) => (gone = next.apply(tr)));
    expect(passageLanguage(gone, 0)).toBeNull();
  });

  it('labels every passage by its family, and marks the one the cursor is in', () => {
    const named: string[] = [];
    const plugin = passageBrackets((family) => {
      named.push(family);
      return family === 'k1' ? 'Letter' : family.toUpperCase();
    });
    const s = EditorState.create({
      doc: doc.create(null, [
        p('text', 'Before'),
        verse(),
        passage.create({ family: 'k1' }, [p('k1', 'Dear')]),
      ]),
      plugins: [plugin],
    });
    const found = plugin.getState(s)!.find();
    const widgets = found.filter((d) => 'toDOM' in typeOf(d));
    expect(widgets.map((d) => d.from)).toEqual([9, 70]);
    expect(widgets.map((d) => d.spec.key)).toEqual([
      'passage-label:verse:VERSE',
      'passage-label:k1:Letter',
    ]);
    expect(named).toEqual(['verse', 'k1']);
    // No passage has the cursor while it stands in the first paragraph.
    expect(found.some((d) => typeOf(d).attrs?.['data-current'] !== undefined)).toBe(false);
    const inside = s.apply(s.tr.setSelection(TextSelection.create(s.doc, 12)));
    const current = plugin
      .getState(inside)!
      .find()
      .filter((d) => typeOf(d).attrs?.['data-current'] !== undefined);
    expect(current.map((d) => [d.from, d.to])).toEqual([[8, 69]]);
  });
});
