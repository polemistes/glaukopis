import { describe, expect, it } from 'vitest';
import type { Fragment, Node } from 'prosemirror-model';
import { AllSelection, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { bodySchema, titleSchema } from '$lib/editor/schema';
import { headingAt, headingOfSelection, nameDoc } from './heading';

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
const br = () => s.nodes.hard_break.create();
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

/** The paragraphs of a fragment as what they hold, one string each: words as they are, a line break as a slash, any other inline node by its name in brackets. */
const shown = (f: Fragment) => {
  const out: string[] = [];
  f.forEach((b) => {
    let line = '';
    b.forEach((n) => {
      line += n.isText ? n.text : n.type.name === 'hard_break' ? '/' : `[${n.type.name}]`;
    });
    out.push(line);
  });
  return out;
};

/** The words of a name. */
const nameOf = (h: { name: Fragment }) => h.name.textBetween(0, h.name.size);

/** A name as its stretches of words, each with the names of its marks. */
const marked = (name: Fragment) => {
  const out: [string, string[]][] = [];
  name.forEach((n) => out.push([n.text!, n.marks.map((m) => m.type.name)]));
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

/** The same, with the line breaks and the other inline nodes shown. */
function leftShown(d: Node, cutFrom: number): string[] {
  return shown(after(d, cutFrom).content);
}

const text = () =>
  doc(p('Sing, goddess, the wrath.'), p('Of Achilles, son of Peleus.'), p('That brought woes.'));

/** A paragraph of three lines between two paragraphs. */
const lines = () =>
  doc(p('Before.'), p('First line', br(), 'Second line', br(), 'Third line'), p('Below.'));

describe('a paragraph made an element, with the cursor', () => {
  it('takes the whole paragraph for the name with the cursor in its middle, and the paragraphs below for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'));
    expect(nameOf(h)).toBe('Of Achilles, son of Peleus.');
    expect(words(h.body)).toEqual(['That brought woes.']);
    expect(h.holds).toEqual([]);
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
    expect(h.holds).toEqual([]);
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
    expect(h.name.size).toBe(0);
    expect(h.body.size).toBe(0);
    expect(h.holds).toEqual([]);
    expect(left(d, h.cutFrom)).toEqual(['Sing.', 'Of Achilles.']);
  });

  it('has an empty name in an empty paragraph, the paragraphs below going in', () => {
    const d = doc(p('Sing.'), p(), p('Of Achilles.'), p('That brought woes.'));
    const h = headingAt(d, p('Sing.').nodeSize + 1);
    expect(h.name.size).toBe(0);
    expect(words(h.body)).toEqual(['Of Achilles.', 'That brought woes.']);
    expect(left(d, h.cutFrom)).toEqual(['Sing.']);
  });

  it('makes an empty element of an empty text', () => {
    const d = doc(p());
    const h = headingAt(d, 1);
    expect(h.name.size).toBe(0);
    expect(h.body.size).toBe(0);
    expect(h.holds).toEqual([]);
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
    expect(h.holds).toEqual([]);
    const name = nameDoc(h.name);
    expect(name.textContent).toBe('Iliad of Homer');
    expect(name.firstChild!.firstChild!.marks.map((m) => m.type.name)).toEqual(['em']);
  });
});

describe('a paragraph made an element, whatever marks its words have', () => {
  it('takes a paragraph with a bold word for the name, the bold gone and the words kept, and says nothing of it', () => {
    for (const where of ['As', 'here']) {
      const d = doc(p('Before.'), p('As ', bold('sung'), ' here'), p('Below.'));
      const h = headingAt(d, at(d, where, where === 'here'));
      expect(nameOf(h)).toBe('As sung here');
      expect(marked(h.name)).toEqual([['As sung here', []]]);
      expect(h.holds).toEqual([]);
      expect(words(h.body)).toEqual(['Below.']);
      expect(left(d, h.cutFrom)).toEqual(['Before.']);
    }
  });

  it('keeps the marks a name may have and drops the others, side by side', () => {
    const d = doc(
      p(
        em('Iliad'),
        ' and ',
        bold('Homer'),
        ' and ',
        s.text('Troy', [s.marks.em.create(), s.marks.underline.create()]),
        ' and ',
        s.text('II', [s.marks.smallcaps.create()]),
        s.text('3', [s.marks.sup.create()]),
        s.text('4', [s.marks.sub.create()]),
      ),
    );
    const h = headingAt(d, at(d, 'Homer'));
    expect(marked(h.name)).toEqual([
      ['Iliad', ['em']],
      [' and Homer and ', []],
      ['Troy', ['em']],
      [' and ', []],
      ['II', ['smallcaps']],
      ['3', ['sup']],
      ['4', ['sub']],
    ]);
    expect(h.holds).toEqual([]);
    const name = nameDoc(h.name);
    expect(name.textContent).toBe('Iliad and Homer and Troy and II34');
    name.check();
  });

  it('drops every mark a name cannot have', () => {
    const own = new Set(Object.keys(titleSchema.marks));
    const others = Object.keys(s.marks).filter((m) => !own.has(m));
    expect(others.length).toBeGreaterThan(4);
    for (const mark of others) {
      const made = s.marks[mark].create(mark === 'link' ? { href: 'https://example.org' } : null);
      const d = doc(p(s.text('Some words', [made])));
      const h = headingAt(d, at(d, 'words'));
      expect(marked(h.name), mark).toEqual([['Some words', []]]);
      expect(h.holds, mark).toEqual([]);
    }
  });
});

