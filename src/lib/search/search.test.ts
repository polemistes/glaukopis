import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { ySyncPlugin } from 'y-prosemirror';
import { afterEach, describe, expect, it } from 'vitest';
import type * as Y from 'yjs';
import { bodySchema, titleSchema } from '$lib/editor/schema';
import { HASH, cell, note, p, project, t } from '$lib/found/testing';
import { readBody, readTitle, type Block, type Inline } from '$lib/project/model/text';
import { Matcher, NO_OPTIONS, fold, type SearchOptions } from './matching';
import { NO_TEXT, bodyPassages, titlePassage, type Labels } from './passages';
import { offsetOf, positionOf, readBodyDoc, readTitleDoc } from './prosemirror';
import { readBodyY, readTitleY, replaceAll, type Replacing } from './replacing';
import { Texts, search, type Match } from './searching';

let views: EditorView[] = [];

/** An editor bound to a text of the project, as where the text is written. */
function editor(fragment: Y.XmlFragment, kind: 'body' | 'title' = 'body'): EditorView {
  const place = document.body.appendChild(document.createElement('div'));
  const view = new EditorView(place, {
    state: EditorState.create({
      schema: kind === 'body' ? bodySchema : titleSchema,
      plugins: [ySyncPlugin(fragment)],
    }),
  });
  views.push(view);
  return view;
}

afterEach(() => {
  for (const v of views) v.destroy();
  views = [];
  document.body.innerHTML = '';
});

const LABELS: Labels = {
  citation: (items) => `(Nagy 1979${items[0]?.locator ? `, ${items[0].locator}` : ''})`,
  crossref: () => 'Figure 1',
};

const cite = (id: string, locator?: string): Inline => ({
  kind: 'citation',
  items: [{ id, ...(locator ? { locator } : {}) }],
  mode: 'normal',
});

/** A text with something of every kind in it. */
const rich: Block[] = [
  p(
    t('Sing, goddess, the wrath of '),
    t('Achilles', { em: {} }),
    t(' son of Peleus'),
    note(t('The wrath is '), t('mēnis', { em: {} }), t('.')),
    t(', the accursed wrath.'),
  ),
  { kind: 'blockquote', content: [p(t('A wrath that brought countless sorrows.'))] },
  { kind: 'bullet_list', items: [[p(t('First wrath'))], [p(t('Second'))]] },
  {
    kind: 'figure',
    id: 'f1',
    file: HASH,
    extension: 'png',
    name: 'shield.png',
    caption: [t('The wrath shown')],
    alt: '',
    width: 100,
    numbered: true,
  },
  {
    kind: 'table',
    id: 't1',
    caption: [t('Wrath in numbers')],
    rows: [[cell(t('wrath')), cell(t('nine'))]],
    numbered: true,
    width: 0,
  },
  { kind: 'equation', id: 'e1', tex: 'E = mc^2', numbered: true },
  p(
    t('Before '),
    cite('r1', '73'),
    t(' after '),
    { kind: 'math', tex: 'x^2' },
    t(' and '),
    { kind: 'crossref', target: 'f1', form: 'full' },
    { kind: 'break' },
    t('next line wrath'),
  ),
];

const options = (change: Partial<SearchOptions> = {}): SearchOptions => ({
  ...NO_OPTIONS,
  ...change,
});

function matcher(words: string, change: Partial<SearchOptions> = {}): Matcher {
  const made = Matcher.make(words, options(change));
  if (!made || 'error' in made) throw new Error(`no matcher: ${made && made.error}`);
  return made.matcher;
}

const found = (words: string, text: string, change: Partial<SearchOptions> = {}) =>
  matcher(words, change)
    .find(text)
    .map((h) => text.slice(h.start, h.end));

