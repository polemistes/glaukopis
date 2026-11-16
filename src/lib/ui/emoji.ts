/**
 * The small things the emoji picker (`EmojiPicker.svelte`) is made of that
 * need no page: the emojis chosen last, as they are kept, and the way the
 * arrows move through the grid.
 */

/** How many emojis are remembered as the last chosen. */
export const MOST_RECENT_EMOJIS = 24;

/** How many emojis the grid has to a row. */
export const EMOJI_COLUMNS = 8;

/** The longest an emoji may be, in UTF-16 units; the longest of Unicode's is eight, a family. */
const LONGEST_EMOJI = 16;

/**
 * The emojis chosen last as they were kept, read with care: what is not a
 * short string is left out, each is kept once, the newest first, and only
 * so many.
 */
export function recentEmojisOf(kept: unknown): string[] {
  if (!Array.isArray(kept)) return [];
  const out: string[] = [];
  for (const emoji of kept) {
    if (typeof emoji !== 'string' || !emoji || emoji.length > LONGEST_EMOJI) continue;
    if (!out.includes(emoji)) out.push(emoji);
    if (out.length === MOST_RECENT_EMOJIS) break;
  }
  return out;
}

/** The emojis chosen last once `emoji` is chosen: it first, and each other once, as many as are kept. */
export function rememberEmoji(recent: readonly string[], emoji: string): string[] {
  return [emoji, ...recent.filter((one) => one !== emoji)].slice(0, MOST_RECENT_EMOJIS);
}

/**
 * Where an arrow, Home or End moves from the emoji at `at` of `count` in a
 * grid of `columns` to a row, or null for a key that moves nowhere. Down
 * from a place with nothing under it goes to the last emoji; up from the
 * first row, and left of the first, and right of the last, stay where they are.
 */
export function movedInGrid(
  key: string,
  at: number,
  count: number,
  columns = EMOJI_COLUMNS,
): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  const rowStart = at - (at % columns);
  switch (key) {
    case 'ArrowLeft':
      return Math.max(0, at - 1);
    case 'ArrowRight':
      return Math.min(last, at + 1);
    case 'ArrowUp':
      return at - columns >= 0 ? at - columns : at;
    case 'ArrowDown':
      if (at + columns <= last) return at + columns;
      return Math.floor(last / columns) > Math.floor(at / columns) ? last : at;
    case 'Home':
      return rowStart;
    case 'End':
      return Math.min(last, rowStart + columns - 1);
    default:
      return null;
  }
}
