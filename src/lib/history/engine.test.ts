import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { Project, type Persistence } from '$lib/project/model/project.svelte';
import { applyEdits } from './applying';
import { Engine } from './engine';
import { ProjectHistory } from './history.svelte';
import { writeRecords, type HistoryRecord } from './records';
import type { Passage, Piece, Reference } from './types';

/** A store of history as the core keeps one: see `crates/core/src/history.rs`. */
class Store implements Persistence {
  kept: HistoryRecord[] = [];
  log: HistoryRecord[] = [];
  async append(update: Uint8Array, here: boolean, time: number) {
    this.log.push({ kind: 'change', here, time, until: time, update });
  }
  async saveState(state: Uint8Array, _summary: unknown, keep: boolean) {
    if (!keep) this.kept = [];
    else if (!this.kept.length)
      this.kept = [
        { kind: 'start', here: true, time: Date.now(), until: Date.now(), update: state },
      ];
    else this.kept.push(...this.log);
    this.log = [];
  }
  read(): HistoryRecord[] {
    return [...this.kept, ...this.log];
  }
}

/** Two people with a project each, joined as through a server. */
async function two() {
  const ann = new Store();
  const bo = new Store();
  const a = new Project(ann);
  const b = new Project(bo);
  a.load(null, []);
  const map = a.createMap('Wrath');
  const root = a.map(map)!.root;
  b.load(Y.encodeStateAsUpdate(a.doc), []);
  a.doc.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'remote') Y.applyUpdate(b.doc, u, 'remote');
  });
  b.doc.on('update', (u: Uint8Array, origin: unknown) => {
    if (origin !== 'remote') Y.applyUpdate(a.doc, u, 'remote');
  });
  a.setMe({ id: 'ann', name: 'Ann' });
  b.setMe({ id: 'bo', name: 'Bo' });
  await a.setHistory({ on: true });
  // Bo's copy learns that the history is on, and begins its own.
  await new Promise((r) => setTimeout(r, 0));
  await b.snapshot();
  const flush = async () => {
    await a.flush();
    await b.flush();
    // What was deleted is written with the next batch.
    await a.flush();
    await b.flush();
  };
  return { a, b, ann, bo, map, root, flush };
}

function paragraph(p: Project, element: string, text: string) {
  p.transact(() => {
    const body = p.fragment(element, 'body')!;
    const para = new Y.XmlElement('paragraph');
    para.insert(0, [new Y.XmlText(text)]);
    body.insert(body.length, [para]);
  });
}

function textOf(p: Project, element: string, index = 0): Y.XmlText {
  const para = p.fragment(element, 'body')!.get(index) as Y.XmlElement;
  return para.get(0) as Y.XmlText;
}

function engineOf(store: Store, me: string, project?: Project): Engine {
  const e = new Engine();
  e.me = me;
  e.load(store.read());
  project?.follow({ change: (u, h) => e.change(u, h), written: (t, h, n) => e.written(t, h, n) });
  return e;
}

const find = (passage: Passage, text: string): Piece | undefined =>
  passage.pieces.find((p) => p.text === text);

