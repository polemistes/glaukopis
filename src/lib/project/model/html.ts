/**
 * The text of an element as HTML, for showing it where it is not being
 * written, and for the clipboard. A paragraph is a `p`, with its kind and
 * what else is said of it as data attributes, as the editor draws one; a
 * passage a `div.passage` naming its family, its numbers counted here as
 * the editor counts them (`lines.ts`). A passage of a list is a list of
 * `ul` or `ol`, nested by the indent of its items, so that other programs
 * get lists; each item holds its paragraph.
 */

import { citationLabel, isMissing } from '$lib/editor/references.svelte';
import { figureWidth, foundAttrs, tableWidth } from '$lib/editor/schema';
import { isPictureName } from '$lib/figures/pictures.svelte';
import { languageName } from '$lib/i18n';
import { countedKind, type BasedKind } from './families';
import { lineNumbers, type Shown } from './lines';
import type { Block, Inline, ParagraphBlock, PassageBlock } from './text';

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlines(list: Inline[], notes: { n: number }): string {
  let out = '';
  for (const i of list) {
    switch (i.kind) {
      case 'text': {
        let html = escape(i.text);
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
        // As an editor draws it: the style sheet puts a faint sign at the end of the line.
        out += '<span class="hard-break"><br></span>';
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

/** The attributes of a paragraph beyond its words, those that are the defaults left out; and its number, where it shows one. */
function paragraphAttrs(p: ParagraphBlock, shown: Shown | null): string {
  return (
    (p.name !== 'text' ? ` data-kind="${escape(p.name)}"` : '') +
    (p.indent ? ` data-indent="${p.indent}" style="--indent: ${p.indent}"` : '') +
    (p.number ? ` data-number="${escape(p.number)}"` : '') +
    (p.counted === false ? ' data-uncounted' : '') +
    (p.margin ? ` data-margin="${escape(p.margin)}"` : '') +
    (shown ? ` data-n="${escape(shown.label)}"${shown.set ? ' data-n-set' : ''}` : '')
  );
}

/** The numbers the paragraphs of a passage show, by the rule the editor and the documents follow. */
export function passageNumbers(p: PassageBlock, own: readonly BasedKind[]): (Shown | null)[] {
  return lineNumbers(
    p.numbering,
    p.every ?? 5,
    p.content.map((line) => ({
      counted: countedKind(line.name, own) && line.counted !== false,
      number: line.number,
    })),
  );
}

/** The attributes of a passage beyond its family, those that are the defaults left out. */
function passageAttrs(p: PassageBlock): string {
  return (
    ` data-family="${escape(p.family)}"` +
    (p.numbering !== 'none' ? ` data-numbering="${p.numbering}"` : '') +
    (p.every ? ` data-every="${p.every}"` : '') +
    (p.side ? ` data-side="${p.side}"` : '')
  );
}

/**
 * A passage of a list, in its `div.passage`, as nested lists: an item
 * deeper than the one before it begins a list within that item; a run of
 * items of the other kind at one depth is a list of its own. An item given
 * a number keeps it.
 */
function listHtml(p: PassageBlock, notes: { n: number }, own: readonly BasedKind[]): string {
  const numbers = passageNumbers(p, own);
  const items = p.content.map((item, i) => ({ item, shown: numbers[i] }));
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
        const value = /^\d+$/.test(item.number ?? '') ? ` value="${item.number}"` : '';
        out += `<li${value}><p${paragraphAttrs(item, shown)}>${inlines(item.content, notes)}</p>`;
        // What is deeper stands within this item.
        if (at < items.length && items[at].item.indent > depth) out += level(depth + 1);
        out += '</li>';
      }
      out += `</${tag}>`;
    }
    return out;
  };
  return `<div class="passage"${passageAttrs(p)}>${level(Math.min(...items.map((i) => i.item.indent)))}</div>`;
}

function blocks(list: Block[], notes: { n: number }, own: readonly BasedKind[]): string {
  let out = '';
  for (const b of list) {
    switch (b.kind) {
      case 'paragraph':
        out += `<p${paragraphAttrs(b, null)}>${inlines(b.content, notes)}</p>`;
        break;
      case 'passage': {
        if (!b.content.length) break;
        if (b.family === 'list') {
          out += listHtml(b, notes, own);
          break;
        }
        const numbers = passageNumbers(b, own);
        out += `<div class="passage"${passageAttrs(b)}>`;
        b.content.forEach((line, i) => {
          out += `<p${paragraphAttrs(line, numbers[i])}>${inlines(line.content, notes)}</p>`;
        });
        out += '</div>';
        break;
      }
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
      : b.kind === 'passage'
        ? b.content.reduce((n, l) => n + plain(l.content).length + 1, 0)
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
