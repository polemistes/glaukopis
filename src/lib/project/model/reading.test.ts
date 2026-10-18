import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import { writeBody } from './blocks';
import { Project } from './project.svelte';
import { bodyFacts, paragraph, readBody, type Block, type Inline } from './text';
import { PROJECT } from './types';

const t = (text: string, marks: Record<string, object> = {}): Inline => ({
  kind: 'text',
  text,
  marks: marks as Record<string, Record<string, unknown>>,
});
const p = (...content: Inline[]): Block => paragraph(content);
const note = (...content: Inline[]): Inline => ({ kind: 'footnote', content });
const cite = (id: string): Inline => ({ kind: 'citation', items: [{ id }], mode: 'normal' });

/** A project with one element of a long text, of every kind of part. */
function long(paragraphs = 200) {
  const pr = new Project(null);
  pr.begin('Wrath');
  const id = pr.addChild(PROJECT, { title: 'Book' })!;
  const blocks: Block[] = [];
  for (let i = 0; i < paragraphs; i++)
    blocks.push(
      paragraph(
        [
          t(`Sing, goddess, the wrath ${i} `),
          t('of Achilles', { em: {} }),
          ...(i % 7 === 0 ? [note(t('A note, '), cite(`r${i % 3}`))] : []),
          ...(i % 5 === 0 ? [cite(`r${i % 4}`)] : []),
        ],
        i % 11 === 0 ? 'quote' : 'text',
      ),
    );
  blocks.push(
    {
      kind: 'figure',
      id: 'f1',
      file: 'a'.repeat(64),
      extension: 'png',
      name: 'shield.png',
      caption: [t('The shield')],
      alt: '',
      width: 100,
      numbered: true,
    },
    {
      kind: 'table',
      id: 't1',
      caption: [t('Forms')],
      rows: [
        [
          { content: [p(t('a cell'))], colspan: 1, rowspan: 1, header: false },
          { content: [p(t('b'), cite('r9'))], colspan: 1, rowspan: 1, header: false },
        ],
      ],
      numbered: true,
      width: 0,
    },
    { kind: 'equation', id: 'e1', tex: 'x', numbered: false },
    p(),
    p(),
  );
  pr.transact(() => writeBody(pr.fragment(id, 'body')!, blocks));
  const body = () => pr.fragment(id, 'body')!;
  /** The text of a paragraph at the top of the text. */
  const line = (i: number) => (body().get(i) as Y.XmlElement).get(0) as Y.XmlText;
  /** What the record says of the text, against what reading it all says. */
  const same = () => {
    const whole = readBody(body());
    const facts = bodyFacts(whole);
    const n = pr.node(id)!;
    expect(pr.blocksOf(id)).toEqual(whole);
    expect({
      empty: n.empty,
      words: n.words,
      cited: n.cited,
      notes: n.notes,
      noteWords: n.noteWords,
      set: n.set,
      uses: n.uses,
    }).toEqual(facts);
  };
  return { pr, id, body, line, same };
}

/** How many runs of text are read while `f` runs. */
function deltas(f: () => void): number {
  const spy = vi.spyOn(Y.XmlText.prototype, 'toDelta');
  f();
  const n = spy.mock.calls.length;
  spy.mockRestore();
  return n;
}

describe('the text of an element, read on every change', () => {
  it('reads again only the paragraph written in', () => {
    const { pr, line, same } = long();
    same();
    const n = deltas(() => pr.transact(() => line(100).insert(3, 'x')));
    // The paragraph written in, and the name, which is read anew with the
    // record: not the runs of the 200 others.
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(2);
    same();
  });

  it('reads nothing of the text when only where the element stands has changed', () => {
    const { pr, id } = long();
    const stamp = pr.stampOf(id);
    const words = pr.node(id)!.words;
    // Its name only, which is read anew with the record.
    expect(deltas(() => pr.setPosition(id, { x: 10, y: 20 }))).toBeLessThanOrEqual(1);
    expect(pr.stampOf(id)).toBe(stamp);
    expect(pr.node(id)!.words).toBe(words);
    expect(pr.node(id)!.pos).toEqual({ x: 10, y: 20 });
  });

  it('gives the text a new stamp when it changed, and keeps it while it has not', () => {
    const { pr, id, line } = long(10);
    const stamp = pr.stampOf(id);
    pr.setCollapsed(id, true);
    expect(pr.stampOf(id)).toBe(stamp);
    pr.transact(() => line(3).insert(0, 'x'));
    const written = pr.stampOf(id);
    expect(written).not.toBe(stamp);
    pr.setTitle(id, 'Another book');
    expect(pr.stampOf(id)).toBe(written);
  });

  it('is what reading the whole text gives, after changes of every kind', () => {
    const { pr, id, body, line, same } = long(60);
    const each = (change: () => void) => {
      pr.transact(change);
      same();
    };
    // Words written, taken out, and given a mark.
    each(() => line(5).insert(0, 'Then '));
    each(() => line(6).delete(0, 4));
    each(() => line(7).format(0, 4, { strong: {} }));
    // Paragraphs put in and taken out.
    each(() => {
      const added = new Y.XmlElement('paragraph');
      added.insert(0, [new Y.XmlText('A new paragraph with words')]);
      body().insert(10, [added]);
    });
    each(() => body().delete(3, 2));
    // A paragraph given another kind.
    each(() => (body().get(4) as Y.XmlElement).setAttribute('kind', 'quote'));
    // A note within a paragraph, and a cell of a table.
    each(() => {
      const withNote = body().get(0) as Y.XmlElement;
      const footnote = withNote.toArray().find((c) => c instanceof Y.XmlElement) as Y.XmlElement;
      const first = (e: Y.XmlElement): Y.XmlText =>
        e.toArray().find((c) => c instanceof Y.XmlText) ??
        first(e.toArray().find((c) => c instanceof Y.XmlElement) as Y.XmlElement);
      first(footnote).insert(0, 'more words in the note ');
    });
    each(() => {
      const table = body()
        .toArray()
        .find((c) => c instanceof Y.XmlElement && c.nodeName === 'tabular') as Y.XmlElement;
      const cells: Y.XmlText[] = [];
      const walk = (e: Y.XmlElement) => {
        for (const c of e.toArray()) {
          if (c instanceof Y.XmlText) cells.push(c);
          else if (c instanceof Y.XmlElement) walk(c);
        }
      };
      walk(table);
      cells[cells.length - 1].insert(0, 'counted ');
    });
    // Undone and done again.
    pr.checkpoint();
    each(() => line(2).insert(0, 'Undone '));
    pr.undo();
    same();
    pr.redo();
    same();
    // The whole text written anew.
    each(() => {
      body().delete(0, body().length);
      writeBody(body(), [p(t('Only this.'))]);
    });
    expect(pr.node(id)!.words).toBe(2);
    // And emptied.
    each(() => body().delete(0, body().length));
    expect(pr.node(id)!.empty).toBe(true);
  });

  it('is what reading the whole text gives in another copy, from the changes of the first', () => {
    const a = long(30);
    const b = new Project(null);
    b.load(Y.encodeStateAsUpdate(a.pr.doc), []);
    a.pr.doc.on('update', (u: Uint8Array) => Y.applyUpdate(b.doc, u, 'remote'));
    a.pr.transact(() => a.line(4).insert(0, 'Heard elsewhere '));
    a.pr.transact(() => a.body().delete(8, 1));
    expect(b.blocksOf(a.id)).toEqual(readBody(b.fragment(a.id, 'body')!));
    expect(b.node(a.id)!.words).toBe(a.pr.node(a.id)!.words);
  });
});
