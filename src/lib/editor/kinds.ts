/**
 * The kinds of paragraph and of words that come with the application, with
 * the words the tools name them by: the catalogue of the editor. What a
 * kind is for the shape of a text — its family, whether it is counted,
 * whether it joins, what Enter and Tab make — is said once, in
 * `project/model/families.ts`, and taken from there; a kind carries no
 * look, which every layout has (ADR 0040). Also the kinds at hand of a
 * project, and the cues on screen of a kind of the writer's own. The core
 * has the same catalogue (`formats/kinds.rs`); a test holds the two alike.
 */

import type { KindFamily, Look } from '$lib/api/documents';
import { t } from '$lib/i18n';
import {
  FAMILIES,
  KIND_FACTS,
  renamed,
  type BasedKind,
  type Family,
} from '$lib/project/model/families';
import type { Project } from '$lib/project/model/project.svelte';
import type { PassageKindRecord } from '$lib/project/model/types';

/** The groups the tools show the kinds in: the families, with the small ones together under `more`. */
export type KindGroup = 'text' | 'quotation' | 'verse' | 'script' | 'list' | 'more' | 'words';

export interface KindSpec {
  id: string;
  family: KindFamily;
  /** The family of its passages, as `families.ts` has it: `text` for none, `words` for a kind of words. */
  group: Family | 'words';
  /** The id of the kind it is based on, where it is based on one. */
  basedOn?: string;
  label(): string;
  hint(): string;
  shortcut?: string;
}

/** The words of each kind, by id, and what some are based on. */
const WORDS: Record<string, string> = {
  text: 'editor-text',
  quote: 'editor-quotation',
  epigraph: 'editor-epigraph',
  attribution: 'editor-attribution',
  line: 'editor-verse',
  speaker: 'editor-speaker',
  direction: 'editor-direction',
  scene: 'editor-scene',
  action: 'editor-action',
  character: 'editor-character',
  dialogue: 'editor-dialogue',
  parenthetical: 'editor-parenthetical',
  transition: 'editor-transition',
  headword: 'editor-headword',
  gloss: 'editor-gloss',
  item: 'editor-list',
  numbered: 'editor-numbered-list',
  code: 'editor-code',
  break: 'editor-break',
  draft: 'editor-draft',
  foreign: 'editor-foreign',
  title: 'editor-title-of-work',
  term: 'editor-term',
  mention: 'editor-mention',
  highlight: 'editor-highlight',
};

const BASED_ON: Record<string, string> = { epigraph: 'quote', attribution: 'quote' };

const SHORTCUTS: Record<string, string> = {
  quote: "Ctrl+'",
  item: 'Ctrl+Shift+8',
  numbered: 'Ctrl+Shift+7',
};

/** The kinds that come with the application, in the order the tools list them: the order of `families.ts`, which is the core's. */
export const CATALOGUE: KindSpec[] = Object.entries(KIND_FACTS).map(([id, facts]) => {
  const words = WORDS[id] ?? `editor-${id}`;
  return {
    id,
    family: facts.family === 'words' ? 'words' : 'paragraph',
    group: facts.family,
    ...(BASED_ON[id] ? { basedOn: BASED_ON[id] } : {}),
    ...(SHORTCUTS[id] ? { shortcut: SHORTCUTS[id] } : {}),
    label: () => t(words),
    hint: () => t(`${words}-hint`),
  };
});

/** The groups of the kind menu, each with the families it shows. */
export const GROUPS: { id: KindGroup; families: readonly string[]; label(): string }[] = [
  { id: 'text', families: ['text'], label: () => t('editor-kinds-text') },
  { id: 'quotation', families: ['quotation'], label: () => t('editor-kinds-quotation') },
  { id: 'verse', families: ['verse'], label: () => t('editor-kinds-verse') },
  { id: 'script', families: ['script'], label: () => t('editor-kinds-script') },
  { id: 'list', families: ['list'], label: () => t('editor-kinds-list') },
  {
    id: 'more',
    families: ['glossary', 'code', 'break', 'draft'],
    label: () => t('editor-kinds-more'),
  },
  { id: 'words', families: ['words'], label: () => t('editor-kinds-words') },
];

/** The words for each family that comes with the application, by which the bracket of a passage names it. */
const FAMILY_WORDS: Record<string, string> = {
  quotation: 'editor-family-quotation',
  verse: 'editor-family-verse',
  script: 'editor-family-script',
  glossary: 'editor-family-glossary',
  list: 'editor-family-list',
  code: 'editor-family-code',
  break: 'editor-family-break',
  draft: 'editor-family-draft',
};

/**
 * The name of a family of passages: of the catalogue by its words, or of
 * a kind of the writer's own based on text by the kind's name. The id
 * itself for one that is not known.
 */
export function familyName(
  family: string,
  own: readonly { id: string; name?: string }[] = [],
): string {
  const words = FAMILY_WORDS[family];
  if (words) return t(words);
  return own.find((k) => k.id === family)?.name ?? family;
}

/** The group of the menu a family is shown in; `more` for one that is no group of its own. */
export function groupOf(family: string): KindGroup {
  return GROUPS.find((g) => g.families.includes(family))?.id ?? 'more';
}

/** Whether a family is one that comes with the application, and not a kind of the writer's own. */
export function knownFamily(family: string): family is Family {
  return (FAMILIES as readonly string[]).includes(family);
}

/** The kinds that are always at hand. */
export const PLAIN_KINDS: readonly string[] = ['text', 'quote', 'item', 'numbered'];

const byId = new Map(CATALOGUE.map((s) => [s.id, s]));

