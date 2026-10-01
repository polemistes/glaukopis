/** The text of an element as HTML, for showing it where it is not being written. */

import { citationLabel, isMissing } from '$lib/editor/references.svelte';
import { figureWidth, foundAttrs, tableWidth } from '$lib/editor/schema';
import { isPictureName } from '$lib/figures/pictures.svelte';
import type { Block, Inline } from './text';

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
        if (i.marks.link) html = `<a>${html}</a>`;
        // A citation that was found, and is not yet tied to a reference.
        const found = foundAttrs(i.marks.found);
        if (found && !found.left)
          html = `<span class="found" data-by="${escape(found.by)}" data-found-id="${escape(found.id)}">${html}</span>`;
        out += html;
        break;
      }
      case 'break':
        out += '<br>';
        break;
      case 'citation':
        out += `<span class="citation${isMissing(i.items) ? ' missing' : ''}">${escape(citationLabel(i.items, i.mode, speaking))}</span>`;
        break;
      case 'math':
        // Shown as it was written until it is shown as mathematics: see `figures/hydrate.ts`.
        out += `<span class="math" data-math="${escape(i.tex)}">${escape(i.tex)}</span>`;
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

function blocks(list: Block[], notes: { n: number }): string {
  let out = '';
  for (const b of list) {
    switch (b.kind) {
      case 'paragraph':
        out += `<p>${inlines(b.content, notes)}</p>`;
        break;
      case 'blockquote':
        out += `<blockquote>${blocks(b.content, notes)}</blockquote>`;
        break;
      case 'verse': {
        let n = b.start ?? 0;
        out += `<div class="verse"${b.start === null ? '' : ` data-start="${b.start}"`}>`;
        for (const line of b.lines) {
          const numbered = b.start !== null && line.kind === 'line';
          const number = numbered ? n++ : null;
          const shown = number !== null && (number === b.start || number % b.by === 0);
          out +=
            `<p class="verse-line ${line.kind}"${line.indent ? ` style="--indent: ${line.indent}"` : ''}` +
            `${shown ? ` data-n="${number}"` : ''}>${inlines(line.content, notes)}</p>`;
        }
        out += '</div>';
        break;
      }
      case 'script':
        out += `<p class="script ${b.part}">${inlines(b.content, notes)}</p>`;
        break;
      case 'parallel':
        out +=
          `<div class="parallel"><div class="parallel-side">${blocks(b.left, notes)}</div>` +
          `<div class="parallel-side">${blocks(b.right, notes)}</div></div>`;
        break;
      case 'bullet_list':
        out += `<ul>${b.items.map((i) => `<li>${blocks(i, notes)}</li>`).join('')}</ul>`;
        break;
      case 'ordered_list':
        out += `<ol${b.start !== 1 ? ` start="${b.start}"` : ''}>${b.items
          .map((i) => `<li>${blocks(i, notes)}</li>`)
          .join('')}</ol>`;
        break;
      case 'row':
        out += `<div class="row-of" data-row>${blocks(b.items, notes)}</div>`;
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
                      `${blocks(cell.content, notes)}</${tag}>`
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

export function blocksHtml(list: Block[], language?: string | null): string {
  speaking = language;
  try {
    return blocks(list, { n: 0 });
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
      : b.kind === 'blockquote'
        ? b.content.reduce((n, c) => n + size(c), 0)
        : b.kind === 'verse'
          ? b.lines.reduce((n, l) => n + plain(l.content).length + 1, 0)
          : b.kind === 'script'
            ? plain(b.content).length
            : b.kind === 'parallel'
              ? [...b.left, ...b.right].reduce((n, c) => n + size(c), 0)
              : b.kind === 'figure'
                ? // A picture takes the room of some lines.
                  plain(b.caption).length + 240
                : b.kind === 'equation'
                  ? 80
                  : b.kind === 'row'
                    ? b.items.reduce((n, c) => n + size(c), 0)
                    : b.kind === 'table'
                      ? // A row takes the room of a line.
                        plain(b.caption).length + b.rows.length * 70
                      : b.items.reduce((n, item) => n + item.reduce((m, c) => m + size(c), 0), 0);
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
      out.push({ kind: 'paragraph', content });
      return { blocks: out, cut: true };
    }
    out.push(b);
    count += s;
  }
  return { blocks: out, cut: false };
}
