/**
 * A reader of the Markdown the user's guide is written in, and of nothing
 * more: headings `#` to `####`, paragraphs (their lines joined), points
 * (`- `, the lines that go on set in), numbered points (`1. `), tables with
 * a row of headings, `**bold**`, `*italics*`, `` `code` `` and backslash
 * escapes. What it reads it makes into blocks, which are written as HTML
 * with everything escaped: no HTML of the guide passes as HTML.
 *
 * What the reader does not understand it shows as it is written, and says
 * so among its problems, so that a test of the whole guide can tell where
 * the guide has gone beyond the reader, and the two stay in step.
 */

export type Inline =
  | { kind: 'text'; text: string }
  | { kind: 'strong' | 'em'; children: Inline[] }
  | { kind: 'code'; text: string };

export type Block =
  | { kind: 'heading'; level: number; content: Inline[]; line: number }
  | { kind: 'paragraph'; content: Inline[]; line: number }
  /** A list of points, each a paragraph or more. */
  | { kind: 'points'; ordered: boolean; start: number; items: Inline[][][]; line: number }
  /** A table: the row of headings, then the rows; each cell its words. */
  | { kind: 'table'; head: Inline[][]; rows: Inline[][][]; line: number };

/** Something the reader did not understand, and the line of the source it is on. */
export interface Problem {
  line: number;
  what: string;
}

export interface Read {
  blocks: Block[];
  problems: Problem[];
}

const HEADING = /^(#{1,6})\s+(.*?)(?:\s+#+)?\s*$/;
const POINT = /^- (.*)$/;
const NUMBERED = /^(\d{1,9})\. (.*)$/;
const ROW = /^\s*\|/;
const RULE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;
const FENCE = /^\s*(```|~~~)/;
const QUOTATION = /^\s*>/;
const LINK = /\[[^\]]*\]\([^)]*\)/;
/** The signs a backslash takes as themselves: ASCII's punctuation. */
const PUNCTUATION = /[!-/:-@[-`{-~]/;

/** Reads the source into blocks, with what was not understood. */
export function readMarkdown(source: string): Read {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  const problems: Problem[] = [];
  const blank = (k: number) => k >= lines.length || !lines[k].trim();
  /** The lines of a paragraph are looked at for what only a block could be. */
  const look = (text: string, line: number) => {
    if (FENCE.test(text)) problems.push({ line, what: 'a fence of code' });
    else if (QUOTATION.test(text)) problems.push({ line, what: 'a quotation' });
    else if (ROW.test(text)) problems.push({ line, what: 'a row of a table outside a table' });
  };
  const words = (text: string, line: number) => readInline(text, line, problems);

  let i = 0;
  while (i < lines.length) {
    const text = lines[i];
    if (blank(i)) {
      i++;
      continue;
    }
    const line = i + 1;
    const heading = HEADING.exec(text);
    if (heading) {
      const level = heading[1].length;
      if (level > 4) problems.push({ line, what: `a heading of level ${level}` });
      blocks.push({ kind: 'heading', level, content: words(heading[2], line), line });
      i++;
      continue;
    }
    if (ROW.test(text) && i + 1 < lines.length && RULE.test(lines[i + 1])) {
      const head = cells(text).map((c) => words(c, line));
      const rows: Inline[][][] = [];
      i += 2;
      while (i < lines.length && ROW.test(lines[i])) {
        rows.push(cells(lines[i]).map((c) => words(c, i + 1)));
        i++;
      }
      blocks.push({ kind: 'table', head, rows, line });
      continue;
    }
    const marker = POINT.exec(text) ?? NUMBERED.exec(text);
    if (marker) {
      const ordered = !text.startsWith('- ');
      const items: Inline[][][] = [];
      while (i < lines.length) {
        const m = ordered ? NUMBERED.exec(lines[i]) : POINT.exec(lines[i]);
        if (!m) break;
        const at = i + 1;
        const paragraphs: Inline[][] = [];
        let current = [m[m.length - 1]];
        i++;
        for (;;) {
          if (i >= lines.length) break;
          const next = lines[i];
          if (blank(i)) {
            // A paragraph more of the same point, where what follows is set in.
            let j = i;
            while (j < lines.length && blank(j)) j++;
            if (j < lines.length && /^ {2,}\S/.test(lines[j])) {
              paragraphs.push(words(current.join(' '), at));
              current = [];
              i = j;
              continue;
            }
            break;
          }
          if (/^\s+\S/.test(next)) {
            const going = next.trim();
            if (POINT.test(going) || NUMBERED.test(going))
              problems.push({ line: i + 1, what: 'a point within a point' });
            look(going, i + 1);
            current.push(going);
            i++;
            continue;
          }
          break;
        }
        paragraphs.push(words(current.join(' '), at));
        items.push(paragraphs);
        // The list goes on past blank lines to a point of the same kind.
        let j = i;
        while (j < lines.length && blank(j)) j++;
        const again = j < lines.length && (ordered ? NUMBERED : POINT).test(lines[j]);
        if (!again) break;
        i = j;
      }
      blocks.push({
        kind: 'points',
        ordered,
        start: ordered ? Number(marker[1]) : 1,
        items,
        line,
      });
      continue;
    }
    // A paragraph: its lines up to a blank one, or to what begins a block.
    // A numbered point begins one only from 1, so that a line that begins
    // with a number and a stop, in the middle of a sentence, is not one.
    const gathered: string[] = [];
    while (i < lines.length && !blank(i)) {
      const next = lines[i];
      if (gathered.length) {
        if (HEADING.test(next) || POINT.test(next) || /^1\. /.test(next)) break;
        if (ROW.test(next) && i + 1 < lines.length && RULE.test(lines[i + 1])) break;
      }
      look(next, i + 1);
      gathered.push(next.trim());
      i++;
    }
    blocks.push({ kind: 'paragraph', content: words(gathered.join(' '), line), line });
  }
  return { blocks, problems };
}

/** The cells of a row of a table, split at the bars that are not escaped. */
function cells(row: string): string[] {
  let text = row.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
  const out: string[] = [];
  let cell = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\' && text[i + 1] === '|') {
      cell += '|';
      i++;
    } else if (text[i] === '|') {
      out.push(cell.trim());
      cell = '';
    } else cell += text[i];
  }
  out.push(cell.trim());
  return out;
}

