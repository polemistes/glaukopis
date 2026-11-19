import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { isHandMark } from '$lib/byhand/hand';
import { formOf } from '$lib/editor/form';
import { everything, trapBlocks } from '$lib/org/fixtures';
import { blockElements, writeBody } from './blocks';
import {
  blocksText,
  bodyFacts,
  BodyReading,
  boxed,
  paragraph,
  readBody,
  type Block,
  type Boxed,
  type Inline,
} from './text';

const words = (text: string, name = 'text'): Block =>
  paragraph([{ kind: 'text', text, marks: {} }], name);
const inBox = (block: Block, rich: Boxed): Block => boxed(block, rich);

/** A text of a document of its own, holding the blocks. */
function textOf(blocks: Block[]): Y.XmlFragment {
  const text = new Y.Doc().getXmlFragment('text');
  text.insert(0, blockElements(blocks));
  return text;
}

/**
 * The text that uses everything there is, of all the elements of the
 * fixture, and the traps of Org: as it reads when it has been written once,
 * so that what is given an id when it is written has one.
 */
function everythingThereIs(): Block[] {
  return readBody(textOf([...everything().elements.flatMap((e) => e.blocks), ...trapBlocks()]));
}

/** Blocks as one box: the first begins it, the rest stand in it. Two texts side by side stand in none. */
function allInOneBox(blocks: Block[]): Block[] {
  let begun = false;
  return blocks.map((b) => {
    if (b.kind === 'parallel') {
      begun = false;
      return b;
    }
    const rich: Boxed = begun ? 'in' : 'first';
    begun = true;
    return boxed(b, rich);
  });
}

/** Words without what is set by hand of them. */
function plainWords(inlines: Inline[]): Inline[] {
  const merged: Inline[] = [];
  for (const i of inlines) {
    if (i.kind === 'footnote') {
      merged.push({ ...i, content: plainWords(i.content) });
      continue;
    }
    if (i.kind !== 'text') {
      merged.push(i);
      continue;
    }
    const marks = Object.fromEntries(Object.entries(i.marks).filter(([name]) => !isHandMark(name)));
    const last = merged[merged.length - 1];
    // Words that differed only by hand are one run of words without it.
    if (last?.kind === 'text' && JSON.stringify(last.marks) === JSON.stringify(marks))
      merged[merged.length - 1] = { ...last, text: last.text + i.text };
    else merged.push({ ...i, marks });
  }
  return merged;
}

/** A block without its look: with nothing said of a box, and nothing set by hand. */
function plainBlock(block: Block): Block {
  const b = boxed(block, null);
  if (b.kind === 'paragraph') {
    const { hand: _, ...rest } = b;
    return { ...rest, content: plainWords(b.content) };
  }
  if (b.kind === 'figure') return { ...b, caption: plainWords(b.caption) };
  if (b.kind === 'row') return { ...b, items: b.items.map(plainBlock) };
  if (b.kind === 'table')
    return {
      ...b,
      caption: plainWords(b.caption),
      rows: b.rows.map((row) =>
        row.map((cell) => ({ ...cell, content: cell.content.map(plainBlock) })),
      ),
    };
  return b;
}

/** Blocks without their look: what is left when the box is taken away. */
const unboxed = (blocks: Block[]): Block[] => blocks.map(plainBlock);

