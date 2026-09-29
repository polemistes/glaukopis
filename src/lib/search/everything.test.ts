import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { note, p, project, t } from '$lib/found/testing';
import type { Inline } from '$lib/project/model/text';
import type { RefRecord } from '$lib/project/model/types';
import { toBase64 } from '$lib/util/base64';
import { Engine } from './engine';
import { around, readProject, searchProject, type ProjectFound } from './everything';
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

/** A project with a map of two elements, a citation, a note, an association with a name, details and a note on a work. */
function made() {
  const { pr, map, root, elements } = project(
    [p(t('Sing the wrath of Achilles '), cite('r1', '73'), note(t('On wrath, see the poem.')))],
    [p(t('The wrath returns.'))],
  );
  pr.putReference(nagy);
  pr.setNote('r1', 'Nagy on the hero and his wrath.');
  const link = pr.addLink(elements[0], elements[1])!;
  pr.setLinkLabel(link, 'wrath again');
  pr.setDocument(map, { subtitle: 'A study of wrath' });
  pr.setTitle(root, 'The poem');
  return { pr, map, root, elements };
}

const read = (pr: ReturnType<typeof made>['pr'], id = 'p1') =>
  readProject(id, 'Wrath', Y.encodeStateAsUpdate(pr.doc), []);

function found(result: ReturnType<typeof searchProject>): ProjectFound {
  if (!result || 'error' in result) throw new Error('nothing found');
  return result;
}

describe('the search through everything', () => {
  it('reads a project as the disk keeps it, and finds in the texts of its maps', () => {
    const { pr, map, elements } = made();
    const result = found(searchProject(read(pr), 'wrath', options()));
    expect(result.count).toBe(3);
    expect(result.found.map((f) => [f.where, f.element, f.part, f.passage])).toEqual([
      ['text', elements[0], 'body', 0],
      ['text', elements[0], 'body', 1],
      ['text', elements[1], 'body', 0],
    ]);
    expect(result.found[0]).toMatchObject({
      map,
      mapName: 'Wrath',
      elementName: 'Part 1',
      before: 'Sing the ',
      text: 'wrath',
      // What is no text is shown as the text shows it.
      after: ' of Achilles (Nagy 1979, 73)',
    });
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
      await engine.read(id, id, toBase64(Y.encodeStateAsUpdate(pr.doc)), []);
    const a = await engine.search('a', 'wrath', options({ wholeWords: true }));
    const b = await engine.search('b', 'wrath', options({ wholeWords: true }));
    expect(a).toMatchObject({ project: 'a', count: 3 });
    // The centre of the map is named after it: "Wrath".
    expect(b).toMatchObject({ project: 'b', count: 2 });
    expect(await engine.search('c', 'wrath', options())).toBeNull();
    // What was read of a project is kept, and read anew when it is given anew.
    two.pr.setTitle(two.elements[0], 'Of wrath');
    await engine.read('b', 'b', toBase64(Y.encodeStateAsUpdate(two.pr.doc)), []);
    expect(await engine.search('b', 'wrath', options())).toMatchObject({ count: 3 });
  });
});
