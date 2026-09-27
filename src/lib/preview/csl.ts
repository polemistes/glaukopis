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
      words.replace(/^.*?error[^:]*:\s*/i, '').slice(0, 200) ||
        'The source is not well-formed XML.',
    );
  }
  const root = doc.documentElement;
  if (root.localName !== 'style')
    throw new Error('This is not a style: it does not begin with <style>.');
  if (!child(root, 'citation')) {
    throw new Error(
      'The style has no <citation>: it only names another style, and cannot be changed.',
    );
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

const VARIABLES: Record<string, string> = {
  title: 'the title',
  'title-short': 'the short title',
  'container-title': 'the title of the journal or book',
  'container-title-short': 'the short title of the journal',
  'collection-title': 'the series',
  'collection-number': 'the number in the series',
  'original-title': 'the original title',
  'reviewed-title': 'the title of the work reviewed',
  author: 'the author',
  editor: 'the editor',
  translator: 'the translator',
  'container-author': 'the author of the book',
  'collection-editor': 'the editor of the series',
  'editorial-director': 'the editorial director',
  'original-author': 'the original author',
  'reviewed-author': 'the author of the work reviewed',
  interviewer: 'the interviewer',
  recipient: 'the recipient',
  director: 'the director',
  composer: 'the composer',
  illustrator: 'the illustrator',
  issued: 'the date',
  accessed: 'the date of access',
  'original-date': 'the original date',
  'event-date': 'the date of the event',
  submitted: 'the date of submission',
  volume: 'the volume',
  'number-of-volumes': 'the number of volumes',
  issue: 'the issue',
  edition: 'the edition',
  page: 'the pages',
  'page-first': 'the first page',
  'number-of-pages': 'the number of pages',
  number: 'the number',
  chapter: 'the chapter',
  'chapter-number': 'the number of the chapter',
  publisher: 'the publisher',
  'publisher-place': 'the place of publication',
  'original-publisher': 'the original publisher',
  'original-publisher-place': 'the original place of publication',
  locator: 'the place cited',
  'citation-number': 'the number of the citation',
  'citation-label': 'the label of the citation',
  'year-suffix': 'the letter after the year',
  'first-reference-note-number': 'the number of the note where it was first cited',
  DOI: 'the DOI',
  URL: 'the address',
  ISBN: 'the ISBN',
  ISSN: 'the ISSN',
  PMID: 'the PMID',
  genre: 'the kind of work',
  medium: 'the medium',
  note: 'the note',
  annote: 'the annotation',
  abstract: 'the abstract',
  archive: 'the archive',
  archive_location: 'the place in the archive',
  'archive-place': 'the place of the archive',
  authority: 'the authority',
  'call-number': 'the call number',
  event: 'the event',
  'event-place': 'the place of the event',
  'event-title': 'the title of the event',
  section: 'the section',
  source: 'the source',
  status: 'the state of publication',
  version: 'the version',
  language: 'the language',
  dimensions: 'the dimensions',
  scale: 'the scale',
  references: 'the references',
  keyword: 'the keywords',
  jurisdiction: 'the jurisdiction',
};

const TYPES: Record<string, string> = {
  book: 'a book',
  chapter: 'a chapter',
  'article-journal': 'an article in a journal',
  'article-magazine': 'an article in a magazine',
  'article-newspaper': 'an article in a newspaper',
  article: 'an article',
  thesis: 'a thesis',
  report: 'a report',
  webpage: 'a web page',
  'paper-conference': 'a conference paper',
  'entry-encyclopedia': 'an entry in an encyclopaedia',
  'entry-dictionary': 'an entry in a dictionary',
  entry: 'an entry',
  review: 'a review',
  'review-book': 'a review of a book',
  manuscript: 'a manuscript',
  personal_communication: 'a letter or other communication',
  legal_case: 'a court decision',
  legislation: 'legislation',
  bill: 'a bill',
  patent: 'a patent',
  dataset: 'a dataset',
  software: 'software',
  motion_picture: 'a film',
  broadcast: 'a broadcast',
  song: 'a recording',
  speech: 'a lecture',
  interview: 'an interview',
  graphic: 'an image',
  map: 'a map',
  pamphlet: 'a pamphlet',
  'post-weblog': 'a blog post',
  post: 'a post',
  classic: 'a classical work',
  collection: 'a collection',
  document: 'a document',
  standard: 'a standard',
  treaty: 'a treaty',
  periodical: 'a periodical',
  musical_score: 'a score',
  figure: 'a figure',
  event: 'an event',
  performance: 'a performance',
  regulation: 'a regulation',
  hearing: 'a hearing',
};

const POSITIONS: Record<string, string> = {
  first: 'it is cited for the first time',
  subsequent: 'it has been cited before',
  ibid: 'it is the same as the citation before',
  'ibid-with-locator': 'it is the same as the citation before, at another place',
  'near-note': 'it was cited in a note nearby',
};

export function variableWords(names: string): string {
  return names
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => VARIABLES[v] ?? `“${v}”`)
    .join(', or else ');
}

