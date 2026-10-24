/**
 * The text of an element as HTML, for showing it where it is not being
 * written, and for the clipboard. A paragraph is a `p`, with its kind and
 * what else is said of it as data attributes, as the editor draws one, its
 * lines parted by line breaks; where its stretch is numbered, each line that
 * shows a number has it before it, counted here as the editor counts them
 * (`lines.ts`). Items of a list that stand together are a list of `ul` or
 * `ol`, nested by their indent, so that other programs get lists; each item
 * holds its paragraph. A page or column break is a `div.pagebreak`.
 */

import { citationLabel, isMissing } from '$lib/editor/references.svelte';
import { figureWidth, foundAttrs, tableWidth } from '$lib/editor/schema';
import { isPictureName } from '$lib/figures/pictures.svelte';
import { languageName } from '$lib/i18n';
import { groupingOf, type BasedKind } from './families';
import { linesOf, stretches, stretchNumbers, type Shown } from './lines';
import type { Block, Inline, InlineLineMark, ParagraphBlock } from './text';

/** The notes met so far. */
type Notes = { n: number };

/** A line break, as an editor draws it: the style sheet puts a faint sign at the end of the line. */
const BREAK = '<span class="hard-break"><br></span>';

/** A hard space, ringed as the editor rings it. */
const HARD_SPACE_HTML = '<span class="hard-space">\u00a0</span>';

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlines(list: Inline[], notes: Notes): string {
  let out = '';
  for (const i of list) {
    switch (i.kind) {
      case 'text': {
        // A hard space is ringed as the editor rings it, for the marks of whitespace (`editor/hard-space.ts`).
        let html = escape(i.text).replace(/\u00a0/g, HARD_SPACE_HTML);
        if (i.marks.em) html = `<em>${html}</em>`;
        if (i.marks.strong) html = `<strong>${html}</strong>`;
        if (i.marks.smallcaps) html = `<span class="smallcaps">${html}</span>`;
        if (i.marks.sup) html = `<sup>${html}</sup>`;
        if (i.marks.sub) html = `<sub>${html}</sub>`;
        if (i.marks.strike) html = `<s>${html}</s>`;
        if (i.marks.underline) html = `<u>${html}</u>`;
        if (i.marks.code) html = `<code>${html}</code>`;
        // The language of a passage, inside any kind of words, as the editor has it: its name is told on hover.
        const lang = i.marks.lang;
        const tag = typeof lang === 'object' && typeof lang.tag === 'string' ? lang.tag.trim() : '';
        if (tag)
          html = `<span class="lang" lang="${escape(tag)}" title="${escape(languageName(tag))}">${html}</span>`;
        // A kind of words: a foreign word with its language, the title of a work, a term.
        const kind = i.marks.kind;
        if (typeof kind === 'object' && typeof kind.name === 'string' && kind.name) {
          const lang =
            typeof kind.lang === 'string' && kind.lang ? ` lang="${escape(kind.lang)}"` : '';
          html = `<span class="kind" data-kind="${escape(kind.name)}"${lang}>${html}</span>`;
        }
        if (i.marks.link) html = `<a>${html}</a>`;
        // A citation that was found, and is not yet tied to a reference.
        const found = foundAttrs(i.marks.found);
        if (found && !found.left)
          html = `<span class="found" data-by="${escape(found.by)}" data-found-id="${escape(found.id)}">${html}</span>`;
        out += html;
        break;
      }
      case 'break':
        out += BREAK;
        break;
      case 'citation':
        out += `<span class="citation${isMissing(i.items) ? ' missing' : ''}">${escape(citationLabel(i.items, i.mode, speaking))}</span>`;
        break;
      case 'math':
        // Shown as it was written until it is shown as mathematics: see `figures/hydrate.ts`.
        out += `<span class="math" data-math="${escape(i.tex)}">${escape(i.tex)}</span>`;
        break;
      case 'refmark':
        out += `<span class="refmark" data-refmark="${escape(i.label)}">${escape(i.label)}</span>`;
        break;
      case 'crossref':
        // What the words say is put in where they are shown: see `figures/hydrate.svelte.ts`.
        out += `<span class="crossref" data-crossref="${escape(i.target)}" data-form="${i.form}"></span>`;
        break;
      case 'footnote':
        notes.n++;
        // The number is counted by the page, from where the note stands.
        out += `<sup class="footnote"${i.place ? ` data-place="${i.place}"` : ''} title="${escape(plain(i.content))}"></sup>`;
        break;
    }
  }
  return out;
}

