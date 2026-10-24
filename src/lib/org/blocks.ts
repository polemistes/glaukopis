/**
 * The text of an element as Org, and back (ADR 0041, "Lines and
 * paragraphs", "Kinds of paragraph", "Verse", "Numbered stretches",
 * "Formulas, figures, tables, rows, breaks").
 *
 * Paragraphs are written by how the document groups them: a run of lines
 * of verse as `#+BEGIN_VERSE`, with speakers and directions among them as
 * lines of their own (`@ Nurse`, `> She weeps.`); quoted paragraphs as
 * `#+BEGIN_QUOTE`; items as Org's lists; code as `#+BEGIN_SRC`; headwords
 * and glosses as a description list; a draft as `#+BEGIN_COMMENT`; a break
 * as `-----`; text bare; every other kind as a block named by it
 * (`#+BEGIN_epigraph`, a kind of the writer's own by the slug of its
 * name). A kind of the writer's own that is set as verse, as a quotation
 * or as code is written as one, its name on the settings line before it
 * (`:kind ships-log`). A paragraph that begins a new run closes its block
 * and opens another.
 *
 * What is said of a stretch stands on the line before it,
 * `#+ATTR_GLAUKOPIS: :numbering counted :every 5 :side right`; where the
 * stretch is more than one block, or a list, it is wrapped in
 * `#+BEGIN_numbered … #+END_numbered`. The language of a whole paragraph is
 * `:lang de` on the line before it, or before its block where every
 * paragraph of the block is in it; a paragraph's indent where it is not
 * the nesting of a list, `:indent 2`; a new run that closing the block does
 * not say, `:new t`.
 *
 * Texts side by side are `#+BEGIN_parallel` with `#+BEGIN_left` and
 * `#+BEGIN_right` in it; figures, formulas and tables side by side
 * `#+BEGIN_row`; a page or column break `#+BREAK: page`.
 */

import type {
  Block,
  BreakBlock,
  EquationBlock,
  FigureBlock,
  Inline,
  ParagraphBlock,
  Stand,
  TableBlock,
  TableCell,
} from '$lib/project/model/text';
import {
  groupingOf,
  KIND_FACTS,
  type BasedKind,
  type Numbering,
} from '$lib/project/model/families';
import { escapeCodeLine, isConstruct, isEscapedLine, slug, unescapeCodeLine } from './escape';
import { readGrid, writeGrid } from './grid';
import {
  RESERVED_NAMES,
  normalInlines,
  readContentLines,
  stableJson,
  writeContentLines,
  type InlineReading,
  type InlineWriting,
} from './inline';
import { bool, jsonOf, num, ownSlugs, readPlist, str, writePlist, type Value } from './properties';
import type { PassageKindRecord, RefRecord } from '$lib/project/model/types';

/** What writing and reading a text needs of the project it belongs to. */
export interface TextContext {
  writing: InlineWriting;
  reading: InlineReading;
  /** The kinds of the writer's own, for how the document groups them. */
  own: BasedKind[];
  /** The name the block of a kind of the writer's own is written by; nothing for one of the catalogue. */
  ownName: (id: string) => string | null;
  /** The id of a kind by the name its block was written by: of the catalogue, of the writer's own, or one made for it. */
  kindOf: (name: string) => string;
}

// ---- what is said of paragraphs ----

const SD = new Set(['speaker', 'direction']);
const isSD = (p: ParagraphBlock) => SD.has(p.name);

/** The settings of a paragraph's stretch, as one key; '' where it says nothing. */
function settingsKey(p: ParagraphBlock): string {
  const n = p.numbering && p.numbering !== 'none' ? p.numbering : '';
  return n || p.every || p.side || p.only
    ? `${n}|${p.every ?? ''}|${p.side ?? ''}|${p.only ?? ''}`
    : '';
}

/** The settings of a stretch as its settings line says them; the one kind counted by the name its block is written by. */
function settingsSaid(p: ParagraphBlock, ctx: TextContext): [string, Value | undefined][] {
  return [
    ['numbering', p.numbering && p.numbering !== 'none' ? p.numbering : undefined],
    ['every', p.every],
    ['side', p.side],
    ['only', p.only ? (ctx.ownName(p.only) ?? p.only) : undefined],
  ];
}

/** The language all the words of a paragraph are in, where they are all in one. */
function wholeLang(p: ParagraphBlock): string | null {
  let tag: string | null = null;
  let any = false;
  for (const i of p.content) {
    if (i.kind !== 'text') continue;
    any = true;
    const lang = i.marks.lang;
    const t = lang && typeof lang === 'object' ? String((lang as { tag?: unknown }).tag ?? '') : '';
    if (!t || (tag !== null && t !== tag)) return null;
    tag = t;
  }
  return any ? tag : null;
}

/** The content of a paragraph without the language of its words, which is said on its settings line. */
function withoutLang(content: Inline[]): Inline[] {
  return content.map((i) => {
    if (i.kind !== 'text' || !('lang' in i.marks)) return i;
    const marks = { ...i.marks };
    delete marks.lang;
    return { ...i, marks };
  });
}

/** Gives every run of words of a paragraph the language said of it, where they have none of their own. */
function withLang(content: Inline[], tag: string): Inline[] {
  return content.map((i) =>
    i.kind === 'text' && !i.marks.lang ? { ...i, marks: { ...i.marks, lang: { tag } } } : i,
  );
}

const attrLine = (said: [string, Value | null | undefined][]): string[] => {
  const text = writePlist(said);
  return text ? [`#+ATTR_GLAUKOPIS: ${text}`] : [];
};

/** A paragraph with only what is said of it written: the plain form `paragraph()` makes. */
function makeParagraph(
  content: Inline[],
  name: string,
  more: Partial<
    Pick<ParagraphBlock, 'indent' | 'numbering' | 'every' | 'side' | 'only' | 'new'>
  > = {},
): ParagraphBlock {
  return {
    kind: 'paragraph',
    name,
    indent: more.indent ?? 0,
    ...(more.numbering && more.numbering !== 'none' ? { numbering: more.numbering } : {}),
    ...(more.every ? { every: more.every } : {}),
    ...(more.side ? { side: more.side } : {}),
    ...(more.only ? { only: more.only } : {}),
    ...(more.new ? { new: true as const } : {}),
    content,
  };
}

/** Whether a paragraph holds anything: an empty one is not written, as Org has none, but for a break. */
const holds = (p: ParagraphBlock) => p.content.length > 0 || p.name === 'break';

// ---- writing ----

type Form = 'verse' | 'quote' | 'src' | 'comment' | 'generic';

type Unit =
  | { t: 'text'; p: ParagraphBlock }
  | { t: 'sd'; p: ParagraphBlock }
  | { t: 'break'; p: ParagraphBlock }
  | { t: 'list'; ps: ParagraphBlock[] }
  | { t: 'glossary'; ps: ParagraphBlock[] }
  | {
      t: 'block';
      form: Form;
      name: string;
      kindAttr: string | null;
      kind: string;
      ps: ParagraphBlock[];
      /** Whether its first paragraph begins a new run, said whatever the reader would take it for. */
      told?: boolean;
    };