describe('the history of a project', () => {
  it('begins with the state when it is turned on, on every copy', async () => {
    const { ann, bo } = await two();
    expect(ann.kept.map((r) => r.kind)).toEqual(['start']);
    expect(bo.kept.map((r) => r.kind)).toEqual(['start']);
  });

  it('knows who wrote, who deleted, and who changed the marks', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'Sing, goddess, the wrath.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);

    b.transact(() => {
      const t = textOf(b, root);
      t.delete(6, 9);
      t.insert(6, 'muse, ');
      t.format(t.toString().indexOf('wrath'), 5, { em: {} });
    });
    await flush();

    const e = engineOf(ann, 'ann');
    expect(e.people()).toEqual(
      expect.arrayContaining([
        { id: 'ann', name: 'Ann' },
        { id: 'bo', name: 'Bo' },
      ]),
    );
    const changes = e.compare(map, { moment: since.snapshot, accepted: [] });
    const passage = changes.passages.find(
      (p) => p.place.element === root && p.place.part === 'body',
    )!;
    expect(passage.place.path).toEqual([0]);
    expect(passage.kind).toBe('paragraph');
    expect(find(passage, 'goddess, ')).toMatchObject({ status: 'removed', by: 'bo' });
    expect(find(passage, 'muse, ')).toMatchObject({ status: 'added', by: 'bo' });
    expect(find(passage, 'Sing, ')).toMatchObject({ status: 'same', by: null });
    const wrath = find(passage, 'wrath')!;
    expect(wrath).toMatchObject({
      status: 'same',
      marks: { em: true },
      marksBefore: {},
      marksBy: 'bo',
    });
    // What the pieces are made of, in the order of the text.
    const muse = find(passage, 'muse, ')!;
    expect(muse.runs.reduce((n, r) => n + r[2], 0)).toBe(6);
    // The name of the centre did not change.
    expect(changes.passages.some((p) => p.place.part === 'title')).toBe(false);

    // Sessions: the start, Ann's writing, Bo's.
    const people = e.sessions().map((s) => s.person);
    expect(people).toContain('ann');
    expect(people).toContain('bo');
  });

  it('shows objects in the text, and figures and equations as wholes', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'As Nagy says.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);
    b.transact(() => {
      const para = b.fragment(root, 'body')!.get(0) as Y.XmlElement;
      const citation = new Y.XmlElement('citation');
      citation.setAttribute('items', [{ id: 'nagy1979' }] as unknown as string);
      para.insert(1, [citation]);
      const equation = new Y.XmlElement('equation');
      equation.setAttribute('tex', 'E = mc^2');
      b.fragment(root, 'body')!.insert(1, [equation]);
    });
    await flush();
    const changes = engineOf(ann, 'ann').compare(map, { moment: since.snapshot, accepted: [] });
    const passage = changes.passages.find((p) => p.place.part === 'body')!;
    const cited = passage.pieces.find((p) => p.object)!;
    expect(cited).toMatchObject({ status: 'added', by: 'bo', text: '￼' });
    expect(cited.object).toMatchObject({
      kind: 'citation',
      attrs: { items: [{ id: 'nagy1979' }] },
    });
    expect(changes.objects).toEqual([
      expect.objectContaining({
        kind: 'equation',
        status: 'added',
        by: 'bo',
        place: expect.objectContaining({ path: [1] }),
      }),
    ]);
  });

  it('knows elements added, removed and moved, and by whom', async () => {
    const { a, b, ann, map, root, flush } = await two();
    const achilles = a.addChild(root, { title: 'Achilles' })!;
    const hector = a.addChild(root, { title: 'Hector' })!;
    const priam = a.addChild(root, { title: 'Priam' })!;
    paragraph(a, priam, 'King of Troy.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);
    b.remove([priam]);
    b.move([hector], root, 0);
    const patroclus = a.addChild(achilles, { title: 'Patroclus' })!;
    b.setHeading(achilles, false);
    await flush();
    const changes = engineOf(ann, 'ann').compare(map, { moment: since.snapshot, accepted: [] });
    const of = (id: string) =>
      changes.elements.filter((c) => c.element === id).map((c) => [c.kind, c.by]);
    expect(of(priam)).toEqual([['removed', 'bo']]);
    expect(of(patroclus)).toEqual([['added', 'ann']]);
    expect(of(hector)).toEqual([['moved', 'bo']]);
    expect(of(achilles)).toEqual([['heading', 'bo']]);
    // The text of what was removed is shown removed, where it stood.
    const gone = changes.passages.find(
      (p) => p.place.element === priam && p.place.part === 'body',
    )!;
    expect(gone).toMatchObject({ before: true, after: false });
    expect(gone.pieces[0]).toMatchObject({ status: 'removed', text: 'King of Troy.', by: 'bo' });
  });

  it('takes back changes, makes a stretch as it was, and tells its versions', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'Sing, goddess, the wrath.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);
    b.transact(() => {
      const t = textOf(b, root);
      t.delete(6, 9);
      t.insert(6, 'muse, ');
    });
    await flush();
    b.transact(() => textOf(b, root).insert(0, 'O '));
    await flush();

    const e = engineOf(ann, 'ann', a);
    const reference: Reference = { moment: since.snapshot, accepted: [] };
    const passage = e.compare(map, reference).passages[0];
    const t = textOf(a, root);
    const from = Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(t, 0));
    const to = Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(t, t.length, -1));

    const versions = e.versions(passage.place, from, to, reference);
    expect(versions.length).toBe(3);
    expect(versions[0].pieces.map((p) => p.text).join('')).toBe('Sing, goddess, the wrath.');
    expect(versions[1].by).toEqual(['bo']);
    expect(versions[2].pieces.find((p) => p.status === 'added')?.text).toBe('O ');

    // Bo's change of words is taken back by Ann, as her own change.
    const pieces = passage.pieces.filter((p) => p.text === 'muse, ' || p.text === 'goddess, ');
    expect(applyEdits(a, e.revert(passage, pieces))).toBe(1);
    expect(textOf(a, root).toString()).toBe('O Sing, goddess, the wrath.');
    await flush();
    const after = e.compare(map, reference).passages[0];
    // Put back as Ann's: what Bo removed stays removed, and Ann's is added.
    expect(find(after, 'goddess, ')).toMatchObject({ status: 'removed', by: 'bo' });
    expect(after.pieces.find((p) => p.status === 'added' && p.text.includes('goddess'))?.by).toBe(
      'ann',
    );
    // It can be undone.
    a.undo();
    expect(textOf(a, root).toString()).toBe('O Sing, muse, the wrath.');

    // The whole stretch as it was when Ann had written it.
    expect(applyEdits(a, e.restore(passage.place, from, to, since.snapshot))).toBe(1);
    expect(textOf(a, root).toString()).toBe('Sing, goddess, the wrath.');
  });

  it('brings a paragraph that was deleted back where it stood', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'First.');
    paragraph(a, root, 'Second.');
    paragraph(a, root, 'Third.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);
    b.transact(() => b.fragment(root, 'body')!.delete(1, 1));
    await flush();
    const e = engineOf(ann, 'ann', a);
    const gone = e.compare(map, { moment: since.snapshot, accepted: [] }).passages[0];
    expect(gone).toMatchObject({ before: true, after: false, place: { path: [1] } });
    applyEdits(a, e.revert(gone, gone.pieces));
    const body = a.fragment(root, 'body')!;
    expect(body.toArray().map((p) => (p as Y.XmlElement).toArray().join(''))).toEqual([
      'First.',
      'Second.',
      'Third.',
    ]);
  });

  it('compares a stretch that was accepted with what was accepted there', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'Sing, goddess, the wrath.');
    await flush();
    const since = engineOf(ann, 'ann').moment(Infinity);
    b.transact(() => textOf(b, root).insert(0, 'O '));
    await flush();
    let e = engineOf(ann, 'ann');
    const passage = e.compare(map, { moment: since.snapshot, accepted: [] }).passages[0];
    // Ann accepts the whole paragraph as it is.
    const t = textOf(a, root);
    const visible: Record<number, [number, number][]> = {};
    for (const p of passage.pieces)
      if (p.status !== 'removed')
        for (const [client, ranges] of Object.entries(p.items))
          (visible[Number(client)] ??= []).push(...ranges);
    const accepted = {
      place: passage.place,
      from: Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(t, 0)),
      to: Y.encodeRelativePosition(Y.createRelativePositionFromTypeIndex(t, t.length, -1)),
      visible,
    };
    e = engineOf(ann, 'ann');
    expect(e.compare(map, { moment: since.snapshot, accepted: [accepted] }).passages).toEqual([]);
    // Written in again: only what is new is a change.
    b.transact(() => textOf(b, root).insert(textOf(b, root).length - 1, ' of Achilles'));
    await flush();
    e = engineOf(ann, 'ann');
    const again = e.compare(map, { moment: since.snapshot, accepted: [accepted] }).passages[0];
    expect(again.pieces.filter((p) => p.status !== 'same').map((p) => p.text)).toEqual([
      ' of Achilles',
    ]);
  });
});

