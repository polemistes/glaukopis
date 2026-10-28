/**
 * The versions of an image (ADR 0071): the file it was first made from, and
 * every copy made from that or from a copy of it, by editing, to be smaller,
 * or to be a figure. A figure's panel offers them, to be chosen by hand.
 */
import type { FileView } from '$lib/api/files';

/**
 * The versions of the file with this hash, among these files: the original
 * first, then the copies in the order they were made. Only files that are
 * there. Empty where the file is not among them.
 */
export function versionsOf(hash: string, all: readonly FileView[]): FileView[] {
  const byHash = new Map(all.map((f) => [f.hash, f]));
  let root = byHash.get(hash);
  if (!root) return [];
  // Up to the original: a source the library no longer has ends the climb.
  const climbed = new Set([root.hash]);
  while (root.madeFrom && !climbed.has(root.madeFrom)) {
    const up = byHash.get(root.madeFrom);
    if (!up) break;
    climbed.add(up.hash);
    root = up;
  }
  // Down from it, to every copy of a copy.
  const madeFrom = new Map<string, FileView[]>();
  for (const f of all) {
    if (!f.madeFrom) continue;
    const list = madeFrom.get(f.madeFrom) ?? [];
    list.push(f);
    madeFrom.set(f.madeFrom, list);
  }
  const found: FileView[] = [root];
  const seen = new Set([root.hash]);
  for (let i = 0; i < found.length; i++) {
    for (const copy of madeFrom.get(found[i].hash) ?? []) {
      if (seen.has(copy.hash)) continue;
      seen.add(copy.hash);
      found.push(copy);
    }
  }
  const [first, ...copies] = found;
  // Times are kept to the second: copies made within one keep the order they were found in,
  // a copy before the copies made from it.
  copies.sort((a, b) => a.added.localeCompare(b.added));
  return [first, ...copies].filter((f) => f.exists);
}