/** How a paragraph of a kind is written, and the name of its block. */
function formOf(
  kind: string,
  ctx: TextContext,
):
  | { t: 'text' | 'sd' | 'break' | 'list' | 'glossary' }
  | { t: 'block'; form: Form; name: string; kindAttr: string | null } {
  if (kind === 'text') return { t: 'text' };
  if (SD.has(kind)) return { t: 'sd' };
  if (kind === 'break') return { t: 'break' };
  if (kind === 'item' || kind === 'numbered') return { t: 'list' };
  if (kind === 'headword' || kind === 'gloss') return { t: 'glossary' };
  if (kind === 'line') return { t: 'block', form: 'verse', name: 'VERSE', kindAttr: null };
  if (kind === 'quote') return { t: 'block', form: 'quote', name: 'QUOTE', kindAttr: null };
  if (kind === 'code') return { t: 'block', form: 'src', name: 'SRC', kindAttr: null };
  if (kind === 'draft') return { t: 'block', form: 'comment', name: 'COMMENT', kindAttr: null };
  if (KIND_FACTS[kind]) return { t: 'block', form: 'generic', name: kind, kindAttr: null };
  const own = ctx.ownName(kind) ?? kind;
  const grouping = groupingOf(kind, ctx.own);
  if (grouping === 'lines') return { t: 'block', form: 'verse', name: 'VERSE', kindAttr: own };
  if (grouping === 'quote') return { t: 'block', form: 'quote', name: 'QUOTE', kindAttr: own };
  if (grouping === 'code') return { t: 'block', form: 'src', name: 'SRC', kindAttr: own };
  return { t: 'block', form: 'generic', name: own, kindAttr: null };
}

/** Whether paragraphs of these two kinds go on in one block. */
function sameRun(a: string, b: string): boolean {
  if (a === b) return true;
  const list = new Set(['item', 'numbered']);
  const glossary = new Set(['headword', 'gloss']);
  return (list.has(a) && list.has(b)) || (glossary.has(a) && glossary.has(b));
}

/** The blocks a stretch of paragraphs is written in. */
function unitsOf(ps: ParagraphBlock[], ctx: TextContext): Unit[] {
  const out: Unit[] = [];
  let k = 0;
  while (k < ps.length) {
    // Speakers and directions go into the run that follows them, where it can hold them,
    // unless they come after a run of another kind that could: then they stand by themselves.
    let m = k;
    while (m < ps.length && isSD(ps[m])) m++;
    const head = ps[m];
    const form = head ? formOf(head.name, ctx) : null;
    const holdsSD = form?.t === 'block' && form.form !== 'src';
    const last = out[out.length - 1];
    const after = last?.t === 'block' && last.form !== 'src' && last.kind !== head?.name;
    if (m > k && (!holdsSD || after)) {
      for (let j = k; j < m; j++) out.push({ t: 'sd', p: ps[j] });
      k = m;
      continue;
    }
    if (!head || !form) break;
    let end = m + 1;
    if (form.t !== 'text' && form.t !== 'break') {
      while (end < ps.length) {
        let r = end;
        if (holdsSD) while (r < ps.length && isSD(ps[r])) r++;
        const next = ps[r];
        if (!next || next.new || !sameRun(head.name, next.name)) break;
        end = r + 1;
      }
    }
    const run = ps.slice(k, end);
    if (form.t === 'text' || form.t === 'break') out.push({ t: form.t, p: head });
    else if (form.t === 'list' || form.t === 'glossary') out.push({ t: form.t, ps: run });
    else if (form.t === 'block') out.push({ ...form, t: 'block', kind: head.name, ps: run });
    else out.push({ t: 'sd', p: head });
    k = end;
  }
  return out;
}

/** The lines of a paragraph's words, written as prose. */
const prose = (content: Inline[], ctx: TextContext) =>
  writeContentLines(content, 'prose', ctx.writing, ctx.reading);

function sdLines(p: ParagraphBlock, ctx: TextContext, langSaid: boolean): string[] {
  const sign = p.name === 'speaker' ? '@' : '>';
  const lines = prose(langSaid ? withoutLang(p.content) : p.content, ctx);
  return lines.map((l) => (l ? `${sign} ${l}` : sign));
}

/** What is said of one paragraph on the line before it: its language, its indent, a new run. */
function paragraphSaid(
  p: ParagraphBlock,
  opts: { lang: boolean; indent: boolean; isNew: boolean | null },
): [string, Value | undefined][] {
  return [
    ['lang', opts.lang ? (wholeLang(p) ?? undefined) : undefined],
    ['indent', opts.indent && p.indent ? p.indent : undefined],
    ['new', opts.isNew === null ? undefined : opts.isNew],
  ];
}

/** Where a block of a kind stands just after another of the same kind and settings, the reader takes it for a new run. */
interface Before {
  kind: string;
  settings: string;
}

/** The lines of the paragraphs within a block of prose: quotation, a kind's own block, a draft. */
function proseBlockLines(
  ps: ParagraphBlock[],
  ctx: TextContext,
  blockLang: string | null,
): string[] {
  const out: string[] = [];
  let firstReal = true;
  for (const p of ps) {
    if (!holds(p)) continue;
    // The first paragraph's new run is said of the block.
    const isNew = !isSD(p) && firstReal ? null : p.new ? true : null;
    if (!isSD(p)) firstReal = false;
    const said = attrLine(paragraphSaid(p, { lang: !blockLang, indent: true, isNew }));
    if (out.length) out.push('');
    out.push(...said);
    const content = blockLang || wholeLang(p) ? withoutLang(p.content) : p.content;
    out.push(...(isSD(p) ? sdLines(p, ctx, !!(blockLang || wholeLang(p))) : prose(content, ctx)));
  }
  return out;
}

/** The lines within a verse block: stanzas parted by a blank line, speakers and directions as lines of their own. */
function verseLines(ps: ParagraphBlock[], ctx: TextContext, blockLang: string | null): string[] {
  const out: string[] = [];
  let last: ParagraphBlock | null = null;
  let firstReal = true;
  for (const p of ps) {
    if (!holds(p)) continue;
    const isNew = !isSD(p) && firstReal ? null : p.new ? true : null;
    if (!isSD(p)) firstReal = false;
    const said = attrLine(paragraphSaid(p, { lang: !blockLang, indent: true, isNew }));
    // Two stanzas are parted by a blank line, and so are two speakers, or two directions, one after the other.
    if (last && (last.name === p.name || (!isSD(last) && !isSD(p)))) out.push('');
    out.push(...said);
    const content = blockLang || wholeLang(p) ? withoutLang(p.content) : p.content;
    if (isSD(p)) out.push(...sdLines(p, ctx, !!(blockLang || wholeLang(p))));
    else out.push(...writeContentLines(content, 'verse', ctx.writing, ctx.reading));
    last = p;
  }
  return out;
}

/** Code as Org's source block, where it is plain lines and nothing else; null where it is not. */
function srcLines(ps: ParagraphBlock[]): string[] | null {
  const out: string[] = [];
  for (const p of ps) {
    if (!holds(p)) continue;
    if (p.indent) return null;
    const content = normalInlines(p.content);
    if (content.length !== 1 || content[0].kind !== 'text') return null;
    const text = content[0].text;
    if (Object.keys(content[0].marks).length || /[\n\0]/.test(text)) return null;
    if (!text.trim() || text !== text.trimEnd()) return null;
    out.push(escapeCodeLine(text));
  }
  return out;
}