describe('the passages of a text', () => {
  it('are its paragraphs, captions, cells and equations, with a note after the paragraph it stands in', () => {
    const passages = bodyPassages(rich);
    expect(passages.map((x) => [x.kind, x.text])).toEqual([
      ['line', `Sing, goddess, the wrath of Achilles son of Peleus${NO_TEXT}, the accursed wrath.`],
      ['note', 'The wrath is mēnis.'],
      ['line', 'A wrath that brought countless sorrows.'],
      ['line', 'First wrath'],
      ['line', 'Second'],
      ['line', 'The wrath shown'],
      ['line', 'Wrath in numbers'],
      ['line', 'wrath'],
      ['line', 'nine'],
      ['equation', ''],
      ['line', `Before ${NO_TEXT} after ${NO_TEXT} and ${NO_TEXT}\nnext line wrath`],
    ]);
    expect(passages[1].within).toEqual({ passage: 0, at: 50 });
    expect(passages[0].text[50]).toBe(NO_TEXT);
  });

  it('take in what stands outside the text where that is asked for', () => {
    const passages = bodyPassages(rich, LABELS);
    expect(passages[9].text).toBe('E = mc^2');
    expect(passages[10].text).toBe(
      `Before (Nagy 1979, 73) after x^2 and Figure 1\nnext line wrath`,
    );
    // A note is a note still: its text is a passage of its own.
    expect(passages[0].text).toContain(NO_TEXT);
  });

  it('are read alike from the blocks, from the project and from an editor', () => {
    const { pr, elements } = project(rich);
    const fragment = pr.fragment(elements[0], 'body')!;
    const view = editor(fragment);
    for (const labels of [null, LABELS]) {
      const blocks = bodyPassages(readBody(fragment), labels).map((x) => [x.index, x.text]);
      expect(readBodyY(fragment, labels).passages.map((x) => [x.index, x.text])).toEqual(blocks);
      expect(readBodyDoc(view.state.doc, labels).passages.map((x) => [x.index, x.text])).toEqual(
        blocks,
      );
    }
    const title = pr.fragment(elements[0], 'title')!;
    const named = titlePassage(readTitle(title)).text;
    expect(named).toBe('Part 1');
    expect(readTitleY(title).passages[0].text).toBe(named);
    expect(readTitleDoc(editor(title, 'title').state.doc).passages[0].text).toBe(named);
  });

  it('are found again where an editor holds them', () => {
    const { pr, elements } = project(rich);
    const view = editor(pr.fragment(elements[0], 'body')!);
    const read = readBodyDoc(view.state.doc, null);
    const doc = view.state.doc;
    // "wrath" in the note, and in the line after a break.
    const inNote = read.passages[1].text.indexOf('wrath');
    const from = positionOf(read, 1, inNote);
    expect(doc.textBetween(from, positionOf(read, 1, inNote + 5, true))).toBe('wrath');
    const last = read.passages[10].text.lastIndexOf('wrath');
    expect(doc.textBetween(positionOf(read, 10, last), positionOf(read, 10, last + 5, true))).toBe(
      'wrath',
    );
    expect(offsetOf(read, positionOf(read, 10, last))).toEqual({ passage: 10, offset: last });
    expect(offsetOf(read, from)).toEqual({ passage: 1, offset: inNote });
    // Between passages, as where all is selected: the beginning of the next, or the end of the one before.
    expect(offsetOf(read, 0)).toEqual({ passage: 0, offset: 0 });
    expect(offsetOf(read, doc.content.size, 'to')).toEqual({
      passage: 10,
      offset: read.passages[10].text.length,
    });
  });
});