/** The words of a paragraph, a heading or a cell, read into their marks. */
export function readInline(text: string, line: number, problems: Problem[]): Inline[] {
  if (LINK.test(text.replace(/(`+)[^`]*?\1/g, ''))) problems.push({ line, what: 'a link' });
  const found: string[] = [];
  const nodes = span(text, 0, null, found).nodes;
  for (const what of found) problems.push({ line, what });
  return nodes;
}

const space = (sign: string | undefined) => sign === undefined || /\s/.test(sign);

/**
 * Words up to the mark that closes them, where one is wanted: what is
 * bold, what is in italics, and what is code, within one another. A mark
 * that is never closed stands as it is written, and is said in `found`;
 * what an attempt that came to nothing found is not said, since its words
 * are read again.
 */
function span(
  s: string,
  from: number,
  closer: '*' | '**' | null,
  found: string[],
): { nodes: Inline[]; end: number; closed: boolean } {
  const nodes: Inline[] = [];
  let text = '';
  const flush = () => {
    if (text) nodes.push({ kind: 'text', text });
    text = '';
  };
  let i = from;
  while (i < s.length) {
    const sign = s[i];
    if (sign === '\\' && i + 1 < s.length && PUNCTUATION.test(s[i + 1])) {
      text += s[i + 1];
      i += 2;
      continue;
    }
    if (sign === '`') {
      let run = 1;
      while (s[i + run] === '`') run++;
      const close = closingTicks(s, i + run, run);
      if (close < 0) {
        found.push('a ` that is not closed');
        text += '`'.repeat(run);
        i += run;
        continue;
      }
      flush();
      let code = s.slice(i + run, close);
      if (code.length > 2 && code.startsWith(' ') && code.endsWith(' ') && code.trim())
        code = code.slice(1, -1);
      nodes.push({ kind: 'code', text: code });
      i = close + run;
      continue;
    }
    if (sign === '*') {
      const double = s[i + 1] === '*';
      const mark = double ? '**' : '*';
      const before = s[i - 1];
      const after = s[i + mark.length];
      if (closer === mark && i > from && !space(before)) {
        flush();
        return { nodes, end: i + mark.length, closed: true };
      }
      // Italics that end where bold would begin with nothing after it: the first star closes them.
      if (closer === '*' && double && i > from && !space(before) && space(after)) {
        flush();
        return { nodes, end: i + 1, closed: true };
      }
      // A star with room after it opens nothing: it is a star, as in `* * *`.
      if (!space(after)) {
        const inner: string[] = [];
        const within = span(s, i + mark.length, mark, inner);
        if (within.closed) {
          flush();
          found.push(...inner);
          nodes.push({ kind: double ? 'strong' : 'em', children: within.nodes });
          i = within.end;
          continue;
        }
        found.push(double ? 'a ** that is not closed' : 'a * that is not closed');
      }
      text += mark;
      i += mark.length;
      continue;
    }
    text += sign;
    i++;
  }
  flush();
  return { nodes, end: i, closed: false };
}

