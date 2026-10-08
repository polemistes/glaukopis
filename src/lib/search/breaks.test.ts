/**
 * The breaks in search and replace (ADR 0033): `\n` a break within a
 * paragraph, `\p` a paragraph break, found and made; paragraphs read as one
 * where `\p` is searched for; and the break within a paragraph drawn.
 */

import { DOMParser as PMParser, DOMSerializer } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { bodySchema } from '$lib/editor/schema';
import { HASH, cell, note, p, project, t } from '$lib/found/testing';
import { blocksHtml } from '$lib/project/model/html';
import { readBody, type Block, type Inline } from '$lib/project/model/text';
import { readProject, searchProject } from './everything';
import { Matcher, NO_OPTIONS, type SearchOptions } from './matching';
import { PARAGRAPH, bodyPassages, joined } from './passages';
import { positionOf, readBodyDoc } from './prosemirror';
import { replaceAll, type Replacing } from './replacing';
import { Texts, search, type Match } from './searching';

let views: EditorView[] = [];

function editor(fragment: Y.XmlFragment): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({ schema: bodySchema, plugins: [ySyncPlugin(fragment)] }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

const options = (change: Partial<SearchOptions> = {}): SearchOptions => ({
  ...NO_OPTIONS,
  ...change,
});

function matcher(words: string, change: Partial<SearchOptions> = { regex: true }): Matcher {
  const made = Matcher.make(words, options(change));
  if (!made || 'error' in made) throw new Error(`no matcher: ${made && made.error}`);
  return made.matcher;
}

const found = (words: string, text: string, change?: Partial<SearchOptions>) =>
  matcher(words, change)
    .find(text)
    .map((h) => text.slice(h.start, h.end));

/** What is to be replaced, of all that is found, as the search of a text makes it. */
function replacing(all: Match[], m: Matcher, words: string, texts: Texts): Replacing[] {
  return all.map((x) => {
    const read = texts.of(x.element)!;
    const passage = x.part === 'title' ? read.title : read.body[x.passage];
    return {
      element: x.element,
      part: x.part,
      passage: x.passage,
      start: x.start,
      end: x.end,
      ...(x.last !== undefined ? { last: x.last } : {}),
      found: x.text,
      text: m.replacement(x.joined ?? passage.text, x.hit, words),
    };
  });
}

/** Searches the elements of a project, and replaces all that is found. */
function replaceIn(
  pr: ReturnType<typeof project>['pr'],
  elements: string[],
  words: string,
  by: string,
): number {
  const texts = new Texts(pr);
  const m = matcher(words);
  return replaceAll(pr, replacing(search(texts, elements, m), m, by, texts));
}

/** A paragraph of a kind of its own. */
const kind = (name: string, ...content: Inline[]): Block => ({ kind: 'passage', name, content });

describe('the two breaks in a regular expression', () => {
  it('finds a paragraph break by \\p, and a break within a paragraph by \\n', () => {
    const text = `The end.${PARAGRAPH}Next\nline`;
    expect(found('end\\.\\pNext', text)).toEqual([`end.${PARAGRAPH}Next`]);
    expect(found('Next\\nline', text)).toEqual(['Next\nline']);
    expect(found('\\n', text)).toEqual(['\n']);
    expect(matcher('a\\pb').acrossParagraphs).toBe(true);
    expect(matcher('a\\nb').acrossParagraphs).toBe(false);
  });

  it('keeps \\p{…}, the classes of Unicode, and an escaped backslash', () => {
    expect(found('\\p{Lu}', 'aBc', { regex: true, caseSensitive: true })).toEqual(['B']);
    expect(matcher('\\p{L}+').acrossParagraphs).toBe(false);
    expect(found('\\\\p', 'a\\pb')).toEqual(['\\p']);
    expect(matcher('\\\\p').acrossParagraphs).toBe(false);
    expect(found('[\\p]', `a${PARAGRAPH}b`)).toEqual([PARAGRAPH]);
  });

  it('takes \\p as it is written in plain words', () => {
    expect(found('a\\pb', 'a\\pb', {})).toEqual(['a\\pb']);
    expect(matcher('a\\pb', {}).acrossParagraphs).toBe(false);
  });

  it('keeps ^ and $ the beginning and the end of a paragraph where paragraphs are read as one', () => {
    const text = `one two${PARAGRAPH}three four`;
    expect(found('^\\w+|\\w+$', text)).toEqual(['one', 'four']);
    expect(found('(^\\w+|\\w+$)|\\p', text)).toEqual(['one', 'two', PARAGRAPH, 'three', 'four']);
    // Not within a class.
    expect(found('[^x]\\p', text)).toEqual([`o${PARAGRAPH}`]);
  });

  it('puts breaks and a backslash in what replaces', () => {
    const m = matcher('(\\w+) (\\w+)');
    const text = 'wrath sing';
    const [hit] = m.find(text);
    expect(m.replacement(text, hit, '$1\\n$2')).toBe('wrath\nsing');
    expect(m.replacement(text, hit, '$1\\p$2')).toBe(`wrath${PARAGRAPH}sing`);
    expect(m.replacement(text, hit, '$1\\\\$2')).toBe('wrath\\sing');
    expect(m.replacement(text, hit, '\\t')).toBe('\\t');
    // Plain words are put as they are.
    expect(matcher('wrath', {}).replacement(text, hit, 'a\\pb')).toBe('a\\pb');
  });
});

/** A text of paragraphs, a note, a figure, a table and an equation. */
const text: Block[] = [
  p(t('The first'), note(t('A note ends.')), t(' ends.')),
  p(t('Second begins.')),
  {
    kind: 'figure',
    id: 'f1',
    file: HASH,
    extension: 'png',
    name: 'shield.png',
    caption: [t('Said of it.')],
    alt: '',
    width: 100,
    numbered: true,
  },
  p(t('Third.')),
  {
    kind: 'table',
    id: 't1',
    caption: [t('Said of the table.')],
    rows: [[cell(t('Cell one.')), cell(t('Cell two.'))]],
    numbered: true,
    width: 0,
  },
  { kind: 'equation', id: 'e1', tex: 'E = mc^2', numbered: true },
  p(t('Last.')),
];

describe('paragraphs read as one', () => {
  it('are the lines that follow one another, without the note, the captions, the cells or an equation', () => {
    const passages = bodyPassages(text);
    expect(passages.filter((x) => x.apart).map((x) => x.text)).toEqual([
      'Said of it.',
      'Said of the table.',
      'Cell one.',
      'Cell two.',
    ]);
    expect(joined(passages).map((j) => j.text)).toEqual([
      `The first￼ ends.${PARAGRAPH}Second begins.`,
      'A note ends.',
      'Said of it.',
      'Third.',
      'Said of the table.',
      'Cell one.',
      'Cell two.',
      '',
      'Last.',
    ]);
  });

  it('part at the sides of a parallel text, read from blocks, from the project and from an editor alike', () => {
    const parallel: Block[] = [
      p(t('Before.')),
      {
        kind: 'parallel',
        left: [p(t('Left one.')), p(t('Left two.'))],
        right: [p(t('Right one.'))],
      },
      p(t('After.')),
      p(t('Last.')),
    ];
    const runs = ['Before.', `Left one.${PARAGRAPH}Left two.`, 'Right one.', `After.${PARAGRAPH}Last.`];
    expect(joined(bodyPassages(parallel)).map((j) => j.text)).toEqual(runs);
    const { pr, elements } = project(parallel);
    const fragment = pr.fragment(elements[0], 'body')!;
    const view = editor(fragment);
    expect(joined(readBodyDoc(view.state.doc, null).passages).map((j) => j.text)).toEqual(runs);
    // Nothing is found from one side into the other.
    expect(search(new Texts(pr), elements, matcher('two\\.\\pRight'))).toEqual([]);
    expect(search(new Texts(pr), elements, matcher('one\\.\\pLeft')).length).toBe(1);
  });

  it('are searched where \\p is searched for, and found across', () => {
    const { pr, elements } = project(text);
    const texts = new Texts(pr);
    const all = search(texts, elements, matcher('\\.\\p\\w+'));
    expect(all.map((m) => [m.passage, m.start, m.last, m.end, m.text])).toEqual([
      [0, 15, 2, 6, `.${PARAGRAPH}Second`],
    ]);
    // Nothing is joined to a caption, a cell, a note, the name or an equation.
    expect(search(texts, elements, matcher('\\p')).length).toBe(1);
    expect(search(texts, elements, matcher('Third\\.\\p'))).toEqual([]);
    expect(search(texts, elements, matcher('one\\.\\pCell'))).toEqual([]);
  });

  it('find what they found before where \\p is not searched for', () => {
    const { pr, elements } = project(text);
    const texts = new Texts(pr);
    const plain = search(texts, elements, matcher('\\w+\\.'));
    const byPlace = (a: (string | number)[], b: (string | number)[]) =>
      Number(a[0]) - Number(b[0]) || Number(a[1]) - Number(b[1]);
    expect(plain.map((m) => [m.passage, m.start, m.text]).sort(byPlace)).toEqual(
      bodyPassages(text).flatMap((x) =>
        [...x.text.matchAll(/\w+\./gu)].map((h) => [x.index, h.index, h[0]]),
      ),
    );
    expect(plain.every((m) => m.last === undefined && m.joined === undefined)).toBe(true);
    // Across, the same words are found in the same places, with the note where it stands.
    const across = search(texts, elements, matcher('\\w+\\.|\\pz'));
    expect(across.map((m) => [m.passage, m.start, m.text])).toEqual(
      plain.map((m) => [m.passage, m.start, m.text]),
    );
  });

  it('keep to the selection', () => {
    const { pr, elements } = project([p(t('a.')), p(t('b.')), p(t('c.'))]);
    const texts = new Texts(pr);
    const scope = {
      element: elements[0],
      part: 'body' as const,
      from: { passage: 1, offset: 0 },
      to: { passage: 2, offset: 2 },
    };
    expect(search(texts, elements, matcher('\\.\\p\\w'), { scope }).map((m) => m.text)).toEqual([
      `.${PARAGRAPH}c`,
    ]);
  });

  it('are found again across paragraphs where an editor holds them', () => {
    const { pr, elements } = project(text);
    const view = editor(pr.fragment(elements[0], 'body')!);
    const [m] = search(new Texts(pr), elements, matcher('ends\\.\\pSecond'));
    const read = readBodyDoc(view.state.doc, null);
    const from = positionOf(read, m.passage, m.start);
    const to = positionOf(read, m.last!, m.end, true);
    expect(view.state.doc.textBetween(from, to, '|')).toBe('ends.|Second');
  });
});

describe('replacing with breaks', () => {
  it('makes a break within the paragraph of \\n, without an editor and with one', () => {
    for (const open of [false, true]) {
      const { pr, elements } = project([
        p(t('Sing, '), t('goddess', { em: {} }), t(', the wrath')),
      ]);
      const view = open ? editor(pr.fragment(elements[0], 'body')!) : null;
      expect(replaceIn(pr, elements, ', the', ',\\nthe')).toBe(1);
      expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
        p(t('Sing, '), t('goddess', { em: {} }), t(','), { kind: 'break' }, t('the wrath')),
      ]);
      if (view) expect(view.state.doc.firstChild?.child(3).type.name).toBe('hard_break');
    }
  });

  it('splits the paragraph at \\p, the new one of the same kind', () => {
    for (const open of [false, true]) {
      const { pr, elements } = project([
        p(t('First.')),
        kind('epigraph', t('Sing. Goddess.')),
        p(t('Last.')),
      ]);
      const view = open ? editor(pr.fragment(elements[0], 'body')!) : null;
      expect(replaceIn(pr, elements, '(Sing\\.) ', '$1\\p')).toBe(1);
      expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
        p(t('First.')),
        kind('epigraph', t('Sing.')),
        kind('epigraph', t('Goddess.')),
        p(t('Last.')),
      ]);
      if (view) expect(view.state.doc.childCount).toBe(4);
    }
  });

  it('joins the paragraphs a match ran across, the first keeping its kind', () => {
    for (const open of [false, true]) {
      const { pr, elements } = project([
        kind('epigraph', t('Sing, '), t('goddess', { em: {} })),
        p(t('the wrath.')),
        p(t('Other.')),
      ]);
      const view = open ? editor(pr.fragment(elements[0], 'body')!) : null;
      expect(replaceIn(pr, elements, 'goddess\\pthe', 'goddess, the')).toBe(1);
      expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
        kind('epigraph', t('Sing, '), t('goddess, the', { em: {} }), t(' wrath.')),
        p(t('Other.')),
      ]);
      if (view) expect(view.state.doc.childCount).toBe(2);
    }
  });

  it('takes away empty paragraphs, and all of it is one step of undo', () => {
    const { pr, elements } = project([p(t('One.')), p(), p(), p(t('Two.')), p(t('Three.'))]);
    pr.checkpoint();
    const before = readBody(pr.fragment(elements[0], 'body')!);
    expect(replaceIn(pr, elements, '\\p(\\p)+', '\\p')).toBe(1);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
      p(t('One.')),
      p(t('Two.')),
      p(t('Three.')),
    ]);
    pr.undo();
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual(before);
  });

  it('replaces in a note and in a caption, where a paragraph break is a break within the line', () => {
    const { pr, elements } = project(text);
    expect(replaceIn(pr, elements, 'A note ends\\.|Said of it\\.', '$&\\pMore.')).toBe(2);
    const after = readBody(pr.fragment(elements[0], 'body')!);
    expect(after[0]).toEqual(
      p(t('The first'), note(t('A note ends.'), { kind: 'break' }, t('More.')), t(' ends.')),
    );
    expect(after[2]).toMatchObject({
      kind: 'figure',
      caption: [t('Said of it.'), { kind: 'break' }, t('More.')],
    });
    expect(after.length).toBe(text.length);
  });

  it('replaces the others of a text with those that make breaks', () => {
    const { pr, elements } = project([p(t('x-y')), p(t('z-w'))]);
    expect(replaceIn(pr, elements, 'y|z|-', '_')).toBe(4);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([p(t('x__')), p(t('__w'))]);
    expect(replaceIn(pr, elements, '_\\p_|x', '\\n')).toBe(2);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
      p({ kind: 'break' }, t('_'), { kind: 'break' }, t('_w')),
    ]);
  });

  it('puts a space for a break in a name', () => {
    const { pr, elements } = project([p(t('x'))]);
    expect(replaceIn(pr, [elements[0]], 'Part ', 'Part\\p')).toBe(1);
    expect(pr.node(elements[0])?.title).toBe('Part 1');
  });
});

