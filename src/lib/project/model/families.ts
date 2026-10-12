/**
 * What the kinds of paragraph are, as far as the shape of a text needs to
 * know, without the words of the interface: the family of each kind of the
 * catalogue, whether its paragraphs are counted by a numbering, whether it
 * joins the passage before it, and what Enter and Tab make. Read here by
 * the readers of texts, the search in its thread of its own, the migration
 * of old projects and the editor alike; the editor's catalogue
 * (`editor/kinds.ts`) adds the words. See ADR 0040.
 *
 * A passage is a run of paragraphs of one family. Text forms no passage.
 */

/** The families that come with the application, in the order the tools show them. */
export const FAMILIES = [
  'text',
  'quotation',
  'verse',
  'script',
  'glossary',
  'list',
  'code',
  'break',
  'draft',
] as const;
export type Family = (typeof FAMILIES)[number];

/** How a passage numbers its paragraphs: not at all, counted from the first number given, or only by the numbers given. */
export type Numbering = 'none' | 'counted' | 'given';
export const NUMBERINGS: readonly Numbering[] = ['none', 'counted', 'given'];

/** The side the numbers stand on; nothing for the layout's. */
export type Side = 'left' | 'right';

export interface KindFacts {
  /** The family of its passages; `text` for none; `words` for a kind of words. */
  family: Family | 'words';
  /** Whether a numbering counts its paragraphs. */
  counted: boolean;
  /** Whether it stands in the passage before it, whatever its family. */
  joins: boolean;
  /** The kind Enter makes after it; itself where not said. */
  next?: string;
  /** The kind Tab makes of it, in a script or a glossary; `indent` where Tab indents. */
  tab?: string | 'indent';
}

const f = (
  family: Family | 'words',
  counted: boolean,
  more: Partial<Omit<KindFacts, 'family' | 'counted'>> = {},
): KindFacts => ({ family, counted, joins: false, ...more });

/** The kinds of the catalogue, by id. The ids are stored in projects and must not change. */
export const KIND_FACTS: Record<string, KindFacts> = {
  text: f('text', false, { next: 'text' }),
  quote: f('quotation', true),
  epigraph: f('quotation', true, { next: 'attribution' }),
  attribution: f('quotation', false, { joins: true, next: 'text' }),
  line: f('verse', true, { tab: 'indent' }),
  speaker: f('verse', false, { next: 'line' }),
  direction: f('verse', false, { next: 'line' }),
  scene: f('script', true, { next: 'action', tab: 'action' }),
  action: f('script', true, { tab: 'character' }),
  character: f('script', true, { next: 'dialogue', tab: 'transition' }),
  dialogue: f('script', true, { next: 'action', tab: 'parenthetical' }),
  parenthetical: f('script', true, { next: 'dialogue', tab: 'dialogue' }),
  transition: f('script', true, { next: 'scene', tab: 'scene' }),
  headword: f('glossary', true, { next: 'gloss', tab: 'gloss' }),
  gloss: f('glossary', true, { next: 'headword', tab: 'headword' }),
  item: f('list', true, { tab: 'indent' }),
  numbered: f('list', true, { tab: 'indent' }),
  code: f('code', true),
  break: f('break', false, { next: 'text' }),
  draft: f('draft', true),
  foreign: f('words', false),
  title: f('words', false),
  term: f('words', false),
  mention: f('words', false),
  highlight: f('words', false),
};

/** The ids of the kinds of paragraph of the catalogue, in its order. */
export const PARAGRAPH_KINDS: readonly string[] = Object.keys(KIND_FACTS).filter(
  (id) => KIND_FACTS[id].family !== 'words',
);

/** The ids kinds had before ADR 0040, and what they are now. */
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
 * nothing known, is a family of its own, named by its id. One that is not
 * known at all is taken for text.
 */
export function factsOf(id: string, own: readonly BasedKind[] = []): KindFacts {
  const seen = new Set<string>();
  let at = renamed(id);
  for (let depth = 0; depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    const known = KIND_FACTS[at];
    if (known) {
      // A kind of the writer's own based on text is a family of its own, whose paragraphs count.
      if (known.family === 'text' && at !== id)
        return { ...known, family: id as Family, counted: true, next: undefined };
      return known;
    }
    const kind = own.find((k) => k.id === at);
    if (!kind) break;
    at = kind.basedOn ? renamed(kind.basedOn) : 'text';
  }
  return seen.size > 1 || own.some((k) => k.id === id)
    ? { ...KIND_FACTS.text, family: id as Family, counted: true, next: undefined }
    : KIND_FACTS.text;
}

/** The family of a kind: that of its passages; `text` for none. */
export function familyOf(id: string, own: readonly BasedKind[] = []): string {
  return factsOf(id, own).family;
}

/** The kind Enter makes after a paragraph of a kind: the one it names, else itself. */
export function nextOf(id: string, own: readonly BasedKind[] = []): string {
  const facts = factsOf(id, own);
  return facts.next ?? id;
}

/** What Tab makes of a paragraph of a kind: another kind, `indent`, or nothing. */
export function tabOf(id: string, own: readonly BasedKind[] = []): string | undefined {
  return factsOf(id, own).tab;
}

/** Whether a numbering counts a paragraph of a kind, before what the paragraph itself says. */
export function countedKind(id: string, own: readonly BasedKind[] = []): boolean {
  return factsOf(id, own).counted;
}

/** Whether a paragraph of a kind stands in the passage before it. */
export function joinsBefore(id: string, own: readonly BasedKind[] = []): boolean {
  return factsOf(id, own).joins;
}