/** The lines of a list: `- ` and `1. ` nested by two spaces a step, a number given to a numbered item as `[@5]`. */
function listLines(ps: ParagraphBlock[], ctx: TextContext): string[] {
  const out: string[] = [];
  const counters: number[] = [];
  ps.forEach((p, k) => {
    if (!holds(p)) return;
    out.push(
      ...attrLine(
        paragraphSaid(p, {
          lang: true,
          indent: false,
          isNew: p.new && k === 0 ? true : p.new ? true : null,
        }),
      ),
    );
    const depth = p.indent;
    counters.length = depth + 1;
    let content = wholeLang(p) ? withoutLang(p.content) : p.content;
    let marker = '-';
    let cookie = '';
    if (p.name === 'numbered') {
      counters[depth] = (counters[depth] ?? 0) + 1;
      const first = normalInlines(content)[0];
      if (first?.kind === 'linemark' && first.number && /^\d+$/.test(first.number)) {
        cookie = `[@${first.number}] `;
        counters[depth] = Number(first.number);
        const rest: Inline = { ...first };
        delete (rest as { number?: string }).number;
        content = [rest, ...normalInlines(content).slice(1)];
      }
      marker = `${counters[depth]}.`;
    } else counters[depth] = 0;
    const lines = prose(content, ctx);
    const lead = '  '.repeat(depth);
    const hang = ' '.repeat(lead.length + marker.length + 1);
    lines.forEach((l, n) =>
      out.push(n ? `${hang}${l}` : `${lead}${marker} ${cookie}${l}`.trimEnd()),
    );
  });
  return out;
}

/** The lines of a description list: `- headword :: gloss`, further glosses indented under it. */
function glossaryLines(ps: ParagraphBlock[], ctx: TextContext): string[] {
  const out: string[] = [];
  const said = (p: ParagraphBlock) =>
    attrLine(paragraphSaid(p, { lang: true, indent: true, isNew: p.new ? true : null }));
  const words = (p: ParagraphBlock) =>
    prose(wholeLang(p) ? withoutLang(p.content) : p.content, ctx);
  let k = 0;
  while (k < ps.length) {
    const p = ps[k];
    if (!holds(p)) {
      k++;
      continue;
    }
    let head: string[] = [];
    let glosses: ParagraphBlock[];
    if (p.name === 'headword') {
      out.push(...said(p));
      head = words(p);
      k++;
      glosses = [];
    } else glosses = [];
    while (k < ps.length && ps[k].name === 'gloss') glosses.push(ps[k++]);
    glosses = glosses.filter(holds);
    // The first gloss goes on the headword's line, unless something is said of it.
    const first = glosses[0] && !said(glosses[0]).length ? glosses.shift()! : null;
    const gloss = first ? words(first) : [];
    const lines = [...head];
    if (!lines.length) lines.push('');
    const at = lines.length - 1;
    lines[at] = `${lines[at]}${lines[at] ? ' ' : ''}::${gloss.length ? ` ${gloss[0]}` : ''}`;
    lines.push(...gloss.slice(1));
    lines.forEach((l, n) => out.push(n ? `  ${l}` : `- ${l}`));
    for (const g of glosses) {
      out.push('');
      for (const l of [...said(g), ...words(g)]) out.push(`  ${l}`);
    }
  }
  return out;
}

const STAND: readonly string[] = ['left', 'center', 'right'];

function figureLines(f: FigureBlock, ctx: TextContext): string[] {
  const caption = f.caption.length ? prose(f.caption, ctx) : [];
  const file = `pictures/${f.file}${f.extension ? `.${f.extension}` : ''}`;
  return [
    ...caption.map((l) => `#+CAPTION: ${l}`.trimEnd()),
    ...(f.id ? [`#+NAME: fig:${f.id}`] : []),
    ...attrLine([
      ['width', f.width],
      ['align', f.align],
      ['wrap', f.wrap],
      ['alt', f.alt],
      ['file-name', f.name],
      ['numbered', f.numbered ? undefined : false],
    ]),
    `[[file:${file.replace(/[\\[\]]/g, (c) => `\\${c}`)}]]`,
  ];
}

function equationLines(e: EquationBlock): string[] {
  const tex = e.tex.trim();
  const multi = tex.includes('\n');
  const body = e.numbered
    ? multi
      ? ['\\begin{equation}', ...tex.split('\n'), '\\end{equation}']
      : [`\\begin{equation} ${tex} \\end{equation}`]
    : multi
      ? ['\\[', ...tex.split('\n'), '\\]']
      : [`\\[ ${tex} \\]`];
  return [...(e.id ? [`#+NAME: eq:${e.id}`] : []), ...attrLine([['align', e.align]]), ...body];
}

/** The cell of a simple table as one line; null where it would not be one. */
function simpleCell(cell: TableCell, ctx: TextContext): string | null {
  if (cell.colspan !== 1 || cell.rowspan !== 1) return null;
  const ps = cell.content.filter((b) => b.kind !== 'paragraph' || holds(b));
  if (!ps.length) return '';
  if (ps.length !== 1 || ps[0].kind !== 'paragraph') return null;
  const p = ps[0];
  if (p.name !== 'text' || p.indent || settingsKey(p) || p.new || wholeLang(p)) return null;
  if (p.content.some((i) => i.kind === 'break' || i.kind === 'linemark')) return null;
  const lines = prose(p.content, ctx);
  if (lines.length !== 1 || lines[0].includes('|') || lines[0] !== lines[0].trim()) return null;
  return lines[0];
}

/** Which cells are headings: whole rows at the top, and the first column below them; or each by its place. */
function headerModel(rows: TableCell[][]): {
  rows: number;
  column: boolean;
  cells: [number, number][] | null;
} {
  let h = 0;
  while (h < rows.length && rows[h].every((c) => c.header)) h++;
  const below = rows.slice(h);
  const column =
    below.length > 0 && below.every((r) => r[0]?.header && r.slice(1).every((c) => !c.header));
  const fits = rows.every((r, ri) =>
    r.every((c, ci) => c.header === (ri < h || (column && ci === 0))),
  );
  if (fits) return { rows: h, column, cells: null };
  const cells: [number, number][] = [];
  rows.forEach((r, ri) => r.forEach((c, ci) => c.header && cells.push([ri, ci])));
  return { rows: 0, column: false, cells };
}

function tableLines(t: TableBlock, ctx: TextContext): string[] {
  const caption = t.caption.length ? prose(t.caption, ctx) : [];
  const model = headerModel(t.rows);
  const aligns: [number, number, string][] = [];
  t.rows.forEach((r, ri) => r.forEach((c, ci) => c.align && aligns.push([ri, ci, c.align])));
  const head = [
    ...caption.map((l) => `#+CAPTION: ${l}`.trimEnd()),
    ...(t.id ? [`#+NAME: tab:${t.id}`] : []),
    ...attrLine([
      ['width', t.width || undefined],
      ['align', t.align],
      ['wrap', t.wrap],
      ['numbered', t.numbered ? undefined : false],
      ['header-columns', model.column ? 1 : undefined],
      ['headers', model.cells ? { json: model.cells } : undefined],
      ['aligns', aligns.length ? { json: aligns } : undefined],
    ]),
  ];
  const width = t.rows[0]?.length ?? 0;
  const simple = t.rows.every((r) => r.length === width)
    ? t.rows.map((r) => r.map((c) => simpleCell(c, ctx)))
    : null;
  if (simple && width && simple.every((r) => r.every((c) => c !== null))) {
    const cells = simple as string[][];
    const widths = Array.from({ length: width }, (_, i) =>
      Math.max(1, ...cells.map((r) => Array.from(r[i]).length)),
    );
    const pad = (s: string, w: number) => s + ' '.repeat(w - Array.from(s).length);
    const out = cells.map((r) => `| ${r.map((c, i) => pad(c, widths[i])).join(' | ')} |`);
    if (model.rows > 0)
      out.splice(model.rows, 0, `|${widths.map((w) => '-'.repeat(w + 2)).join('+')}|`);
    return [...head, ...out];
  }
  const grid = writeGrid(
    t.rows.map((r) =>
      r.map((c) => ({ lines: bodyLines(c.content, ctx), rowspan: c.rowspan, colspan: c.colspan })),
    ),
    model.rows,
  );
  return [...head, ...grid];
}

