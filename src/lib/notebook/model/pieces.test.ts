import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { beginsOf, holdsOf, metOf, piecesOf, pictureOf, wordsOf } from './pieces';

const HASH = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

/** A run of words, taken in a passage where one is given, with marks beside. */
type Run = string | { text: string; passage?: string; link?: string };

/** A text made as y-prosemirror keeps one, part by part. */
function note(...parts: ((f: Y.XmlFragment) => Y.XmlElement)[]): Y.XmlFragment {
  const doc = new Y.Doc();
  const fragment = doc.getXmlFragment('body');
  for (const part of parts) part(fragment);
  return fragment;
}

const p =
  (...runs: Run[]) =>
  (f: Y.XmlFragment) => {
    const el = new Y.XmlElement('paragraph');
    el.setAttribute('kind', 'text');
    const t = new Y.XmlText();
    el.insert(0, [t]);
    f.insert(f.length, [el]);
    let at = 0;
    for (const run of runs) {
      const r = typeof run === 'string' ? { text: run } : run;
      const marks: Record<string, unknown> = {};
      if (r.passage) marks.taken = { passage: r.passage };
      if (r.link) marks.link = { href: r.link };
      t.insert(at, r.text, marks);
      at += r.text.length;
    }
    return el;
  };

const figure =
  (hash = HASH) =>
  (f: Y.XmlFragment) => {
    const el = new Y.XmlElement('figure');
    el.setAttribute('file', hash);
    el.setAttribute('extension', 'png');
    el.setAttribute('name', 'owl.png');
    f.insert(f.length, [el]);
    return el;
  };

const file =
  (hash = OTHER) =>
  (f: Y.XmlFragment) => {
    const el = new Y.XmlElement('file');
    el.setAttribute('hash', hash);
    el.setAttribute('name', 'letter.pdf');
    el.setAttribute('extension', 'pdf');
    f.insert(f.length, [el]);
    return el;
  };

const shape = (fragment: Y.XmlFragment) =>
  piecesOf(fragment).map((piece) => [
    piece.kind,
    piece.from,
    piece.to,
    ...(piece.kind === 'passage' ? [piece.passage] : []),
  ]);

describe('the pieces of a note', () => {
  it('a text of the writer’s own is one piece', () => {
    const f = note(p('One thought.'), p('And another.'));
    expect(shape(f)).toEqual([['own', 0, 2]]);
    const [own] = piecesOf(f);
    expect(own.kind === 'own' && own.blocks.length).toBe(2);
  });

  it('paragraphs taken whole in one passage are one piece; another passage is another', () => {
    const f = note(
      p('Mine.'),
      p({ text: 'Sing, goddess,', passage: 'P1' }),
      p({ text: 'the wrath', passage: 'P1' }, { text: '  ' }),
      p({ text: 'Of arms', passage: 'P2' }),
      p('Mine again.'),
    );
    expect(shape(f)).toEqual([
      ['own', 0, 1],
      ['passage', 1, 3, 'P1'],
      ['passage', 3, 4, 'P2'],
      ['own', 4, 5],
    ]);
  });

  it('taken words within a paragraph of one’s own leave it one’s own', () => {
    const f = note(p('As Homer says, ', { text: 'the wrath', passage: 'P1' }, ' is first.'));
    expect(shape(f)).toEqual([['own', 0, 1]]);
    expect(metOf(piecesOf(f))).toEqual([{ passage: 'P1' }]);
    expect(holdsOf(piecesOf(f))).toMatchObject({ own: true, passages: true });
  });

  it('a picture and a file are pieces by themselves', () => {
    const f = note(p('Before.'), figure(), file(), p('After.'));
    expect(shape(f)).toEqual([
      ['own', 0, 1],
      ['figure', 1, 2],
      ['file', 2, 3],
      ['own', 3, 4],
    ]);
    const pieces = piecesOf(f);
    expect(pieces[1]).toMatchObject({ hash: HASH, extension: 'png', name: 'owl.png' });
    expect(pieces[2]).toMatchObject({ hash: OTHER, extension: 'pdf', name: 'letter.pdf' });
    expect(pictureOf(pieces)).toEqual({ hash: HASH, extension: 'png' });
    expect(metOf(pieces)).toEqual([{ hash: HASH }, { hash: OTHER }]);
    expect(holdsOf(pieces)).toEqual({
      own: true,
      passages: false,
      pictures: true,
      files: true,
      links: false,
    });
  });

  it('empty paragraphs belong to no piece, and a run goes on across them', () => {
    const f = note(
      p(),
      p('One.'),
      p(' '),
      p('Two.'),
      p(),
      p({ text: 'Taken.', passage: 'P1' }),
      p(),
      p(),
    );
    expect(shape(f)).toEqual([
      ['own', 1, 4],
      ['passage', 5, 6, 'P1'],
    ]);
    expect(note(p(), p()).length).toBe(2);
    expect(piecesOf(note(p(), p()))).toEqual([]);
  });

  it('what is not a paragraph is the writer’s own, and joins a run of it', () => {
    const f = note(p('Mine.'), (fr) => {
      const el = new Y.XmlElement('equation');
      el.setAttribute('tex', 'x^2');
      fr.insert(fr.length, [el]);
      return el;
    });
    expect(shape(f)).toEqual([['own', 0, 2]]);
  });

  it('says how a note begins, its words, and its links', () => {
    const long = 'word '.repeat(60).trim();
    const f = note(p(long), p({ text: 'Linked', link: 'https://example.org' }), file());
    const pieces = piecesOf(f);
    const begins = beginsOf(pieces);
    expect(begins.length).toBeLessThanOrEqual(121);
    expect(begins.endsWith('…')).toBe(true);
    expect(begins).not.toContain('\n');
    expect(beginsOf(piecesOf(note(p('Short'), p('note'))))).toBe('Short note');
    expect(wordsOf(pieces, 'My Name')).toContain('my name');
    expect(wordsOf(pieces, '')).toContain('letter.pdf');
    expect(wordsOf(pieces, '')).toContain('linked');
    expect(holdsOf(pieces).links).toBe(true);
  });
});