describe('finding words', () => {
  it('finds capitals and small letters alike, unless they are to be as written', () => {
    expect(found('wrath', 'Wrath and wrath')).toEqual(['Wrath', 'wrath']);
    expect(found('wrath', 'Wrath and wrath', { caseSensitive: true })).toEqual(['wrath']);
    // Greek, with its final sigma.
    expect(found('λογος', 'ΛΟΓΟΣ λόγος λογος')).toEqual(['ΛΟΓΟΣ', 'λογος']);
  });

  it('finds whole words only, where asked', () => {
    expect(found('wrath', 'wrathful wrath wrath2')).toEqual(['wrath', 'wrath', 'wrath']);
    expect(found('wrath', 'wrathful wrath, wrath2 (wrath)', { wholeWords: true })).toEqual([
      'wrath',
      'wrath',
    ]);
    expect(found('ἄειδε', 'ἄειδε θεὰ', { wholeWords: true })).toEqual(['ἄειδε']);
  });

  it('finds letters with and without accents alike, where asked', () => {
    expect(found('αειδε', 'Μῆνιν ἄειδε θεὰ')).toEqual([]);
    expect(found('αειδε', 'Μῆνιν ἄειδε θεὰ', { accentsAlike: true })).toEqual(['ἄειδε']);
    expect(found('Pelée', 'Pelee and Pelée', { accentsAlike: true })).toEqual(['Pelee', 'Pelée']);
    // Letters written with their accents apart are found whole.
    const apart = 'Pelée said';
    expect(found('pelee', apart, { accentsAlike: true })).toEqual(['Pelée']);
    // A letter of its own is not a letter with an accent.
    expect(found('o', 'ø', { accentsAlike: true })).toEqual([]);
    expect(fold('é').text).toBe('e');
  });

  it('finds by regular expressions, and says when one is not', () => {
    expect(found('wr[a-z]+h', 'wrath and wreath', { regex: true })).toEqual(['wrath', 'wreath']);
    expect(Matcher.make('(unclosed', options({ regex: true }))).toHaveProperty('error');
    // Nothing is found that is nothing.
    expect(found('x*', 'axxb', { regex: true })).toEqual(['xx']);
  });

  it('takes plain words as they are written, with room of any kind and quotes of either kind', () => {
    expect(found('(Nagy', 'as (Nagy 1979)')).toEqual(['(Nagy']);
    expect(found('a.b', 'a.b axb')).toEqual(['a.b']);
    expect(found('the wrath', 'the wrath')).toEqual(['the wrath']);
    expect(found("Achilles' wrath", 'Achilles’ wrath')).toEqual(['Achilles’ wrath']);
  });

  it('finds nothing across what is not text', () => {
    const text = `a1b${NO_TEXT}a2b`;
    expect(found('a.*b', text, { regex: true })).toEqual(['a1b', 'a2b']);
    expect(found('b a', `b${NO_TEXT}a`)).toEqual([]);
  });

  it('finds only within a part of a passage, where asked', () => {
    const m = matcher('wrath');
    const text = 'wrath, wrath and wrath';
    expect(m.find(text, [3, 17]).map((h) => h.start)).toEqual([7]);
  });

  it('puts what the groups of a regular expression found in what replaces', () => {
    const m = matcher('(\\w+)ful', { regex: true });
    const text = 'a wrathful man';
    const [hit] = m.find(text);
    expect(m.replacement(text, hit, '$1less')).toBe('wrathless');
    expect(m.replacement(text, hit, '[$&] $$ $2')).toBe('[wrathful] $ $2');
    const named = matcher('(?<word>\\w+)ful', { regex: true });
    expect(named.replacement(text, named.find(text)[0], '$<word>')).toBe('wrath');
    // Plain words are put as they are.
    expect(matcher('wrath').replacement(text, hit, '$1')).toBe('$1');
    // With accents alike, what the groups found is taken as it was written.
    const greek = matcher('(λ.γ)ος', { regex: true, accentsAlike: true });
    const words = 'ὁ λόγος';
    expect(greek.replacement(words, greek.find(words)[0], '$1οι')).toBe('λόγοι');
  });
});

describe('searching elements', () => {
  it('finds in the name first and then in the text, and in a note where the note stands', () => {
    const { pr, elements } = project(
      [p(t('Part one wrath'), note(t('wrath in a note')), t(' and wrath after'))],
      [p(t('No more.'))],
    );
    const texts = new Texts(pr);
    const all = search(texts, elements, matcher('part|wrath', { regex: true }));
    expect(all.map((m) => `${m.part}:${m.passage}:${m.text}`)).toEqual([
      'title:0:Part',
      'body:0:Part',
      'body:0:wrath',
      'body:1:wrath',
      'body:0:wrath',
      'title:0:Part',
    ]);
    expect(all.map((m) => m.element)).toEqual([
      elements[0],
      elements[0],
      elements[0],
      elements[0],
      elements[0],
      elements[1],
    ]);
  });

  it('keeps to the selection, and a note is in it when the place it stands at is', () => {
    const { pr, elements } = project([
      p(t('wrath one'), note(t('wrath in a note'))),
      p(t('wrath two, wrath three')),
      p(t('wrath four')),
    ]);
    const texts = new Texts(pr);
    const scope = {
      element: elements[0],
      part: 'body' as const,
      from: { passage: 0, offset: 2 },
      to: { passage: 2, offset: 16 },
    };
    const all = search(texts, elements, matcher('wrath'), { scope });
    expect(all.map((m) => `${m.passage}:${m.start}`)).toEqual(['1:0', '2:0', '2:11']);
    const narrow = { ...scope, from: { passage: 2, offset: 1 }, to: { passage: 2, offset: 16 } };
    expect(
      search(texts, elements, matcher('wrath'), { scope: narrow }).map((m) => m.start),
    ).toEqual([11]);
  });

  it('reads again only what was changed', () => {
    const { pr, elements } = project([p(t('wrath'))], [p(t('wrath'))]);
    const texts = new Texts(pr);
    const [a, b] = elements.map((id) => texts.of(id));
    pr.setTitle(elements[0], 'Renamed');
    expect(texts.of(elements[0])).not.toBe(a);
    expect(texts.of(elements[0])?.title.text).toBe('Renamed');
    expect(texts.of(elements[1])).toBe(b);
  });
});

/** What is to be replaced, of all that is found, with what is to be put there. */
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
      found: x.text,
      text: m.replacement(passage.text, x.hit, words),
    };
  });
}

