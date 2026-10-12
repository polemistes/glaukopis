/**
 * What the kinds of paragraph and of words are, as far as the shape of a
 * text needs to know, without the words of the interface: how the document
 * groups paragraphs of a kind that stand together, whether a numbering
 * counts their lines, and whether a kind may also stand on words. Read by
 * the readers of texts, the search in its thread of its own and the editor
 * alike; the editor's catalogue (`editor/kinds.ts`) adds the words. See
 * ADR 0041.
 *
 * A kind is a label and nothing more: no kind follows another, joins what
 * is before it, or belongs anywhere by rule. The grouping is the
 * document's business, which the writer never sees or steers.
 */

/**
 * How the document sets paragraphs of a kind that stand together: lines of
 * verse as a line block, quoted paragraphs as a block quote, items as a
 * list, lines of code as a code block, headwords and glosses as a
 * description list; each a paragraph of its own where nothing groups them.
 */
export type Grouping = 'lines' | 'quote' | 'list' | 'code' | 'glossary' | 'none';
export const GROUPINGS: readonly Grouping[] = [
  'lines',
  'quote',
  'list',
  'code',
  'glossary',
  'none',
];

/** How a stretch numbers its lines: not at all, counted from the first number given, or only by the numbers given. */
export type Numbering = 'none' | 'counted' | 'given';
export const NUMBERINGS: readonly Numbering[] = ['none', 'counted', 'given'];

/** The side the numbers stand on; nothing for the layout's. */
export type Side = 'left' | 'right';

export interface KindFacts {
  /** `words` for a kind of words only; otherwise how the document groups paragraphs of it. */
  grouping: Grouping | 'words';
  /** Whether a numbering counts its lines by default. */
  counted: boolean;
  /** Whether the kind may also stand on a run of words, as a speaker and a direction may. */
  words?: boolean;
}

const f = (grouping: Grouping | 'words', counted: boolean, words = false): KindFacts =>
  words ? { grouping, counted, words } : { grouping, counted };

/** The kinds of the catalogue, by id, in the order the tools list them. The ids are stored in projects and must not change. */
export const KIND_FACTS: Record<string, KindFacts> = {
  text: f('none', true),
  quote: f('quote', true),
  epigraph: f('none', true),
  attribution: f('none', false),
  line: f('lines', true),
  speaker: f('none', false, true),
  direction: f('none', false, true),
  scene: f('none', true),
  action: f('none', true),
  character: f('none', true),
  dialogue: f('none', true),
  parenthetical: f('none', true),
  transition: f('none', true),
  headword: f('glossary', true),
  gloss: f('glossary', true),
  item: f('list', true),
  numbered: f('list', true),
  code: f('code', true),
  break: f('none', false),
  draft: f('none', false),
  foreign: f('words', false),
  title: f('words', false),
  term: f('words', false),
  mention: f('words', false),
  highlight: f('words', false),
};

/** The ids of the kinds of paragraph of the catalogue, in its order. */
export const PARAGRAPH_KINDS: readonly string[] = Object.keys(KIND_FACTS).filter(
  (id) => KIND_FACTS[id].grouping !== 'words',
);

/** The ids of the kinds that may stand on words, in the catalogue's order: the kinds of words, then speaker and direction. */
export const WORD_KINDS: readonly string[] = [
  ...Object.keys(KIND_FACTS).filter((id) => KIND_FACTS[id].grouping === 'words'),
  ...Object.keys(KIND_FACTS).filter((id) => KIND_FACTS[id].words),
];

/** The ids kinds had before, and what they are now. */
export const RENAMED: Record<string, string> = { verse: 'line', list: 'item' };

/** A kind's id as it is now, for one read from an old project. */
export const renamed = (id: string): string => RENAMED[id] ?? id;

/** As much of a kind of the writer's own as the facts need: what it is based on. */
export interface BasedKind {
  id: string;
  basedOn?: string | null;
}

/**
 * The facts of a kind: of the catalogue, or of the writer's own through
 * what it is based on. A kind of the writer's own based on text, or on
 * nothing known, has text's facts; one that is not known at all is taken
 * for text.
 */
export function factsOf(id: string, own: readonly BasedKind[] = []): KindFacts {
  const seen = new Set<string>();
  let at = renamed(id);
  for (let depth = 0; depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    const known = KIND_FACTS[at];
    if (known) return known;
    const kind = own.find((k) => k.id === at);
    if (!kind) break;
    at = kind.basedOn ? renamed(kind.basedOn) : 'text';
  }
  return KIND_FACTS.text;
}

/** How the document groups paragraphs of a kind; `words` for a kind of words only. */
export function groupingOf(id: string, own: readonly BasedKind[] = []): Grouping | 'words' {
  return factsOf(id, own).grouping;
}

/** Whether a numbering counts the lines of a paragraph of a kind, before what a line itself says. */
export function countedKind(id: string, own: readonly BasedKind[] = []): boolean {
  return factsOf(id, own).counted;
}

/** Whether a kind may stand on words: a kind of words, or a speaker or a direction. */
export function wordsKind(id: string, own: readonly BasedKind[] = []): boolean {
  const facts = factsOf(id, own);
  return facts.grouping === 'words' || !!facts.words;
}