/** Where a run of so many backticks closes a code span begun before `from`: a run of just as many. */
function closingTicks(s: string, from: number, run: number): number {
  for (let i = from; i < s.length; i++) {
    if (s[i] !== '`') continue;
    let n = 1;
    while (s[i + n] === '`') n++;
    if (n === run) return i;
    i += n - 1;
  }
  return -1;
}

// ---- written out ----

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Words with their marks, as HTML. */
export function inlineHtml(nodes: readonly Inline[]): string {
  return nodes
    .map((n) => {
      if (n.kind === 'text') return escapeHtml(n.text);
      if (n.kind === 'code') return `<code>${escapeHtml(n.text)}</code>`;
      const tag = n.kind === 'strong' ? 'strong' : 'em';
      return `<${tag}>${inlineHtml(n.children)}</${tag}>`;
    })
    .join('');
}

/**
 * A block as HTML. A heading is given the attributes handed over, written
 * as they are, which the caller makes of what it knows; and its level as
 * the caller would have it, where it shows the guide's headings lower.
 */
export function blockHtml(block: Block, heading: { level?: number; attributes?: string } = {}) {
  switch (block.kind) {
    case 'heading': {
      const level = heading.level ?? block.level;
      const attributes = heading.attributes ? ` ${heading.attributes}` : '';
      return `<h${level}${attributes}>${inlineHtml(block.content)}</h${level}>`;
    }
    case 'paragraph':
      return `<p>${inlineHtml(block.content)}</p>`;
    case 'points': {
      const tag = block.ordered ? 'ol' : 'ul';
      const start = block.ordered && block.start !== 1 ? ` start="${block.start}"` : '';
      const items = block.items
        .map((paragraphs) =>
          paragraphs.length === 1
            ? `<li>${inlineHtml(paragraphs[0])}</li>`
            : `<li>${paragraphs.map((p) => `<p>${inlineHtml(p)}</p>`).join('')}</li>`,
        )
        .join('');
      return `<${tag}${start}>${items}</${tag}>`;
    }
    case 'table': {
      // A row of headings with nothing in it, as the table of keys has, is not shown.
      const head = block.head.some((c) => inlineText(c).trim())
        ? `<thead><tr>${block.head.map((c) => `<th>${inlineHtml(c)}</th>`).join('')}</tr></thead>`
        : '';
      const rows = block.rows
        .map((row) => `<tr>${row.map((c) => `<td>${inlineHtml(c)}</td>`).join('')}</tr>`)
        .join('');
      return `<div class="table"><table>${head}<tbody>${rows}</tbody></table></div>`;
    }
  }
}

/** Words without their marks, as they are read. */
export function inlineText(nodes: readonly Inline[]): string {
  return nodes.map((n) => ('children' in n ? inlineText(n.children) : n.text)).join('');
}

/** The words of a block, as they are read: for finding in. */
export function blockText(block: Block): string {
  switch (block.kind) {
    case 'heading':
    case 'paragraph':
      return inlineText(block.content);
    case 'points':
      return block.items.map((item) => item.map(inlineText).join(' ')).join(' ');
    case 'table':
      return [block.head, ...block.rows].map((row) => row.map(inlineText).join(' ')).join(' ');
  }
}
