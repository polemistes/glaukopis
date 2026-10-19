import { describe, expect, it, vi } from 'vitest';
import * as Y from 'yjs';
import type {
  History,
  BranchChanges,
  Moment,
  Named,
  Passage,
  Piece,
  Reference,
  Session,
  Version,
} from '$lib/history/types';
import { Project } from '$lib/project/model/project.svelte';
import { PROJECT } from '$lib/project/model/types';
import { blockAt, textOf } from './accepting';
import { readReview } from './kept';
import { Review, stateOf } from './review.svelte';
import type { Choice, Source } from './source';

function piece(status: Piece['status'], text: string, by: string | null = null): Piece {
  return {
    status,
    text,
    marks: {},
    by,
    items: { 5: [[0, text.length]] },
    runs: [[5, 0, text.length]],
  };
}

/** A history made by hand: what it says of each element in view is what the test gives it. */
class FakeHistory implements History {
  said = new Map<string, (reference: Reference) => BranchChanges>();
  compared: Reference[] = [];
  reverted: { passage: Passage; pieces: Piece[] }[] = [];
  restored: Uint8Array[] = [];
  restoredAt: { from: Uint8Array; to: Uint8Array }[] = [];
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

  async begins(): Promise<Moment> {
    return BEGINNING.moment;
  }

  async sessions(): Promise<Session[]> {
    return [];
  }

  async moment(): Promise<Moment> {
    return BEGINNING.moment;
  }

  async named(): Promise<Named[]> {
    return [];
  }

  async compare(at: string, reference: Reference): Promise<BranchChanges> {
    this.compared.push(reference);
    return this.said.get(at)?.(reference) ?? { at, passages: [], objects: [], elements: [] };
  }

  async versions(): Promise<Version[]> {
    return this.versionsSaid;
  }

  async revert(passage: Passage, pieces: Piece[]) {
    this.reverted.push({ passage, pieces });
  }

  async restore(_place: unknown, from: Uint8Array, to: Uint8Array, moment: Uint8Array) {
    this.restored.push(moment);
    this.restoredAt.push({ from, to });
  }
}

const BEGINNING: Choice = {
  kind: 'beginning',
  moment: { snapshot: new Uint8Array([0, 0]), time: 100 },
};

