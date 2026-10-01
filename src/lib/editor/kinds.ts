/**
 * The kinds of paragraph and of words that come with the application, and
 * what each does while writing: what it is in the editor, what Enter makes
 * after it, what Tab makes of it, and how the tools name it. Also the
 * kinds in a map's hand, and the look on screen of a kind of the writer's
 * own. The core has the same catalogue with the look each kind has in a
 * document (`formats/kinds.rs`); a test holds the two alike. See ADR 0029.
 */

import type { KindFamily, Look } from '$lib/api/documents';
import { t } from '$lib/i18n';
import type { Project } from '$lib/project/model/project.svelte';
import type { PassageKindRecord } from '$lib/project/model/types';

/** The groups the tools show the kinds in. */
export type KindGroup = 'text' | 'quotation' | 'verse' | 'script' | 'more' | 'words';

/**
 * What a kind is in the editor: a paragraph of text; a quotation or a list,
 * which hold paragraphs; a line of verse, a speaker or a stage direction;
 * a part of a script; a passage of a kind; or a mark on words.
 */
export type KindStructure =
  | 'text'
  | 'quote'
  | 'list'
  | 'numbered'
  | 'verse'
  | 'speaker'
  | 'direction'
  | 'script'
  | 'passage'
  | 'mark';

export interface KindSpec {
  id: string;
  family: KindFamily;
  group: KindGroup;
  structure: KindStructure;
  /** The id of the kind it is based on, where it is based on one. */
  basedOn?: string;
  /** The kind Enter makes at the end of one of this kind; a paragraph of text where nothing is said. */
  next?: string;
  /** The kind Tab makes of an empty one of this kind, or begins after a full one. */
  tab?: string;
  label(): string;
  hint(): string;
  shortcut?: string;
}

function spec(
  id: string,
  family: KindFamily,
  group: KindGroup,
  structure: KindStructure,
  words: string,
  more: Pick<KindSpec, 'basedOn' | 'next' | 'tab' | 'shortcut'> = {},
): KindSpec {
  return {
    id,
    family,
    group,
    structure,
    ...more,
    label: () => t(words),
    hint: () => t(`${words}-hint`),
  };
}

/** The kinds that come with the application, in the order the tools list them: the core's order. */
export const CATALOGUE: KindSpec[] = [
  // Text.
  spec('text', 'paragraph', 'text', 'text', 'editor-text'),
  spec('quote', 'paragraph', 'text', 'quote', 'editor-quotation', { shortcut: "Ctrl+'" }),
  spec('list', 'paragraph', 'text', 'list', 'editor-list', { shortcut: 'Ctrl+Shift+8' }),
  spec('numbered', 'paragraph', 'text', 'numbered', 'editor-numbered-list', {
    shortcut: 'Ctrl+Shift+7',
  }),
  // What goes with a quotation.
  spec('attribution', 'paragraph', 'quotation', 'passage', 'editor-attribution', {
    basedOn: 'quote',
    next: 'text',
  }),
  spec('epigraph', 'paragraph', 'quotation', 'passage', 'editor-epigraph', {
    basedOn: 'quote',
    next: 'attribution',
  }),
  // Verse: the lines, the speaker, the stage direction.
  spec('verse', 'paragraph', 'verse', 'verse', 'editor-verse'),
  spec('speaker', 'words', 'verse', 'speaker', 'editor-speaker'),
  spec('direction', 'words', 'verse', 'direction', 'editor-direction'),
  // A screenplay: Enter goes from a part to the one that follows it, Tab to the other that commonly does.
  spec('scene', 'paragraph', 'script', 'script', 'editor-scene', { next: 'action', tab: 'action' }),
  spec('action', 'paragraph', 'script', 'script', 'editor-action', {
    next: 'action',
    tab: 'character',
  }),
  spec('character', 'paragraph', 'script', 'script', 'editor-character', {
    next: 'dialogue',
    tab: 'transition',
  }),
  spec('dialogue', 'paragraph', 'script', 'script', 'editor-dialogue', {
    next: 'action',
    tab: 'parenthetical',
  }),
  spec('parenthetical', 'paragraph', 'script', 'script', 'editor-parenthetical', {
    next: 'dialogue',
    tab: 'dialogue',
  }),
  spec('transition', 'paragraph', 'script', 'script', 'editor-transition', {
    next: 'scene',
    tab: 'scene',
  }),
  // More kinds of paragraph.
  spec('headword', 'paragraph', 'more', 'passage', 'editor-headword', {
    next: 'gloss',
    tab: 'gloss',
  }),
  spec('gloss', 'paragraph', 'more', 'passage', 'editor-gloss', {
    next: 'headword',
    tab: 'headword',
  }),
  spec('code', 'paragraph', 'more', 'passage', 'editor-code', { next: 'code' }),
  spec('break', 'paragraph', 'more', 'passage', 'editor-break', { next: 'text' }),
  spec('draft', 'paragraph', 'more', 'passage', 'editor-draft', { next: 'draft' }),
  // Kinds of words.
  spec('foreign', 'words', 'words', 'mark', 'editor-foreign'),
  spec('title', 'words', 'words', 'mark', 'editor-title-of-work'),
  spec('term', 'words', 'words', 'mark', 'editor-term'),
  spec('mention', 'words', 'words', 'mark', 'editor-mention'),
  spec('highlight', 'words', 'words', 'mark', 'editor-highlight'),
];

