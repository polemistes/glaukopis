import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { writeBody } from '$lib/project/model/blocks';
import { Project } from '$lib/project/model/project.svelte';
import type { Block, Inline } from '$lib/project/model/text';
import { PROJECT, type RefRecord } from '$lib/project/model/types';
import { everything, mark, p, t, trapBlocks } from './fixtures';
import { normalInlines } from './inline';
import { findWords, intoProject, orgOf } from './of-project';
import { readProject } from './read';
import type { OrgProject } from './types';
import { writeProject } from './write';

/** Marks that say nothing but that they are there, as the project reads them: `{}` for `true`. */
function marks(inlines: Inline[]): Inline[] {
  return normalInlines(inlines).map((i) =>
    i.kind === 'text'
      ? {
          ...i,
          marks: Object.fromEntries(
            Object.entries(i.marks).map(([k, v]) => [k, v === true ? {} : v]),
          ),
        }
      : i.kind === 'footnote'
        ? { ...i, content: marks(i.content) }
        : i,
  );
}

/**
 * Blocks as the Org form holds them: empty paragraphs dropped, words in
 * their plain form; the id of an equation that is not numbered is the
 * program's own, made where there is none.
 */
function normal(blocks: readonly Block[]): Block[] {
  const out: Block[] = [];
  for (const b of blocks) {
    if (b.kind === 'paragraph') {
      const content = marks(b.content);
      if (content.length || b.name === 'break') out.push({ ...b, content });
    } else if (b.kind === 'table')
      out.push({
        ...b,
        caption: marks(b.caption),
        rows: b.rows.map((r) => r.map((c) => ({ ...c, content: normal(c.content) }))),
      });
    else if (b.kind === 'figure') out.push({ ...b, caption: marks(b.caption) });
    else if (b.kind === 'equation' && !b.numbered) out.push({ ...b, id: '' });
    else if (b.kind === 'row') out.push({ ...b, items: normal(b.items) });
    else if (b.kind === 'parallel')
      out.push({ ...b, left: normal(b.left), right: normal(b.right) });
    else out.push(b);
  }
  return out;
}