describe('keeping older history less finely', () => {
  const holds = (update: Uint8Array, words: string) =>
    new TextDecoder('utf-8', { fatal: false }).decode(update).includes(words);

  async function written() {
    const { a, ann, root, flush } = await two();
    const steps = [
      () => paragraph(a, root, 'Sing'),
      () => a.transact(() => textOf(a, root).insert(4, ' goddess')),
      () => a.transact(() => textOf(a, root).delete(4, 8)),
      () => a.transact(() => textOf(a, root).insert(4, ' muse')),
    ];
    for (const step of steps) {
      step();
      await flush();
    }
    await a.snapshot(true);
    // Two months ago, a minute apart, within one hour.
    const now = Date.now();
    const base = Math.floor((now - 60 * 24 * 3_600_000) / 3_600_000) * 3_600_000;
    ann.kept.forEach((r, i) => {
      if (i === 0) return;
      r.time = r.until = base + i * 60_000;
    });
    return { a, ann, root, now };
  }

  it('merges the records of an hour into one, without what was made and deleted within it', async () => {
    const { a, ann, root, now } = await written();
    const e = engineOf(ann, 'ann');
    const stretches = e.thin(now, 4, 6, []);
    expect(stretches).toHaveLength(1);
    expect(stretches[0].first).toBe(1);
    expect(stretches[0].count).toBe(ann.kept.length - 1);
    const merged = stretches[0].record;
    expect(merged.kind).toBe('merged');
    expect(holds(merged.update, 'goddess')).toBe(false);
    expect(holds(merged.update, 'muse')).toBe(true);
    // Played again, it is the project as it is.
    const again = new Engine();
    again.load([ann.kept[0], merged]);
    const text = (again.doc.getMap('nodes').get(root) as Y.Map<unknown>).get(
      'body',
    ) as Y.XmlFragment;
    expect((text.get(0) as Y.XmlElement).toArray().join('')).toBe(textOf(a, root).toString());
    // Recent history is left as it is.
    expect(e.thin(now - 50 * 24 * 3_600_000, 4, 6, [])).toEqual([]);
  });

  it('keeps a named moment, and merges nothing across it', async () => {
    const { ann, now } = await written();
    const e = engineOf(ann, 'ann');
    // The moment when "goddess" had been written: before the record that deleted it.
    const at = e.records.findIndex((r) => r.deleted.clients.size) - 1;
    const stretches = e.thin(now, 4, 6, [e.moment(at).snapshot]);
    expect(stretches.length).toBeGreaterThan(0);
    for (const s of stretches) expect(s.first > at || s.first + s.count - 1 <= at).toBe(true);
    // What it shows is kept in what is merged up to it.
    const upTo = stretches.find((s) => s.first + s.count - 1 === at);
    if (upTo) expect(holds(upTo.record.update, 'goddess')).toBe(true);
  });
});

