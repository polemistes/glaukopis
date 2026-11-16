/**
 * The user's guide as Help shows it: its chapters (the `##` headings, and a
 * first one of what stands before them, named by the `#` heading), the
 * parts of each (its beginning, and its `###` headings), each with an id;
 * and finding words in it, letters folded as the library and the palette
 * fold them.
 *
 * The guide comes with the application as text, fetched when Help is first
 * opened rather than at the start (`loadGuide`).
 */

import { fold } from '$lib/state/library.svelte';
import { blockHtml, blockText, inlineText, readMarkdown, type Block } from './markdown';

export interface Part {
  id: string;
  /** The words of its heading; of a chapter's beginning, the chapter's name. */
  title: string;
  /** Its heading, then what stands under it down to the next part. */
  blocks: Block[];
  /** Its words as they are read, the heading's not among them. */
  text: string;
  /** Its words, the heading's among them, folded and with a space before each: for finding. */
  folded: string;
}

export interface Chapter {
  id: string;
  title: string;
  /** Its beginning first, then its `###` parts. */
  parts: Part[];
}

export interface Guide {
  chapters: Chapter[];
}

/** The id of a heading: its words folded, joined by hyphens. */
function slug(title: string): string {
  return fold(title).replace(/ /g, '-') || 'part';
}

/** Reads the guide into its chapters and their parts. */
export function readGuide(source: string): Guide {
  const { blocks } = readMarkdown(source);
  const chapters: Chapter[] = [];
  const taken = new Set<string>();
  const idOf = (title: string) => {
    const base = slug(title);
    let id = base;
    for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
    taken.add(id);
    return id;
  };
  let chapter: Chapter | null = null;
  let part: Part | null = null;
  const begin = (title: string, block: Block | null): Part => ({
    id: idOf(title),
    title,
    blocks: block ? [block] : [],
    text: '',
    folded: '',
  });
  for (const block of blocks) {
    const level = block.kind === 'heading' ? block.level : 0;
    if (block.kind === 'heading' && (level === 2 || (level === 1 && !chapter))) {
      const title = inlineText(block.content);
      part = begin(title, block);
      chapter = { id: part.id, title, parts: [part] };
      chapters.push(chapter);
      continue;
    }
    if (block.kind === 'heading' && level === 3 && chapter) {
      part = begin(inlineText(block.content), block);
      chapter.parts.push(part);
      continue;
    }
    if (!chapter || !part) {
      // Before any heading: a first chapter with no name of its own.
      part = begin('', null);
      chapter = { id: part.id, title: '', parts: [part] };
      chapters.push(chapter);
    }
    part.blocks.push(block);
  }
  for (const c of chapters) {
    for (const p of c.parts) {
      const under = p.blocks.filter((b, i) => !(i === 0 && b.kind === 'heading'));
      p.text = under.map(blockText).join(' ');
      p.folded = ' ' + foldMapped(`${p.title} ${p.text}`).text;
    }
  }
  return { chapters };
}

let loading: Promise<Guide> | null = null;

/** The guide, fetched and read once, when Help is first opened. */
export function loadGuide(): Promise<Guide> {
  loading ??= import('/docs/guide.md?raw').then((m) => readGuide(m.default));
  return loading;
}

/** A chapter by its id. */
export function chapterById(guide: Guide, id: string): Chapter | undefined {
  return guide.chapters.find((c) => c.id === id);
}

/** The chapter and the part whose heading has these words; nothing where none has. */
export function partByTitle(guide: Guide, title: string): { chapter: Chapter; part: Part } | null {
  for (const chapter of guide.chapters)
    for (const part of chapter.parts) if (part.title === title) return { chapter, part };
  return null;
}

/**
 * A chapter as HTML: every heading is set one level lower than the
 * window's own title, the chapter's name as `h2`, and each that begins a
 * part says which part it begins.
 */
export function chapterHtml(chapter: Chapter): string {
  return chapter.parts
    .flatMap((part) =>
      part.blocks.map((block, i) => {
        if (block.kind !== 'heading') return blockHtml(block);
        if (i > 0) return blockHtml(block, { level: Math.max(block.level, 4) });
        const level = part === chapter.parts[0] ? 2 : 3;
        return blockHtml(block, { level, attributes: `data-help-heading="${part.id}"` });
      }),
    )
    .join('\n');
}

