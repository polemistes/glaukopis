import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { PLAIN_POINTER, PLAIN_WORDS, type LabelWords } from '$lib/editor/labels';
import { HASH, note, oldDocument, p, project, t } from '$lib/found/testing';
import type { Block, Inline } from '$lib/project/model/text';
import { PROJECT, type RefRecord } from '$lib/project/model/types';
import { Engine } from './engine';
import { around, documentsOf, readProject, searchProject, type ProjectFound } from './everything';
import { NO_OPTIONS, type SearchOptions } from './matching';

const options = (change: Partial<SearchOptions> = {}): SearchOptions => ({
  ...NO_OPTIONS,
  ...change,
});

const nagy: RefRecord = {
  id: 'r1',
  key: 'nagy1979',
  type: 'book',
  fields: {},
  names: {},
  modified: '2026-01-01T00:00:00Z',
  authors: 'Nagy',
  year: '1979',
  title: 'The Best of the Achaeans',
  container: '',
};

const cite = (id: string, locator?: string): Inline => ({
  kind: 'citation',
  items: [{ id, ...(locator ? { locator } : {}) }],
  mode: 'normal',
});

/** A project with two elements, a citation, a note, an association with a name, details and a note on a work. */
function made() {
  const { pr, at, elements } = project(
    [p(t('Sing the wrath of Achilles '), cite('r1', '73'), note(t('On wrath, see the poem.')))],
    [p(t('The wrath returns.'))],
  );
  pr.putReference(nagy);
  pr.setNote('r1', 'Nagy on the hero and his wrath.');
  const link = pr.addLink(elements[0], elements[1])!;
  pr.setLinkLabel(link, 'wrath again');
  pr.setDocument(at, { subtitle: 'A study of wrath' });
  pr.setName('The poem');
  return { pr, at, elements };
}

const read = (pr: ReturnType<typeof made>['pr'], id = 'p1') =>
  readProject(id, 'Wrath', Y.encodeStateAsUpdate(pr.doc), []);

function found(result: ReturnType<typeof searchProject>): ProjectFound {
  if (!result || 'error' in result) throw new Error('nothing found');
  return result;
}

describe('the search through everything', () => {
  it('reads a project as the disk keeps it, and finds in the texts of its elements', () => {
    const { pr, elements } = made();
    const result = found(searchProject(read(pr), 'wrath', options()));
    expect(result.count).toBe(3);
    expect(result.found.map((f) => [f.where, f.element, f.part, f.passage])).toEqual([
      ['text', elements[0], 'body', 0],
      ['text', elements[0], 'body', 1],
      ['text', elements[1], 'body', 0],
    ]);
    expect(result.found[0]).toMatchObject({
      // Under the project, each element is a tree of its own.
      tree: elements[0],
      treeName: 'Part 1',
      elementName: 'Part 1',
      before: 'Sing the ',
      text: 'wrath',
      // What is no text is shown as the text shows it.
      after: ' of Achilles (Nagy 1979, 73)',
    });
  });

  it('says how many of the changes on disk could not be applied, and searches the rest', () => {
    const { pr } = made();
    const state = Y.encodeStateAsUpdate(pr.doc);
    const whole = readProject('p1', 'Wrath', state, []);
    expect(whole.unapplied).toBe(0);
    const partly = readProject('p1', 'Wrath', state, [new Uint8Array([1, 2, 3])]);
    expect(partly.unapplied).toBe(1);
    const result = found(searchProject(partly, 'wrath', options()));
    expect(result.unapplied).toBe(1);
    expect(result.count).toBe(3);
  });

  it('reads a project written as maps in the shape it opens in, without writing it back', () => {
    const old = oldDocument({
      centre: [p(t('Of wrath.'))],
      part: [p(t('More wrath.'))],
      loose: [p(t('Wrath beside.'))],
    });
    const before = Y.encodeStateAsUpdate(old);
    const read = readProject('p2', 'Wrath', before, []);
    // One tree: the project at the top, the centre and the loose element under it.
    expect(read.tree.sequence).toEqual([PROJECT, 'centre', 'part', 'loose']);
    expect(read.elements.map((e) => [e.name, e.tree])).toEqual([
      ['Wrath', null],
      ['The poem', 'centre'],
      ['Part 1', 'centre'],
      ['Beside', 'loose'],
    ]);
    const result = found(searchProject(read, 'wrath', options({ wholeWords: true })));
    // The project's own element is named after the project.
    expect(result.found.map((f) => [f.element, f.treeName])).toEqual([
      [PROJECT, ''],
      ['centre', 'The poem'],
      ['part', 'The poem'],
      ['loose', 'Beside'],
    ]);
    expect(Y.encodeStateAsUpdate(old)).toEqual(before);
  });

  it('finds what stands outside the texts only where that is asked for', () => {
    const { pr } = made();
    const project = read(pr);
    expect(searchProject(project, 'Nagy', options())).toMatchObject({ count: 0 });
    const outside = found(searchProject(project, 'Nagy', options({ labels: true })));
    expect(outside.found.map((f) => f.where)).toEqual(['text', 'note']);
    expect(outside.found[0].text).toBe('Nagy');
    expect(outside.found[1]).toMatchObject({ ref: 'r1', work: 'Nagy 1979' });
    const wrath = found(searchProject(project, 'wrath', options({ labels: true })));
    expect(wrath.found.map((f) => f.where)).toEqual([
      'text',
      'text',
      'text',
      'details',
      'association',
      'note',
    ]);
    // The details are said of the project itself, which is in no tree under it.
    expect(wrath.found[3]).toMatchObject({ tree: null, element: PROJECT, elementName: 'The poem' });
    expect(wrath.found[4].elementName).toBe('Part 1 ↔ Part 2');
  });

  it('says of the words around what was found where they are cut', () => {
    const long = `${'a '.repeat(60)}wrath${' b'.repeat(60)}`;
    const [before, text, after] = around(long, 120, 125);
    expect(text).toBe('wrath');
    expect(before.startsWith('…')).toBe(true);
    expect(after.endsWith('…')).toBe(true);
    expect(around('the wrath', 4, 9)).toEqual(['the ', 'wrath', '']);
  });

  it('says so of a regular expression that is not one', () => {
    const { pr } = made();
    expect(searchProject(read(pr), '(wr', options({ regex: true }))).toHaveProperty('error');
  });

  it('reads and searches two projects, without a worker where there is none', async () => {
    const one = made();
    const two = project([p(t('No anger here, but wrath.'))]);
    const engine = new Engine();
    for (const [id, pr] of [
      ['a', one.pr],
      ['b', two.pr],
    ] as const)
      await engine.read(id, id, Y.encodeStateAsUpdate(pr.doc), []);
    const a = await engine.search('a', 'wrath', options({ wholeWords: true }));
    const b = await engine.search('b', 'wrath', options({ wholeWords: true }));
    expect(a).toMatchObject({ project: 'a', count: 3 });
    // The project's own element is named after it: "Wrath".
    expect(b).toMatchObject({ project: 'b', count: 2 });
    expect(await engine.search('c', 'wrath', options())).toBeNull();
    // What was read of a project is kept, and read anew when it is given anew.
    two.pr.setTitle(two.elements[0], 'Of wrath');
    await engine.read('b', 'b', Y.encodeStateAsUpdate(two.pr.doc), []);
    expect(await engine.search('b', 'wrath', options())).toMatchObject({ count: 3 });
  });

  it('says what a project cites, in its texts and their notes, each once', async () => {
    const one = made();
    const two = project(
      [p(t('Again '), cite('r1'), note(t('See '), cite('r2'), t(' and '), cite('r1')))],
      [p(t('Nothing cited here.'))],
    );
    const engine = new Engine();
    await engine.read('a', 'a', Y.encodeStateAsUpdate(one.pr.doc), []);
    await engine.read('b', 'b', Y.encodeStateAsUpdate(two.pr.doc), []);
    expect(await engine.cited('a')).toEqual(['r1']);
    expect((await engine.cited('b')).sort()).toEqual(['r1', 'r2']);
    expect(await engine.cited('c')).toEqual([]);
  });
});

