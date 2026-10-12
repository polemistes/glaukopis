/**
 * The difference between two Org texts, line by line (ADR 0041, section
 * 7): what the history and the review show of a text when it is seen as
 * Org. The lines are compared by their longest common run; a line taken
 * out where another is put in is a line changed, with the words that
 * changed in it marked.
 */

/** A run of words within a changed line: changed, or the same on both sides. */
export interface Words {
  text: string;
  changed: boolean;
}

export type DiffLine =
  | { kind: 'same'; text: string }
  | { kind: 'added'; text: string }
  | { kind: 'removed'; text: string }
  | { kind: 'changed'; before: Words[]; after: Words[] };

/** How many pairs of lines, at most, are compared: beyond, what differs is taken out and put in whole. */
const MOST_COMPARED = 4_000_000;

/** The longest common run of two lists, as the pairs of indices that are the same. */
function common<T>(a: readonly T[], b: readonly T[]): [number, number][] {
  const n = a.length;
  const m = b.length;
  // The length of the longest run of what follows each pair, row by row.
  const table = new Uint32Array((n + 1) * (m + 1));
  const at = (i: number, j: number) => i * (m + 1) + j;
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      table[at(i, j)] =
        a[i] === b[j]
          ? table[at(i + 1, j + 1)] + 1
          : Math.max(table[at(i + 1, j)], table[at(i, j + 1)]);
  const out: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push([i, j]);
      i++;
      j++;
    } else if (table[at(i + 1, j)] >= table[at(i, j + 1)]) i++;
    else j++;
  }
  return out;
}

/** Of two lists, what is the same, taken out and put in, in order: the same at each end found first. */
function compare<T>(
  a: readonly T[],
  b: readonly T[],
): { kind: 'same' | 'removed' | 'added'; a?: number; b?: number }[] {
  let head = 0;
  while (head < a.length && head < b.length && a[head] === b[head]) head++;
  let tail = 0;
  while (
    tail < a.length - head &&
    tail < b.length - head &&
    a[a.length - 1 - tail] === b[b.length - 1 - tail]
  )
    tail++;
  const midA = a.slice(head, a.length - tail);
  const midB = b.slice(head, b.length - tail);
  const out: { kind: 'same' | 'removed' | 'added'; a?: number; b?: number }[] = [];
  for (let k = 0; k < head; k++) out.push({ kind: 'same', a: k, b: k });
  let i = 0;
  let j = 0;
  // Two long texts with nothing in common at their ends are not compared line by line.
  const same = midA.length * midB.length > MOST_COMPARED ? [] : common(midA, midB);
  for (const [ci, cj] of same) {
    for (; i < ci; i++) out.push({ kind: 'removed', a: head + i });
    for (; j < cj; j++) out.push({ kind: 'added', b: head + j });
    out.push({ kind: 'same', a: head + ci, b: head + cj });
    i++;
    j++;
  }
  for (; i < midA.length; i++) out.push({ kind: 'removed', a: head + i });
  for (; j < midB.length; j++) out.push({ kind: 'added', b: head + j });
  for (let k = 0; k < tail; k++)
    out.push({ kind: 'same', a: a.length - tail + k, b: b.length - tail + k });
  return out;
}

/** The words of a line and the spaces between them, each a piece. */
const pieces = (line: string) => line.split(/(\s+)/).filter((p) => p !== '');

/** Runs of words, the same and changed, of each side of a changed line. */
export function changedWords(before: string, after: string): { before: Words[]; after: Words[] } {
  const a = pieces(before);
  const b = pieces(after);
  const out = { before: [] as Words[], after: [] as Words[] };
  const put = (list: Words[], text: string, changed: boolean) => {
    const last = list[list.length - 1];
    if (last && last.changed === changed) last.text += text;
    else list.push({ text, changed });
  };
  for (const step of compare(a, b)) {
    if (step.kind === 'same') {
      put(out.before, a[step.a!], false);
      put(out.after, b[step.b!], false);
    } else if (step.kind === 'removed') put(out.before, a[step.a!], true);
    else put(out.after, b[step.b!], true);
  }
  return out;
}

/**
 * The difference between two texts, line by line. Where lines are taken
 * out and others put in at the same place, they are paired, the first
 * with the first, as lines changed; what is left over is taken out or put
 * in.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
  const b = after.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
  if (!before) a.length = 0;
  if (!after) b.length = 0;
  const out: DiffLine[] = [];
  let removed: string[] = [];
  let added: string[] = [];
  const settle = () => {
    const pairs = Math.min(removed.length, added.length);
    for (let k = 0; k < pairs; k++) {
      if (!removed[k].trim() || !added[k].trim()) {
        out.push({ kind: 'removed', text: removed[k] }, { kind: 'added', text: added[k] });
        continue;
      }
      out.push({ kind: 'changed', ...changedWords(removed[k], added[k]) });
    }
    for (const text of removed.slice(pairs)) out.push({ kind: 'removed', text });
    for (const text of added.slice(pairs)) out.push({ kind: 'added', text });
    removed = [];
    added = [];
  };
  for (const step of compare(a, b)) {
    if (step.kind === 'same') {
      settle();
      out.push({ kind: 'same', text: a[step.a!] });
    } else if (step.kind === 'removed') removed.push(a[step.a!]);
    else added.push(b[step.b!]);
  }
  settle();
  return out;
}

/** Whether a difference says anything changed. */
export const anyChange = (lines: DiffLine[]) => lines.some((l) => l.kind !== 'same');