function plain(list: Inline[]): string {
  return list
    .map((i) =>
      i.kind === 'text'
        ? i.text
        : i.kind === 'citation'
          ? citationLabel(i.items, i.mode, speaking)
          : i.kind === 'math'
            ? i.tex
            : i.kind === 'linemark'
              ? ''
              : ' ',
    )
    .join('');
}

/** Where it stands and whether the text flows around it, where that is said of it. */
function placing(b: { align?: string; wrap?: boolean }): string {
  return (
    (b.align ? ` data-align="${b.align}"` : '') +
    (b.wrap === undefined ? '' : ` data-flow="${b.wrap ? 'around' : 'apart'}"`)
  );
}

/**
 * The attributes of a paragraph beyond its words, those that are the
 * defaults left out: its kind, its indent, and the settings of the stretch
 * it stands in.
 */
function paragraphAttrs(p: ParagraphBlock): string {
  return (
    (p.name !== 'text' ? ` data-kind="${escape(p.name)}"` : '') +
    (p.indent ? ` data-indent="${p.indent}" style="--indent: ${p.indent}"` : '') +
    (p.numbering ? ` data-numbering="${p.numbering}"` : '') +
    (p.every ? ` data-every="${p.every}"` : '') +
    (p.side ? ` data-side="${p.side}"` : '') +
    (p.only ? ` data-only="${escape(p.only)}"` : '') +
    (p.new ? ' data-new' : '')
  );
}

/** The number a line shows, as a sign before it: what it says, and whether it was given by hand. */
function numberHtml(shown: Shown | null | undefined): string {
  return shown?.printed
    ? `<span class="line-number" data-n="${escape(shown.label)}"${shown.set ? ' data-n-set' : ''}></span>`
    : '';
}

/**
 * A line mark, as the editor keeps one in its page: an empty span that
 * shows nothing and says what the mark says, so that the clipboard carries
 * it, and so that it stands as one thing in the line, as it does in the
 * text, for what counts the places of a line (the marks of a review).
 */
function lineMarkHtml(m: InlineLineMark | null): string {
  if (!m) return '';
  return (
    '<span class="linemark"' +
    (m.number ? ` data-number="${escape(m.number)}"` : '') +
    (m.counted === false ? ' data-uncounted' : '') +
    (m.hidden ? ' data-hidden' : '') +
    (m.shown ? ' data-shown' : '') +
    (m.margin ? ` data-margin="${escape(m.margin)}"` : '') +
    (m.indent ? ` data-indent="${m.indent}"` : '') +
    (m.continues ? ' data-continues' : '') +
    '></span>'
  );
}

/**
 * A paragraph: its lines, parted by line breaks, each with the number it
 * shows before it, where it shows one, and its line mark, which shows
 * nothing.
 */
function paragraphHtml(
  p: ParagraphBlock,
  shown: (Shown | null)[] | undefined,
  notes: Notes,
): string {
  const lines = linesOf(p.content)
    .map(
      (line, i) => numberHtml(shown?.[i]) + lineMarkHtml(line.mark) + inlines(line.content, notes),
    )
    .join(BREAK);
  return `<p${paragraphAttrs(p)}>${lines}</p>`;
}

