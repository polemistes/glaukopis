/**
 * What the program knows of an element, as Org has it (ADR 0041, "The
 * file"): the drawer of its properties, one line each; the kinds of the
 * project in two drawers of their own, a line a kind; the templates the
 * project carries as blocks of JSON; the comments in a drawer, one thread
 * an item with its answers under it. Also the settings lines of blocks,
 * `#+ATTR_GLAUKOPIS: :key value …`, and the `key=value` lists the kinds and
 * the identifiers are written in.
 *
 * A value is written bare where it can be read back so, and as a string of
 * JSON where it holds spaces or signs: `alt="A drawing of a hull"`. `WHEN`,
 * `TIMELINE` and `LOOK` are written as one line of JSON for now: the words the
 * program writes for a placement in time are not yet a form that reads
 * back.
 */

import type { Template } from '$lib/api/templates';
import type { KindFamily, Look } from '$lib/api/documents';
import type {
  DocumentSettings,
  KindRecord,
  PassageKindRecord,
  Person,
  Position,
  Status,
  TimelineSettings,
} from '$lib/project/model/types';
import type { LookChanges } from '$lib/look/changes';
import type { When } from '$lib/timeline/solve';
import { escapeCodeLine, slug, unescapeCodeLine } from './escape';
import type { OrgElement, OrgLink, OrgNote, OrgThread } from './types';

// ---- values ----

/** A value a settings line or a list of `key=value` holds: written bare, as a string of JSON, or as JSON itself. */
export type Value = string | number | boolean | { json: unknown };

const bare = (s: string) => /^[^\s"'[\]{}:=\\][^\s"=\\]*$/.test(s);

function valueText(v: Value): string {
  if (typeof v === 'boolean') return v ? 't' : 'nil';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'object') return JSON.stringify(v.json);
  return bare(v) ? v : JSON.stringify(v);
}

/** A run of JSON from `at`: a string, an array or an object; its end, or -1. */
function jsonEnd(s: string, at: number): number {
  let depth = 0;
  let quoted = false;
  for (let j = at; j < s.length; j++) {
    const c = s[j];
    if (quoted) {
      if (c === '\\') j++;
      else if (c === '"') {
        quoted = false;
        if (!depth) return j + 1;
      }
    } else if (c === '"') quoted = true;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') {
      depth--;
      if (!depth) return j + 1;
    }
  }
  return -1;
}

/** The tokens of a line: runs without spaces, or runs of JSON, each read as what it says. */
function tokens(s: string): { text: string; value: unknown; json: boolean }[] {
  const out: { text: string; value: unknown; json: boolean }[] = [];
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    // A key with its value glued on: key="…" or key=[…].
    const keyed = /^[^\s="[{]+=/.exec(s.slice(i))?.[0] ?? '';
    const at = i + keyed.length;
    if ('"[{'.includes(s[at] ?? ' ')) {
      const end = jsonEnd(s, at);
      if (end > 0) {
        const raw = s.slice(at, end);
        let value: unknown = raw;
        let json = true;
        try {
          value = JSON.parse(raw);
        } catch {
          json = false;
        }
        out.push({ text: keyed + raw, value: keyed ? [keyed.slice(0, -1), value] : value, json });
        i = end;
        continue;
      }
    }
    const word = /^\S+/.exec(s.slice(i))![0];
    out.push({
      text: word,
      value: keyed ? [keyed.slice(0, -1), word.slice(keyed.length)] : word,
      json: false,
    });
    i += word.length;
  }
  return out;
}

/** A settings line's words: `:numbering counted :every 5 :alt "A hull"`. Keys whose value is nothing are left out. */
export function writePlist(said: [string, Value | null | undefined][]): string {
  return said
    .filter((p): p is [string, Value] => p[1] !== null && p[1] !== undefined && p[1] !== '')
    .map(([k, v]) => `:${k} ${valueText(v)}`)
    .join(' ');
}