export const GROUPS: { id: KindGroup; label(): string }[] = [
  { id: 'text', label: () => t('editor-kinds-text') },
  { id: 'quotation', label: () => t('editor-kinds-quotation') },
  { id: 'verse', label: () => t('editor-kinds-verse') },
  { id: 'script', label: () => t('editor-kinds-script') },
  { id: 'more', label: () => t('editor-kinds-more') },
  { id: 'words', label: () => t('editor-kinds-words') },
];

/** The kinds that are always in hand. */
export const PLAIN_KINDS: readonly string[] = ['text', 'quote', 'list', 'numbered'];

const byId = new Map(CATALOGUE.map((s) => [s.id, s]));

/** A kind of the catalogue by its id; nothing for a kind of the writer's own, or one that is not known. */
export function specOf(id: string): KindSpec | undefined {
  return byId.get(id);
}

/** A kind of the writer's own, as much of it as Enter and Tab need: what it is based on. */
export interface OwnKindLike {
  id: string;
  basedOn: string;
}

/**
 * What a kind says of itself, or, for a kind of the writer's own, what the
 * kind it is based on says. A kind that is followed by itself is followed
 * by the writer's own kind where that is based on it.
 */
function inherited(
  id: string,
  own: OwnKindLike[],
  pick: (spec: KindSpec) => string | undefined,
): string | undefined {
  const seen = new Set<string>();
  let at = id;
  for (let depth = 0; depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    const spec = specOf(at);
    if (spec) {
      const picked = pick(spec);
      return picked === at ? id : picked;
    }
    const kind = own.find((k) => k.id === at);
    if (!kind) return undefined;
    at = kind.basedOn || 'text';
  }
  return undefined;
}

/** The kind Enter makes at the end of a paragraph of a kind: text, where nothing is said. */
export function nextOf(id: string, own: OwnKindLike[] = []): string {
  return inherited(id, own, (s) => s.next) ?? 'text';
}

/** The kind Tab makes of an empty paragraph of a kind, or begins after a full one; nothing where Tab means nothing to it. */
export function tabOf(id: string, own: OwnKindLike[] = []): string | undefined {
  return inherited(id, own, (s) => s.tab);
}

/**
 * The kinds in hand for a map, by id: the plain kinds, every kind the
 * map's texts use, the kinds the writer has pinned, and those the format
 * suggests, less those the writer has unpinned; in the catalogue's order,
 * the writer's own kinds after, each once. Text is always in hand.
 */
export function inHand(project: Project, mapId: string, suggests: string[] = []): string[] {
  const map = project.map(mapId);
  const wanted = new Set<string>(PLAIN_KINDS);
  for (const node of project.nodes.values()) {
    if (node.map !== mapId) continue;
    for (const id of node.uses) wanted.add(id);
  }
  for (const id of map?.hand.pinned ?? []) wanted.add(id);
  for (const id of suggests) wanted.add(id);
  for (const id of map?.hand.unpinned ?? []) if (id !== 'text') wanted.delete(id);
  const out: string[] = [];
  for (const spec of CATALOGUE) if (wanted.has(spec.id)) out.push(spec.id);
  for (const kind of project.passageKinds) if (wanted.has(kind.id)) out.push(kind.id);
  return out;
}

// ---- the looks on screen ----

/**
 * How each kind of the catalogue looks on screen, by the measures a look
 * has: the look of the kind it is based on, and these. The style sheet
 * (`app.css`) sets the kinds of the catalogue by hand to the same
 * measures; a kind of the writer's own is set from them by `passageKindsCss`.
 */