describe('bringing back', () => {
  it('an element as it was, and the whole map', async () => {
    const { a, b, ann, map, root, flush } = await two();
    const achilles = a.addChild(root, { title: 'Achilles' })!;
    const hector = a.addChild(root, { title: 'Hector' })!;
    paragraph(a, achilles, 'Son of Peleus.');
    paragraph(a, hector, 'Tamer of horses.');
    await flush();
    const e0 = engineOf(ann, 'ann');
    const then = e0.records.length - 1;
    b.transact(() => textOf(b, achilles).insert(0, 'Swift '));
    b.remove([hector]);
    const priam = b.addChild(root, { title: 'Priam' })!;
    await flush();

    let e = engineOf(ann, 'ann', a);
    // The element that is gone comes back, under its own id, with its text.
    applyEdits(a, e.bringBack(map, hector, then));
    expect(a.node(hector)?.title).toBe('Hector');
    expect(textOf(a, hector).toString()).toBe('Tamer of horses.');
    expect(a.tree(map).parent.get(hector)).toBe(root);
    // One that is there has its text as it was.
    applyEdits(a, e.bringBack(map, achilles, then));
    expect(textOf(a, achilles).toString()).toBe('Son of Peleus.');
    expect(a.node(priam)).toBeTruthy();
    // The whole map: what was not there goes.
    await flush();
    e = engineOf(ann, 'ann', a);
    applyEdits(a, e.bringBack(map, null, then));
    expect(a.node(priam)).toBeUndefined();
    expect(a.tree(map).sequence.map((id) => a.node(id)!.title)).toEqual([
      'Wrath',
      'Achilles',
      'Hector',
    ]);
    // And it is one change, which undo takes back.
    a.undo();
    expect(a.node(priam)).toBeTruthy();
    // A copy of the project as it was.
    const copy = new Y.Doc();
    Y.applyUpdate(copy, e.stateAt(then));
    expect(copy.getMap('nodes').has(priam)).toBe(false);
    expect(copy.getMap('nodes').has(hector)).toBe(true);
  });
});

describe('the history of a project that is open', () => {
  it('is read when it is first asked, follows what is written, and changes the project', async () => {
    const { a, b, ann, map, root, flush } = await two();
    paragraph(a, root, 'Sing, goddess, the wrath.');
    await flush();
    const history = new ProjectHistory(a, 'p', { read: async () => writeRecords(ann.read()) });
    const since = await history.now();
    // Written after the history was read: followed as it is made, before and after it is written.
    b.transact(() => textOf(b, root).insert(0, 'O '));
    await flush();
    b.transact(() => textOf(b, root).insert(textOf(b, root).length - 1, ' of Achilles'));
    const changes = await history.compare(map, { moment: since.snapshot, accepted: [] });
    const added = changes.passages[0].pieces.filter((p) => p.status === 'added');
    expect(added.map((p) => [p.text, p.by])).toEqual([
      ['O ', 'bo'],
      [' of Achilles', 'bo'],
    ]);
    await history.revert(changes.passages[0], added);
    expect(textOf(a, root).toString()).toBe('Sing, goddess, the wrath.');
    expect((await history.people()).map((p) => p.name).sort()).toEqual(['Ann', 'Bo']);
    history.stop();
  });
});