/** A settings line read: each key with what follows it until the next key; `t` for a key with nothing after it. */
export function readPlist(s: string): Map<string, unknown> {
  const out = new Map<string, unknown>();
  let key: string | null = null;
  let words: unknown[] = [];
  const close = () => {
    if (key === null) return;
    out.set(key, !words.length ? 't' : words.length === 1 ? words[0] : words.map(String).join(' '));
  };
  for (const t of tokens(s)) {
    if (!t.json && /^:[^\s]+$/.test(t.text)) {
      close();
      key = t.text.slice(1).toLowerCase();
      words = [];
    } else words.push(Array.isArray(t.value) && !t.json ? t.text : t.value);
  }
  close();
  return out;
}

/** A list of `key=value`, with flags bare: `words based-on=title italic=yes`. */
export function writeKv(said: [string, Value | null | undefined][]): string {
  return said
    .filter((p): p is [string, Value] => p[1] !== null && p[1] !== undefined && p[1] !== '')
    .map(([k, v]) => (v === true ? k : `${k}=${valueText(v)}`))
    .join(' ');
}

/** A list of `key=value` read; a flag is `true`. */
export function readKv(s: string): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const t of tokens(s)) {
    if (Array.isArray(t.value)) out.set(String(t.value[0]), t.value[1]);
    else if (typeof t.value === 'string') out.set(t.value, true);
  }
  return out;
}

const truthy = (v: unknown) => v === true || v === 't' || v === 'yes' || v === 'true';

/** A string from what was read, or nothing. */
export const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : typeof v === 'number' ? String(v) : undefined;

/** A number from what was read, or nothing. */
export function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

/** A yes or a no from what was read, or nothing. */
export function bool(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (truthy(v)) return true;
  if (v === false || v === 'nil' || v === 'no' || v === 'false') return false;
  return undefined;
}

/** JSON written in a value, read; nothing where it is not. */
export function jsonOf(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
}

// ---- the properties of an element ----

/** A property's value on its line: as it is, or as a string of JSON where it would not read back so. */
function propertyText(v: string): string {
  return /^\s|\s$|\n|^"/.test(v) || v === '' ? JSON.stringify(v) : v;
}

function propertyValue(v: string): string {
  const t = v.trim();
  if (t.startsWith('"')) {
    try {
      const got = JSON.parse(t);
      if (typeof got === 'string') return got;
    } catch {
      // Words that begin with a quote, as they are.
    }
  }
  return t;
}

/** A list of words, as `a; b; c`, or as JSON where one of them would not read back so. */
function listText(items: string[]): string {
  const plain = items.every((i) => i && i === i.trim() && !i.includes(';') && !i.startsWith('['));
  return plain ? items.join('; ') : JSON.stringify(items);
}

function readList(v: string): string[] {
  if (v.startsWith('[')) {
    const got = jsonOf(v);
    if (Array.isArray(got)) return got.map(String);
  }
  return v
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The authors: names, an affiliation after a `/`, an address in `<…>`, an ORCID after `orcid=`; JSON where that would not read back. */
function authorsText(people: Person[]): string {
  const plain = people.every(
    (p) =>
      [p.name, p.affiliation ?? 'x', p.email ?? 'x', p.orcid ?? 'x'].every(
        (s) => s && s === s.trim() && !/[;<>[\]]|\s\/\s|orcid=/.test(s),
      ) && !p.name.startsWith('['),
  );
  if (!plain) return JSON.stringify(people);
  return people
    .map((p) =>
      [
        p.name,
        ...(p.affiliation ? [`/ ${p.affiliation}`] : []),
        ...(p.email ? [`<${p.email}>`] : []),
        ...(p.orcid ? [`orcid=${p.orcid}`] : []),
      ].join(' '),
    )
    .join('; ');
}

function readAuthors(v: string): Person[] {
  if (v.startsWith('[')) {
    const got = jsonOf(v);
    if (Array.isArray(got))
      return got
        .filter((p) => p && typeof p.name === 'string')
        .map((p) => ({
          name: p.name,
          ...(typeof p.affiliation === 'string' ? { affiliation: p.affiliation } : {}),
          ...(typeof p.email === 'string' ? { email: p.email } : {}),
          ...(typeof p.orcid === 'string' ? { orcid: p.orcid } : {}),
        }));
  }
  return v
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      let rest = s;
      const person: Person = { name: '' };
      const orcid = /\s*orcid=(\S+)\s*$/.exec(rest);
      if (orcid) {
        person.orcid = orcid[1];
        rest = rest.slice(0, orcid.index);
      }
      const email = /\s*<([^>]*)>\s*$/.exec(rest);
      if (email) {
        person.email = email[1];
        rest = rest.slice(0, email.index);
      }
      const cut = rest.indexOf(' / ');
      if (cut >= 0) {
        person.affiliation = rest.slice(cut + 3).trim();
        rest = rest.slice(0, cut);
      }
      person.name = rest.trim();
      const ordered: Person = { name: person.name };
      if (person.affiliation) ordered.affiliation = person.affiliation;
      if (person.email) ordered.email = person.email;
      if (person.orcid) ordered.orcid = person.orcid;
      return ordered;
    });
}