const SCREEN: Record<string, Look> = {
  quote: { indentLeft: '1.27cm', spaceBefore: '6pt', spaceAfter: '6pt' },
  attribution: { align: 'right', spaceBefore: '0pt', italic: false, firstLine: '0pt' },
  epigraph: { indentLeft: '4cm', indentRight: '0pt', spaceAfter: '18pt', firstLine: '0pt' },
  speaker: { case: 'smallcaps' },
  direction: { italic: true },
  scene: { bold: true, case: 'upper', spaceBefore: '19pt', spaceAfter: '11pt', align: 'left' },
  action: { spaceBefore: '11pt', spaceAfter: '11pt', align: 'left' },
  character: { indentLeft: '5.6cm', case: 'upper', spaceBefore: '11pt', spaceAfter: '0pt' },
  dialogue: { indentLeft: '2.5cm', indentRight: '3.8cm', spaceBefore: '0pt', spaceAfter: '0pt' },
  parenthetical: { indentLeft: '4cm', indentRight: '4cm', spaceBefore: '0pt', spaceAfter: '0pt' },
  transition: { align: 'right', case: 'upper', spaceBefore: '11pt', spaceAfter: '11pt' },
  headword: { bold: true, spaceBefore: '6pt', spaceAfter: '0pt', firstLine: '0pt' },
  gloss: { indentLeft: '1.27cm', spaceBefore: '0pt', spaceAfter: '6pt' },
  code: { monospace: true, lineSpacing: 1, align: 'left', spaceBefore: '6pt', spaceAfter: '6pt' },
  break: { align: 'center', spaceBefore: '12pt', spaceAfter: '12pt', text: '* * *' },
  foreign: { italic: true },
  title: { italic: true },
  term: { italic: true },
};

/** What some kinds have on screen beyond the measures, which a kind based on them has too. */
const SCREEN_MORE: Record<string, string> = {
  draft: 'color: var(--ink-3); border-left: 2px dashed var(--line-strong); padding-left: 0.8em;',
  highlight:
    'background: var(--highlight); border-radius: 2px; box-decoration-break: clone; -webkit-box-decoration-break: clone;',
};

/** The quotation marks a mentioned word stands in, by language: see the same in `app.css`. */
const QUOTES: [string[], string][] = [
  [[''], "'\\201C' '\\201D' '\\2018' '\\2019'"],
  [[':lang(nb)', ':lang(nn)', ':lang(no)'], "'\\AB' '\\BB' '\\2018' '\\2019'"],
  [[':lang(de)'], "'\\201E' '\\201C' '\\201A' '\\2018'"],
  [[':lang(fr)'], "'\\AB\\A0' '\\A0\\BB' '\\201C' '\\201D'"],
];

/**
 * A length in points, from how it is written: `1.27cm`, `12pt`, `0.5in`,
 * `25mm`, or a number of points. Nothing where it cannot be read.
 */
export function points(length: string | number | undefined): number | null {
  if (typeof length === 'number') return Number.isFinite(length) ? length : null;
  if (!length) return null;
  const m = /^\s*(-?\d+(?:[.,]\d+)?)\s*(pt|mm|cm|in|)\s*$/i.exec(length);
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  switch (m[2].toLowerCase()) {
    case 'cm':
      return (value * 72) / 2.54;
    case 'mm':
      return (value * 72) / 25.4;
    case 'in':
      return value * 72;
    default:
      return value;
  }
}

/** Points as ems of the text in the editor, where a centimetre is about 2.4em. */
function em(pt: number): string {
  return `${Math.round(((pt * 2.4) / (72 / 2.54)) * 100) / 100}em`;
}

const css = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, ' ');