function list(values: string, words: Record<string, string>, join: string): string {
  const parts = values
    .split(/\s+/)
    .filter(Boolean)
    .map((v) => words[v] ?? v);
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} ${join} ${parts[parts.length - 1]}`;
}

function condition(el: Element): string {
  const match = el.getAttribute('match') ?? 'all';
  const join = match === 'any' ? 'or' : 'and';
  const parts: string[] = [];
  const type = el.getAttribute('type');
  if (type)
    parts.push(
      `the work is ${list(type, TYPES, match === 'all' && type.includes(' ') ? 'and' : 'or')}`,
    );
  const variable = el.getAttribute('variable');
  if (variable) {
    const names = variable
      .split(/\s+/)
      .filter(Boolean)
      .map((v) => (VARIABLES[v] ?? v).replace(/^the /, ''));
    const verb = match === 'none' ? 'it has no' : 'it has';
    parts.push(`${verb} ${names.join(match === 'any' ? ' or ' : ' and ')}`);
  }
  const position = el.getAttribute('position');
  if (position) parts.push(list(position, POSITIONS, join));
  const numeric = el.getAttribute('is-numeric');
  if (numeric) parts.push(`${variableWords(numeric).replace(/^the /, 'the ')} is a number`);
  const uncertain = el.getAttribute('is-uncertain-date');
  if (uncertain) parts.push(`${variableWords(uncertain)} is uncertain`);
  const locator = el.getAttribute('locator');
  if (locator) parts.push(`the place cited is a ${locator.split(/\s+/).join(' or a ')}`);
  const disambiguate = el.getAttribute('disambiguate');
  if (disambiguate) parts.push('it would otherwise be mistaken for another');
  if (!parts.length) return 'always';
  const joined = parts.join(` ${join} `);
  return match === 'none' && !variable ? `none of this holds: ${joined}` : joined;
}

/** What a part of a style is, in words. */
export function describe(el: Element): string {
  switch (el.localName) {
    case 'layout':
      return 'The whole';
    case 'text': {
      const variable = el.getAttribute('variable');
      if (variable) return capital(variableWords(variable));
      const m = el.getAttribute('macro');
      if (m) return `“${m}”`;
      const term = el.getAttribute('term');
      if (term) return `The word for “${term}”`;
      const value = el.getAttribute('value');
      if (value !== null) return `The words “${value}”`;
      return 'Text';
    }
    case 'names':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'name':
      return 'How the names are written';
    case 'name-part':
      return `The ${el.getAttribute('name') ?? ''} name`;
    case 'et-al':
      return '“et al.”';
    case 'label':
      return el.getAttribute('variable')
        ? `The word before ${variableWords(el.getAttribute('variable')!)} (“p.”, “ed.”)`
        : 'The word for the role (“ed.”, “trans.”)';
    case 'substitute':
      return 'When there is no such name, in its place';
    case 'date':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'date-part':
      return `The ${el.getAttribute('name') ?? 'part'}`;
    case 'number':
      return capital(variableWords(el.getAttribute('variable') ?? ''));
    case 'group':
      return 'Together';
    case 'choose':
      return 'One of these';
    case 'if':
      return `If ${condition(el)}`;
    case 'else-if':
      return `Or else, if ${condition(el)}`;
    case 'else':
      return 'Otherwise';
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
  if (el.getAttribute('font-style') === 'italic') out.push('italic');
  if (el.getAttribute('font-weight') === 'bold') out.push('bold');
  if (el.getAttribute('font-variant') === 'small-caps') out.push('small capitals');
  if (el.getAttribute('text-decoration') === 'underline') out.push('underlined');
  if (el.getAttribute('quotes') === 'true') out.push('in quotation marks');
  const c = el.getAttribute('text-case');
  if (c) out.push(c.replace(/-/g, ' '));
  const v = el.getAttribute('vertical-align');
  if (v && v !== 'baseline') out.push(v === 'sup' ? 'raised' : 'lowered');
  const prefix = el.getAttribute('prefix');
  if (prefix) out.push(`after “${prefix}”`);
  const suffix = el.getAttribute('suffix');
  if (suffix) out.push(`before “${suffix}”`);
  const delimiter = el.getAttribute('delimiter');
  if (delimiter) out.push(`with “${delimiter}” between`);
  return out.join(', ');
}