/** What the lines of each numbered paragraph of a text show, by its index among the blocks. */
function numbersOf(list: Block[], own: readonly BasedKind[]): Map<number, (Shown | null)[]> {
  const out = new Map<number, (Shown | null)[]>();
  for (const s of stretches(list)) {
    const paragraphs = list.slice(s.from, s.to) as ParagraphBlock[];
    // The layout is not known here: every fifth, where the stretch does not say.
    stretchNumbers(paragraphs, s.numbering, s.every ?? 5, own, s.only).forEach((shown, i) =>
      out.set(s.from + i, shown),
    );
  }
  return out;
}

/** Whether a paragraph is an item of a list, by its kind. */
const listed = (b: Block | undefined, own: readonly BasedKind[]): b is ParagraphBlock =>
  b?.kind === 'paragraph' && groupingOf(b.name, own) === 'list';

/**
 * Items of a list that stand together, as nested lists of `ul` or `ol`, so
 * that other programs get lists: an item deeper than the one before it
 * begins a list within that item; a run of items of the other kind at one
 * depth is a list of its own. An item given a number keeps it.
 */
function listHtml(
  items: { item: ParagraphBlock; shown: (Shown | null)[] | undefined }[],
  notes: Notes,
): string {
  let at = 0;
  const level = (depth: number): string => {
    let out = '';
    while (at < items.length && items[at].item.indent >= depth) {
      const tag = items[at].item.name === 'numbered' ? 'ol' : 'ul';
      out += `<${tag}>`;
      while (at < items.length && items[at].item.indent >= depth) {
        const { item, shown } = items[at];
        if ((item.name === 'numbered' ? 'ol' : 'ul') !== tag && item.indent === depth) break;
        at++;
        const given = linesOf(item.content)[0]?.mark?.number ?? '';
        const value = /^\d+$/.test(given) ? ` value="${given}"` : '';
        out += `<li${value}>${paragraphHtml(item, shown, notes)}`;
        // What is deeper stands within this item.
        if (at < items.length && items[at].item.indent > depth) out += level(depth + 1);
        out += '</li>';
      }
      out += `</${tag}>`;
    }
    return out;
  };
  return level(Math.min(...items.map((i) => i.item.indent)));
}