/** A project with a tree Wrath under it, which is in view, and an element in that. */
function setUp() {
  const project = new Project(null);
  project.begin('The poem');
  const root = project.addChild(PROJECT, { title: 'Wrath' })!;
  const element = project.addChild(root, { title: 'Mênis', body: 'The black cat sat. It slept.' })!;
  const history = new FakeHistory(project.doc);
  const source: Source = { history, me: 'me', choices: async () => [BEGINNING], turnOn: null };
  // Anna wrote "black" into the first sentence, and the second anew.
  history.said.set(root, (reference) => {
    const accepted = reference.accepted.length;
    const passages: Passage[] = [
      {
        place: { element, part: 'body', path: [0] },
        block: '1:1',
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
    return { at: root, passages, objects: [], elements: [] };
  });
  const review = new Review(project, source, root);
  return { project, root, element, history, review };
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

  it('when nothing is left anywhere, becomes the moment the changes were worked out at', async () => {
    const { review, project } = setUp();
    await review.refresh();
    await review.accept();
    await review.accept();
    const kept = readReview(project.doc, 'me')!;
    expect(kept.accepted).toEqual([]);
    expect(kept.moment).not.toEqual(BEGINNING.moment.snapshot);
  });

  it('is not settled while the rest of the project has changes left', async () => {
    const { review, project, history } = setUp();
    const other = project.addChild(PROJECT, { title: 'Other' })!;
    // Asked of the whole project, the history says a name changed elsewhere.
    history.said.set(PROJECT, () => ({
      at: PROJECT,
      passages: [
        {
          place: { element: other, part: 'title', path: [0] },
          block: '1:2',
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
    // Not settled: what was accepted is kept, the two stretches of the paragraph as one.
    const kept = readReview(project.doc, 'me')!;
    expect(kept.moment).toEqual(BEGINNING.moment.snapshot);
    expect(kept.accepted).toHaveLength(1);
  });

  it('with one’s own changes shown, is not settled while one’s own are left elsewhere', async () => {
    const { review, project, history } = setUp();
    const other = project.addChild(PROJECT, { title: 'Other' })!;
    // Elsewhere in the project the reviewer renamed an element, and nobody else changed anything.
    history.said.set(PROJECT, () => ({
      at: PROJECT,
      passages: [
        {
          place: { element: other, part: 'title', path: [0] },
          block: '1:2',
          kind: 'name',
          before: true,
          after: true,
          pieces: [piece('same', 'Oth'), piece('added', 'er', 'me')],
        },
      ],
      objects: [],
      elements: [],
    }));
    review.setOwn(true);
    await review.refresh();
    await review.accept();
    await review.accept();
    expect(review.changes).toEqual([]);
    // Settled, the review would begin at now with nothing accepted, and the rename would never be shown.
    const kept = readReview(project.doc, 'me')!;
    expect(kept.moment).toEqual(BEGINNING.moment.snapshot);
    expect(kept.accepted).toHaveLength(1);
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
    const { review, project, root, element, history } = setUp();
    const other = project.addChild(root, { title: 'Other' })!;
    project.move([element], other);
    history.said.set(root, () => ({
      at: root,
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
    // Elsewhere in the project a change is left, so that the review is not settled.
    const second = project.addChild(PROJECT, { title: 'Second' })!;
    history.said.set(PROJECT, () => ({
      at: PROJECT,
      passages: [],
      objects: [],
      elements: [{ element: second, kind: 'heading', by: 'anna' }],
    }));
    await review.refresh();
    expect(review.changes.map((c) => c.kind)).toEqual(['element']);
    await review.reject();
    expect(project.tree().parent.get(element)).toBe(root);
    await review.refresh();
    await review.accept();
    await review.refresh();
    expect(review.changes).toEqual([]);
  });

  it('one’s own changes are shown only when asked for', async () => {
    const { review, root, element, history } = setUp();
    history.said.set(root, () => ({
      at: root,
      passages: [
        {
          place: { element, part: 'body', path: [0] },
          block: '1:3',
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

  it('says that the versions could not be read, not that there are none', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { review, history } = setUp();
    await review.refresh();
    history.versions = () => Promise.reject(new Error('change 3 of 7 could not be applied'));
    await review.loadVersions();
    expect(review.versions).toEqual({
      key: review.current!.key,
      list: [],
      failed: 'change 3 of 7 could not be applied',
    });
    error.mockRestore();
  });

  describe('acts on the text as it stands, written in since the changes were worked out', () => {
    /**
     * Anna wrote "black" into the first paragraph: the history says so of the
     * paragraph as it stands, wherever "black" now is in it.
     */
    /** The stretch of the change: the sentence "black" was written into. */
    const SENTENCE = 'The black cat sat.';

    function standing() {
      const set = setUp();
      const { project, root, element, history } = set;
      const place = { element, part: 'body' as const, path: [0] };
      history.said.set(root, (reference) => {
        const text = textOf(blockAt(project.fragment(element, 'body'), place)!);
        const at = text.indexOf('black ');
        const pieces =
          at < 0 || reference.accepted.length
            ? [piece('same', text)]
            : [
                piece('same', text.slice(0, at)),
                piece('added', 'black ', 'anna'),
                piece('same', text.slice(at + 'black '.length)),
              ];
        return {
          at: root,
          passages: [{ place, block: '1:1', kind: 'paragraph', before: true, after: true, pieces }],
          objects: [],
          elements: [],
        };
      });
      /** Something written at the head of the paragraph, by someone else. */
      const writeAtHead = (what: string) => {
        const paragraph = blockAt(project.fragment(element, 'body'), place)!;
        const text = paragraph.get(0) as Y.XmlText;
        project.doc.transact(() => text.insert(0, what));
      };
      /** The text between two positions the review kept. */
      const between = (from: Uint8Array, to: Uint8Array) => {
        const a = Y.createAbsolutePositionFromRelativePosition(
          Y.decodeRelativePosition(from),
          project.doc,
        )!;
        const b = Y.createAbsolutePositionFromRelativePosition(
          Y.decodeRelativePosition(to),
          project.doc,
        )!;
        const paragraph = blockAt(project.fragment(element, 'body'), place)!;
        const text = textOf(paragraph);
        const index = (p: Y.AbsolutePosition) =>
          p.type === paragraph ? (p.index === 0 ? 0 : text.length) : p.index;
        return text.slice(index(a), index(b));
      };
      return { ...set, writeAtHead, between };
    }

    it('rejecting accepts what now stands where the change was', async () => {
      const { review, project, writeAtHead, between } = standing();
      await review.refresh();
      expect(review.changes).toHaveLength(1);
      writeAtHead('Yes. ');
      await review.reject();
      const kept = readReview(project.doc, 'me')!;
      expect(kept.accepted).toHaveLength(1);
      expect(between(kept.accepted[0].from, kept.accepted[0].to)).toBe(SENTENCE);
    });

    it('using a version makes the stretch of the change what it was, not the one beside it', async () => {
      const { review, history, writeAtHead, between } = standing();
      await review.refresh();
      writeAtHead('Yes. ');
      const version: Version = {
        moment: { snapshot: new Uint8Array([1]), time: 10 },
        by: ['anna'],
        pieces: [piece('same', 'The cat sat.')],
      };
      await review.useVersion(review.changes[0], version);
      expect(history.restoredAt).toHaveLength(1);
      expect(between(history.restoredAt[0].from, history.restoredAt[0].to)).toBe(SENTENCE);
    });

    it('accepting up to a version keeps the stretch of the change', async () => {
      const { review, project, writeAtHead, between } = standing();
      await review.refresh();
      writeAtHead('Yes. ');
      const version: Version = {
        moment: { snapshot: new Uint8Array([1]), time: 10 },
        by: ['anna'],
        pieces: [piece('added', 'black ', 'anna')],
      };
      await review.acceptUpTo(review.changes[0], version);
      const kept = readReview(project.doc, 'me')!;
      expect(kept.accepted).toHaveLength(1);
      expect(between(kept.accepted[0].from, kept.accepted[0].to)).toBe(SENTENCE);
    });
  });
});

describe('what a settled change is kept as', () => {
  it('reads the same whatever order the keys of its records came in', () => {
    const place = { element: 'e', part: 'text', path: [0] };
    const of = (after: Record<string, unknown>) =>
      stateOf({
        key: 'k',
        kind: 'object',
        element: 'e',
        stretches: [],
        by: [],
        object: { place, kind: 'figure', status: 'changed', after, by: null },
      } as unknown as Parameters<typeof stateOf>[0]);
    expect(of({ width: 'half', caption: { text: 'Troy', lang: 'en' } })).toBe(
      of({ caption: { lang: 'en', text: 'Troy' }, width: 'half' }),
    );
    expect(of({ width: 'half' })).not.toBe(of({ width: 'whole' }));
  });
});