/** A kind of the catalogue by its id, by its old id too; nothing for a kind of the writer's own, or one that is not known. */
export function specOf(id: string): KindSpec | undefined {
  return byId.get(renamed(id));
}

/** A kind of the writer's own, as much of it as the shape of a text needs: what it is based on. */
export type OwnKindLike = BasedKind;

/**
 * The kinds at hand of a project, by id: the plain kinds, every kind the
 * project's texts use, and those the template brings; in the catalogue's
 * order, the writer's own kinds after, each once. Text is always at hand.
 * There is no pinning: the menu learns from use (ADR 0040).
 */
export function inHand(project: Project, templateKinds: readonly string[] = []): string[] {
  const wanted = new Set<string>(PLAIN_KINDS);
  for (const node of project.nodes.values()) for (const id of node.uses) wanted.add(renamed(id));
  for (const id of templateKinds) wanted.add(renamed(id));
  // The plain kinds first, then the rest in the catalogue's order, then the writer's own.
  const out: string[] = [...PLAIN_KINDS];
  for (const spec of CATALOGUE)
    if (wanted.has(spec.id) && !PLAIN_KINDS.includes(spec.id)) out.push(spec.id);
  for (const kind of project.passageKinds) if (wanted.has(kind.id)) out.push(kind.id);
  return out;
}

// ---- the cues on screen ----

/**
 * The cues by which the editor shows the kinds of the catalogue where one
 * writes, by the measures a look has: these are the editor's own and reach
 * no document; every look lives in a layout (ADR 0040). The style sheet
 * (`app.css`) sets the kinds of the catalogue by hand to the same measures;
 * a kind of the writer's own is set from them by `passageKindsCss`, through
 * the kinds it is based on.
 */
const CUES: Record<string, Look> = {
  quote: { indentLeft: '1.27cm', spaceBefore: '6pt', spaceAfter: '6pt' },
  attribution: { align: 'right', spaceBefore: '0pt', italic: false, firstLine: '0pt' },
  epigraph: { indentLeft: '4cm', indentRight: '0pt', spaceAfter: '18pt', firstLine: '0pt' },
  line: { indentLeft: '1cm' },
  speaker: { case: 'smallcaps', indentLeft: '1cm', spaceBefore: '6pt' },
  direction: { italic: true, indentLeft: '1cm' },
  scene: { bold: true, case: 'upper', spaceBefore: '19pt', spaceAfter: '11pt', align: 'left' },
  action: { spaceBefore: '11pt', spaceAfter: '11pt', align: 'left' },
  character: { indentLeft: '5.6cm', case: 'upper', spaceBefore: '11pt', spaceAfter: '0pt' },
  dialogue: { indentLeft: '2.5cm', indentRight: '3.8cm', spaceBefore: '0pt', spaceAfter: '0pt' },
  parenthetical: { indentLeft: '4cm', indentRight: '4cm', spaceBefore: '0pt', spaceAfter: '0pt' },
  transition: { align: 'right', case: 'upper', spaceBefore: '11pt', spaceAfter: '11pt' },
  headword: { bold: true, spaceBefore: '6pt', spaceAfter: '0pt', firstLine: '0pt' },
  gloss: { indentLeft: '1.27cm', spaceBefore: '0pt', spaceAfter: '6pt' },
  item: { indentLeft: '1.27cm' },
  numbered: { indentLeft: '1.27cm' },
  code: { monospace: true, lineSpacing: 1, align: 'left', spaceBefore: '6pt', spaceAfter: '6pt' },
  break: { align: 'center', spaceBefore: '12pt', spaceAfter: '12pt', text: '* * *' },
  foreign: { italic: true },
  title: { italic: true },
  term: { italic: true },
};

/** What some kinds have on screen beyond the measures, which a kind based on them has too. */
const CUES_MORE: Record<string, string> = {
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
 * The cues of a kind of the writer's own as they come to be on screen: the
 * cues of the kinds it is based on, through the catalogue and other own
 * kinds, with its own look over them; and the kinds of the catalogue it
 * passed through, for what they have beyond the measures.
 */
function screenLook(kind: PassageKindRecord, own: PassageKindRecord[]) {
  const looks: Look[] = [];
  const through = new Set<string>();
  const seen = new Set<string>([kind.id]);
  let at: string | undefined = kind.basedOn ? renamed(kind.basedOn) : undefined;
  for (let depth = 0; at && depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    const catalogued = specOf(at);
    if (catalogued) {
      through.add(at);
      looks.unshift(CUES[at] ?? {});
      at = catalogued.basedOn;
      continue;
    }
    const other = own.find((k) => k.id === at);
    if (!other) break;
    looks.unshift(other.look);
    at = other.basedOn ? renamed(other.basedOn) : undefined;
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
 * `.prose p[data-kind=ID]` for a kind of paragraph and
 * `.prose .kind[data-kind=ID]` for a kind of words, from the cues of what
 * it is based on and its own look. So a kind is seen at once where one
 * writes; what it reaches in a document, the layout says.
 */
export function passageKindsCss(kinds: PassageKindRecord[]): string {
  const rules: string[] = [];
  for (const kind of kinds) {
    const id = selectorId(kind.id);
    if (!id) continue;
    const words = kind.family === 'words';
    const selector = words ? `.prose .kind[data-kind="${id}"]` : `.prose p[data-kind="${id}"]`;
    const { look, through } = screenLook(kind, kinds);
    const own = declarations(look, kind.family);
    for (const base of through) if (CUES_MORE[base]) own.push(CUES_MORE[base]);
    if (own.length) rules.push(`${selector} { ${own.join(' ')} }`);
    if (!words && look.text) {
      // The sign of a break, drawn where the paragraph holds nothing.
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
