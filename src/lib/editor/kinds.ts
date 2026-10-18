/**
 * The kinds of paragraph and of words that come with the application, with
 * the words the tools name them by: the catalogue of the editor. What a
 * kind is for the shape of a text — how the document groups paragraphs of
 * it, whether a numbering counts its lines, whether it may stand on words
 * too — is said once, in `project/model/families.ts`, and taken from there;
 * a kind carries no look, which every layout has. A kind is a label and
 * nothing more: no kind follows another on Enter, and Tab does the same in
 * every kind (ADR 0041). Also the kinds at hand of a project, and the cues
 * on screen of a kind of the writer's own. The core has the same catalogue
 * (`formats/kinds.rs`); a test holds the two alike.
 */

import type { KindFamily, Look } from '$lib/api/documents';
import { t } from '$lib/i18n';
import {
  KIND_FACTS,
  WORD_KINDS,
  factsOf,
  renamed,
  type BasedKind,
  type Grouping,
} from '$lib/project/model/families';
import type { Project } from '$lib/project/model/project.svelte';
import type { PassageKindRecord } from '$lib/project/model/types';

export { WORD_KINDS };

/** The groups the tools show the kinds in. They are the menu's only: the document groups paragraphs by `families.ts`. */
export type KindGroup = 'text' | 'quotation' | 'verse' | 'script' | 'list' | 'more' | 'words';

export interface KindSpec {
  id: string;
  family: KindFamily;
  /** How the document groups paragraphs of it, as `families.ts` has it; `words` for a kind of words. */
  group: Grouping | 'words';
  /** The id of the kind it is based on, where it is based on one. */
  basedOn?: string;
  label(): string;
  hint(): string;
  shortcut?: string;
}

/** The words of each kind, by id. */
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
    family: facts.grouping === 'words' ? 'words' : 'paragraph',
    group: facts.grouping,
    ...(BASED_ON[id] ? { basedOn: BASED_ON[id] } : {}),
    ...(SHORTCUTS[id] ? { shortcut: SHORTCUTS[id] } : {}),
    label: () => t(words),
    hint: () => t(`${words}-hint`),
  };
});

/** The groups of the kind menu, each with the kinds of the catalogue it shows, in order. */
export const GROUPS: { id: KindGroup; kinds: readonly string[]; label(): string }[] = [
  { id: 'text', kinds: ['text'], label: () => t('editor-kinds-text') },
  {
    id: 'quotation',
    kinds: ['quote', 'epigraph', 'attribution'],
    label: () => t('editor-kinds-quotation'),
  },
  { id: 'verse', kinds: ['line', 'speaker', 'direction'], label: () => t('editor-kinds-verse') },
  {
    id: 'script',
    kinds: ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'],
    label: () => t('editor-kinds-script'),
  },
  { id: 'list', kinds: ['item', 'numbered'], label: () => t('editor-kinds-list') },
  {
    id: 'more',
    kinds: ['headword', 'gloss', 'code', 'break', 'draft'],
    label: () => t('editor-kinds-more'),
  },
  {
    id: 'words',
    kinds: ['foreign', 'title', 'term', 'mention', 'highlight'],
    label: () => t('editor-kinds-words'),
  },
];

/** The group of the menu a kind of the catalogue is shown in; `more` for one that is in none. */
export function groupOf(id: string): KindGroup {
  const at = renamed(id);
  return GROUPS.find((g) => g.kinds.includes(at))?.id ?? 'more';
}

/**
 * The kinds that are written together, which the kind menu offers first
 * while the cursor is among them: lines of verse with speakers and
 * directions, the parts of a script, a headword and its gloss, a quotation
 * and what goes with it, the two kinds of item.
 */
const FELLOWS: readonly (readonly string[])[] = [
  ['line', 'speaker', 'direction'],
  ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'],
  ['headword', 'gloss'],
  ['quote', 'epigraph', 'attribution'],
  ['item', 'numbered'],
];

/** The kind of the catalogue a kind is, or is based on through the writer's own; text for one based on nothing known. */
export function catalogueKindOf(id: string, own: readonly BasedKind[] = []): string {
  const seen = new Set<string>();
  let at = renamed(id);
  for (let depth = 0; depth < 8 && !seen.has(at); depth++) {
    seen.add(at);
    if (KIND_FACTS[at]) return at;
    const kind = own.find((k) => k.id === at);
    if (!kind?.basedOn) break;
    at = renamed(kind.basedOn);
  }
  return 'text';
}

