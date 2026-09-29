/**
 * Reading and changing reference styles (Citation Style Language).
 *
 * A style is an XML document. It is changed in place, so that everything the
 * editor does not know about stays as it was. Three depths of change:
 *
 * - the options of the style, of its citations and of its bibliography;
 * - the parts that a citation or an entry is built from, one by one;
 * - the source.
 */

import { has, t } from '$lib/i18n';

export const CSL = 'http://purl.org/net/xbiblio/csl';

export type Scope = 'citation' | 'bibliography';

export interface Style {
  doc: XMLDocument;
  root: Element;
}

export function parse(xml: string): Style {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const failure = doc.getElementsByTagName('parsererror')[0];
  if (failure) {
    const words = (failure.textContent ?? '').replace(/\s+/g, ' ').trim();
    throw new Error(
      words.replace(/^.*?error[^:]*:\s*/i, '').slice(0, 200) || t('style-source-not-xml'),
    );
  }
  const root = doc.documentElement;
  if (root.localName !== 'style') throw new Error(t('style-source-not-style'));
  if (!child(root, 'citation')) {
    throw new Error(t('style-source-dependent'));
  }
  return { doc, root };
}

export function serialise(style: Style): string {
  let xml = new XMLSerializer().serializeToString(style.doc);
  if (!xml.startsWith('<?xml')) xml = `<?xml version="1.0" encoding="utf-8"?>\n${xml}`;
  return xml;
}

export function child(parent: Element, name: string): Element | null {
  for (const c of Array.from(parent.children)) if (c.localName === name) return c;
  return null;
}

export function children(parent: Element, name?: string): Element[] {
  return Array.from(parent.children).filter((c) => !name || c.localName === name);
}

export function title(style: Style): string {
  const info = child(style.root, 'info');
  return (info && child(info, 'title')?.textContent?.trim()) || '';
}

/** note, author-date, numeric, label, author; or empty. */
export function kind(style: Style): string {
  const info = child(style.root, 'info');
  for (const c of info ? children(info, 'category') : []) {
    const f = c.getAttribute('citation-format');
    if (f) return f;
  }
  return '';
}

export function scopeElement(style: Style, scope: Scope): Element | null {
  return child(style.root, scope);
}

export function layout(style: Style, scope: Scope): Element | null {
  const s = scopeElement(style, scope);
  return s ? child(s, 'layout') : null;
}

export function macro(style: Style, name: string): Element | null {
  return children(style.root, 'macro').find((m) => m.getAttribute('name') === name) ?? null;
}

/** The macros a part of the style makes use of, directly or through others. */
export function macrosUsedBy(style: Style, start: Element): Element[] {
  const seen = new Set<string>();
  const out: Element[] = [];
  const visit = (el: Element) => {
    for (const t of Array.from(el.querySelectorAll('*'))) {
      const name = t.getAttribute('macro');
      if (!name || seen.has(name)) continue;
      // `macro` names a macro on <text> and on <key>.
      if (t.localName !== 'text' && t.localName !== 'key') continue;
      seen.add(name);
      const m = macro(style, name);
      if (m) {
        out.push(m);
        visit(m);
      }
    }
  };
  visit(start);
  return out;
}

/** How many places call a macro. */
export function usesOf(style: Style, name: string): number {
  return Array.from(style.root.querySelectorAll('text')).filter(
    (t) => t.getAttribute('macro') === name,
  ).length;
}

// ---------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------

/** Options of names that a citation or bibliography hands down to its names. */
export const NAME_OPTIONS = [
  'and',
  'delimiter-precedes-last',
  'delimiter-precedes-et-al',
  'et-al-min',
  'et-al-use-first',
  'et-al-use-last',
  'et-al-subsequent-min',
  'et-al-subsequent-use-first',
  'initialize',
  'initialize-with',
  'name-as-sort-order',
  'sort-separator',
] as const;

/** The elements <name> that a citation or bibliography prints. */
export function namesIn(style: Style, scope: Scope): Element[] {
  const start = scopeElement(style, scope);
  if (!start) return [];
  const out = new Set<Element>();
  for (const root of [start, ...macrosUsedBy(style, start)]) {
    for (const n of Array.from(root.querySelectorAll('name'))) out.add(n);
  }
  return [...out];
}