describe('a box of rich text, as the project keeps it', () => {
  it('is one block of the document, around the blocks that say they stand in it', () => {
    const text = textOf([
      words('Before'),
      inBox(words('One', 'quote'), 'first'),
      inBox(words('Two'), 'in'),
      words('After'),
    ]);
    expect(text.toArray().map((e) => (e as Y.XmlElement).nodeName)).toEqual([
      'paragraph',
      'rich',
      'paragraph',
    ]);
    const box = text.get(1) as Y.XmlElement;
    expect(box.toArray().map((e) => (e as Y.XmlElement).getAttribute('kind'))).toEqual([
      'quote',
      'text',
    ]);
  });

  it('is begun anew by a block that says it is the first, and by one that follows blocks in no box', () => {
    const text = textOf([
      inBox(words('A'), 'first'),
      inBox(words('B'), 'in'),
      inBox(words('C'), 'first'),
      words('Between'),
      // Said to stand in a box, after a block that stands in none: it begins one.
      inBox(words('D'), 'in'),
    ]);
    expect(
      text.toArray().map((e) => `${(e as Y.XmlElement).nodeName}:${(e as Y.XmlElement).length}`),
    ).toEqual(['rich:2', 'rich:1', 'paragraph:1', 'rich:1']);
  });

  it('is read back as the blocks it holds, each saying that it stands in it', () => {
    const blocks = [
      words('Before'),
      inBox(words('One', 'quote'), 'first'),
      inBox({ kind: 'break', what: 'page' }, 'in'),
      inBox(words('Two'), 'in'),
      inBox(words('Another'), 'first'),
      words('After'),
    ];
    expect(readBody(textOf(blocks))).toEqual(blocks);
  });

  it('is never written within a side of two texts, whatever the blocks there say', () => {
    const text = textOf([
      { kind: 'parallel', left: [inBox(words('Left'), 'first')], right: [words('Right')] },
    ]);
    expect(text.toString()).not.toContain('<rich>');
    expect(blocksText(readBody(text))).toBe('Left\nRight');
  });

  it('holds the text that uses everything there is, and gives it back', () => {
    const blocks = allInOneBox(everythingThereIs());
    const text = textOf(blocks);
    expect(text.toString()).toContain('<rich>');
    // Read back, written and read again, it is what it was read as: nothing is lost on the way.
    const read = readBody(text);
    expect(readBody(textOf(read))).toEqual(read);
    expect(unboxed(read)).toEqual(readBody(textOf(unboxed(blocks))));
  });

  it('keeps what is set by hand in a box, and nowhere else: not outside one, and not in a note at the foot', () => {
    const red = { colour: { value: '#a02020' } };
    const byHand = (rich: Boxed | null): Block =>
      boxed(
        {
          ...paragraph([
            {
              kind: 'text',
              text: 'Big',
              marks: { size: { pt: 20 }, font: { family: 'Futura' }, strong: {} },
            },
            { kind: 'footnote', content: [{ kind: 'text', text: 'A note', marks: red }] },
          ]),
          hand: { align: 'center', spaceAfter: '12pt' },
        },
        rich,
      );
    const [inside] = readBody(textOf([byHand('first')]));
    expect(inside).toEqual({
      ...byHand('first'),
      content: [
        // A mark that holds nothing is read as nothing held.
        {
          kind: 'text',
          text: 'Big',
          marks: { size: { pt: 20 }, font: { family: 'Futura' }, strong: {} },
        },
        { kind: 'footnote', content: [{ kind: 'text', text: 'A note', marks: {} }] },
      ],
    });
    const [outside] = readBody(textOf([byHand(null)]));
    expect(outside).toEqual(plainBlock(byHand(null)));
    expect(JSON.stringify(outside)).not.toMatch(/size|font|colour|hand/);
    // What is no size, no font and no colour is not kept as one.
    const [bad] = readBody(
      textOf([
        boxed(
          paragraph([
            {
              kind: 'text',
              text: 'x',
              marks: { size: { pt: 9000 }, colour: { value: 'red' }, font: { family: '' } },
            },
          ]),
          'first',
        ),
      ]),
    );
    expect(bad).toEqual(boxed(paragraph([{ kind: 'text', text: 'x', marks: {} }]), 'first'));
  });

  it('keeps the ground of words in every text, in a box and outside one, and in a note at the foot', () => {
    const yellow = { ground: { value: '#ffe066' } };
    const marked = (rich: Boxed | null): Block =>
      boxed(
        paragraph([
          { kind: 'text', text: 'Marked', marks: yellow },
          { kind: 'footnote', content: [{ kind: 'text', text: 'A note', marks: yellow }] },
        ]),
        rich,
      );
    expect(readBody(textOf([marked(null)]))).toEqual([marked(null)]);
    expect(readBody(textOf([marked('first')]))).toEqual([marked('first')]);
    // What is no colour is no ground.
    const [bad] = readBody(
      textOf([paragraph([{ kind: 'text', text: 'x', marks: { ground: { value: 'yellow' } } }])]),
    );
    expect(bad).toEqual(paragraph([{ kind: 'text', text: 'x', marks: {} }]));
  });

  it('has the document say the second form of the texts when a text is written with a ground of words', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    writeBody(text, [words('Plain')]);
    expect(formOf(doc)).toBe(1);
    writeBody(text, [
      paragraph([{ kind: 'text', text: 'Marked', marks: { ground: { value: '#ffe066' } } }]),
    ]);
    expect(formOf(doc)).toBe(2);
    // And not by a text written after it that has none.
    const other = new Y.Doc();
    blockElements([
      paragraph([{ kind: 'text', text: 'Marked', marks: { ground: { value: '#ffe066' } } }]),
    ]);
    writeBody(other.getXmlFragment('text'), [words('Plain')]);
    expect(formOf(other)).toBe(1);
  });

  it('has the document say the second form of the texts when a text is written with one', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    writeBody(text, [words('Plain')]);
    expect(formOf(doc)).toBe(1);
    writeBody(text, [inBox(words('In a box'), 'first')]);
    expect(formOf(doc)).toBe(2);
  });
});