/** A project's Org form with what a project does not keep left out: settings that say nothing. */
function normalProject(o: OrgProject): OrgProject {
  return {
    ...o,
    elements: o.elements.map((e) => ({
      ...e,
      name: marks(e.name),
      blocks: normal(e.blocks),
      document: Object.fromEntries(
        Object.entries(e.document).filter(
          ([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && !v.length),
        ),
      ),
      timeline: e.timeline && Object.keys(e.timeline).length ? e.timeline : null,
    })),
  };
}

const ref = (id: string, key: string): RefRecord => ({
  id,
  key,
  type: 'book',
  fields: { title: `The book of ${key}` },
  names: { author: [{ family: key }] },
  modified: '',
  authors: key,
  year: '1979',
  title: `The book of ${key}`,
  container: '',
});

/** A project made in code, as the writer would make it, with something of everything. */
function made(): Project {
  const pr = new Project(null);
  pr.begin('Medea');
  const scene = pr.addChild(PROJECT, { title: 'The prologue' })!;
  const nurse = pr.addChild(scene, { title: 'Nurse' })!;
  const notes = pr.addChild(PROJECT, { title: 'Notes' })!;
  const kind = pr.createKind({ name: 'Character', colour: 'blue', template: '', begins: 'line' })!;
  const own = pr.createPassageKind({
    name: 'Letter',
    family: 'paragraph',
    basedOn: 'quote',
    look: { italic: true },
  })!;
  pr.setKind([nurse], kind);
  pr.setStatus([scene], 'draft');
  pr.setPosition(nurse, { x: 40, y: -20 });
  pr.setHeading(notes, false);
  pr.setExcluded(notes, true);
  pr.setDocument(PROJECT, { language: 'en-GB', subtitle: 'A tragedy' });
  pr.setWhen(scene, { start: { at: '431 BC' } });
  pr.setTimeline(PROJECT, { axis: 'dates' });
  pr.putReference(ref('R1abc', 'nagy1979'));
  pr.transact(() => {
    writeBody(pr.fragment(scene, 'body')!, [
      p(
        [
          mark({ number: '1' }),
          t('If only the Argo had never flown'),
          { kind: 'break' },
          t('through the dark Clashing Rocks'),
        ],
        'line',
        { numbering: 'counted', every: 5 },
      ),
      p([t('Nurse')], 'speaker'),
      p([t('She weeps for the gods before men.')], 'quote'),
      p([t('A letter of the writer’s own kind.')], own),
      p([t('First')], 'item'),
      p([t('Second')], 'item', { indent: 1 }),
      p([
        t('As Nagy says'),
        { kind: 'citation', mode: 'normal', items: [{ id: 'R1abc', locator: '73' }] },
        t('.'),
        { kind: 'footnote', content: [t('So Nagy, who is not alone.')] },
      ]),
    ]);
    writeBody(pr.fragment(notes, 'body')!, trapBlocks());
  });
  pr.addLink(scene, nurse);
  pr.setLinkLabel(pr.links[0].id, 'answers');
  pr.addLink(notes, scene);
  pr.setMe({ id: 'u1', name: 'Robert' });
  const words = findWords(pr.fragment(scene, 'body')!, 'gods before men')!;
  const thread = pr.comment(
    scene,
    { ...words, text: 'gods before men' },
    "Is this Nagy's phrase?",
  )!;
  pr.reply(thread, 'Yes, p. 73.');
  pr.setResolved(thread, true);
  pr.comment(nurse, null, 'Who is she?');
  return pr;
}

describe('the Org form of a project as the program has it', () => {
  it('a project made of the Org form of everything gives the same Org form back', () => {
    const o = everything();
    // A project carries only templates of the writer's own, and a comment
    // on words is on words its element has.
    for (const template of Object.values(o.templates)) template.group = 'own';
    o.comments[0].words = 'Clashing Rocks';
    o.comments[2].words = null;
    const pr = new Project(null);
    intoProject(o, pr);
    const back = normalProject(orgOf(pr));
    const want = normalProject(o);
    // The works the project carries are those it cites.
    expect(back.references.map((r) => r.id).sort()).toEqual(
      want.references
        .filter((r) => back.references.some((b) => b.id === r.id))
        .map((r) => r.id)
        .sort(),
    );
    expect({ ...back, references: [] }).toEqual({ ...want, references: [] });
  });

  it('a project written as Org, read back and made anew is the same project', () => {
    const first = made();
    const org = orgOf(first);
    expect(org.elements.map((e) => e.depth)).toEqual([0, 1, 2, 1]);
    expect(org.comments.map((c) => c.words)).toEqual(['gods before men', null]);
    const text = writeProject(org);
    expect(text).toContain('[cite:@nagy1979 73]');
    const read = readProject(text, org.references);
    const second = new Project(null);
    intoProject(read, second);
    expect(normalProject(orgOf(second))).toEqual(normalProject(org));
    expect(second.name).toBe('Medea');
    // The comment finds its words again.
    const thread = second.threadsOf(org.elements[1].id)[0];
    expect(thread.passage?.text).toBe('gods before men');
    expect(thread.notes.map((n) => [n.author.name, n.text])).toEqual([
      ['Robert', "Is this Nagy's phrase?"],
      ['Robert', 'Yes, p. 73.'],
    ]);
    const body = second.fragment(org.elements[1].id, 'body')!;
    const from = Y.createAbsolutePositionFromRelativePosition(
      Y.decodeRelativePosition(thread.passage!.from),
      second.doc,
    )!;
    const to = Y.createAbsolutePositionFromRelativePosition(
      Y.decodeRelativePosition(thread.passage!.to),
      second.doc,
    )!;
    expect(from.type).toBe(to.type);
    expect((from.type as Y.XmlText).toString().slice(from.index, to.index)).toBe('gods before men');
    expect(body.length).toBeGreaterThan(0);
    // Saved, but not undone.
    expect(second.canUndo).toBe(false);
  });

  it('a comment whose words are gone stands on its element', () => {
    const o = everything();
    o.comments = [
      {
        element: 'blocks',
        words: 'words that are nowhere',
        resolved: false,
        notes: [{ author: 'Anna', date: '2026-10-12', text: 'Where?' }],
      },
    ];
    const pr = new Project(null);
    intoProject(o, pr);
    const [thread] = pr.threadsOf('blocks');
    expect(thread.passage).toBeNull();
    expect(thread.notes[0].text).toBe('Where?');
  });

  it('words are found across marks and with spaces of any kind', () => {
    const pr = new Project(null);
    pr.begin('X');
    pr.transact(() =>
      writeBody(pr.fragment(PROJECT, 'body')!, [
        p([t('the '), t('wine-dark', { em: true }), t('  sea and')]),
        p([t('more')]),
      ]),
    );
    const body = pr.fragment(PROJECT, 'body')!;
    expect(findWords(body, 'wine-dark sea')).not.toBeNull();
    expect(findWords(body, 'and more')).not.toBeNull();
    expect(findWords(body, 'the wine-dark se…')).not.toBeNull();
    expect(findWords(body, 'nothing here')).toBeNull();
  });

  it('the Org form of a large project is made quickly', () => {
    const pr = new Project(null);
    pr.begin('Large');
    const text = (n: number): Block[] => [
      p([t(`Paragraph ${n} of the element, with some words in it, `), t('marked', { em: true })]),
      p([t('A second paragraph, a little longer than the first, to have something to write.')]),
      p([t('And a line'), { kind: 'break' }, t('of verse')], 'line'),
    ];
    pr.transact(() => {
      for (let i = 0; i < 2000; i++) {
        const id = pr.addChild(PROJECT, { title: `Element ${i}` })!;
        writeBody(pr.fragment(id, 'body')!, text(i));
      }
    });
    writeProject(orgOf(pr));
    const begun = performance.now();
    const gathered = orgOf(pr);
    const between = performance.now();
    const org = writeProject(gathered);
    const done = performance.now();
    expect(org.length).toBeGreaterThan(100_000);
    console.log(
      `the Org form of 2000 elements: gathered in ${(between - begun).toFixed(1)} ms, written in ${(done - between).toFixed(1)} ms`,
    );
  });
});