/**
 * The value of an option of names as it holds in a citation or bibliography:
 * what the first <name> that says anything says, or else what is handed down
 * from the citation or bibliography, or else from the style.
 */
export function nameOption(style: Style, scope: Scope, option: string): string | null {
  for (const n of namesIn(style, scope)) {
    const own = n.getAttribute(option);
    if (own !== null) return own;
  }
  return scopeElement(style, scope)?.getAttribute(option) ?? style.root.getAttribute(option);
}

/**
 * Sets an option of names for a citation or bibliography. The option is set
 * on the citation or bibliography itself, from where it is handed down to
 * its names; names that said otherwise are made to agree. With null, the
 * option is taken away, and what the style says as a whole holds.
 *
 * A macro may serve citation and bibliography both. Where a name in such a
 * macro said something, it is made to say nothing, and the other of the two
 * is told to go on as before.
 */
export function setNameOption(style: Style, scope: Scope, option: string, value: string | null) {
  const el = scopeElement(style, scope);
  if (!el) return;
  const other: Scope = scope === 'citation' ? 'bibliography' : 'citation';
  const otherBefore = nameOption(style, other, option);
  const shared = new Set(namesIn(style, other));

  for (const n of namesIn(style, scope)) {
    if (!n.hasAttribute(option)) continue;
    if (shared.has(n)) n.removeAttribute(option);
    else set(n, option, value);
  }
  set(el, option, value);

  const otherEl = scopeElement(style, other);
  if (otherEl && nameOption(style, other, option) !== otherBefore && otherBefore !== null) {
    otherEl.setAttribute(option, otherBefore);
  }
}

export function set(el: Element, name: string, value: string | null | undefined) {
  if (value === null || value === undefined) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export function option(el: Element | null, name: string): string | null {
  return el?.getAttribute(name) ?? null;
}

export type Initials = 'full' | 'spaced' | 'close' | 'bare' | 'bare-spaced' | 'other';

const INITIALS: Record<Exclude<Initials, 'full' | 'other'>, string> = {
  spaced: '. ',
  close: '.',
  bare: '',
  'bare-spaced': ' ',
};

/**
 * Whether given names are written in full or as initials, and how. Two
 * options decide it together: `initialize-with` says what follows an initial,
 * and `initialize`, when false, says that names are not to be shortened.
 */
export function initials(style: Style, scope: Scope): Initials {
  const mark = nameOption(style, scope, 'initialize-with');
  if (mark === null || nameOption(style, scope, 'initialize') === 'false') return 'full';
  const found = (Object.entries(INITIALS) as [Initials, string][]).find(([, v]) => v === mark);
  return found ? found[0] : 'other';
}

export function setInitials(style: Style, scope: Scope, how: Initials) {
  if (how === 'other') return;
  if (how === 'full') {
    setNameOption(style, scope, 'initialize', 'false');
    return;
  }
  setNameOption(style, scope, 'initialize', 'true');
  setNameOption(style, scope, 'initialize-with', INITIALS[how]);
}

// ---------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------

// What the variables, types and positions of CSL are called is said in
// `locales/<language>/style.ftl`, a message for each: `style-variable-title`,
// `style-type-book`, `style-position-first`. What has none is shown by the
// name CSL gives it.

/** The words for a variable, with their article: "the title". */
function variableWord(name: string): string {
  const id = `style-variable-${name}`;
  return has(id) ? t(id) : t('style-quoted', { text: name });
}

/** A variable as a field of a reference is named, without an article: "title". */
export function variableName(name: string): string {
  const id = `style-variable-${name}`;
  return has(id) ? t(`${id}.bare`) : name;
}

function typeWord(name: string): string {
  const id = `style-type-${name}`;
  return has(id) ? t(id) : name;
}

function positionWord(name: string): string {
  const id = `style-position-${name}`;
  return has(id) ? t(id) : name;
}

function split(values: string): string[] {
  return values.split(/\s+/).filter(Boolean);
}

/**
 * Words joined two at a time by a message that has them as `first` and
 * `last`, so that the language orders them: "the author, or else the editor".
 */
function chain(parts: string[], id: string): string {
  return parts.length ? parts.reduce((first, last) => t(id, { first, last })) : '';
}

/** Words as a list, the last joined to the others by a message: "a book, a chapter or a thesis". */
function list(parts: string[], id: string): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return t(id, { first: parts.slice(0, -1).join(', '), last: parts[parts.length - 1] });
}

