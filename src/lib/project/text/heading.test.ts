import { describe, expect, it } from 'vitest';
import type { Fragment, Node } from 'prosemirror-model';
import { AllSelection, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { bodySchema } from '$lib/editor/schema';
import { headingAt, headingOfSelection, nameable, nameDoc } from './heading';

const s = bodySchema;
const p = (...content: (Node | string)[]) =>
  s.node(
    'paragraph',
    null,
    content.map((c) => (typeof c === 'string' ? s.text(c) : c)),
  );
const quote = (...content: (Node | string)[]) =>
  s.node(
    'paragraph',
    { kind: 'quote' },
    content.map((c) => (typeof c === 'string' ? s.text(c) : c)),
  );
const doc = (...blocks: Node[]) => s.node('doc', null, blocks);
const em = (text: string) => s.text(text, [s.marks.em.create()]);
const bold = (text: string) => s.text(text, [s.marks.strong.create()]);
const citation = () => s.nodes.citation.create({ items: [{ id: 'homer' }] });
const note = (text: string) => s.nodes.footnote.create(null, [s.text(text)]);
const sides = () => s.nodes.parallel.create(null, [side('Left.'), side('Right.')]);
const side = (words: string) => s.nodes.parallel_side.create(null, [p(words)]);

/** The paragraphs of a fragment as their words, one string each. */
const words = (f: Fragment) => {
  const out: string[] = [];
  f.forEach((b) => out.push(b.textContent));
  return out;
};

/** The words of a name, where it is one. */
const nameOf = (h: { name: Fragment | null }) => h.name?.textBetween(0, h.name.size);

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

/** The old text once the heading is cut from it, as the text's editor cuts it. */
function after(d: Node, cutFrom: number): Node {
  const state = EditorState.create({ schema: s, doc: d });
  const done = state.apply(state.tr.delete(cutFrom, d.content.size)).doc;
  done.check();
  return done;
}

/** What is left of the old text once the heading is made, one string for each paragraph. */
function left(d: Node, cutFrom: number): string[] {
  return words(after(d, cutFrom).content);
}

const text = () =>
  doc(p('Sing, goddess, the wrath.'), p('Of Achilles, son of Peleus.'), p('That brought woes.'));

describe('a paragraph made an element, with the cursor', () => {
  it('takes the whole paragraph for the name with the cursor in its middle, and the paragraphs below for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(h.keptAsParagraph).toBe(false);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('is the same with the cursor at the start of the paragraph', () => {
    const d = text();
    const h = headingAt(d, at(d, 'Of Achilles'));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('is the same with the cursor at the very end of the paragraph', () => {
    const d = text();
    const h = headingAt(d, at(d, 'Peleus.', true));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(h.keptAsParagraph).toBe(false);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('takes the first paragraph for the name, and all below it for the text, leaving an empty text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'goddess'));
    expect(nameOf(h)).toBe('Sing, goddess, the wrath.');
    expect(words(h.body)).toEqual(['Of Achilles, son of Peleus.', 'That brought woes.']);
    const old = after(d, h.cutFrom);
    expect(old.childCount).toBe(1);
    expect(old.firstChild!.type.name).toBe('paragraph');
    expect(old.textContent).toBe('');
  });

  it('takes the last paragraph for the name with nothing for the text, at its end too', () => {
    const d = text();
    for (const cursor of [at(d, 'That brought'), at(d, 'woes.', true)]) {
      const h = headingAt(d, cursor);
      expect(nameOf(h)).toBe('That brought woes.');
      expect(h.body.size).toBe(0);
      expect(left(d, h.cutFrom)).toEqual([
        'Sing, goddess, the wrath.',
        'Of Achilles, son of Peleus.',
      ]);
    }
  });

  it('leaves one empty paragraph where the only paragraph of a text is made the name', () => {
    const d = doc(p('Alone.'));
    const h = headingAt(d, at(d, 'Alone.', true));
    expect(nameOf(h)).toBe('Alone.');
    expect(h.body.size).toBe(0);
    const old = after(d, h.cutFrom);
    expect(old.childCount).toBe(1);
    expect(old.firstChild!.type.name).toBe('paragraph');
    expect(old.textContent).toBe('');
  });

  it('has an empty name in an empty paragraph at the end, takes the paragraph from the text, and leaves no empty line', () => {
    const d = doc(p('Sing.'), p('Of Achilles.'), p());
    const h = headingAt(d, d.content.size - 1);
    expect(h.name?.size).toBe(0);
    expect(h.body.size).toBe(0);
    expect(h.keptAsParagraph).toBe(false);
    expect(left(d, h.cutFrom)).toEqual(['Sing.', 'Of Achilles.']);
  });

  it('has an empty name in an empty paragraph, the paragraphs below going in', () => {
    const d = doc(p('Sing.'), p(), p('Of Achilles.'), p('That brought woes.'));
    const h = headingAt(d, p('Sing.').nodeSize + 1);
    expect(h.name?.size).toBe(0);
    expect(words(h.body)).toEqual(['Of Achilles.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing.']);
  });

  it('makes an empty element of an empty text', () => {
    const d = doc(p());
    const h = headingAt(d, 1);
    expect(h.name?.size).toBe(0);
    expect(h.body.size).toBe(0);
    expect(h.keptAsParagraph).toBe(false);
    expect(after(d, h.cutFrom).textContent).toBe('');
  });

  it('takes the spaces from the two ends of the name', () => {
    const d = doc(p('Before.'), p('  Padded words  '));
    const h = headingAt(d, at(d, 'words'));
    expect(nameOf(h)).toBe('Padded words');
  });

  it('keeps italics in the name', () => {
    const d = doc(p('On the '), p(em('Iliad'), ' of Homer'), p('Below.'));
    const h = headingAt(d, at(d, 'Iliad'));
    expect(h.keptAsParagraph).toBe(false);
    const name = nameDoc(h.name!);
    expect(name.textContent).toBe('Iliad of Homer');
    expect(name.firstChild!.firstChild!.marks.map((m) => m.type.name)).toEqual(['em']);
  });

  it('keeps a paragraph with a citation, a note or a bold word as the first paragraph of the text, the name empty', () => {
    for (const [what, made] of [
      ['a citation', () => doc(p('Before.'), p('As sung ', citation(), ' here'), p('Below.'))],
      ['a note', () => doc(p('Before.'), p('As sung', note('a note'), ' here'), p('Below.'))],
      ['a bold word', () => doc(p('Before.'), p('As ', bold('sung'), ' here'), p('Below.'))],
    ] as const) {
      for (const where of ['As', 'here']) {
        const d = made();
        const h = headingAt(d, at(d, where, where === 'here'));
        expect(h.name, what).toBeNull();
        expect(h.keptAsParagraph, what).toBe(true);
        expect(h.body.childCount, what).toBe(2);
        expect(h.body.firstChild!.textContent, what).toBe(d.child(1).textContent);
        expect(words(h.body)[1], what).toBe('Below.');
        expect(left(d, h.cutFrom), what).toEqual(['Before.']);
      }
    }
  });

  it('keeps a paragraph that cannot be a name as a paragraph of its kind', () => {
    const d = doc(s.node('paragraph', { kind: 'quote' }, [s.text('Sung '), citation()]));
    const h = headingAt(d, at(d, 'Sung', true));
    expect(h.keptAsParagraph).toBe(true);
    expect(h.body.firstChild!.attrs.kind).toBe('quote');
    expect(h.body.firstChild!.childCount).toBe(2);
    expect(after(d, h.cutFrom).textContent).toBe('');
  });

  it('knows what a name can hold', () => {
    const f = (...nodes: Node[]) => p(...nodes).content;
    expect(nameable(f(s.text('plain'), em('slanted')))).toBe(true);
    expect(nameable(f(s.text('a'), citation()))).toBe(false);
    expect(nameable(f(bold('heavy')))).toBe(false);
    expect(nameable(f(s.text('a'), s.nodes.hard_break.create(), s.text('b')))).toBe(false);
  });
});

describe('a paragraph made an element, with words selected', () => {
  it('takes what is selected for the name, leaves what stood before without the space at its end, and begins the text with what stood after', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'), at(d, 'son of', true));
    expect(nameOf(h)).toBe('son of');
    expect(h.keptAsParagraph).toBe(false);
    expect(words(h.body)).toEqual(['Peleus.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.', 'Of Achilles,']);
  });

  it('gives the first paragraph of the text the kind of the paragraph, and none of the spaces it would begin with', () => {
    const d = doc(quote('Before the name and after it'), p('Below.'));
    const h = headingAt(d, at(d, 'the name'), at(d, 'the name', true));
    expect(nameOf(h)).toBe('the name');
    expect(h.body.childCount).toBe(2);
    expect(h.body.firstChild!.attrs.kind).toBe('quote');
    expect(h.body.firstChild!.textContent).toBe('and after it');
    expect(left(d, h.cutFrom)).toEqual(['Before']);
  });

  it('makes no paragraph of what stands after where nothing is left', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'), at(d, 'Peleus.', true));
    expect(nameOf(h)).toBe('son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);

    const spaces = doc(p('Name and '), p('Below.'));
    const h2 = headingAt(spaces, at(spaces, 'and'), at(spaces, 'and', true));
    expect(nameOf(h2)).toBe('and');
    expect(words(h2.body)).toEqual(['Below.']);
  });

  it('takes the paragraph from the text where what stood before is only spaces', () => {
    const d = doc(p('Before.'), p('   The name and more'), p('Below.'));
    const h = headingAt(d, at(d, 'The name'), at(d, 'The name', true));
    expect(nameOf(h)).toBe('The name');
    expect(words(h.body)).toEqual(['and more', 'Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.']);
  });

  it('takes the paragraph from the text where the selection begins at its start', () => {
    const d = text();
    const h = headingAt(d, at(d, 'Of Achilles'), at(d, 'Of Achilles,', true));
    expect(nameOf(h)).toBe('Of Achilles,');
    expect(words(h.body)).toEqual(['son of Peleus.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('takes the spaces from the two ends of what is selected', () => {
    const d = doc(p('One two three'));
    const from = at(d, ' two');
    const h = headingAt(d, from, at(d, ' two ', true));
    expect(nameOf(h)).toBe('two');
    expect(words(h.body)).toEqual(['three']);
    expect(left(d, h.cutFrom)).toEqual(['One']);
  });

  it('keeps italics in a name that is selected', () => {
    const d = doc(p('See the ', em('Iliad'), ' again'));
    const h = headingAt(d, at(d, 'the'), at(d, 'Iliad', true));
    expect(h.keptAsParagraph).toBe(false);
    expect(nameDoc(h.name!).textContent).toBe('the Iliad');
    expect(words(h.body)).toEqual(['again']);
  });

  it('keeps what is selected, with what follows it in the paragraph, as one paragraph where a name cannot hold it', () => {
    const d = doc(p('Before the ', bold('bold'), ' words and more'), p('Below.'));
    const h = headingAt(d, at(d, 'the '), at(d, 'bold', true));
    expect(h.name).toBeNull();
    expect(h.keptAsParagraph).toBe(true);
    expect(words(h.body)).toEqual(['the bold words and more', 'Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before']);
  });

  it('makes a name of what is selected and a paragraph of what follows it, even where that holds a citation', () => {
    const d = doc(p('Before the name and ', citation(), ' more'), p('Below.'));
    const h = headingAt(d, at(d, 'the name'), at(d, 'the name', true));
    expect(nameOf(h)).toBe('the name');
    expect(h.keptAsParagraph).toBe(false);
    expect(h.body.childCount).toBe(2);
    expect(h.body.firstChild!.childCount).toBe(3);
    expect(h.body.firstChild!.textContent).toBe('and  more');
  });

  it('takes what is selected of the first paragraph for the name, and every paragraph after it whole for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'goddess'), at(d, 'son of', true));
    expect(nameOf(h)).toBe('goddess, the wrath.');
    expect(h.keptAsParagraph).toBe(false);
    expect(words(h.body)).toEqual(['Of Achilles, son of Peleus.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing,']);
  });

  it('begins with the next paragraph where the selection begins at the very end of one and goes on into the next', () => {
    const d = text();
    const h = headingAt(d, at(d, 'the wrath.', true), at(d, 'Of Achilles, son of Peleus.', true));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);

    const inside = headingAt(d, at(d, 'the wrath.', true), at(d, 'Of Achilles, son', true));
    expect(nameOf(inside)).toBe('Of Achilles, son');
    expect(words(inside.body)).toEqual(['of Peleus.', 'That brought woes.']);
  });

  it('reads a selection of nothing but the break between two paragraphs as the cursor in the second', () => {
    const d = text();
    const h = headingAt(d, at(d, 'the wrath.', true), at(d, 'Of Achilles'));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing, goddess, the wrath.']);
  });

  it('takes what is selected to the end of its paragraph, and the blocks after it whole, where the selection ends in a block', () => {
    const d = doc(p('Before.'), p('The name here'), sides(), p('Below.'));
    const h = headingAt(d, at(d, 'name'), at(d, 'Left.'));
    expect(nameOf(h)).toBe('name here');
    expect(h.body.childCount).toBe(2);
    expect(h.body.child(0).type.name).toBe('parallel');
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'The']);
  });
});