/** The lines of a run that is not prose, read back to see that it is the same; null where it is not. */
function checked(lines: string[], ps: ParagraphBlock[], ctx: TextContext): string[] | null {
  const plain = (q: ParagraphBlock[]) =>
    stableJson(
      q.filter(holds).map((p) => ({
        ...p,
        content: normalInlines(p.content),
        numbering: undefined,
        every: undefined,
        side: undefined,
        only: undefined,
        new: undefined,
      })),
    );
  const back = readBody(lines, ctx).filter((b): b is ParagraphBlock => b.kind === 'paragraph');
  return plain(back) === plain(ps) ? lines : null;
}

/** Paragraphs of the kinds given, each run of one kind in a block named by it: where a list will not read back. */
function genericLines(ps: ParagraphBlock[], ctx: TextContext): string[] {
  const out: string[] = [];
  let k = 0;
  while (k < ps.length) {
    let end = k + 1;
    while (end < ps.length && ps[end].name === ps[k].name && !ps[end].new) end++;
    const name = ps[k].name === 'numbered' ? 'numbered-item' : ps[k].name;
    const got = unitLines(
      {
        t: 'block',
        form: 'generic',
        name,
        kindAttr: null,
        kind: ps[k].name,
        ps: ps.slice(k, end),
        told: !!ps[k].new,
      },
      ctx,
      null,
      [],
    );
    if (out.length) out.push('');
    out.push(...got.lines);
    k = end;
  }
  return out;
}

/** The lines of one unit, and what it leaves for the next to be read after. */
function unitLines(
  u: Unit,
  ctx: TextContext,
  before: Before | null,
  outer: [string, Value | undefined][],
): { lines: string[]; after: Before | null } {
  switch (u.t) {
    case 'text': {
      const p = u.p;
      const lang = wholeLang(p);
      return {
        lines: [
          ...attrLine([
            ...outer,
            ...paragraphSaid(p, { lang: true, indent: true, isNew: p.new ? true : null }),
          ]),
          ...prose(lang ? withoutLang(p.content) : p.content, ctx),
        ],
        after: null,
      };
    }
    case 'sd':
      return {
        lines: [
          ...attrLine([
            ...outer,
            ...paragraphSaid(u.p, { lang: true, indent: true, isNew: u.p.new ? true : null }),
          ]),
          ...sdLines(u.p, ctx, !!wholeLang(u.p)),
        ],
        after: null,
      };
    case 'break': {
      const p = u.p;
      if (!p.content.length)
        return {
          lines: [
            ...attrLine([
              ...outer,
              ...paragraphSaid(p, { lang: false, indent: true, isNew: p.new ? true : null }),
            ]),
            '-----',
          ],
          after: null,
        };
      return unitLines(
        { t: 'block', form: 'generic', name: 'break', kindAttr: null, kind: 'break', ps: [p] },
        ctx,
        before,
        outer,
      );
    }
    case 'list':
    case 'glossary': {
      const lines = u.t === 'list' ? listLines(u.ps, ctx) : glossaryLines(u.ps, ctx);
      return {
        lines: [...attrLine(outer), ...(checked(lines, u.ps, ctx) ?? genericLines(u.ps, ctx))],
        after: null,
      };
    }
    case 'block': {
      const real = u.ps.filter((p) => !isSD(p) && holds(p));
      const first = real[0];
      const inferred = !!(
        first &&
        before &&
        before.kind === first.name &&
        before.settings === settingsKey(first)
      );
      const firstNew = first ? (!!first.new === inferred ? null : !!first.new) : null;
      const langs = u.ps.filter(holds).map(wholeLang);
      const blockLang = langs.length && langs.every((l) => l && l === langs[0]) ? langs[0] : null;
      const said = attrLine([
        ...outer,
        ['kind', u.kindAttr ?? undefined],
        ['lang', blockLang ?? undefined],
        ['new', u.told ?? firstNew ?? undefined],
      ]);
      let inner: string[];
      const name = u.name;
      if (u.form === 'verse') inner = verseLines(u.ps, ctx, blockLang);
      else if (u.form === 'src') {
        const src = srcLines(
          blockLang ? u.ps.map((p) => ({ ...p, content: withoutLang(p.content) })) : u.ps,
        );
        if (src) inner = src;
        else
          return unitLines(
            { ...u, form: 'generic', name: u.kindAttr ?? 'code', kindAttr: null },
            ctx,
            before,
            outer,
          );
      } else inner = proseBlockLines(u.ps, ctx, blockLang);
      const last = real[real.length - 1];
      return {
        lines: [...said, `#+BEGIN_${name}`, ...inner, `#+END_${name}`],
        after: last ? { kind: last.name, settings: settingsKey(last) } : null,
      };
    }
  }
}

/** The lines of a stretch: its blocks, with what is said of it before them, wrapped where it is more than one. */
function stretchLines(
  ps: ParagraphBlock[],
  ctx: TextContext,
  before: Before | null,
): { items: string[][]; after: Before | null } {
  const units = unitsOf(ps.filter(holds), ctx);
  const key = settingsKey(ps[0]);
  if (!units.length) return { items: [], after: before };
  if (!key) {
    const items: string[][] = [];
    let at = before;
    for (const u of units) {
      const got = unitLines(u, ctx, at, []);
      items.push(got.lines);
      at = got.after;
    }
    return { items, after: at };
  }
  const settings = settingsSaid(ps[0], ctx);
  if (units.length === 1 && units[0].t !== 'list' && units[0].t !== 'glossary') {
    const got = unitLines(units[0], ctx, before, settings);
    return { items: [got.lines], after: got.after };
  }
  const inner: string[] = [];
  let at: Before | null = null;
  for (const u of units) {
    const got = unitLines(u, ctx, at, []);
    if (inner.length) inner.push('');
    inner.push(...got.lines);
    at = got.after;
  }
  return {
    items: [[...attrLine(settings), '#+BEGIN_numbered', ...inner, '#+END_numbered']],
    after: null,
  };
}

/** The lines of a text: its blocks, parted by blank lines. */
export function bodyLines(blocks: readonly Block[], ctx: TextContext): string[] {
  const items: string[][] = [];
  let before: Before | null = null;
  let k = 0;
  while (k < blocks.length) {
    const b = blocks[k];
    if (b.kind === 'paragraph') {
      let end = k + 1;
      while (end < blocks.length) {
        const next = blocks[end];
        if (next.kind !== 'paragraph' || settingsKey(next) !== settingsKey(b)) break;
        end++;
      }
      const got = stretchLines(blocks.slice(k, end) as ParagraphBlock[], ctx, before);
      items.push(...got.items);
      before = got.after;
      k = end;
      continue;
    }
    before = null;
    k++;
    if (b.kind === 'break') items.push([`#+BREAK: ${b.what}`]);
    else if (b.kind === 'figure') items.push(figureLines(b, ctx));
    else if (b.kind === 'equation') items.push(equationLines(b));
    else if (b.kind === 'table') items.push(tableLines(b, ctx));
    else if (b.kind === 'row') items.push(['#+BEGIN_row', ...bodyLines(b.items, ctx), '#+END_row']);
    else if (b.kind === 'parallel')
      items.push([
        '#+BEGIN_parallel',
        '#+BEGIN_left',
        ...bodyLines(b.left, ctx),
        '#+END_left',
        '#+BEGIN_right',
        ...bodyLines(b.right, ctx),
        '#+END_right',
        '#+END_parallel',
      ]);
  }
  const out: string[] = [];
  for (const item of items) {
    if (!item.length) continue;
    if (out.length) out.push('');
    out.push(...item);
  }
  return out;
}