export function variableWords(names: string): string {
  return chain(split(names).map(variableWord), 'style-or-else');
}

function condition(el: Element): string {
  const match = el.getAttribute('match') ?? 'all';
  const join = match === 'any' ? 'style-or' : 'style-and';
  const parts: string[] = [];
  const type = el.getAttribute('type');
  if (type) {
    const types = split(type).map(typeWord);
    parts.push(
      t('style-if-type', {
        types: list(types, match === 'all' && type.includes(' ') ? 'style-and' : 'style-or'),
      }),
    );
  }
  const variable = el.getAttribute('variable');
  if (variable) {
    const names = chain(split(variable).map(variableName), join);
    parts.push(
      match === 'none'
        ? t('style-if-lacks', { variables: names })
        : t('style-if-has', { variables: names }),
    );
  }
  const position = el.getAttribute('position');
  if (position) parts.push(list(split(position).map(positionWord), join));
  const numeric = el.getAttribute('is-numeric');
  if (numeric) parts.push(t('style-if-numeric', { variables: variableWords(numeric) }));
  const uncertain = el.getAttribute('is-uncertain-date');
  if (uncertain) parts.push(t('style-if-uncertain', { variables: variableWords(uncertain) }));
  const locator = el.getAttribute('locator');
  if (locator) {
    const places = split(locator).map((name) => t('style-locator', { name }));
    parts.push(t('style-if-locator', { locators: chain(places, 'style-or') }));
  }
  const disambiguate = el.getAttribute('disambiguate');
  if (disambiguate) parts.push(t('style-if-disambiguate'));
  if (!parts.length) return t('style-if-always');
  const joined = chain(parts, join);
  return match === 'none' && !variable ? t('style-if-none-holds', { conditions: joined }) : joined;
}

/** What a part of a style is, in words. */
export function describe(el: Element): string {
  switch (el.localName) {
    case 'layout':
      return t('style-part-layout');
    case 'text': {
      const variable = el.getAttribute('variable');
      if (variable) return capital(variableWords(variable));
      const m = el.getAttribute('macro');
      if (m) return t('style-quoted', { text: m });
      const term = el.getAttribute('term');
      if (term) return t('style-part-term', { term });
      const value = el.getAttribute('value');
      if (value !== null) return t('style-part-value', { value });
      return t('style-part-text');
    }
    case 'names':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'name':
      return t('style-part-name');
    case 'name-part':
      return t('style-part-name-part', { name: el.getAttribute('name') ?? '' });
    case 'et-al':
      return t('style-part-et-al');
    case 'label':
      return el.getAttribute('variable')
        ? t('style-part-label', { variables: variableWords(el.getAttribute('variable')!) })
        : t('style-part-role');
    case 'substitute':
      return t('style-part-substitute');
    case 'date':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'date-part':
      return t('style-part-date-part', { name: el.getAttribute('name') ?? 'part' });
    case 'number':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'group':
      return t('style-part-group');
    case 'choose':
      return t('style-part-choose');
    case 'if':
      return t('style-part-if', { condition: condition(el) });
    case 'else-if':
      return t('style-part-else-if', { condition: condition(el) });
    case 'else':
      return t('style-part-else');
    default:
      return el.localName;
  }
}

