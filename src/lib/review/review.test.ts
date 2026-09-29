import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import type {
  History,
  MapChanges,
  Moment,
  Passage,
  Piece,
  Reference,
  Version,
} from '$lib/history/types';
import { Project } from '$lib/project/model/project.svelte';
import { readReview } from './kept';
import { Review } from './review.svelte';
import type { Choice, Source } from './source';

function piece(status: Piece['status'], text: string, by: string | null = null): Piece {
  return { status, text, marks: {}, by, items: { 5: [[0, text.length]] } };
}

/** A history made by hand: what it says of each map is what the test gives it. */
class FakeHistory implements History {
  said = new Map<string, (reference: Reference) => MapChanges>();
  compared: Reference[] = [];
  reverted: { passage: Passage; pieces: Piece[] }[] = [];
  restored: Uint8Array[] = [];
  versionsSaid: Version[] = [];
  #doc: Y.Doc;

  constructor(doc: Y.Doc) {
    this.#doc = doc;
  }

  async people() {
    return [
      { id: 'anna', name: 'Anna Lind' },
      { id: 'me', name: 'Me' },
    ];
  }

  async now(): Promise<Moment> {
    return { snapshot: Y.encodeSnapshot(Y.snapshot(this.#doc)), time: Date.now() };
  }

  async compare(map: string, reference: Reference): Promise<MapChanges> {
    this.compared.push(reference);
    return this.said.get(map)?.(reference) ?? { map, passages: [], objects: [], elements: [] };
  }

  async versions(): Promise<Version[]> {
    return this.versionsSaid;
  }

  async revert(passage: Passage, pieces: Piece[]) {
    this.reverted.push({ passage, pieces });
  }

  async restore(_place: unknown, _from: Uint8Array, _to: Uint8Array, moment: Uint8Array) {
    this.restored.push(moment);
  }
}

const BEGINNING: Choice = {
  kind: 'beginning',
  moment: { snapshot: new Uint8Array([0, 0]), time: 100 },
};

function setUp() {
  const project = new Project(null);
  const map = project.createMap('Wrath');
  const root = project.map(map)!.root;
  const element = project.addChild(root, { title: 'Mênis', body: 'The black cat sat. It slept.' })!;
  const history = new FakeHistory(project.doc);
  const source: Source = { history, me: 'me', choices: async () => [BEGINNING], turnOn: null };
  // Anna wrote "black" into the first sentence, and the second anew.
  history.said.set(map, (reference) => {
    const accepted = reference.accepted.length;
    const passages: Passage[] = [
      {
        place: { element, part: 'body', path: [0] },
        kind: 'paragraph',
        before: true,
        after: true,
        pieces: [
          piece('same', 'The '),
          ...(accepted ? [piece('same', 'black ')] : [piece('added', 'black ', 'anna')]),
          piece('same', 'cat sat. '),
          piece('added', 'It slept.', 'anna'),
        ],
      },
    ];
    return { map, passages, objects: [], elements: [] };
  });
  const review = new Review(project, source, map);
  return { project, map, root, element, history, review };
}

describe('a review', () => {
  it('works the changes out, and looks at the first', async () => {
    const { review, history } = setUp();
    await review.refresh();
    expect(review.changes.map((c) => c.kind)).toEqual(['changed', 'added']);
    expect(review.current).toBe(review.changes[0]);
    expect(review.since).toEqual(BEGINNING.moment);
    expect(review.people.get('anna')?.name).toBe('Anna Lind');
    // A first review compares with the beginning of the history.
    expect(history.compared[0].moment).toEqual(BEGINNING.moment.snapshot);
  });

  it('accepting keeps the stretch as it stands, and looks at the next', async () => {
    const { review, project } = setUp();
    await review.refresh();
    const first = review.changes[0];
    await review.accept();
    const kept = readReview(project.doc, 'me')!;
    expect(kept.moment).toEqual(BEGINNING.moment.snapshot);
    expect(kept.accepted).toHaveLength(1);
    expect(kept.accepted[0].place.path).toEqual([0]);
    expect(Object.keys(kept.accepted[0].visible)).toHaveLength(1);
    expect(review.changes).not.toContain(first);
    expect(review.current?.kind).toBe('added');
  });

  it('later goes on to the next and leaves this one in the list, and comes round again', async () => {
    const { review } = setUp();
    await review.refresh();
    const [a, b] = review.changes;
    review.next();
    expect(review.looked).toBe(b.key);
    review.next();
    expect(review.looked).toBe(a.key);
    review.previous();
    expect(review.looked).toBe(b.key);
    expect(review.changes).toHaveLength(2);
  });

  it('rejecting has the history take back what changed', async () => {
    const { review, history } = setUp();
    await review.refresh();
    await review.reject();
    expect(history.reverted).toHaveLength(1);
    expect(history.reverted[0].pieces.map((p) => p.text)).toEqual(['black ']);
    expect(review.changes).toHaveLength(1);
  });

  it('when nothing is left in any map, becomes the moment the changes were worked out at', async () => {
    const { review, project } = setUp();
    await review.refresh();
    await review.accept();
    await review.accept();
    const kept = readReview(project.doc, 'me')!;
    expect(kept.accepted).toEqual([]);
    expect(kept.moment).not.toEqual(BEGINNING.moment.snapshot);
  });

  it('is not settled while another map has changes left', async () => {
    const { review, project, history } = setUp();
    const other = project.createMap('Other');
    history.said.set(other, () => ({
      map: other,
      passages: [
        {
          place: { element: project.map(other)!.root, part: 'title', path: [0] },
          kind: 'name',
          before: true,
          after: true,
          pieces: [piece('same', 'Oth'), piece('added', 'er', 'anna')],
        },
      ],
      objects: [],
      elements: [],
    }));
    await review.refresh();
    await review.accept();
    await review.accept();
    expect(readReview(project.doc, 'me')!.accepted).toHaveLength(2);
  });

  it('accepts as it stands what was written since the changes were worked out', async () => {
    const { review, project, element, history } = setUp();
    await review.refresh();
    const before = history.compared.length;
    project.transact(() => project.setTitle(element, 'Mênis, the wrath'));
    await review.accept();
    expect(history.compared.length).toBeGreaterThan(before);
    expect(readReview(project.doc, 'me')!.accepted).toHaveLength(1);
  });

  it('a moment chosen is compared with, and what is accepted is compared with it too', async () => {
    const { review, history } = setUp();
    const chosen: Choice = {
      kind: 'named',
      name: 'Draft',
      moment: { snapshot: new Uint8Array([7]), time: 5 },
    };
    review.choose(chosen);
    await review.refresh();
    expect(history.compared.at(-1)!.moment).toEqual(new Uint8Array([7]));
    await review.accept();
    await review.refresh();
    expect(history.compared.at(-1)!.accepted).toHaveLength(1);
  });

  it('an element moved and taken back stands where it stood; one accepted is not shown again', async () => {
    const { review, project, map, root, element, history } = setUp();
    const other = project.addChild(root, { title: 'Other' })!;
    project.move([element], other);
    history.said.set(map, () => ({
      map,
      passages: [],
      objects: [],
      elements: [
        {
          element,
          kind: 'moved',
          before: { parent: root, after: null },
          after: { parent: other, after: null },
          by: 'anna',
        },
      ],
    }));
    // Another map has a change left, so that the review is not settled.
    const second = project.createMap('Second');
    history.said.set(second, () => ({
      map: second,
      passages: [],
      objects: [],
      elements: [{ element: project.map(second)!.root, kind: 'heading', by: 'anna' }],
    }));
    await review.refresh();
    expect(review.changes.map((c) => c.kind)).toEqual(['element']);
    await review.reject();
    expect(project.tree(map).parent.get(element)).toBe(root);
    await review.refresh();
    await review.accept();
    await review.refresh();
    expect(review.changes).toEqual([]);
  });

  it('one’s own changes are shown only when asked for', async () => {
    const { review, map, element, history } = setUp();
    history.said.set(map, () => ({
      map,
      passages: [
        {
          place: { element, part: 'body', path: [0] },
          kind: 'paragraph',
          before: true,
          after: true,
          pieces: [
            piece('same', 'The '),
            piece('added', 'black ', 'me'),
            piece('same', 'cat sat. It slept.'),
          ],
        },
      ],
      objects: [],
      elements: [],
    }));
    await review.refresh();
    expect(review.changes).toEqual([]);
    review.setOwn(true);
    await review.refresh();
    expect(review.changes).toHaveLength(1);
  });

  it('accepting up to a version keeps what was to be seen in it', async () => {
    const { review, project, history } = setUp();
    await review.refresh();
    history.versionsSaid = [
      {
        moment: { snapshot: new Uint8Array([1]), time: 10 },
        by: ['anna'],
        pieces: [
          { ...piece('added', 'black ', 'anna'), items: { 9: [[3, 9]] } },
          piece('same', 'The '),
        ],
      },
    ];
    await review.loadVersions();
    expect(review.versions?.list).toHaveLength(1);
    await review.acceptUpTo(review.changes[0], history.versionsSaid[0]);
    const kept = readReview(project.doc, 'me')!;
    expect(kept.accepted[0].visible[9]).toEqual([[3, 9]]);
  });
});