// ---- reading ----

/** What stands before a thing on its own lines: settings, a caption, a name. */
interface Pending {
  said: Map<string, unknown>;
  captions: string[];
  name: string | null;
}

const fresh = (): Pending => ({ said: new Map(), captions: [], name: null });

const NUMBERED: readonly Numbering[] = ['counted', 'given'];

/** Sets on a paragraph what the settings line before it says. */
function sayOn(
  p: ParagraphBlock,
  said: Map<string, unknown>,
  which: { stretch: boolean; lang: boolean; indent: boolean; isNew: boolean },
): ParagraphBlock {
  let out = p;
  if (which.stretch) {
    const n = str(said.get('numbering'));
    if (n !== undefined) {
      out = { ...out };
      delete out.numbering;
      if (NUMBERED.includes(n as Numbering)) out.numbering = n as Numbering;
    }
    const every = num(said.get('every'));
    if (every !== undefined && every > 0) out = { ...out, every: Math.round(every) };
    const side = str(said.get('side'));
    if (side === 'left' || side === 'right') out = { ...out, side };
    // By the name the kind's block is written by; made the kind's id when the whole text is read.
    const only = str(said.get('only'));
    if (only?.trim()) out = { ...out, only: only.trim() };
  }
  if (which.lang) {
    const lang = str(said.get('lang'));
    if (lang && lang !== 't') out = { ...out, content: withLang(out.content, lang) };
  }
  if (which.indent) {
    const indent = num(said.get('indent'));
    if (indent !== undefined)
      out = { ...out, indent: Math.max(0, Math.min(8, Math.round(indent))) };
  }
  if (which.isNew) {
    const isNew = bool(said.get('new'));
    if (isNew === true) out = { ...out, new: true };
    else if (isNew === false && out.new) {
      out = { ...out };
      delete out.new;
    }
  }
  // The keys of a paragraph in the order `paragraph()` gives them.
  return makeParagraph(out.content, out.name, out);
}

function sayOnAll(
  blocks: Block[],
  said: Map<string, unknown>,
  which: { stretch: boolean; lang: boolean; indent: boolean },
): Block[] {
  return blocks.map((b) =>
    b.kind === 'paragraph' ? sayOn(b, said, { ...which, isNew: false }) : b,
  );
}

/** The line where the block that begins at `from` ends, by its name, blocks of the same name within it counted; the end of the lines where it does not. */
function blockEnd(lines: string[], from: number, name: string): number {
  let depth = 0;
  const begin = new RegExp(`^#\\+begin_${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'i');
  const end = new RegExp(`^#\\+end_${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i');
  for (let i = from; i < lines.length; i++) {
    const t = lines[i].trim();
    if (begin.test(t)) depth++;
    else if (end.test(t)) {
      depth--;
      if (!depth) return i;
    }
  }
  return lines.length;
}

/** Text kept as it was, in a draft paragraph, so that nothing is lost: what Org has that has no place here. */
export function keptAsDraft(lines: string[]): ParagraphBlock {
  const content: Inline[] = [];
  lines.forEach((l, k) => {
    if (k) content.push({ kind: 'break' });
    if (l) content.push({ kind: 'text', text: l, marks: {} });
  });
  return makeParagraph(content, 'draft');
}

const ITEM = /^(\s*)([-+]|\*(?=\s)|\d+[.)])(\s+|$)(.*)$/;
const IMAGE = /\.(png|jpe?g|gif|svg|webp|tiff?|bmp|avif)$/i;

function standOf(v: unknown): Stand | undefined {
  return STAND.includes(v as string) ? (v as Stand) : undefined;
}