describe('what stands outside the text, as each document of a project says it', () => {
  const figure = (id: string): Block => ({
    kind: 'figure',
    id,
    file: HASH,
    extension: 'png',
    name: 'shield.png',
    caption: [t('The shield')],
    alt: '',
    width: 100,
    numbered: true,
  });
  /** Two documents, each with a figure; the second points to its own and cites a chapter. */
  function two() {
    const { pr, elements } = project(
      [figure('f0'), p(t('The first.'))],
      [
        figure('f1'),
        p(t('See '), { kind: 'crossref', target: 'f1', form: 'full' }, t(' and '), {
          kind: 'citation',
          items: [{ id: 'r1', locator: '4', label: 'chapter' }],
          mode: 'normal',
        }),
      ],
    );
    pr.putReference(nagy);
    pr.setDocument(PROJECT, { language: 'de', title: 'Zorn' });
    pr.setDocument(elements[1], { format: 'own-layout' });
    return { pr, elements };
  }
  const german: LabelWords = {
    citation: { ...PLAIN_WORDS.citation, noDate: 'o. J.', locators: { chapter: 'Kap.' } },
    pointer: { ...PLAIN_POINTER, label: 'Abbildung' },
  };

  it('are the documents of the project, each with what is said of it over what the project says', () => {
    const { pr, elements } = two();
    expect(documentsOf(read(pr))).toEqual([
      { tree: PROJECT, settings: { language: 'de', title: 'Zorn' } },
      { tree: elements[0], settings: { language: 'de' } },
      { tree: elements[1], settings: { language: 'de', format: 'own-layout' } },
    ]);
  });

  it('say what the document calls a figure and a locator, with the words the window sent', () => {
    const { pr, elements } = two();
    const said = found(
      searchProject(read(pr), 'Abbildung', options({ labels: true }), 300, {
        [elements[1]]: german,
      }),
    );
    expect(said.count).toBe(1);
    // Counted in its own document, where it is the first. The words around
    // what is found show every space as one.
    expect(`${said.found[0].text}${said.found[0].after}`).toMatch(
      /^Abbildung 1 and \(Nagy 1979, Kap\. 4\)/,
    );
    expect(
      searchProject(read(pr), 'Figure', options({ labels: true }), 300, { [elements[1]]: german }),
    ).toMatchObject({ count: 0 });
  });

  it('are those of a document without a layout of its own where none were sent', () => {
    const { pr } = two();
    const said = found(searchProject(read(pr), 'Figure', options({ labels: true })));
    expect(said.count).toBe(1);
    expect(said.found[0].after).toMatch(/^ 1 and \(Nagy 1979, ch\. 4\)/);
  });

  it('are read anew when other words are sent for the same project', () => {
    const { pr, elements } = two();
    const once = read(pr);
    expect(searchProject(once, 'Figure', options({ labels: true }))).toMatchObject({ count: 1 });
    expect(
      searchProject(once, 'Abbildung', options({ labels: true }), 300, { [elements[1]]: german }),
    ).toMatchObject({ count: 1 });
  });
});