describe('a paragraph made an element, within what stands as one block', () => {
  it('leaves the block whole, the name empty and what follows the block for the text', () => {
    const d = doc(p('Before.'), sides(), p('Below.'));
    const h = headingAt(d, at(d, 'Left.'));
    expect(h.name?.size).toBe(0);
    expect(h.keptAsParagraph).toBe(false);
    expect(words(h.body)).toEqual(['Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'Left.Right.']);
  });

  it('does the same with words selected within the block', () => {
    const d = doc(p('Before.'), sides(), p('Below.'));
    const h = headingAt(d, at(d, 'Left'), at(d, 'Left', true));
    expect(h.name?.size).toBe(0);
    expect(words(h.body)).toEqual(['Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'Left.Right.']);
  });
});

describe('what of a selection is read', () => {
  it('is the words selected, for a selection of text', () => {
    const d = text();
    const state = EditorState.create({
      schema: s,
      doc: d,
      selection: TextSelection.create(d, at(d, 'son of'), at(d, 'son of', true)),
    });
    expect(nameOf(headingOfSelection(d, state.selection))).toBe('son of');
  });

  it('is the whole paragraph, for a selection that is not of text, as if the cursor stood at its start', () => {
    const d = doc(p('Before.'), p('A break ', s.nodes.hard_break.create(), 'follows.'), p('Last.'));
    const picked = NodeSelection.create(d, at(d, 'A break') + 'A break '.length);
    expect(picked.empty).toBe(false);
    const h = headingOfSelection(d, picked);
    // Were the break taken for what is selected, only 'follows.' would be kept.
    expect(h.keptAsParagraph).toBe(true);
    expect(words(h.body)).toEqual(['A break follows.', 'Last.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.']);
  });

  it('is the cursor at the start of the text, for everything selected by Ctrl+A where that is not a text selection', () => {
    const d = text();
    const h = headingOfSelection(d, new AllSelection(d));
    expect(h.name?.size).toBe(0);
    expect(h.cutFrom).toBe(0);
    expect(h.body.eq(d.content)).toBe(true);
  });
});