describe('replacing', () => {
  it('keeps the marks of what it replaces', () => {
    const { pr, elements } = project([
      p(t('The '), t('wrath', { em: {} }), t(' of '), t('Achil', { strong: {} }), t('les')),
    ]);
    const texts = new Texts(pr);
    const m = matcher('wrath|Achilles', { regex: true });
    const all = search(texts, elements, m);
    expect(replaceAll(pr, replacing(all, m, 'anger', texts))).toBe(2);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
      p(t('The '), t('anger', { em: {} }), t(' of '), t('anger', { strong: {} })),
    ]);
  });

  it('replaces in names, notes, captions and cells, and all of it is one step of undo', () => {
    const { pr, elements } = project(rich, [p(t('More wrath, and wrath.'))]);
    const before = elements.map((id) => readBody(pr.fragment(id, 'body')!));
    pr.setTitle(elements[1], 'Of wrath');
    pr.checkpoint();
    const texts = new Texts(pr);
    const m = matcher('wrath', { wholeWords: true });
    const all = search(texts, elements, m);
    expect(all.length).toBe(12);
    expect(replaceAll(pr, replacing(all, m, 'anger', texts))).toBe(12);
    const after = readBody(pr.fragment(elements[0], 'body')!);
    expect(JSON.stringify(after)).not.toContain('wrath');
    expect(JSON.stringify(after)).not.toContain('Wrath');
    expect(pr.node(elements[1])?.title).toBe('Of anger');
    expect(JSON.stringify(after)).toContain('The anger is ');
    expect(JSON.stringify(after)).toContain('anger in numbers');
    // What is not text is where it was.
    expect(after[6]).toEqual({
      ...(rich[6] as object),
      content: (rich[6] as { content: Inline[] }).content.map((i) =>
        i.kind === 'text' ? { ...i, text: i.text.replace('wrath', 'anger') } : i,
      ),
    });
    pr.undo();
    expect(elements.map((id) => readBody(pr.fragment(id, 'body')!))).toEqual(before);
    expect(pr.node(elements[1])?.title).toBe('Of wrath');
  });

  it('replaces by the groups of a regular expression', () => {
    const { pr, elements } = project([p(t('a wrathful and a fearful man'))]);
    const texts = new Texts(pr);
    const m = matcher('(\\w+)ful', { regex: true });
    replaceAll(pr, replacing(search(texts, elements, m), m, '$1less', texts));
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
      p(t('a wrathless and a fearless man')),
    ]);
  });

  it('replaces across a line that was broken, and leaves what is no text', () => {
    const { pr, elements } = project([
      p(t('first '), t('line', { em: {} }), { kind: 'break' }, t('second line'), cite('r1')),
    ]);
    const texts = new Texts(pr);
    const m = matcher('line second');
    const all = search(texts, elements, m);
    expect(all.map((x) => x.text)).toEqual(['line\nsecond']);
    expect(replaceAll(pr, replacing(all, m, 'verse', texts))).toBe(1);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([
      p(t('first '), t('verse', { em: {} }), t(' line'), cite('r1')),
    ]);
    // What would take a citation with it is not replaced.
    const text = texts.of(elements[0])!.body[0].text;
    const at = text.indexOf(NO_TEXT);
    const taking: Replacing = {
      element: elements[0],
      part: 'body',
      passage: 0,
      start: at - 4,
      end: at + 1,
      found: text.slice(at - 4, at + 1),
      text: 'x',
    };
    expect(replaceAll(pr, [taking])).toBe(0);
    expect(readBody(pr.fragment(elements[0], 'body')!)[0]).toEqual(
      p(t('first '), t('verse', { em: {} }), t(' line'), cite('r1')),
    );
  });

  it('leaves what no longer stands where it was found, and empties what is replaced by nothing', () => {
    const { pr, elements } = project([p(t('wrath and wrath'))]);
    const texts = new Texts(pr);
    const m = matcher('wrath');
    const list = replacing(search(texts, elements, m), m, '', texts);
    list[0].found = 'wrong';
    expect(replaceAll(pr, list)).toBe(1);
    expect(readBody(pr.fragment(elements[0], 'body')!)).toEqual([p(t('wrath and '))]);
  });

  it('is seen by an editor that is open on the text', () => {
    const { pr, elements } = project([p(t('Sing the wrath'))]);
    const view = editor(pr.fragment(elements[0], 'body')!);
    const texts = new Texts(pr);
    const m = matcher('wrath');
    replaceAll(pr, replacing(search(texts, elements, m), m, 'anger', texts));
    expect(view.state.doc.textContent).toBe('Sing the anger');
  });
});