/** A figure from its line and what stands before it. */
function figureOf(path: string, p: Pending, ctx: TextContext): FigureBlock {
  const file = path.replace(/\\(.)/g, '$1').replace(/^pictures\//, '');
  const base = file.slice(file.lastIndexOf('/') + 1);
  const dot = base.lastIndexOf('.');
  const said = p.said;
  const width = num(said.get('width'));
  const align = standOf(said.get('align'));
  const wrap = bool(said.get('wrap'));
  return {
    kind: 'figure',
    id: p.name?.startsWith('fig:') ? p.name.slice(4) : '',
    ...(align ? { align } : {}),
    ...(wrap !== undefined ? { wrap } : {}),
    file: dot > 0 ? file.slice(0, file.length - (base.length - dot)) : file,
    extension: dot > 0 ? base.slice(dot + 1) : '',
    name: str(said.get('file-name')) ?? '',
    caption: captionOf(p, ctx),
    alt: str(said.get('alt')) ?? '',
    width: width !== undefined && width > 0 ? Math.min(100, Math.max(10, Math.round(width))) : 100,
    numbered: bool(said.get('numbered')) !== false,
  };
}

function captionOf(p: Pending, ctx: TextContext): Inline[] {
  if (!p.captions.length) return [];
  return readContentLines(p.captions, 'prose', ctx.reading).filter((i) => i.kind !== 'footnote');
}

/** A cell's content from its lines. */
function cellOf(lines: string[], ctx: TextContext): Block[] {
  return readBody(lines, ctx);
}

/** A table from its lines, an Org table or a grid table, and what stands before it; null where the lines are no table. */
function tableOf(lines: string[], grid: boolean, p: Pending, ctx: TextContext): TableBlock | null {
  let rows: TableCell[][] = [];
  if (grid) {
    const lead = /^ */.exec(lines[0])![0].length;
    const cells = readGrid(lines.map((l) => l.slice(Math.min(lead, /^ */.exec(l)![0].length))));
    if (!cells) return null;
    for (const c of cells)
      (rows[c.row] ??= []).push({
        content: cellOf(c.lines, ctx),
        colspan: c.colspan,
        rowspan: c.rowspan,
        header: c.header,
      });
    rows = rows.filter(Boolean);
  } else {
    let headerRows = 0;
    for (const line of lines) {
      const t = line.trim();
      if (/^\|-/.test(t)) {
        if (!headerRows && rows.length) headerRows = rows.length;
        continue;
      }
      const inner = t.replace(/^\|/, '').replace(/\|$/, '');
      rows.push(
        inner.split('|').map((raw) => {
          const words = raw.trim();
          const content = words ? readContentLines([words], 'prose', ctx.reading) : [];
          return {
            content: content.length ? [makeParagraph(content, 'text')] : [],
            colspan: 1,
            rowspan: 1,
            header: false,
          };
        }),
      );
    }
    rows.forEach((r, ri) => r.forEach((c) => (c.header = ri < headerRows)));
  }
  if (!rows.length) return null;
  const said = p.said;
  if (num(said.get('header-columns')) === 1)
    rows.forEach((r) => {
      if (r[0] && !r.every((c) => c.header)) r[0].header = true;
    });
  const headers = jsonOf(said.get('headers'));
  if (Array.isArray(headers)) {
    rows.forEach((r) => r.forEach((c) => (c.header = false)));
    for (const h of headers)
      if (Array.isArray(h) && rows[h[0]]?.[h[1]]) rows[h[0]][h[1]].header = true;
  }
  const aligns = jsonOf(said.get('aligns'));
  if (Array.isArray(aligns))
    for (const a of aligns) {
      const cell = Array.isArray(a) ? rows[a[0]]?.[a[1]] : undefined;
      const to = standOf(a?.[2]);
      if (cell && to) cell.align = to;
    }
  const width = num(said.get('width'));
  const align = standOf(said.get('align'));
  const wrap = bool(said.get('wrap'));
  return {
    kind: 'table',
    id: p.name?.startsWith('tab:') ? p.name.slice(4) : '',
    caption: captionOf(p, ctx),
    rows: rows.map((r) =>
      r.map((c) => ({
        content: c.content,
        colspan: c.colspan,
        rowspan: c.rowspan,
        header: c.header,
        ...(c.align ? { align: c.align } : {}),
      })),
    ),
    numbered: bool(said.get('numbered')) !== false,
    ...(align ? { align } : {}),
    ...(wrap !== undefined ? { wrap } : {}),
    width: width !== undefined && width > 0 ? Math.min(100, Math.max(10, Math.round(width))) : 0,
  };
}

/** A speaker or a direction from its lines, the sign at the start of each taken off. */
function sdOf(lines: string[], ctx: TextContext): ParagraphBlock {
  const sign = lines[0].trim()[0];
  const words = lines.map((l) => l.trim().slice(1).replace(/^ /, ''));
  return makeParagraph(
    readContentLines(words, 'prose', ctx.reading),
    sign === '@' ? 'speaker' : 'direction',
  );
}

/** How many lines from `i` make one speaker or direction: the next goes on it where this one ends with a line break and the next begins with the same sign. */
function sdLength(lines: string[], i: number): number {
  const sign = lines[i].trim()[0];
  let n = 1;
  while (i + n < lines.length) {
    const prev = lines[i + n - 1].trim();
    const next = lines[i + n].trim();
    const run = /\\+$/.exec(prev)?.[0].length ?? 0;
    const broken = run >= 2 && run % 2 === 0;
    if (!broken || next[0] !== sign || !/^[@>](\s|$)/.test(next)) break;
    n++;
  }
  return n;
}

/** The paragraphs of a verse block: stanzas parted by blank lines, speakers and directions on lines of their own. */
function verseOf(lines: string[], kind: string, ctx: TextContext): ParagraphBlock[] {
  const out: ParagraphBlock[] = [];
  let stanza: string[] = [];
  let said: Map<string, unknown> | null = null;
  const close = () => {
    if (stanza.length) {
      let p = makeParagraph(readContentLines(stanza, 'verse', ctx.reading), kind);
      if (said) p = sayOn(p, said, { stretch: true, lang: true, indent: true, isNew: true });
      if (p.content.length) out.push(p);
    }
    stanza = [];
    said = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      close();
      continue;
    }
    if (!isEscapedLine(t) && /^#\+attr_glaukopis:/i.test(t)) {
      close();
      said = readPlist(t.replace(/^#\+attr_glaukopis:/i, ''));
      continue;
    }
    if (!isEscapedLine(t) && /^[@>](\s|$)/.test(t)) {
      close();
      const n = sdLength(lines, i);
      let p = sdOf(lines.slice(i, i + n), ctx);
      if (said) p = sayOn(p, said, { stretch: true, lang: true, indent: true, isNew: true });
      said = null;
      if (p.content.length) out.push(p);
      i += n - 1;
      continue;
    }
    if (!isEscapedLine(t) && /^#\+\S*:/.test(t)) continue;
    stanza.push(line);
  }
  close();
  return out;
}

/** The items of a list, from `from`; and where the list ends. */
function listOf(
  lines: string[],
  from: number,
  ctx: TextContext,
): { blocks: ParagraphBlock[]; end: number } {
  const out: ParagraphBlock[] = [];
  let i = from;
  let said: Map<string, unknown> | null = null;
  let saidAt = -1;
  let blanks = 0;
  /** Where the list ends: before a settings line that was not for an item, and before blank lines. */
  let end = from;
  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();
    if (!t) {
      blanks++;
      if (blanks > 1) break;
      i++;
      continue;
    }
    if (/^#\+attr_glaukopis:/i.test(t)) {
      said = readPlist(t.replace(/^#\+attr_glaukopis:/i, ''));
      saidAt = i;
      i++;
      continue;
    }
    const m = ITEM.exec(line);
    if (!m || isEscapedLine(t)) break;
    blanks = 0;
    const col = m[1].length;
    const marker = m[2];
    // The item's first paragraph: its line, and the lines under it indented further.
    const first = [m[4]];
    let j = i + 1;
    while (j < lines.length) {
      const l = lines[j];
      if (!l.trim() || ITEM.test(l) || /^\s*#\+/.test(l)) break;
      if (/^ */.exec(l)![0].length <= col) break;
      first.push(l.trim());
      j++;
    }
    // Further paragraphs: after a blank line, indented under the item.
    const more: { lines: string[]; said: Map<string, unknown> | null }[] = [];
    while (j < lines.length && !lines[j].trim()) {
      let n = j;
      while (n < lines.length && !lines[n].trim()) n++;
      const l = lines[n];
      if (
        n >= lines.length ||
        /^ */.exec(l)![0].length <= col ||
        (ITEM.test(l) && !isEscapedLine(l.trim()))
      )
        break;
      let k = n;
      let saidHere: Map<string, unknown> | null = null;
      if (/^\s*#\+attr_glaukopis:/i.test(l)) {
        saidHere = readPlist(l.trim().replace(/^#\+attr_glaukopis:/i, ''));
        k++;
      }
      const para: string[] = [];
      while (
        k < lines.length &&
        lines[k].trim() &&
        /^ */.exec(lines[k])![0].length > col &&
        !ITEM.test(lines[k])
      ) {
        para.push(lines[k].trim());
        k++;
      }
      more.push({ lines: para, said: saidHere });
      j = k;
    }
    const numbered = /^\d/.test(marker);
    // A description: `headword :: gloss`.
    let cut = -1;
    let sep: RegExpExecArray | null = null;
    for (let k = 0; k < first.length && cut < 0; k++) {
      sep = /(^|\s)::(\s|$)/.exec(first[k]);
      if (sep) cut = k;
    }
    const apply = (p: ParagraphBlock, s: Map<string, unknown> | null, indent: boolean) =>
      s ? sayOn(p, s, { stretch: true, lang: true, indent, isNew: true }) : p;
    if (cut >= 0 && sep) {
      const line0 = first[cut];
      const head = [...first.slice(0, cut), line0.slice(0, sep.index)];
      const rest = line0.slice(sep.index + sep[0].length);
      const gloss = [...(rest || cut < first.length - 1 ? [rest] : []), ...first.slice(cut + 1)];
      const hw = readContentLines(
        head.filter((l, k) => l || k < head.length - 1),
        'prose',
        ctx.reading,
      );
      if (hw.length) out.push(apply(makeParagraph(hw, 'headword'), said, true));
      const g = gloss.length ? readContentLines(gloss, 'prose', ctx.reading) : [];
      if (g.length) out.push(makeParagraph(g, 'gloss'));
      for (const m2 of more) {
        const c = readContentLines(m2.lines, 'prose', ctx.reading);
        if (c.length) out.push(apply(makeParagraph(c, 'gloss'), m2.said, true));
      }
    } else {
      let cookie: string | null = null;
      if (numbered) {
        const c = /^\[@(\d+)\]\s*/.exec(first[0]);
        if (c) {
          cookie = c[1];
          first[0] = first[0].slice(c[0].length);
        }
      }
      let content = readContentLines(first, 'prose', ctx.reading);
      if (cookie) {
        const mark = content[0]?.kind === 'linemark' ? content[0] : null;
        content = normalInlines([
          { ...(mark ?? { kind: 'linemark' }), number: cookie },
          ...(mark ? content.slice(1) : content),
        ]);
      }
      const kind = numbered ? 'numbered' : 'item';
      const p = makeParagraph(content, kind, { indent: Math.min(8, Math.floor(col / 2)) });
      out.push(apply(p, said, false));
      for (const m2 of more) {
        const c = readContentLines(m2.lines, 'prose', ctx.reading);
        if (c.length) out.push(apply(makeParagraph(c, kind, { indent: p.indent }), m2.said, false));
      }
    }
    said = null;
    i = j;
    end = j;
  }
  return { blocks: out.filter((p) => p.content.length), end: said ? saidAt : end };
}

/** Reads the blocks of a text from its lines: tolerant, never failing on what it holds. */
export function readBody(lines: readonly string[], ctx: TextContext): Block[] {
  const out: Block[] = [];
  let pending = fresh();
  let before: Before | null = null;
  const all = lines.map((l) => l.replace(/\r$/, ''));
  let i = 0;
  const push = (blocks: Block[], after: Before | null = null) => {
    out.push(...blocks);
    pending = fresh();
    before = after;
  };
  /** Paragraphs of a block of prose, of a kind: what is not of another kind becomes of this one. */
  const ofKind = (inner: string[], kind: string): Block[] =>
    readBody(inner, ctx).map((b) =>
      b.kind === 'paragraph' && b.name === 'text' ? { ...b, name: kind } : b,
    );
  /** What a block of paragraphs says of them, and whether its first is a new run. */
  const settle = (blocks: Block[], said: Map<string, unknown>): Block[] => {
    let got = sayOnAll(blocks, said, { stretch: true, lang: true, indent: said.has('indent') });
    const firstAt = got.findIndex((b) => b.kind === 'paragraph' && !isSD(b));
    const first = got[firstAt] as ParagraphBlock | undefined;
    if (first) {
      const inferred = !!(
        before &&
        before.kind === first.name &&
        before.settings === settingsKey(first)
      );
      const told = bool(said.get('new'));
      let p = first;
      if (inferred && told === undefined && !first.new) p = { ...first, new: true };
      if (told !== undefined)
        p = sayOn(first, new Map([['new', told]]), {
          stretch: false,
          lang: false,
          indent: false,
          isNew: true,
        });
      got = got.map((b, k) => (k === firstAt ? makeParagraph(p.content, p.name, p) : b));
    }
    return got;
  };
  const lastOf = (blocks: Block[]): Before | null => {
    const real = blocks.filter((b): b is ParagraphBlock => b.kind === 'paragraph' && !isSD(b));
    const last = real[real.length - 1];
    return last ? { kind: last.name, settings: settingsKey(last) } : null;
  };

  while (i < all.length) {
    const line = all[i];
    const t = line.trim();
    if (!t) {
      i++;
      continue;
    }
    const escaped = isEscapedLine(t);
    const construct = !escaped && isConstruct(t);

    if (construct && t.startsWith('#')) {
      const begin = /^#\+begin_(\S+)(?:\s+(.*))?$/i.exec(t);
      if (begin) {
        const name = begin[1];
        const lower = name.toLowerCase();
        const end = blockEnd(all, i, name);
        const inner = all.slice(i + 1, end);
        const said = pending.said;
        const kindAttr = str(said.get('kind'));
        i = end + 1;
        if (lower === 'verse') {
          const kind = kindAttr ? ctx.kindOf(kindAttr) : 'line';
          const got = settle(verseOf(inner, kind, ctx), said);
          push(got, lastOf(got));
        } else if (lower === 'quote' || lower === 'center') {
          const kind = kindAttr ? ctx.kindOf(kindAttr) : lower === 'quote' ? 'quote' : 'text';
          const got = settle(ofKind(inner, kind), said);
          push(got, lastOf(got));
        } else if (lower === 'src' || lower === 'example') {
          const kind = kindAttr ? ctx.kindOf(kindAttr) : 'code';
          const got = settle(
            inner
              .map(unescapeCodeLine)
              .filter((l) => l !== '')
              .map((l) => makeParagraph([{ kind: 'text', text: l, marks: {} }], kind)),
            said,
          );
          push(got, lastOf(got));
        } else if (lower === 'comment') {
          const got = settle(ofKind(inner, 'draft'), said);
          push(got, lastOf(got));
        } else if (lower === 'export') {
          push([keptAsDraft([t, ...inner, `#+END_${name}`])]);
        } else if (lower === 'numbered') {
          push(sayOnAll(readBody(inner, ctx), said, { stretch: true, lang: false, indent: false }));
        } else if (lower === 'row') {
          const items = readBody(inner, ctx);
          push(items.length ? [{ kind: 'row', items }] : []);
        } else if (lower === 'parallel') {
          const sides: Block[][] = [[], []];
          for (let k = 0; k < inner.length; k++) {
            const side = /^#\+begin_(left|right)\s*$/i.exec(inner[k].trim());
            if (!side) continue;
            const e = blockEnd(inner, k, side[1]);
            sides[side[1].toLowerCase() === 'left' ? 0 : 1] = readBody(inner.slice(k + 1, e), ctx);
            k = e;
          }
          push([{ kind: 'parallel', left: sides[0], right: sides[1] }]);
        } else if (lower === 'left' || lower === 'right') {
          push(readBody(inner, ctx));
        } else {
          const kind = ctx.kindOf(lower === 'numbered-item' ? 'numbered' : name);
          const got = settle(ofKind(inner, kind), said);
          push(got, lastOf(got));
        }
        continue;
      }
      const kw = /^#\+([^:\s]+):\s?(.*)$/.exec(t);
      if (kw) {
        const key = kw[1].toLowerCase();
        const value = kw[2];
        if (key === 'attr_glaukopis') for (const [k, v] of readPlist(value)) pending.said.set(k, v);
        else if (key === 'caption') pending.captions.push(value);
        else if (key === 'name') pending.name = value.trim();
        else if (key === 'break') {
          const what = value.trim().toLowerCase() === 'column' ? 'column' : 'page';
          push([{ kind: 'break', what } satisfies BreakBlock]);
        }
        i++;
        continue;
      }
      if (/^#(\s|$)/.test(t)) {
        // Org's comment lines, kept.
        const kept: string[] = [];
        while (i < all.length && /^#(\s|$)/.test(all[i].trim())) kept.push(all[i++].trim());
        push([keptAsDraft(kept)]);
        continue;
      }
      i++;
      continue;
    }

    if (construct && /^-{5,}\s*$/.test(t)) {
      const p = sayOn(makeParagraph([], 'break'), pending.said, {
        stretch: true,
        lang: false,
        indent: true,
        isNew: true,
      });
      push([p]);
      i++;
      continue;
    }

    if (construct && (ITEM.test(line) || /^\*+\s/.test(t))) {
      const got = listOf(all, i, ctx);
      if (got.end > i) {
        if (got.blocks.length && pending.said.size)
          got.blocks[0] = sayOn(got.blocks[0], pending.said, {
            stretch: true,
            lang: true,
            indent: false,
            isNew: true,
          });
        push(got.blocks);
        i = got.end;
        continue;
      }
    }

    if (construct && /^[@>](\s|$)/.test(t)) {
      const n = sdLength(all, i);
      const p = sayOn(sdOf(all.slice(i, i + n), ctx), pending.said, {
        stretch: true,
        lang: true,
        indent: true,
        isNew: true,
      });
      push(p.content.length ? [p] : []);
      i += n;
      continue;
    }

    if (construct && t.startsWith('|')) {
      const rows: string[] = [];
      while (i < all.length && all[i].trim().startsWith('|')) rows.push(all[i++]);
      const table = tableOf(rows, false, pending, ctx);
      push(table ? [table] : []);
      continue;
    }

    if (construct && /^\+[-=]/.test(t)) {
      let j = i;
      while (j < all.length && /^[+|]/.test(all[j].trim())) j++;
      const table = tableOf(all.slice(i, j), true, pending, ctx);
      if (table) {
        push([table]);
        i = j;
        continue;
      }
    }

    if (construct && t.startsWith(':')) {
      const drawer = /^:([\w-]+):\s*$/.exec(t);
      const end = drawer ? all.findIndex((l, k) => k > i && /^\s*:END:\s*$/i.test(l)) : -1;
      if (drawer && end > 0) {
        push([keptAsDraft(all.slice(i, end + 1).map((l) => l.trim()))]);
        i = end + 1;
        continue;
      }
      if (/^:(\s|$)/.test(t)) {
        // Org's lines of fixed width: code, as they are.
        const kept: Block[] = [];
        while (i < all.length && /^:(\s|$)/.test(all[i].trim())) {
          const text = all[i++].trim().replace(/^: ?/, '');
          if (text) kept.push(makeParagraph([{ kind: 'text', text, marks: {} }], 'code'));
        }
        push(kept);
        continue;
      }
    }

    if (construct && /^\\begin\{equation\*?\}/.test(t)) {
      const numbered = !/^\\begin\{equation\*\}/.test(t);
      let j = i;
      while (j < all.length && !/\\end\{equation\*?\}/.test(all[j])) j++;
      const text = all
        .slice(i, Math.min(j + 1, all.length))
        .join('\n')
        .replace(/^\s*\\begin\{equation\*?\}/, '')
        .replace(/\\end\{equation\*?\}\s*$/, '');
      const said = pending.said;
      const align = standOf(said.get('align'));
      const id = pending.name?.startsWith('eq:') ? pending.name.slice(3) : '';
      const tex = text.trim();
      push(
        tex
          ? [
              {
                kind: 'equation',
                id,
                tex,
                numbered,
                ...(align ? { align } : {}),
              } satisfies EquationBlock,
            ]
          : [],
      );
      i = j + 1;
      continue;
    }

    if (construct && /^\\\[(\s|$)/.test(t)) {
      let j = i;
      while (j < all.length && !/\\\]\s*$/.test(j === i ? all[j].trim().slice(2) : all[j])) j++;
      const text = all
        .slice(i, Math.min(j + 1, all.length))
        .join('\n')
        .replace(/^\s*\\\[/, '')
        .replace(/\\\]\s*$/, '');
      const said = pending.said;
      const align = standOf(said.get('align'));
      const id = pending.name?.startsWith('eq:') ? pending.name.slice(3) : '';
      const tex = text.trim();
      push(
        tex
          ? [
              {
                kind: 'equation',
                id,
                tex,
                numbered: false,
                ...(align ? { align } : {}),
              } satisfies EquationBlock,
            ]
          : [],
      );
      i = j + 1;
      continue;
    }

    // A figure: a picture's link alone, with something said before it, or a picture by its name.
    const pic = /^\[\[file:((?:\\.|[^\]\\])+)\]\]$/.exec(t);
    const alone = i + 1 >= all.length || !all[i + 1].trim();
    if (
      pic &&
      alone &&
      (pending.captions.length ||
        pending.name?.startsWith('fig:') ||
        pending.said.has('width') ||
        IMAGE.test(pic[1]))
    ) {
      push([figureOf(pic[1], pending, ctx)]);
      i++;
      continue;
    }

    // A paragraph: its lines up to a blank line or a line that is something else.
    const para = [line];
    let j = i + 1;
    while (j < all.length) {
      const n = all[j].trim();
      if (!n || isConstruct(n)) break;
      para.push(all[j]);
      j++;
    }
    const content = readContentLines(para, 'prose', ctx.reading);
    const p = sayOn(makeParagraph(content, 'text'), pending.said, {
      stretch: true,
      lang: true,
      indent: true,
      isNew: true,
    });
    push(p.content.length ? [p] : []);
    i = j;
  }
  // The one kind a stretch counts, by its id, from the name it was written by.
  return out.map((b) =>
    b.kind === 'paragraph' && b.only
      ? makeParagraph(b.content, b.name, { ...b, only: ctx.kindOf(b.only) })
      : b,
  );
}

// ---- what a text is written and read with ----

/** The names that are signs of their own as blocks, and may not be the name of a kind of the writer's own. */
const BLOCK_NAMES = new Set([
  'verse',
  'quote',
  'src',
  'comment',
  'example',
  'center',
  'export',
  'numbered',
  'numbered-item',
  'row',
  'parallel',
  'left',
  'right',
]);

/** Whether a name is taken by the catalogue, by Org or by our own signs. */
export const takenName = (name: string): boolean =>
  !!KIND_FACTS[name] || BLOCK_NAMES.has(name) || RESERVED_NAMES.has(name);

/** What a cross-reference may point to in these blocks: their figures, tables and equations. */
export function targetsOf(
  blocks: readonly Block[],
  into = new Map<string, 'fig' | 'tab' | 'eq'>(),
) {
  for (const b of blocks) {
    if (b.kind === 'figure' && b.id) into.set(b.id, 'fig');
    else if (b.kind === 'table') {
      if (b.id) into.set(b.id, 'tab');
      for (const row of b.rows) for (const cell of row) targetsOf(cell.content, into);
    } else if (b.kind === 'equation' && b.id) into.set(b.id, 'eq');
    else if (b.kind === 'row') targetsOf(b.items, into);
    else if (b.kind === 'parallel') {
      targetsOf(b.left, into);
      targetsOf(b.right, into);
    }
  }
  return into;
}

/** What a text is written and read with, from what the project says. */
export function textContext(opts: {
  paragraphKinds: PassageKindRecord[];
  /** The names the blocks of the writer's own kinds are written by; made from their names where not given. */
  slugs?: Map<string, string>;
  references: RefRecord[];
  targets: Map<string, 'fig' | 'tab' | 'eq'>;
  /** Makes a kind of the writer's own of a name no kind has, and gives its id; without it, the name is the id. */
  make?: (name: string, words: boolean) => string;
  /** Told of words that would not read back the same, as `InlineWriting.unsure` is. */
  unsure?: (text: string) => void;
}): TextContext {
  const kinds = opts.paragraphKinds;
  const slugs = opts.slugs ?? ownSlugs(kinds, takenName);
  const bySlug = new Map([...slugs].map(([id, s]) => [s, id]));
  const keys = new Map(opts.references.map((r) => [r.id, r.key]));
  const ids = new Map(opts.references.map((r) => [r.key, r.id]));
  const kindOf = (name: string, words: boolean) => {
    const lower = name.toLowerCase();
    if (KIND_FACTS[lower]) return lower;
    const own = bySlug.get(name) ?? bySlug.get(lower);
    if (own) return own;
    if (kinds.some((k) => k.id === name)) return name;
    if (!opts.make) return name;
    const made = opts.make(name, words);
    bySlug.set(name, made);
    return made;
  };
  return {
    writing: {
      kindName: (id) => (KIND_FACTS[id] ? id : (slugs.get(id) ?? id)),
      citeKey: (id) => keys.get(id) || id,
      refPrefix: (target) => opts.targets.get(target) ?? 'id',
      unsure: opts.unsure,
    },
    reading: {
      kindOf: (name) => kindOf(name, true),
      citeId: (key) => ids.get(key) ?? key,
    },
    own: kinds.map((k) => ({ id: k.id, basedOn: k.basedOn })),
    ownName: (id) => (KIND_FACTS[id] ? null : (slugs.get(id) ?? slug(id))),
    kindOf: (name) => kindOf(name, false),
  };
}
