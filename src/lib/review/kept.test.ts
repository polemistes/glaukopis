import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import type { Accepted, Moment, Piece, Place } from '$lib/history/types';
import { Project } from '$lib/project/model/project.svelte';
import { acceptStretch, blockAt, itemsOf, textOf } from './accepting';
import { accept, forget, readReview, referenceOf, reviewers, settle } from './kept';

// ---- a text in a document ----

/** A paragraph of text, a citation, and text again; and a second paragraph with a note. */
function text() {
  const doc = new Y.Doc();
  const body = doc.getXmlFragment('body');
  const first = new Y.XmlElement('paragraph');
  const second = new Y.XmlElement('paragraph');
  body.insert(0, [first, second]);
  const before = new Y.XmlText('The black cat');
  const citation = new Y.XmlElement('citation');
  const after = new Y.XmlText(' sat.');
  first.insert(0, [before, citation, after]);
  const note = new Y.XmlElement('footnote');
  note.insert(0, [new Y.XmlText('A note.')]);
  second.insert(0, [new Y.XmlText('Second.'), note]);
  return { doc, body, first, second, before, after, note };
}

function resolve(doc: Y.Doc, bytes: Uint8Array) {
  const found = Y.createAbsolutePositionFromRelativePosition(Y.decodeRelativePosition(bytes), doc);
  if (!found) throw new Error('not found');
  return found;
}

const place = (path: Place['path']): Place => ({ element: 'e', part: 'body', path });

describe('the block a place names', () => {
  it('is found down the tree of blocks, and a note by its number in the paragraph', () => {
    const { body, first, second, note } = text();
    expect(blockAt(body, place([0]))).toBe(first);
    expect(blockAt(body, place([1]))).toBe(second);
    expect(blockAt(body, place([1, 'note', 0]))).toBe(note);
    expect(blockAt(body, place([2]))).toBeNull();
    expect(blockAt(body, place([1, 'note', 1]))).toBeNull();
  });

  it('of a name is its one line, and of a table what is said of it', () => {
    const doc = new Y.Doc();
    const title = doc.getXmlFragment('title');
    const line = new Y.XmlElement('title');
    title.insert(0, [line]);
    expect(blockAt(title, { element: 'e', part: 'title', path: [] })).toBe(line);
    const body = doc.getXmlFragment('body');
    const tabular = new Y.XmlElement('tabular');
    const said = new Y.XmlElement('table_caption');
    tabular.insert(0, [said, new Y.XmlElement('table')]);
    body.insert(0, [tabular]);
    expect(blockAt(body, place([0]))).toBe(said);
  });

  it('has the text the history counts: a thing that is no text is one sign', () => {
    const { first, second } = text();
    expect(textOf(first)).toBe('The black cat￼ sat.');
    expect(textOf(second)).toBe('Second.￼');
  });
});

describe('a stretch accepted', () => {
  it('goes from after the sign before it to before the sign after it, and holds what is to be seen', () => {
    const { doc, first, before } = text();
    const accepted = acceptStretch(first, place([0]), 4, 10, []);
    const from = resolve(doc, accepted.from);
    const to = resolve(doc, accepted.to);
    expect(from.type).toBe(before);
    expect(from.index).toBe(4);
    expect(to.type).toBe(before);
    expect(to.index).toBe(10);
    const client = doc.clientID;
    const start = before._start!.id.clock;
    expect(accepted.visible).toEqual({ [client]: [[start + 4, start + 10]] });
  });

  it('takes in what was deleted at its edges', () => {
    const { doc, first, before } = text();
    before.delete(4, 6); // "The cat", with "black " deleted where the stretch begins
    const accepted = acceptStretch(first, place([0]), 4, 7, []);
    // From after "The ", which is before what was deleted.
    const anchor = Y.decodeRelativePosition(accepted.from);
    const deleted = before._start!.right!;
    expect(deleted.deleted).toBe(true);
    expect(anchor.item?.clock).toBeLessThan(deleted.id.clock);
    // To before the citation, which stands in the paragraph itself.
    expect(resolve(doc, accepted.to)).toMatchObject({ type: first, index: 1 });
  });

  it('at the beginning and the end of a block is the beginning and the end of the block', () => {
    const { doc, first } = text();
    const accepted = acceptStretch(first, place([0]), 0, 19, []);
    expect(resolve(doc, accepted.from)).toMatchObject({ type: first, index: 0 });
    expect(resolve(doc, accepted.to)).toMatchObject({ type: first, index: first.length });
  });

  it('over a citation holds the citation', () => {
    const { first, before } = text();
    const accepted = acceptStretch(first, place([0]), 10, 15, []);
    const citation = first.get(1) as Y.XmlElement;
    const ranges = accepted.visible[citation._item!.id.client];
    expect(
      ranges.some(([a, b]) => citation._item!.id.clock >= a && citation._item!.id.clock < b),
    ).toBe(true);
    expect(before.toString().slice(10)).toBe('cat');
  });

  it('of a block that is gone is found by the items of its pieces, and nothing in it is seen', () => {
    const pieces: Piece[] = [
      {
        status: 'removed',
        text: 'Gone',
        marks: {},
        by: 'a',
        items: { 7: [[10, 14]] },
        runs: [[7, 10, 4]],
      },
      {
        status: 'removed',
        text: ' too',
        marks: {},
        by: 'a',
        items: { 7: [[20, 24]] },
        runs: [[7, 20, 4]],
      },
    ];
    const accepted = acceptStretch(null, place([3]), 0, 0, pieces);
    expect(Y.decodeRelativePosition(accepted.from).item).toMatchObject({ client: 7, clock: 10 });
    expect(Y.decodeRelativePosition(accepted.to).item).toMatchObject({ client: 7, clock: 23 });
    expect(accepted.visible).toEqual({});
  });

  it('counts items as the history does, in ranges for each copy', () => {
    expect(
      itemsOf([
        { client: 1, clock: 5 },
        { client: 1, clock: 6 },
        { client: 2, clock: 1 },
        { client: 1, clock: 9 },
        { client: 1, clock: 9 },
      ]),
    ).toEqual({
      1: [
        [5, 7],
        [9, 10],
      ],
      2: [[1, 2]],
    });
  });
});