/** An id as it can stand in a selector: letters, digits, hyphens and underscores; nothing otherwise. */
function selectorId(id: string): string | null {
  return /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

/**
 * The look of a kind of the writer's own as it comes to be on screen: the
 * looks of the kinds it is based on, through the catalogue and other own
 * kinds, with its own look over them; and the kinds of the catalogue it
 * passed through, for what they have beyond the measures.
 */
function screenLook(kind: PassageKindRecord, own: PassageKindRecord[]) {
  const looks: Look[] = [];
  const through = new Set<string>();
  const seen = new Set<string>([kind.id]);
  let at: string | undefined = kind.basedOn;
  for (let depth = 0; at && depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    const catalogued = specOf(at);
    if (catalogued) {
      through.add(at);
      looks.unshift(SCREEN[at] ?? {});
      at = catalogued.basedOn;
      continue;
    }
    const other = own.find((k) => k.id === at);
    if (!other) break;
    looks.unshift(other.look);
    at = other.basedOn;
  }
  looks.push(kind.look);
  const look: Record<string, unknown> = {};
  for (const l of looks) {
    for (const [key, value] of Object.entries(l))
      if (value !== undefined && value !== null) look[key] = value;
  }
  return { look: look as Look, through };
}

/** The declarations a look comes to on screen; of a kind of words, only those words can have. */
function declarations(look: Look, family: KindFamily): string[] {
  const out: string[] = [];
  if (family === 'paragraph') {
    if (look.align) out.push(`text-align: ${look.align === 'justified' ? 'justify' : look.align};`);
    const indentLeft = points(look.indentLeft);
    if (indentLeft !== null) out.push(`margin-left: ${em(indentLeft)};`);
    const indentRight = points(look.indentRight);
    if (indentRight !== null) out.push(`margin-right: ${em(indentRight)};`);
    const firstLine = points(look.firstLine);
    if (firstLine !== null) out.push(`text-indent: ${em(firstLine)};`);
    const before = points(look.spaceBefore);
    if (before !== null) out.push(`margin-top: ${em(before)};`);
    const after = points(look.spaceAfter);
    if (after !== null) out.push(`margin-bottom: ${em(after)};`);
    if (look.lineSpacing && Number.isFinite(look.lineSpacing))
      out.push(`line-height: ${Math.round(look.lineSpacing * 1.62 * 100) / 100};`);
    if (look.monospace) out.push('white-space: pre-wrap;');
  }
  if (look.size && Number.isFinite(look.size))
    out.push(`font-size: ${Math.round((look.size / 12) * 100) / 100}em;`);
  if (look.bold !== undefined) out.push(`font-weight: ${look.bold ? 600 : 'normal'};`);
  if (look.italic !== undefined) out.push(`font-style: ${look.italic ? 'italic' : 'normal'};`);
  if (look.case === 'upper') out.push('text-transform: uppercase;');
  else if (look.case === 'smallcaps')
    out.push('font-variant-caps: small-caps; letter-spacing: 0.02em;');
  else if (look.case === 'none') out.push('text-transform: none; font-variant-caps: normal;');
  if (look.underline !== undefined)
    out.push(`text-decoration: ${look.underline ? 'underline' : 'none'};`);
  if (look.monospace !== undefined)
    out.push(`font-family: ${look.monospace ? 'var(--font-mono)' : 'inherit'};`);
  return out;
}

/**
 * The style sheet for the kinds of the writer's own: a rule for each, on
 * `.prose .passage[data-kind=ID]` for a kind of paragraph and
 * `.prose .kind[data-kind=ID]` for a kind of words, from the look on screen
 * of what it is based on and its own. So a kind is seen at once.
 */
export function passageKindsCss(kinds: PassageKindRecord[]): string {
  const rules: string[] = [];
  for (const kind of kinds) {
    const id = selectorId(kind.id);
    if (!id) continue;
    const words = kind.family === 'words';
    const selector = words
      ? `.prose .kind[data-kind="${id}"]`
      : `.prose .passage[data-kind="${id}"]`;
    const { look, through } = screenLook(kind, kinds);
    const own = declarations(look, kind.family);
    for (const base of through) if (SCREEN_MORE[base]) own.push(SCREEN_MORE[base]);
    if (own.length) rules.push(`${selector} { ${own.join(' ')} }`);
    if (!words && look.text) {
      // The sign of a break, drawn where the passage holds nothing.
      const sign = `content: "${css(look.text)}"; letter-spacing: 0.4em; color: var(--ink-3);`;
      rules.push(`${selector}:empty::before { ${sign} }`);
      rules.push(`${selector}:has(> .ProseMirror-trailingBreak:only-child)::before { ${sign} }`);
    }
    if (words && through.has('mention')) {
      for (const [langs, quotes] of QUOTES)
        rules.push(`${langs.map((l) => selector + l).join(', ')} { quotes: ${quotes}; }`);
      rules.push(`${selector}::before { content: open-quote; }`);
      rules.push(`${selector}::after { content: close-quote; }`);
    }
  }
  return rules.join('\n');
}