/** What writing an element's drawer needs of the project. */
export interface DrawerWriting {
  /** The name an element's kind is written by: its name where that is one kind's alone, else its id. */
  kindName: (id: string) => string;
  /** The associations that go from the element. */
  links: OrgLink[];
}

/** The lines of an element's drawer of properties. */
export function writeProperties(e: OrgElement, w: DrawerWriting): string[] {
  const d = e.document;
  const said: [string, string | undefined][] = [
    ['ID', e.id],
    ['KIND', e.kind ? w.kindName(e.kind) : undefined],
    ['STATUS', e.status ?? undefined],
    ['WHEN', e.when ? JSON.stringify(e.when) : undefined],
    ['HEADING', e.heading ? undefined : 'no'],
    ['INCLUDE', e.include ?? undefined],
    ['ORIGIN', e.origin ?? undefined],
    ['POS', e.pos ? `${Math.round(e.pos.x)},${Math.round(e.pos.y)}` : undefined],
    ['COLLAPSED', e.collapsed ? 't' : undefined],
    [
      'LINKS',
      w.links.length
        ? w.links
            .map((l) => {
              const to = l.to.replace(/[\\[\]]/g, (c) => `\\${c}`);
              const label = l.label.replace(/[\\[\]]/g, (c) => `\\${c}`).replace(/\n/g, ' ');
              return label ? `[[id:${to}][${label}]]` : `[[id:${to}]]`;
            })
            .join(' ')
        : undefined,
    ],
    ['TITLE', d.title !== undefined ? propertyText(d.title) : undefined],
    ['SUBTITLE', d.subtitle !== undefined ? propertyText(d.subtitle) : undefined],
    ['AUTHORS', d.authors?.length ? authorsText(d.authors) : undefined],
    ['DATE', d.date !== undefined ? propertyText(d.date) : undefined],
    ['KEYWORDS', d.keywords?.length ? listText(d.keywords) : undefined],
    ['TEMPLATE', d.template !== undefined ? propertyText(d.template) : undefined],
    ['LAYOUT', d.format !== undefined ? propertyText(d.format) : undefined],
    ['STYLE', d.style !== undefined ? propertyText(d.style) : undefined],
    ['LANGUAGE', d.language !== undefined ? propertyText(d.language) : undefined],
    [
      'IDENTIFIERS',
      d.identifiers && Object.keys(d.identifiers).length
        ? writeKv(Object.entries(d.identifiers))
        : undefined,
    ],
    ['LINE_NUMBERS', d.lineNumbers === undefined ? undefined : d.lineNumbers ? 't' : 'nil'],
    ['LOOK', d.look && Object.keys(d.look).length ? JSON.stringify(d.look) : undefined],
    ['TIMELINE', e.timeline ? JSON.stringify(e.timeline) : undefined],
  ];
  const lines = said.filter((p): p is [string, string] => p[1] !== undefined);
  const width = Math.max(...lines.map(([k]) => k.length)) + 3;
  return [
    ':PROPERTIES:',
    ...lines.map(([k, v]) => `${`:${k}:`.padEnd(width)}${v}`.trimEnd()),
    ':END:',
  ];
}

