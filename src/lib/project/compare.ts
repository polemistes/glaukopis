/**
 * Where two texts differ, word by word: what stands in both, what only the
 * first has, and what only the second. It is found in Myers's way, with the
 * fewest words taken away and put in, so that a long text with a few changes
 * is compared about as quickly as a short one. Texts that differ in more
 * than so many places are said to differ as wholes.
 */

export interface Compared {
  text: string;
  /** In both; only in the first (`gone`); only in the second (`new`). */
  status: 'same' | 'gone' | 'new';
}

/** How many words may differ before the texts are said to differ as wholes. */
const MOST_CHANGES = 2000;

/** A text as words, with the spaces and signs between them as tokens of their own. */
function tokens(text: string): string[] {
  return text.match(/[\p{L}\p{N}\p{M}'’-]+|\s+|[^\p{L}\p{N}\p{M}\s]/gu) ?? [];
}

/**
 * The fewest changes that make `a` into `b`, as what is kept, taken away
 * and put in; or nothing, where there are more than `MOST_CHANGES`.
 */
function changes(a: string[], b: string[]): Compared[] | null {
  const n = a.length;
  const m = b.length;
  const offset = n + m + 1;
  // The furthest point reached on each diagonal, and for every number of
  // changes a copy of the diagonals it reached (from -d to d).
  const v = new Int32Array(2 * offset + 1);
  const trace: Int32Array[] = [];
  for (let d = 0; ; d++) {
    if (d > MOST_CHANGES) return null;
    let done = false;
    for (let k = -d; k <= d; k += 2) {
      const down = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]);
      let x = down ? v[offset + k + 1] : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        done = true;
        break;
      }
    }
    trace.push(v.slice(offset - d, offset + d + 1));
    if (done) break;
  }
  // Back from the end, along the path that was found.
  const out: Compared[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d > 0; d--) {
    const before = trace[d - 1];
    const at = (k: number) => before[k + d - 1];
    const k = x - y;
    const down = k === -d || (k !== d && at(k - 1) < at(k + 1));
    const fromK = down ? k + 1 : k - 1;
    const fromX = at(fromK);
    const fromY = fromX - fromK;
    while (x > fromX && y > fromY) {
      x--;
      y--;
      out.push({ text: a[x], status: 'same' });
    }
    if (down) {
      y--;
      out.push({ text: b[y], status: 'new' });
    } else {
      x--;
      out.push({ text: a[x], status: 'gone' });
    }
  }
  while (x > 0 && y > 0) {
    x--;
    y--;
    out.push({ text: a[x], status: 'same' });
  }
  return out.reverse();
}

/** Where two texts differ, with what runs alike joined into one piece. */
export function compare(first: string, second: string): Compared[] {
  const a = tokens(first);
  const b = tokens(second);
  const found = changes(a, b) ?? [
    ...a.map((text) => ({ text, status: 'gone' as const })),
    ...b.map((text) => ({ text, status: 'new' as const })),
  ];
  const out: Compared[] = [];
  for (const piece of found) {
    const last = out[out.length - 1];
    if (last && last.status === piece.status) last.text += piece.text;
    else out.push({ ...piece });
  }
  return out;
}