// ---- what is kept ----

function moment(doc: Y.Doc, time: number): Moment {
  return { snapshot: Y.encodeSnapshot(Y.snapshot(doc)), time };
}

function stretch(n: number): Accepted {
  return {
    place: place([n]),
    from: new Uint8Array([n]),
    to: new Uint8Array([n + 1]),
    visible: { 1: [[n, n + 1]] },
  };
}

describe('what a person has reviewed', () => {
  it('begins with what they first accept, at the moment the changes were compared with', () => {
    const doc = new Y.Doc();
    expect(readReview(doc, 'anna')).toBeNull();
    const then = moment(doc, 1000);
    accept(doc, 'anna', then, [stretch(1)]);
    const review = readReview(doc, 'anna')!;
    expect(review.moment).toEqual(then.snapshot);
    expect(review.time).toBe(1000);
    expect(review.accepted).toEqual([stretch(1)]);
    expect(referenceOf(review)).toEqual({ moment: then.snapshot, accepted: [stretch(1)] });
  });

  it('keeps each acceptance after the others, and from the moment it began', () => {
    const doc = new Y.Doc();
    accept(doc, 'anna', moment(doc, 1000), [stretch(1)]);
    accept(doc, 'anna', moment(doc, 2000), [stretch(2), stretch(3)]);
    const review = readReview(doc, 'anna')!;
    expect(review.time).toBe(1000);
    expect(review.accepted.map((a) => a.place.path[0])).toEqual([1, 2, 3]);
  });

  it('keeps a change to an element once, as it was last accepted', () => {
    const doc = new Y.Doc();
    accept(doc, 'anna', moment(doc, 1), [], [{ key: 'element:x:moved', state: 'a' }]);
    accept(
      doc,
      'anna',
      moment(doc, 1),
      [],
      [
        { key: 'element:x:moved', state: 'b' },
        { key: 'element:y:added', state: '' },
      ],
    );
    expect(readReview(doc, 'anna')!.settled).toEqual([
      { key: 'element:x:moved', state: 'b' },
      { key: 'element:y:added', state: '' },
    ]);
  });

  it('becomes the present moment when nothing is left, with nothing accepted since', () => {
    const doc = new Y.Doc();
    accept(doc, 'anna', moment(doc, 1000), [stretch(1)], [{ key: 'k', state: 's' }]);
    doc.getMap('other').set('x', 1);
    const now = moment(doc, 5000);
    settle(doc, 'anna', now);
    expect(readReview(doc, 'anna')).toEqual({
      moment: now.snapshot,
      time: 5000,
      accepted: [],
      settled: [],
    });
  });

  it('is each person’s own, and is known to every copy of the project', () => {
    const doc = new Y.Doc();
    accept(doc, 'anna', moment(doc, 1000), [stretch(1)]);
    accept(doc, 'bo', moment(doc, 2000), [stretch(2)]);
    const copy = new Y.Doc();
    Y.applyUpdate(copy, Y.encodeStateAsUpdate(doc));
    expect(readReview(copy, 'anna')!.accepted).toEqual([stretch(1)]);
    expect(readReview(copy, 'bo')!.accepted).toEqual([stretch(2)]);
    expect(reviewers(copy).sort((a, b) => a.time - b.time)).toEqual([
      { person: 'anna', time: 1000, accepted: 1 },
      { person: 'bo', time: 2000, accepted: 1 },
    ]);
    forget(copy, 'anna');
    expect(readReview(copy, 'anna')).toBeNull();
  });

  it('is not undone with the writing of the project, and is saved with it', () => {
    const saved: Uint8Array[] = [];
    const p = new Project({
      append: async (u) => void saved.push(u),
      saveState: async () => {},
    });
    const map = p.createMap('Wrath');
    p.checkpoint();
    accept(p.doc, 'anna', moment(p.doc, 1), [stretch(1)]);
    p.undo();
    expect(p.map(map)).toBeUndefined();
    expect(readReview(p.doc, 'anna')!.accepted).toHaveLength(1);
  });
});