/** What an element's drawer said, read; and the lines of it that were not known, kept so that nothing is lost. */
export interface ReadProperties {
  id: string | null;
  kind: string | null;
  status: Status | null;
  when: When | null;
  heading: boolean;
  include: string | null;
  origin: string | null;
  pos: Position | null;
  collapsed: boolean;
  links: { to: string; label: string }[];
  document: DocumentSettings;
  timeline: TimelineSettings | null;
  unknown: string[];
}

/** Reads the lines between `:PROPERTIES:` and `:END:`. */
export function readProperties(lines: string[]): ReadProperties {
  const out: ReadProperties = {
    id: null,
    kind: null,
    status: null,
    when: null,
    heading: true,
    include: null,
    origin: null,
    pos: null,
    collapsed: false,
    links: [],
    document: {},
    timeline: null,
    unknown: [],
  };
  const d = out.document;
  for (const line of lines) {
    const m = /^\s*:([^:\s]+):(?:\s+(.*))?$/.exec(line);
    if (!m) {
      if (line.trim()) out.unknown.push(line.trim());
      continue;
    }
    const key = m[1].toUpperCase();
    const raw = (m[2] ?? '').trim();
    const v = propertyValue(raw);
    switch (key) {
      case 'ID':
        out.id = v || null;
        break;
      case 'KIND':
        out.kind = v || null;
        break;
      case 'STATUS':
        out.status = v === 'idea' || v === 'draft' || v === 'done' ? v : null;
        if (!out.status && v) out.unknown.push(line.trim());
        break;
      case 'WHEN': {
        const when = jsonOf(raw) as When | undefined;
        if (when && typeof when === 'object' && when.start && typeof when.start === 'object')
          out.when = when;
        else if (raw) out.unknown.push(line.trim());
        break;
      }
      case 'HEADING':
        out.heading = bool(v) !== false;
        break;
      case 'INCLUDE':
        out.include = v || null;
        break;
      case 'ORIGIN':
        out.origin = v || null;
        break;
      case 'POS': {
        const p = /^(-?[\d.]+)\s*,\s*(-?[\d.]+)$/.exec(v);
        if (p) out.pos = { x: Number(p[1]), y: Number(p[2]) };
        break;
      }
      case 'COLLAPSED':
        out.collapsed = bool(v) === true;
        break;
      case 'LINKS':
        for (const l of raw.matchAll(/\[\[id:((?:\\.|[^\]\\])*)\](?:\[((?:\\.|[^\]\\])*)\])?\]/g))
          out.links.push({
            to: l[1].replace(/\\(.)/g, '$1'),
            label: (l[2] ?? '').replace(/\\(.)/g, '$1'),
          });
        break;
      case 'TITLE':
        d.title = v;
        break;
      case 'SUBTITLE':
        d.subtitle = v;
        break;
      case 'AUTHORS':
        d.authors = readAuthors(raw);
        break;
      case 'DATE':
        d.date = v;
        break;
      case 'KEYWORDS':
        d.keywords = readList(raw);
        break;
      case 'TEMPLATE':
        d.template = v;
        break;
      case 'LAYOUT':
        d.format = v;
        break;
      case 'STYLE':
        d.style = v;
        break;
      case 'LANGUAGE':
        d.language = v;
        break;
      case 'IDENTIFIERS': {
        const ids: Record<string, string> = {};
        for (const [k, val] of readKv(raw)) if (typeof val === 'string') ids[k] = val;
        d.identifiers = ids;
        break;
      }
      case 'LINE_NUMBERS': {
        const b = bool(v);
        if (b !== undefined) d.lineNumbers = b;
        break;
      }
      case 'LOOK': {
        const look = jsonOf(raw);
        if (look && typeof look === 'object' && !Array.isArray(look)) d.look = look as LookChanges;
        else if (raw) out.unknown.push(line.trim());
        break;
      }
      case 'TIMELINE': {
        const t = jsonOf(raw);
        if (t && typeof t === 'object' && !Array.isArray(t)) out.timeline = t as TimelineSettings;
        else if (raw) out.unknown.push(line.trim());
        break;
      }
      default:
        out.unknown.push(line.trim());
    }
  }
  return out;
}