describe('a paragraph made an element, where it has line breaks', () => {
  it('takes the first line for the name, and the lines after it for the start of the text', () => {
    const d = lines();
    const h = headingAt(d, at(d, 'First'));
    expect(nameOf(h)).toBe('First line');
    expect(shown(h.body)).toEqual(['Second line/Third line', 'Below.']);
    expect(h.holds).toEqual([]);
    expect(leftShown(d, h.cutFrom)).toEqual(['Before.']);
  });

  it('takes the middle line for the name, leaves the line before it as the paragraph it was, and begins the text with the line after it', () => {
    const d = lines();
    const h = headingAt(d, at(d, 'ond li'));
    expect(nameOf(h)).toBe('Second line');
    expect(shown(h.body)).toEqual(['Third line', 'Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['Before.', 'First line']);
  });

  it('takes the last line for the name, the lines before it staying, and nothing of the paragraph following', () => {
    const d = lines();
    const h = headingAt(d, at(d, 'Third line', true));
    expect(nameOf(h)).toBe('Third line');
    expect(shown(h.body)).toEqual(['Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['Before.', 'First line/Second line']);
  });

  it('takes the line before a line break for the cursor at the end of it, and the line after for the cursor at the start of it', () => {
    const d = lines();
    expect(nameOf(headingAt(d, at(d, 'First line', true)))).toBe('First line');
    expect(nameOf(headingAt(d, at(d, 'Second line')))).toBe('Second line');
  });

  it('gives the paragraph that begins the text the kind and the attributes of the paragraph', () => {
    const d = doc(quote('One', br(), 'Two', br(), 'Three'));
    const h = headingAt(d, at(d, 'One'));
    expect(h.body.childCount).toBe(1);
    expect(h.body.firstChild!.attrs.kind).toBe('quote');
    expect(shown(h.body)).toEqual(['Two/Three']);
  });

  it('has an empty name in an empty line, and leaves no break at the end of what stays', () => {
    const d = doc(p('One', br(), br(), 'Three'));
    const h = headingAt(d, at(d, 'One', true) + 1);
    expect(h.name.size).toBe(0);
    expect(shown(h.body)).toEqual(['Three']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One']);
  });

  it('leaves no empty line at the end of what stays or at the start of the text, where lines before or after are empty', () => {
    const d = doc(p('One', br(), br(), 'Three', br(), br(), 'Five'));
    const h = headingAt(d, at(d, 'Three'));
    expect(nameOf(h)).toBe('Three');
    expect(shown(h.body)).toEqual(['Five']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One']);
  });

  it('takes the paragraph from the text where only empty lines stand before the name', () => {
    const d = doc(p('Before.'), p(br(), 'Name', br(), 'More'));
    const h = headingAt(d, at(d, 'Name'));
    expect(nameOf(h)).toBe('Name');
    expect(shown(h.body)).toEqual(['More']);
    expect(leftShown(d, h.cutFrom)).toEqual(['Before.']);
  });

  it('keeps the marks a name may have on the words of its line, and drops a line mark that only says how the line is set', () => {
    const d = doc(p(s.nodes.linemark.create({ indent: 2 }), em('Sing'), ' goddess', br(), 'Next'));
    const h = headingAt(d, at(d, 'goddess'));
    expect(marked(h.name)).toEqual([
      ['Sing', ['em']],
      [' goddess', []],
    ]);
    expect(h.holds).toEqual([]);
    expect(shown(h.body)).toEqual(['Next']);
  });

  it('names a number or words set by hand in the margin of the line as what a name cannot hold', () => {
    for (const attrs of [{ number: '12' }, { margin: 'Chryses' }]) {
      const d = doc(p(s.nodes.linemark.create(attrs), 'Sing goddess', br(), 'Next'));
      expect(headingAt(d, at(d, 'goddess')).holds).toEqual(['linemark']);
      // The line after it holds none, and is made a name as any line is.
      const next = headingAt(d, at(d, 'Next'));
      expect(next.holds).toEqual([]);
      expect(nameOf(next)).toBe('Next');
    }
  });
});

describe('a paragraph that holds what a name cannot', () => {
  it('names a citation wherever it stands in the paragraph, so that nothing is made of it', () => {
    for (const [what, made] of [
      ['at the start', () => p(citation(), ' As sung')],
      ['in the middle', () => p('As ', citation(), ' sung')],
      ['at the end', () => p('As sung ', citation())],
    ] as const) {
      const d = doc(p('Before.'), made(), p('Below.'));
      expect(headingAt(d, at(d, 'sung')).holds, what).toEqual(['citation']);
    }
  });

  it('names each kind of thing once, in the order they stand', () => {
    const d = doc(
      p(
        'A',
        citation(),
        'B',
        note('a note'),
        'C',
        s.nodes.math.create({ tex: 'x^2' }),
        'D',
        s.nodes.refmark.create({ label: '3:16' }),
        'E',
        s.nodes.crossref.create({ target: 'fig' }),
        'F',
        citation(),
        note('another'),
      ),
    );
    expect(headingAt(d, at(d, 'C')).holds).toEqual([
      'citation',
      'footnote',
      'math',
      'refmark',
      'crossref',
    ]);
  });

  it('names what a paragraph of nothing but such things holds', () => {
    for (const thing of [citation(), s.nodes.math.create({ tex: 'x' }), note('a note')]) {
      const d = doc(p('Before.'), p(thing), p('Below.'));
      expect(headingAt(d, at(d, 'Before.', true) + 2).holds).toEqual([thing.type.name]);
    }
  });

  it('looks only at the line the cursor is in, where the paragraph has line breaks', () => {
    const d = doc(p('One', br(), 'Two ', citation(), br(), 'Three', note('a note'), br(), 'Four'));
    expect(headingAt(d, at(d, 'Two')).holds).toEqual(['citation']);
    expect(headingAt(d, at(d, 'Three')).holds).toEqual(['footnote']);
    // A line without any is made a name, and the lines after it, with what they hold, begin the text.
    const one = headingAt(d, at(d, 'One'));
    expect(one.holds).toEqual([]);
    expect(nameOf(one)).toBe('One');
    expect(shown(one.body)).toEqual(['Two [citation]/Three[footnote]/Four']);
  });

  it('moves nothing and takes nothing out: what follows the name is as it stood', () => {
    const d = doc(p('Name', br(), 'After ', citation(), ' it'), p('Below.'));
    const h = headingAt(d, at(d, 'Name'));
    expect(h.holds).toEqual([]);
    expect(shown(h.body)).toEqual(['After [citation] it', 'Below.']);
  });
});

describe('a paragraph made an element, with words selected', () => {
  it('takes what is selected for the name, leaves what stood before without the space at its end, and begins the text with what stood after', () => {
    const d = text();
    const h = headingAt(d, at(d, 'son of'), at(d, 'son of', true));
    expect(nameOf(h)).toBe('son of');
    expect(h.holds).toEqual([]);
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

  it('keeps italics in a name that is selected, and drops bold', () => {
    const d = doc(p('See the ', em('Iliad'), ' and ', bold('Odyssey'), ' again'));
    const h = headingAt(d, at(d, 'the'), at(d, 'Odyssey', true));
    expect(h.holds).toEqual([]);
    expect(marked(h.name)).toEqual([
      ['the ', []],
      ['Iliad', ['em']],
      [' and Odyssey', []],
    ]);
    expect(words(h.body)).toEqual(['again']);
  });

  it('makes a name of what is selected and a paragraph of what follows it, even where that holds a citation', () => {
    const d = doc(p('Before the name and ', citation(), ' more'), p('Below.'));
    const h = headingAt(d, at(d, 'the name'), at(d, 'the name', true));
    expect(nameOf(h)).toBe('the name');
    expect(h.holds).toEqual([]);
    expect(h.body.childCount).toBe(2);
    expect(h.body.firstChild!.childCount).toBe(3);
    expect(h.body.firstChild!.textContent).toBe('and  more');
  });

  it('names a citation within what is selected, and none that stands after it', () => {
    const d = doc(p('Before the name', citation(), ' and more'), p('Below.'));
    expect(headingAt(d, at(d, 'the name'), at(d, 'the name', true) + 1).holds).toEqual([
      'citation',
    ]);
    expect(headingAt(d, at(d, 'the name'), at(d, 'the name', true)).holds).toEqual([]);
  });

  it('takes what is selected of the first paragraph for the name, and every paragraph after it whole for the text', () => {
    const d = text();
    const h = headingAt(d, at(d, 'goddess'), at(d, 'son of', true));
    expect(nameOf(h)).toBe('goddess, the wrath.');
    expect(h.holds).toEqual([]);
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

describe('a paragraph made an element, with words selected where there are line breaks', () => {
  const four = () => doc(p('One two', br(), 'three four', br(), 'five'), p('Below.'));

  it('takes what is selected within a line for the name, and begins the text with the rest of the line and the lines after it', () => {
    const d = four();
    const h = headingAt(d, at(d, 'three'), at(d, 'three', true));
    expect(nameOf(h)).toBe('three');
    expect(shown(h.body)).toEqual(['four/five', 'Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One two']);
  });

  it('ends the name at the first line break within what is selected, and begins the text with all that follows it', () => {
    const d = four();
    const h = headingAt(d, at(d, 'two'), at(d, 'four', true));
    expect(nameOf(h)).toBe('two');
    expect(shown(h.body)).toEqual(['three four/five', 'Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One']);
  });

  it('begins with the next line where the selection begins at the very end of a line and goes on into the next', () => {
    const d = four();
    const h = headingAt(d, at(d, 'One two', true), at(d, 'three', true));
    expect(nameOf(h)).toBe('three');
    expect(shown(h.body)).toEqual(['four/five', 'Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One two']);
  });

  it('reads a selection of nothing but a line break as the cursor in the line after it', () => {
    const d = four();
    const h = headingAt(d, at(d, 'One two', true), at(d, 'One two', true) + 1);
    expect(nameOf(h)).toBe('three four');
    expect(shown(h.body)).toEqual(['five', 'Below.']);
  });

  it('takes a whole line selected for the name, and the next line for the text, the break between them not kept', () => {
    const d = four();
    const h = headingAt(d, at(d, 'three'), at(d, 'three four', true));
    expect(nameOf(h)).toBe('three four');
    expect(shown(h.body)).toEqual(['five', 'Below.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['One two']);
  });

  it('takes the first line within a selection over several paragraphs, and every paragraph after the first whole', () => {
    const d = four();
    const h = headingAt(d, at(d, 'two'), at(d, 'Below'));
    expect(nameOf(h)).toBe('two');
    expect(shown(h.body)).toEqual(['three four/five', 'Below.']);
  });
});

describe('a paragraph made an element, within what stands as one block', () => {
  it('leaves the block whole, the name empty and what follows the block for the text', () => {
    const d = doc(p('Before.'), sides(), p('Below.'));
    const h = headingAt(d, at(d, 'Left.'));
    expect(h.name.size).toBe(0);
    expect(h.holds).toEqual([]);
    expect(words(h.body)).toEqual(['Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'Left.Right.']);
  });

  it('does the same with words selected within the block', () => {
    const d = doc(p('Before.'), sides(), p('Below.'));
    const h = headingAt(d, at(d, 'Left'), at(d, 'Left', true));
    expect(h.name.size).toBe(0);
    expect(words(h.body)).toEqual(['Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'Left.Right.']);
  });

  it('leaves a figure whole, and does not take its caption for the name', () => {
    const d = doc(
      p('Before.'),
      s.nodes.figure.create({ file: 'a'.repeat(64), extension: 'png' }, s.text('A caption')),
      p('Below.'),
    );
    const h = headingAt(d, at(d, 'caption'));
    expect(h.name.size).toBe(0);
    expect(words(h.body)).toEqual(['Below.']);
    expect(left(d, h.cutFrom)).toEqual(['Before.', 'A caption']);
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

  it('is the cursor at its start, for a selection that is not of text', () => {
    const d = doc(p('Before.'), p('A break ', br(), 'follows.'), p('Last.'));
    const picked = NodeSelection.create(d, at(d, 'A break') + 'A break '.length);
    expect(picked.empty).toBe(false);
    const h = headingOfSelection(d, picked);
    // Were the break taken for what is selected, the line after it would be the name.
    expect(nameOf(h)).toBe('A break');
    expect(shown(h.body)).toEqual(['follows.', 'Last.']);
    expect(leftShown(d, h.cutFrom)).toEqual(['Before.']);
  });

  it('is the cursor at the start of the text, for everything selected by Ctrl+A where that is not a text selection', () => {
    const d = text();
    const h = headingOfSelection(d, new AllSelection(d));
    expect(h.name.size).toBe(0);
    expect(h.cutFrom).toBe(0);
    expect(h.body.eq(d.content)).toBe(true);
  });
});