/**
 * The kinds written together with a kind, of the catalogue and the
 * writer's own (those based on one of them), in the catalogue's order and
 * the writer's own after; the kind itself alone where it has no fellows.
 */
export function fellowsOf(id: string, own: readonly BasedKind[] = []): string[] {
  const base = catalogueKindOf(id, own);
  const fellows = FELLOWS.find((f) => f.includes(base));
  if (!fellows) return [renamed(id)];
  return [
    ...fellows,
    ...own.filter((k) => fellows.includes(catalogueKindOf(k.id, own))).map((k) => k.id),
  ];
}

/** Whether a kind is a speaker or a direction, or based on one: such paragraphs stand among others without parting them. */
export function amongOthers(id: string, own: readonly BasedKind[] = []): boolean {
  return !!factsOf(id, own).words;
}

/** The kinds that are always at hand. */
export const PLAIN_KINDS: readonly string[] = ['text', 'quote', 'item', 'numbered'];

const byId = new Map(CATALOGUE.map((s) => [s.id, s]));

/** A kind of the catalogue by its id, by its old id too; nothing for a kind of the writer's own, or one that is not known. */
export function specOf(id: string): KindSpec | undefined {
  return byId.get(renamed(id));
}

/**
 * The name of a kind: of the catalogue by its words, or of the writer's
 * own by its name; the id itself for one that is not known.
 */