// ---- finding ----

/** Text folded sign by sign, and where in the text each folded sign came from and ends. */
export interface Mapped {
  text: string;
  from: number[];
  to: number[];
}

const folds = new Map<string, string>();

/**
 * Text folded as `fold` folds it, sign by sign, so that what is found in
 * the folded text can be found again in the text as it is: a letter as its
 * folding gives it, a mark set on a letter as nothing, and anything that
 * is not a letter or a digit as a space.
 */
export function foldMapped(text: string): Mapped {
  let out = '';
  const from: number[] = [];
  const to: number[] = [];
  for (let i = 0; i < text.length;) {
    const point = text.codePointAt(i)!;
    const size = point > 0xffff ? 2 : 1;
    const sign = text.slice(i, i + size);
    let folded = folds.get(sign);
    if (folded === undefined) {
      folded = /\p{M}/u.test(sign) ? '' : fold(sign) || ' ';
      folds.set(sign, folded);
    }
    for (let k = 0; k < folded.length; k++) {
      from.push(i);
      to.push(i + size);
    }
    out += folded;
    i += size;
  }
  return { text: out, from, to };
}

/** The words of what is typed in the field, folded. */
export function queryWords(query: string): string[] {
  return fold(query).split(' ').filter(Boolean);
}

/**
 * Where the words are in a text, each at the beginning of a word, as the
 * library finds its references: as stretches of the text as it is, in
 * order, those that overlap made one.
 */
export function hitsIn(
  text: string,
  words: readonly string[],
  mapped: Mapped = foldMapped(text),
): [number, number][] {
  if (!words.length) return [];
  const f = mapped.text;
  const found: [number, number][] = [];
  for (const word of words) {
    for (let k = f.indexOf(word); k >= 0; k = f.indexOf(word, k + 1)) {
      if (k > 0 && f[k - 1] !== ' ') continue;
      found.push([mapped.from[k], mapped.to[k + word.length - 1]]);
    }
  }
  found.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
  const merged: [number, number][] = [];
  for (const hit of found) {
    const last = merged[merged.length - 1];
    if (last && hit[0] <= last[1]) last[1] = Math.max(last[1], hit[1]);
    else merged.push([...hit]);
  }
  return merged;
}

/** A part in which the words were found, and a line of its text around the first of them. */
export interface Found {
  chapter: Chapter;
  part: Part;
  before: string;
  hit: string;
  after: string;
}

/** How much of the text is shown before and after the first hit. */
const BEFORE = 40;
const AFTER = 70;

/** The text of each part folded, kept once it is first found in: a search is made at every letter typed. */
const mappedParts = new WeakMap<Part, Mapped>();
function mappedOf(part: Part): Mapped {
  let mapped = mappedParts.get(part);
  if (!mapped) mappedParts.set(part, (mapped = foldMapped(part.text)));
  return mapped;
}

/** The parts whose words hold all the words, in the order of the guide. */
export function findInGuide(guide: Guide, query: string): Found[] {
  const words = queryWords(query);
  if (!words.length) return [];
  const found: Found[] = [];
  for (const chapter of guide.chapters) {
    for (const part of chapter.parts) {
      if (!words.every((w) => part.folded.includes(' ' + w))) continue;
      found.push({ chapter, part, ...lineAround(part.text, words, mappedOf(part)) });
    }
  }
  return found;
}

/** A line of a text around the first of the words in it, cut at words; its beginning where they are only in the heading. */
export function lineAround(
  text: string,
  words: readonly string[],
  mapped?: Mapped,
): { before: string; hit: string; after: string } {
  const [first] = hitsIn(text, words, mapped);
  const [start, end] = first ?? [0, 0];
  let from = Math.max(0, start - BEFORE);
  let to = Math.min(text.length, end + AFTER);
  if (from > 0) {
    const space = text.indexOf(' ', from);
    from = space >= 0 && space < start ? space + 1 : from;
  }
  if (to < text.length) {
    const space = text.lastIndexOf(' ', to);
    to = space > end ? space : to;
  }
  return {
    before: (from > 0 ? '…' : '') + text.slice(from, start),
    hit: text.slice(start, end),
    after: text.slice(end, to) + (to < text.length ? '…' : ''),
  };
}
