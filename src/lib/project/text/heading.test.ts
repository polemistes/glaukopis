import { describe, expect, it } from 'vitest';
import type { Fragment, Node } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { bodySchema } from '$lib/editor/schema';
import { headingAt, nameable, nameDoc } from './heading';

const s = bodySchema;
const p = (...content: (Node | string)[]) =>
  s.node(
    'paragraph',
    null,
    content.map((c) => (typeof c === 'string' ? s.text(c) : c)),
  );
const doc = (...blocks: Node[]) => s.node('doc', null, blocks);
const em = (text: string) => s.text(text, [s.marks.em.create()]);
const bold = (text: string) => s.text(text, [s.marks.strong.create()]);
const citation = () => s.nodes.citation.create({ items: [{ id: 'homer' }] });
const note = (text: string) => s.nodes.footnote.create(null, [s.text(text)]);

/** The paragraphs of a fragment as their words, one string each. */
const words = (f: Fragment) => {
  const out: string[] = [];
  f.forEach((b) => out.push(b.textContent));
  return out;
};

/** The position in a document of the first place a piece of words stands, or of its end. */
function at(d: Node, words: string, end = false): number {
  let found = -1;
  d.descendants((node, pos) => {
    if (found >= 0 || !node.isText) return;
    const i = node.text!.indexOf(words);
    if (i >= 0) found = pos + i + (end ? words.length : 0);
  });
  if (found < 0) throw new Error(`“${words}” is not in the text`);
  return found;
}

/** What is left of the old text once the heading is made. */
function left(d: Node, cutFrom: number): string[] {
  const state = EditorState.create({ schema: s, doc: d });
  const after = state.apply(state.tr.delete(cutFrom, d.content.size)).doc;
  const out: string[] = [];
  after.forEach((b) => out.push(b.textContent));
  return out;
}

const text = () =>
  doc(p('Sing, goddess, the wrath.'), p('Of Achilles, son of Peleus.'), p('That brought woes.'));

describe('a heading made at the cursor', () => {
  it('takes the whole paragraph for the name at its start, and the paragraphs below for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'Of Achilles'));
    expect(h.name?.textBetween(0, h.name.size)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(h.keptAsParagraph).toBe(false);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('takes the tail of the paragraph for the name in its middle, and leaves the head without the space before the cursor', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'));
    expect(h.name?.textBetween(0, h.name.size)).toBe('son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.', 'Of Achilles,']);
  });

  it('has an empty name at the end of a paragraph, and the paragraphs below for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'the wrath.', true));
    expect(h.name?.size).toBe(0);
    expect(words(h.body)).toEqual(['Of Achilles, son of Peleus.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('takes the last paragraph for the name with nothing for the text, and cuts nothing at the very end', () => {
    const d = text();
    const last = headingAt(d, at(d, 'That brought'));
    expect(last.name?.textBetween(0, last.name.size)).toBe('That brought woes.');
    expect(last.body.size).toBe(0);
    expect(left(d, last.cutFrom)).toEqual([
      'Sing, goddess, the wrath.',
      'Of Achilles, son of Peleus.',
    ]);

    const end = headingAt(d, at(d, 'woes.', true));
    expect(end.name?.size).toBe(0);
    expect(end.body.size).toBe(0);
    expect(left(d, end.cutFrom)).toEqual(words(d.content));
  });

  it('keeps italics in the name', () => {
    const d = doc(p('On the '), p(em('Iliad'), ' of Homer'), p('Below.'));
    const h = headingAt(d, at(d, 'Iliad'));
    expect(h.keptAsParagraph).toBe(false);
    const name = nameDoc(h.name!);
    expect(name.textContent).toBe('Iliad of Homer');
    expect(name.firstChild!.firstChild!.marks.map((m) => m.type.name)).toEqual(['em']);
  });

  it('keeps a tail with a citation, a note or a bold word as the first paragraph of the text, the name empty', () => {
    for (const [what, made] of [
      ['a citation', () => doc(p('Before.'), p('As sung ', citation(), ' here'), p('Below.'))],
      ['a note', () => doc(p('Before.'), p('As sung', note('a note'), ' here'), p('Below.'))],
      ['a bold word', () => doc(p('Before.'), p('As ', bold('sung'), ' here'), p('Below.'))],
    ] as const) {
      const d = made();
      const h = headingAt(d, at(d, 'As'));
      expect(h.name, what).toBeNull();
      expect(h.keptAsParagraph, what).toBe(true);
      expect(h.body.childCount, what).toBe(2);
      expect(h.body.firstChild!.textContent, what).toBe(d.child(1).textContent);
      expect(words(h.body)[1], what).toBe('Below.');
      expect(left(d, h.cutFrom), what).toEqual(['Before.']);
    }
  });

  it('keeps the tail in the middle of a paragraph with a citation as a paragraph of its kind', () => {
    const d = doc(
      s.node('paragraph', { kind: 'quote' }, [s.text('Sung '), citation(), s.text(' by him')]),
    );
    const h = headingAt(d, at(d, 'Sung', true));
    expect(h.keptAsParagraph).toBe(true);
    expect(h.body.firstChild!.attrs.kind).toBe('quote');
    expect(h.body.firstChild!.childCount).toBe(2);
    expect(left(d, h.cutFrom)).toEqual(['Sung']);
  });

  it('makes an empty element of an empty text', () => {
    const d = doc(p());
    const h = headingAt(d, 1);
    expect(h.name?.size).toBe(0);
    expect(h.body.size).toBe(0);
    expect(h.keptAsParagraph).toBe(false);
  });

  it('knows what a name can hold', () => {
    const f = (...nodes: Node[]) => p(...nodes).content;
    expect(nameable(f(s.text('plain'), em('slanted')))).toBe(true);
    expect(nameable(f(s.text('a'), citation()))).toBe(false);
    expect(nameable(f(bold('heavy')))).toBe(false);
    expect(nameable(f(s.text('a'), s.nodes.hard_break.create(), s.text('b')))).toBe(false);
  });
});