// ---- the kinds of the project ----

/** A line of a drawer of kinds: `- Name :: key=value …`, the name as JSON where it would not read back. */
function kindLine(name: string, said: [string, Value | null | undefined][]): string {
  const named = /^\s|\s$|::|^"|\n/.test(name) || !name ? JSON.stringify(name) : name;
  const rest = writeKv(said);
  return rest ? `- ${named} :: ${rest}` : `- ${named} ::`;
}

function readKindLine(line: string): { name: string; said: Map<string, unknown> } | null {
  const m = /^\s*-\s+(.*)$/.exec(line);
  if (!m) return null;
  let rest = m[1];
  let name: string;
  if (rest.startsWith('"')) {
    const end = jsonEnd(rest, 0);
    if (end < 0) return null;
    try {
      name = JSON.parse(rest.slice(0, end));
    } catch {
      return null;
    }
    rest = rest.slice(end);
    const sep = /^\s*::(\s|$)/.exec(rest);
    if (!sep) return null;
    rest = rest.slice(sep[0].length);
  } else {
    const sep = /\s::(\s|$)/.exec(rest);
    if (!sep) return { name: rest.trim(), said: new Map() };
    name = rest.slice(0, sep.index).trim();
    rest = rest.slice(sep.index + sep[0].length);
  }
  return { name, said: readKv(rest) };
}

/** The drawer of the kinds of elements. */
export function writeElementKinds(kinds: KindRecord[]): string[] {
  return [
    ':ELEMENT_KINDS:',
    ...kinds.map((k) =>
      kindLine(k.name, [
        ['id', k.id],
        ['colour', k.colour],
        ['begins', k.begins],
        ['based-on', k.basedOn],
        ['order', k.order],
        ['template', k.template ? { json: k.template } : undefined],
      ]),
    ),
    ':END:',
  ];
}

export function readElementKinds(lines: string[]): KindRecord[] {
  const out: KindRecord[] = [];
  for (const line of lines) {
    const got = readKindLine(line);
    if (!got || !got.name) continue;
    const { name, said } = got;
    const kind: KindRecord = {
      id: str(said.get('id')) || slug(name),
      name,
      colour: str(said.get('colour')) ?? 'grey',
      template: str(said.get('template')) ?? '',
      order: str(said.get('order')) ?? String(out.length),
    };
    const begins = str(said.get('begins'));
    if (begins) kind.begins = begins;
    const based = str(said.get('based-on'));
    if (based) kind.basedOn = based;
    out.push(kind);
  }
  return out;
}

/** The measures of a look, by the names they are written with, and what each holds. */
const LOOK: [keyof Look, string, 'number' | 'boolean' | 'string'][] = [
  ['size', 'size', 'number'],
  ['lineSpacing', 'line-spacing', 'number'],
  ['align', 'align', 'string'],
  ['indentLeft', 'indent-left', 'string'],
  ['indentRight', 'indent-right', 'string'],
  ['firstLine', 'first-line', 'string'],
  ['spaceBefore', 'space-before', 'string'],
  ['spaceAfter', 'space-after', 'string'],
  ['bold', 'bold', 'boolean'],
  ['italic', 'italic', 'boolean'],
  ['case', 'case', 'string'],
  ['underline', 'underline', 'boolean'],
  ['monospace', 'monospace', 'boolean'],
  ['keepWithNext', 'keep-with-next', 'boolean'],
  ['newPage', 'new-page', 'boolean'],
  ['text', 'text', 'string'],
];

/**
 * The names the blocks of the writer's own kinds are written by: the slug
 * of the name, and where that is taken, by a sign of Org's or ours or by
 * another kind, the slug with a number after it.
 */
