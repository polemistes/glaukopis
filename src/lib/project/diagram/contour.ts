/**
 * The outline of a branch of the diagram, by which branches are packed
 * beside one another: what lies lowest at each x across the branch, its
 * bottom, and what lies highest, its top, of its boxes and of the lines from
 * each element to those under it. A piece runs straight from (x1, y1) to
 * (x2, y2), with x1 < x2; an outline is pieces in the order of x, none over
 * another, and nothing where the branch has nothing. Up is the smaller y, as
 * on the screen.
 */

export interface Piece {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

export type Outline = Piece[];

/** The height of a piece at an x within it. */
const at = (p: Piece, x: number): number => p.y1 + ((p.y2 - p.y1) * (x - p.x1)) / (p.x2 - p.x1);

const slope = (p: Piece): number => (p.y2 - p.y1) / (p.x2 - p.x1);

/** A piece, or nothing where it would have no width. */
export function piece(x1: number, y1: number, x2: number, y2: number): Outline {
  return x1 < x2 ? [{ x1, x2, y1, y2 }] : x2 < x1 ? [{ x1: x2, x2: x1, y1: y2, y2: y1 }] : [];
}

/**
 * The stretches of x over which either outline has a piece, from left to
 * right, with the piece of each that covers the stretch: every edge of a
 * piece begins a stretch, so a piece covers a stretch wholly or not at all.
 */
function* stretches(
  a: Outline,
  b: Outline,
): Generator<[number, number, Piece | null, Piece | null]> {
  const xs = [...new Set([...a, ...b].flatMap((p) => [p.x1, p.x2]))].sort((p, q) => p - q);
  let i = 0;
  let j = 0;
  for (let k = 0; k + 1 < xs.length; k++) {
    const u = xs[k];
    const v = xs[k + 1];
    while (i < a.length && a[i].x2 <= u) i++;
    while (j < b.length && b[j].x2 <= u) j++;
    const pa = i < a.length && a[i].x1 <= u ? a[i] : null;
    const pb = j < b.length && b[j].x1 <= u ? b[j] : null;
    if (pa || pb) yield [u, v, pa, pb];
  }
}

/** Pieces in order, those that continue one another straight on made one. */
function joinedUp(pieces: Outline): Outline {
  const out: Outline = [];
  for (const p of pieces) {
    const last = out[out.length - 1];
    if (
      last &&
      last.x2 === p.x1 &&
      Math.abs(last.y2 - p.y1) < 1e-6 &&
      Math.abs(slope(last) - slope(p)) < 1e-9
    ) {
      out[out.length - 1] = { x1: last.x1, x2: p.x2, y1: last.y1, y2: p.y2 };
    } else {
      out.push(p);
    }
  }
  return out;
}

/** What lies lowest of two outlines at each x, or, for the top, highest. */
export function joined(a: Outline, b: Outline, lowest: boolean): Outline {
  if (!a.length) return b;
  if (!b.length) return a;
  const out: Outline = [];
  const wins = (ya: number, yb: number) => (lowest ? ya >= yb : ya <= yb);
  for (const [u, v, pa, pb] of stretches(a, b)) {
    if (!pa || !pb) {
      const p = (pa ?? pb)!;
      out.push({ x1: u, x2: v, y1: at(p, u), y2: at(p, v) });
      continue;
    }
    const au = at(pa, u);
    const av = at(pa, v);
    const bu = at(pb, u);
    const bv = at(pb, v);
    const aFirst = wins(au, bu);
    const aLast = wins(av, bv);
    if (aFirst === aLast) {
      out.push(aFirst ? { x1: u, x2: v, y1: au, y2: av } : { x1: u, x2: v, y1: bu, y2: bv });
    } else {
      // They cross between: the one before the crossing, the other after.
      const t = u + ((v - u) * (au - bu)) / (au - bu - (av - bv));
      const yt = at(pa, t);
      if (aFirst) {
        out.push({ x1: u, x2: t, y1: au, y2: yt }, { x1: t, x2: v, y1: yt, y2: bv });
      } else {
        out.push({ x1: u, x2: t, y1: bu, y2: yt }, { x1: t, x2: v, y1: yt, y2: av });
      }
    }
  }
  return joinedUp(out);
}

/** The outline moved. */
export function moved(o: Outline, dx: number, dy: number): Outline {
  return dx || dy
    ? o.map((p) => ({ x1: p.x1 + dx, x2: p.x2 + dx, y1: p.y1 + dy, y2: p.y2 + dy }))
    : o;
}

/**
 * How far down a top must go to stand clear of a bottom by `gap` wherever
 * the two lie over each other; nothing where they never do.
 */
export function clearance(bottom: Outline, top: Outline, gap: number): number | null {
  let need: number | null = null;
  for (const [u, v, pb, pt] of stretches(bottom, top)) {
    if (!pb || !pt) continue;
    // Both straight: the difference is largest at one end.
    const d = Math.max(at(pb, u) - at(pt, u), at(pb, v) - at(pt, v)) + gap;
    if (need === null || d > need) need = d;
  }
  return need;
}

/** The highest y of an outline, or the lowest: nothing of an empty one. */
export function reach(o: Outline, lowest: boolean): number {
  let y = lowest ? -Infinity : Infinity;
  for (const p of o) y = lowest ? Math.max(y, p.y1, p.y2) : Math.min(y, p.y1, p.y2);
  return y;
}