describe('the search through everything with \\p', () => {
  it('finds across paragraphs, and shows a ¶ where the paragraph broke', () => {
    const { pr, elements } = project(text);
    const read = readProject('p1', 'Wrath', Y.encodeStateAsUpdate(pr.doc), []);
    const result = searchProject(read, 'ends\\.\\pSecond', options({ regex: true }));
    if (!result || 'error' in result) throw new Error('nothing found');
    expect(result.count).toBe(1);
    expect(result.found[0]).toMatchObject({
      element: elements[0],
      passage: 0,
      start: 11,
      before: 'The first ',
      text: 'ends. ¶ Second',
      after: ' begins.',
    });
  });
});

describe('the break within a paragraph, drawn', () => {
  it('is a break the style sheet draws a sign for, and is read from what is pasted as one', () => {
    const doc = bodySchema.node('doc', null, [
      bodySchema.node('paragraph', null, [
        bodySchema.text('a'),
        bodySchema.nodes.hard_break.create(),
        bodySchema.text('b'),
      ]),
    ]);
    const dom = DOMSerializer.fromSchema(bodySchema).serializeFragment(doc.content);
    const box = document.createElement('div');
    box.append(dom);
    expect(box.innerHTML).toBe('<p>a<span class="hard-break"><br></span>b</p>');
    // No sign in the text: it is the style sheet's.
    expect(box.textContent).toBe('ab');
    for (const html of [box.innerHTML, '<p>a<br>b</p>']) {
      const from = document.createElement('div');
      from.innerHTML = html;
      const parsed = PMParser.fromSchema(bodySchema).parse(from);
      expect(parsed.eq(doc)).toBe(true);
    }
    expect(blocksHtml([p(t('a'), { kind: 'break' }, t('b'))])).toBe(
      '<p>a<span class="hard-break"><br></span>b</p>',
    );
  });
});