export function ownSlugs(
  kinds: PassageKindRecord[],
  taken: (name: string) => boolean,
): Map<string, string> {
  const out = new Map<string, string>();
  const used = new Set<string>();
  for (const k of kinds) {
    const base = slug(k.name);
    let name = base;
    for (let n = 2; taken(name) || used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    out.set(k.id, name);
  }
  return out;
}

/** The drawer of the kinds of paragraph and of words of the writer's own. */
export function writeParagraphKinds(
  kinds: PassageKindRecord[],
  slugs: Map<string, string>,
): string[] {
  return [
    ':PARAGRAPH_KINDS:',
    ...kinds.map((k) => {
      const s = slugs.get(k.id) ?? slug(k.name);
      return kindLine(k.name, [
        ['id', k.id],
        ...(k.family === 'words' ? ([['words', true]] as [string, Value][]) : []),
        ['based-on', k.basedOn],
        ['order', k.order],
        ['slug', s !== slug(k.name) ? s : undefined],
        ...LOOK.map(([key, written, type]): [string, Value | undefined] => {
          const v = k.look[key];
          if (v === undefined || v === null) return [written, undefined];
          if (type === 'boolean') return [written, v ? 'yes' : 'no'];
          if (type === 'number') return [written, Number(v)];
          return [written, String(v)];
        }),
      ]);
    }),
    ':END:',
  ];
}

/** The kinds of paragraph and of words of the writer's own, and the names their blocks are written by. */
export function readParagraphKinds(lines: string[]): {
  kinds: PassageKindRecord[];
  slugs: Map<string, string>;
} {
  const kinds: PassageKindRecord[] = [];
  const slugs = new Map<string, string>();
  for (const line of lines) {
    const got = readKindLine(line);
    if (!got || !got.name) continue;
    const { name, said } = got;
    const look: Look = {};
    for (const [key, written, type] of LOOK) {
      const v = said.get(written);
      if (v === undefined) continue;
      if (type === 'boolean') {
        const b = bool(v);
        if (b !== undefined) (look as Record<string, unknown>)[key] = b;
      } else if (type === 'number') {
        const n = num(v);
        if (n !== undefined) (look as Record<string, unknown>)[key] = n;
      } else if (typeof v === 'string') (look as Record<string, unknown>)[key] = v;
    }
    const kind: PassageKindRecord = {
      id: str(said.get('id')) || `own-${slug(name)}`,
      name,
      family: (said.get('words') === true ? 'words' : 'paragraph') as KindFamily,
      basedOn: str(said.get('based-on')) ?? (said.get('words') === true ? '' : 'text'),
      look,
      order: str(said.get('order')) ?? String(kinds.length),
    };
    kinds.push(kind);
    slugs.set(kind.id, str(said.get('slug')) || slug(name));
  }
  return { kinds, slugs };
}

// ---- templates ----

/** A template the project carries, as a block of JSON named after it. */
export function writeTemplate(id: string, template: Template): string[] {
  const body = JSON.stringify(template, null, 2)
    .split('\n')
    .map(escapeCodeLine);
  return [`#+BEGIN_SRC json :template ${id}`, ...body, '#+END_SRC'];
}

/** A template from the lines of its block; nothing where they are not one. */
export function readTemplate(lines: string[]): Template | null {
  const text = lines.map(unescapeCodeLine).join('\n');
  const got = jsonOf(text);
  return got &&
    typeof got === 'object' &&
    !Array.isArray(got) &&
    typeof (got as Template).id === 'string'
    ? (got as Template)
    : null;
}

// ---- comments ----

const SETTLED = ' (settled)';

/**
 * The head of a note: when, who, and on which words, as the record has it:
 * `[2026-10-12 Robert] on "gods before men":`. The author is written as
 * JSON where a bracket or a quote would end the head too soon.
 */
function noteHead(note: OrgNote, words: string | null | undefined): string {
  const author =
    /^[^\s"\]\\][^\]\\]*$/.test(note.author) && note.author === note.author.trim()
      ? note.author
      : JSON.stringify(note.author);
  const date = note.date.replace(/\s+/g, '') || '-';
  const on = words !== undefined && words !== null ? ` on ${JSON.stringify(words)}:` : '';
  return `[${date} ${author}]${on}`;
}

/**
 * What a note says, as lines: the first after its head, each further one
 * indented under it, with a backslash where it would read as something
 * else; `(settled)` after the last note of a settled thread.
 */
function noteLines(text: string, indent: string, last: boolean, resolved: boolean): string[] {
  const lines = text.split('\n');
  const n = lines.length - 1;
  // Words that end as a settled thread does, where it is not that, keep a backslash.
  if (!(last && resolved) && lines[n].endsWith('(settled)'))
    lines[n] = `${lines[n].slice(0, -'(settled)'.length)}\\(settled)`;
  if (last && resolved) lines[n] += SETTLED;
  return lines.map((l, k) => {
    if (!k) return l ? ` ${/^(\\|:|on ")/.test(l) ? '\\' : ''}${l}` : '';
    return `${indent}${/^[\s\-:\\]/.test(l) || !l ? '\\' : ''}${l}`;
  });
}

/** The drawer of an element's comments; nothing where it has none. */
export function writeComments(threads: OrgThread[]): string[] {
  if (!threads.length) return [];
  const out = [':COMMENTS:'];
  for (const t of threads) {
    t.notes.forEach((note, k) => {
      const last = k === t.notes.length - 1;
      const [first, ...rest] = noteLines(note.text, k ? '      ' : '    ', last, t.resolved);
      if (!k) out.push(`- ${noteHead(note, t.words)}${first}`);
      else out.push(`  - ${noteHead(note, undefined)}${first}`);
      out.push(...rest);
    });
  }
  out.push(':END:');
  return out;
}

/** The comments of an element from the lines of its drawer. */
export function readComments(lines: string[], element: string): OrgThread[] {
  const out: OrgThread[] = [];
  let note: OrgNote | null = null;
  const head = /^(\s*)-\s+\[(\S+)\s+("(?:\\.|[^"\\])*"|[^\]]*)\](.*)$/;
  for (const line of lines) {
    const m = head.exec(line);
    if (m) {
      let author = m[3].trim();
      if (author.startsWith('"'))
        try {
          author = JSON.parse(author);
        } catch {
          // As it is.
        }
      let rest = m[4];
      let words: string | null = null;
      const on = /^\s+on\s+("(?:\\.|[^"\\])*"):/.exec(rest);
      if (on) {
        try {
          words = JSON.parse(on[1]);
        } catch {
          words = on[1].slice(1, -1);
        }
        rest = rest.slice(on[0].length);
      }
      // A colon after the head where it is on no words is not part of what is said.
      if (!on && rest.startsWith(':')) rest = rest.slice(1);
      if (rest.startsWith(' ')) rest = rest.slice(1);
      if (rest.startsWith('\\')) rest = rest.slice(1);
      note = { author, date: m[2] === '-' ? '' : m[2], text: rest };
      if (!m[1] || !out.length) out.push({ element, words, resolved: false, notes: [note] });
      else out[out.length - 1].notes.push(note);
      continue;
    }
    if (!note) continue;
    const t = line.replace(/^\s+/, '');
    note.text += `\n${t.startsWith('\\') ? t.slice(1) : t}`;
  }
  for (const t of out) {
    const last = t.notes[t.notes.length - 1];
    if (last.text.endsWith(SETTLED) && !last.text.endsWith(`\\${SETTLED.trim()}`)) {
      last.text = last.text.slice(0, -SETTLED.length);
      t.resolved = true;
    } else if (last.text === SETTLED.trim()) {
      last.text = '';
      t.resolved = true;
    }
    for (const n of t.notes)
      if (n.text.endsWith('\\(settled)')) n.text = `${n.text.slice(0, -10)}(settled)`;
  }
  return out;
}