function blocks(list: Block[], notes: Notes, own: readonly BasedKind[]): string {
  const numbers = numbersOf(list, own);
  let out = '';
  for (let at = 0; at < list.length; at++) {
    const b = list[at];
    switch (b.kind) {
      case 'paragraph': {
        if (listed(b, own)) {
          // The items that stand together, until one begins a new run.
          const items = [{ item: b, shown: numbers.get(at) }];
          while (listed(list[at + 1], own) && !(list[at + 1] as ParagraphBlock).new) {
            at++;
            items.push({ item: list[at] as ParagraphBlock, shown: numbers.get(at) });
          }
          out += listHtml(items, notes);
          break;
        }
        out += paragraphHtml(b, numbers.get(at), notes);
        break;
      }
      case 'break':
        out += `<div class="pagebreak" data-what="${b.what === 'column' ? 'column' : 'page'}"></div>`;
        break;
      case 'parallel':
        out +=
          `<div class="parallel"><div class="parallel-side">${blocks(b.left, notes, own)}</div>` +
          `<div class="parallel-side">${blocks(b.right, notes, own)}</div></div>`;
        break;
      case 'row':
        out += `<div class="row-of" data-row>${blocks(b.items, notes, own)}</div>`;
        break;
      case 'table': {
        const said = inlines(b.caption, notes);
        const width = tableWidth(b.width);
        out +=
          `<figure class="tabular${said ? '' : ' uncaptioned'}" data-table${placing(b)}${b.id ? ` data-id="${escape(b.id)}"` : ''}${b.numbered ? '' : ' data-unnumbered'}${width ? ` data-width="${width}" style="--table-width: ${width}%"` : ''}>` +
          `<figcaption>${said}</figcaption><table><tbody>` +
          b.rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => {
                    const tag = cell.header ? 'th' : 'td';
                    return (
                      `<${tag}${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''}${cell.align ? ` style="text-align: ${cell.align}"` : ''}>` +
                      `${blocks(cell.content, notes, own)}</${tag}>`
                    );
                  })
                  .join('')}</tr>`,
            )
            .join('') +
          `</tbody></table></figure>`;
        break;
      }
      case 'equation':
        out += `<div class="equation"${placing(b)}${b.id ? ` data-id="${escape(b.id)}"` : ''}${b.numbered ? ' data-numbered' : ''}><span class="equation-body math" data-math="${escape(b.tex)}" data-display>${escape(b.tex)}</span></div>`;
        break;
      case 'figure': {
        const said = inlines(b.caption, notes);
        const named = isPictureName(b.file, b.extension);
        out +=
          `<figure class="figure${said ? '' : ' uncaptioned'}"${placing(b)}${b.id ? ` data-id="${escape(b.id)}"` : ''}${b.numbered ? '' : ' data-unnumbered'}>` +
          `<div class="picture" style="width: ${figureWidth(b.width)}%" data-width="${figureWidth(b.width)}">` +
          (named
            ? `<img data-picture="${b.file}.${b.extension}" alt="${escape(b.alt)}" draggable="false">`
            : '') +
          `</div><figcaption>${said}</figcaption></figure>`;
        break;
      }
    }
  }
  return out;
}

/**
 * The language of the map whose text is being made, which the words of its
 * citations are in ("kap. 3"): set while `blocksHtml` makes it.
 */
let speaking: string | null | undefined;

/**
 * The text as HTML. `own` are the kinds of paragraph of the writer's own,
 * by which a kind of theirs is counted by a numbering or not.
 */
export function blocksHtml(
  list: Block[],
  language?: string | null,
  own: readonly BasedKind[] = [],
): string {
  speaking = language;
  try {
    return blocks(list, { n: 0 }, own);
  } finally {
    speaking = undefined;
  }
}

/** The beginning of a text, cut at a block boundary once it is long enough. */
export function excerpt(list: Block[], characters = 600): { blocks: Block[]; cut: boolean } {
  const out: Block[] = [];
  let count = 0;
  const size = (b: Block): number =>
    b.kind === 'paragraph'
      ? plain(b.content).length
      : b.kind === 'break'
        ? 0
        : b.kind === 'parallel'
          ? [...b.left, ...b.right].reduce((n, c) => n + size(c), 0)
          : b.kind === 'figure'
            ? // A picture takes the room of some lines.
              plain(b.caption).length + 240
            : b.kind === 'equation'
              ? 80
              : b.kind === 'row'
                ? b.items.reduce((n, c) => n + size(c), 0)
                : // A row takes the room of a line.
                  plain(b.caption).length + b.rows.length * 70;
  for (const b of list) {
    if (count >= characters) return { blocks: out, cut: true };
    const s = size(b);
    if (b.kind === 'paragraph' && count + s > characters * 1.5) {
      // A long paragraph is cut within, at the end of a word.
      const budget = Math.max(120, characters - count);
      const content: Inline[] = [];
      let used = 0;
      for (const i of b.content) {
        if (i.kind !== 'text') {
          content.push(i);
          continue;
        }
        if (used + i.text.length <= budget) {
          content.push(i);
          used += i.text.length;
        } else {
          const room = budget - used;
          const piece = i.text.slice(0, room);
          const space = piece.lastIndexOf(' ');
          content.push({ ...i, text: (space > room * 0.5 ? piece.slice(0, space) : piece) + '…' });
          break;
        }
      }
      out.push({ ...b, content });
      return { blocks: out, cut: true };
    }
    out.push(b);
    count += s;
  }
  return { blocks: out, cut: false };
}