function capital(text: string): string {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

/** Whether a part prints something itself, and so has a form of type. */
export function printsText(el: Element): boolean {
  return [
    'text',
    'names',
    'name',
    'name-part',
    'date',
    'date-part',
    'number',
    'label',
    'group',
    'layout',
    'et-al',
  ].includes(el.localName);
}

export function hasDelimiter(el: Element): boolean {
  return ['group', 'layout', 'names', 'name', 'date'].includes(el.localName);
}

export function hasAffixes(el: Element): boolean {
  return [
    'text',
    'names',
    'date',
    'date-part',
    'number',
    'label',
    'group',
    'layout',
    'name',
    'name-part',
  ].includes(el.localName);
}

/** The parts under a part, for showing them as a tree. A call of a macro has the macro's parts. */
export function partsOf(style: Style, el: Element): Element[] {
  if (el.localName === 'text' && el.getAttribute('macro')) {
    const m = macro(style, el.getAttribute('macro')!);
    return m ? children(m) : [];
  }
  return children(el).filter((c) => c.localName !== 'sort');
}

export function move(el: Element, by: -1 | 1): boolean {
  const parent = el.parentElement;
  if (!parent) return false;
  const siblings = children(parent);
  const i = siblings.indexOf(el);
  const j = i + by;
  if (j < 0 || j >= siblings.length) return false;
  // `if` must stay first in a choice and `else` last.
  const other = siblings[j];
  const fixed = (e: Element) => e.localName === 'if' || e.localName === 'else';
  if (fixed(el) || fixed(other)) return false;
  if (by < 0) parent.insertBefore(el, other);
  else parent.insertBefore(other, el);
  return true;
}

export function remove(el: Element): boolean {
  const parent = el.parentElement;
  if (!parent || el.localName === 'layout' || el.localName === 'if') return false;
  // A choice left without anything to choose from goes with its last branch.
  parent.removeChild(el);
  if (parent.localName === 'choose' && !children(parent).length)
    parent.parentElement?.removeChild(parent);
  return true;
}

export type NewPart =
  | { kind: 'variable'; name: string }
  | { kind: 'value'; text: string }
  | { kind: 'term'; name: string };

/** Adds a part after another, or as the last within it when `inside`. */
export function add(style: Style, at: Element, part: NewPart, inside: boolean): Element {
  const el = style.doc.createElementNS(CSL, 'text');
  if (part.kind === 'variable') el.setAttribute('variable', part.name);
  else if (part.kind === 'value') el.setAttribute('value', part.text);
  else el.setAttribute('term', part.name);
  if (inside) {
    // Into a macro when the part is a call of one.
    const target =
      at.localName === 'text' && at.getAttribute('macro')
        ? (macro(style, at.getAttribute('macro')!) ?? at)
        : at;
    target.appendChild(el);
  } else {
    at.parentElement?.insertBefore(el, at.nextSibling);
  }
  return el;
}

export const TEXT_VARIABLES = [
  'title',
  'title-short',
  'container-title',
  'collection-title',
  'collection-number',
  'volume',
  'issue',
  'edition',
  'page',
  'publisher',
  'publisher-place',
  'genre',
  'note',
  'DOI',
  'URL',
  'ISBN',
  'archive',
  'archive_location',
  'original-title',
  'status',
  'medium',
];

/** A sentence for a part with its form: “italic, in quotation marks, followed by ‘, ’”. */
export function formWords(el: Element): string {
  const out: string[] = [];
  if (el.getAttribute('font-style') === 'italic') out.push(t('style-form-italic'));
  if (el.getAttribute('font-weight') === 'bold') out.push(t('style-form-bold'));
  if (el.getAttribute('font-variant') === 'small-caps') out.push(t('style-form-small-caps'));
  if (el.getAttribute('text-decoration') === 'underline') out.push(t('style-form-underlined'));
  if (el.getAttribute('quotes') === 'true') out.push(t('style-form-quoted'));
  const c = el.getAttribute('text-case');
  if (c) out.push(t('style-form-case', { case: c, words: c.replace(/-/g, ' ') }));
  const v = el.getAttribute('vertical-align');
  if (v && v !== 'baseline')
    out.push(v === 'sup' ? t('style-form-raised') : t('style-form-lowered'));
  const prefix = el.getAttribute('prefix');
  if (prefix) out.push(t('style-form-after', { text: prefix }));
  const suffix = el.getAttribute('suffix');
  if (suffix) out.push(t('style-form-before', { text: suffix }));
  const delimiter = el.getAttribute('delimiter');
  if (delimiter) out.push(t('style-form-between', { text: delimiter }));
  return out.join(', ');
}