export function kindName(id: string, own: readonly { id: string; name?: string }[] = []): string {
  return specOf(id)?.label() ?? own.find((k) => k.id === id)?.name ?? id;
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
 * no document; every look lives in a layout (ADR 0040). They are kept here
 * only: the style sheet of the catalogue's kinds is made from them
 * (`catalogueKindsCss`), and a kind of the writer's own is set from them by
 * `passageKindsCss`, through the kinds it is based on, so that a kind based
 * on another and given nothing of its own looks as that one does. A
 * centimetre is about 2.4em on screen and 12pt about an em, so the
 * measures in points are those of the screen; `app.css` has only what
 * depends on the paragraphs around, and the signs before a list's items.
 */
const CUES: Record<string, Look> = {
  quote: { indentLeft: '16.5pt', size: 11.5 },
  attribution: {
    indentLeft: '1.27cm',
    align: 'right',
    spaceBefore: '0pt',
    italic: false,
    firstLine: '0pt',
  },
  epigraph: {
    indentLeft: '4cm',
    indentRight: '0pt',
    spaceBefore: '6pt',
    spaceAfter: '18pt',
    firstLine: '0pt',
  },
  line: { indentLeft: '1cm' },
  speaker: { case: 'smallcaps', indentLeft: '1cm', spaceBefore: '7pt' },
  direction: { italic: true, indentLeft: '1cm', spaceBefore: '2.4pt', spaceAfter: '2.4pt' },
  scene: { bold: true, case: 'upper', spaceBefore: '16.5pt', align: 'left' },
  action: { align: 'left' },
  character: { indentLeft: '5.6cm', case: 'upper', spaceBefore: '10.6pt', spaceAfter: '0pt' },
  dialogue: { indentLeft: '2.5cm', indentRight: '3.8cm', spaceBefore: '0pt', spaceAfter: '0pt' },
  parenthetical: {
    indentLeft: '4cm',
    indentRight: '4cm',
    spaceBefore: '0pt',
    spaceAfter: '0pt',
    italic: true,
  },
  transition: { align: 'right', case: 'upper', spaceBefore: '10.6pt' },
  headword: { bold: true, spaceBefore: '6pt', spaceAfter: '0pt', firstLine: '0pt' },
  gloss: { indentLeft: '1.27cm', spaceBefore: '0pt', spaceAfter: '6pt' },
  item: { indentLeft: '18.9pt' },
  numbered: { indentLeft: '18.9pt' },
  code: { monospace: true, lineSpacing: 1, align: 'left', size: 10.3 },
  break: { align: 'center', spaceBefore: '12pt', spaceAfter: '12pt', text: '* * *' },
  foreign: { italic: true },
  title: { italic: true },
  term: { italic: true },
};

/** What some kinds have on screen beyond the measures, which a kind based on them has too. */
const CUES_MORE: Record<string, string> = {
  quote: 'color: var(--ink-2);',
  code: 'font-variant-numeric: lining-nums; hanging-punctuation: none;',
  draft: 'color: var(--ink-3); border-left: 2px dashed var(--line-strong); padding-left: 0.8em;',
  highlight:
    'background: var(--highlight); border-radius: 2px; box-decoration-break: clone; -webkit-box-decoration-break: clone;',
};

/** The quotation marks a mentioned word stands in, by language. */
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
 * The cues of a kind as they come to be on screen: the cues of the kinds
 * from `start` on, through the catalogue and the writer's own kinds, with
 * `top` over them; and the kinds of the catalogue it passed through, for
 * what they have beyond the measures. A kind of the writer's own starts at
 * what it is based on, with its own look on top; a kind of the catalogue
 * starts at itself.
 */
function screenLook(
  start: string | null | undefined,
  top: Look,
  own: PassageKindRecord[],
  self?: string,
) {
  const looks: Look[] = [];
  const through = new Set<string>();
  const seen = new Set<string>(self ? [self] : []);
  let at: string | undefined = start ? renamed(start) : undefined;
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
  looks.push(top);
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
    // The bracket of a run and the numbers in the margin stand where the paragraph would without it (app.css).
    if (indentLeft !== null)
      out.push(`--inset: ${em(indentLeft)}; margin-left: ${em(indentLeft)};`);
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
    out.push('font-variant-caps: small-caps; letter-spacing: 0.03em;');
  else if (look.case === 'none') out.push('text-transform: none; font-variant-caps: normal;');
  if (look.underline !== undefined)
    out.push(`text-decoration: ${look.underline ? 'underline' : 'none'};`);
  if (look.monospace !== undefined)
    out.push(`font-family: ${look.monospace ? 'var(--font-mono)' : 'inherit'};`);
  return out;
}

/** The rules that set a kind on screen under its selector, from the look it comes to and the kinds of the catalogue it passed through. */
function kindRules(
  selector: string,
  family: KindFamily,
  look: Look,
  through: ReadonlySet<string>,
): string[] {
  const rules: string[] = [];
  const words = family === 'words';
  const own = declarations(look, family);
  for (const base of through) if (CUES_MORE[base]) own.push(CUES_MORE[base]);
  if (own.length) rules.push(`${selector} { ${own.join(' ')} }`);
  if (!words && look.text) {
    // The sign of a break, drawn where the paragraph holds nothing: in text
    // that is drawn, and in the editor, where an empty paragraph holds a
    // line break and nothing else.
    const sign = `content: "${css(look.text)}"; letter-spacing: 0.4em; color: var(--ink-3);`;
    rules.push(`${selector}:empty::before { ${sign} }`);
    rules.push(`${selector}:has(> .ProseMirror-trailingBreak:only-child)::before { ${sign} }`);
  }
  if (words && through.has('mention')) {
    // A mentioned word stands in the quotation marks of the language of the
    // text, which the editor is given as `lang` from the map.
    for (const [langs, quotes] of QUOTES)
      rules.push(`${langs.map((l) => selector + l).join(', ')} { quotes: ${quotes}; }`);
    rules.push(`${selector}::before { content: open-quote; }`);
    rules.push(`${selector}::after { content: close-quote; }`);
  }
  return rules;
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
    const { look, through } = screenLook(kind.basedOn, kind.look, kinds, kind.id);
    rules.push(...kindRules(selector, kind.family, look, through));
  }
  return rules.join('\n');
}

/**
 * The style sheet for the kinds of the catalogue, from their cues: a rule
 * on the paragraphs of each kind of paragraph, and on the words of each
 * kind that may stand on words (a speaker and a direction within a line
 * have the cues of their paragraphs).
 */
export function catalogueKindsCss(): string {
  const rules: string[] = [];
  for (const spec of CATALOGUE) {
    const { look, through } = screenLook(spec.id, {}, []);
    if (spec.family === 'paragraph')
      rules.push(...kindRules(`.prose p[data-kind="${spec.id}"]`, 'paragraph', look, through));
    if (WORD_KINDS.includes(spec.id))
      rules.push(...kindRules(`.prose .kind[data-kind="${spec.id}"]`, 'words', look, through));
  }
  return rules.join('\n');
}

/**
 * Sets the kinds of the catalogue on screen: a style sheet at the end of
 * the head of the page, made once, so that it comes after `app.css` and is
 * what a rule there of the same weight would say of a kind.
 */
export function showCatalogueKinds(page: Document = document) {
  let sheet = page.getElementById('catalogue-kinds');
  if (!sheet) {
    sheet = page.createElement('style');
    sheet.id = 'catalogue-kinds';
    page.head.appendChild(sheet);
  }
  sheet.textContent = catalogueKindsCss();
}