/** Take the box away, and nothing but the look changes (ADR 0112): what was set by hand goes with it (ADR 0113). */
describe('what is read of a text is the same with a box and without it', () => {
  const all = everythingThereIs();
  const plain = readBody(textOf(unboxed(all)));
  const inABox = readBody(textOf(allInOneBox(all)));

  it('block for block', () => {
    expect(inABox.some((b) => b.kind !== 'parallel' && b.rich)).toBe(true);
    expect(unboxed(inABox)).toEqual(plain);
  });

  it('in its words, with the notes and without', () => {
    expect(blocksText(inABox)).toBe(blocksText(plain));
    expect(blocksText(inABox, true)).toBe(blocksText(plain, true));
  });

  it('in what is counted of it: its words, what it cites, what it holds that is numbered', () => {
    expect(bodyFacts(inABox)).toEqual(bodyFacts(plain));
  });
});

describe('a text read again part by part', () => {
  it('reads a box as what it holds, and after a change in one paragraph of it only that paragraph again', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    writeBody(text, [
      words('Before'),
      inBox(words('One'), 'first'),
      inBox(words('Two'), 'in'),
      inBox(words('Three'), 'in'),
    ]);
    const reading = new BodyReading();
    const first = reading.read(text);
    expect(first.blocks).toEqual(readBody(text));
    expect(first.facts).toEqual(bodyFacts(readBody(text)));

    const box = text.get(1) as Y.XmlElement;
    const second = box.get(1) as Y.XmlElement;
    (second.get(0) as Y.XmlText).insert(3, ' and a half');
    reading.changed(box, second);
    const after = reading.read(text);
    expect(blocksText(after.blocks)).toBe('Before\nOne\nTwo and a half\nThree');
    expect(after.blocks[1]).toBe(first.blocks[1]);
    expect(after.blocks[2]).not.toBe(first.blocks[2]);
    expect(after.blocks[3]).toBe(first.blocks[3]);
    expect(after.facts).toEqual(bodyFacts(readBody(text)));
  });

  it('has the block that comes to stand first in a box say so', () => {
    const doc = new Y.Doc();
    const text = doc.getXmlFragment('text');
    writeBody(text, [inBox(words('One'), 'first'), inBox(words('Two'), 'in')]);
    const reading = new BodyReading();
    reading.read(text);
    const box = text.get(0) as Y.XmlElement;
    box.delete(0, 1);
    reading.changed(box);
    const after = reading.read(text);
    expect(after.blocks).toEqual([inBox(words('Two'), 'first')]);
    expect(after.blocks).toEqual(readBody(text));
  });
});
