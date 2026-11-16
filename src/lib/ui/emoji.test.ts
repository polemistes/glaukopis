import { describe, expect, it } from 'vitest';
import { MOST_RECENT_EMOJIS, movedInGrid, recentEmojisOf, rememberEmoji } from './emoji';

describe('the emojis chosen last', () => {
  it('are read as they were kept, each once, the newest first, and only so many', () => {
    expect(recentEmojisOf(['😀', '🍕', '😀', '🎉'])).toEqual(['😀', '🍕', '🎉']);
    const many = Array.from({ length: 40 }, (_, i) => String.fromCodePoint(0x1f300 + i));
    expect(recentEmojisOf(many)).toEqual(many.slice(0, MOST_RECENT_EMOJIS));
  });

  it('are read with care: what is not a short string is left out, and what is not a list is none', () => {
    expect(recentEmojisOf(['😀', 3, null, '', 'x'.repeat(40), { a: 1 }, '🍕'])).toEqual([
      '😀',
      '🍕',
    ]);
    expect(recentEmojisOf(undefined)).toEqual([]);
    expect(recentEmojisOf('😀')).toEqual([]);
    expect(recentEmojisOf({ 0: '😀' })).toEqual([]);
  });

  it('put what is chosen first, and take it from where it stood', () => {
    expect(rememberEmoji([], '😀')).toEqual(['😀']);
    expect(rememberEmoji(['🍕', '😀', '🎉'], '😀')).toEqual(['😀', '🍕', '🎉']);
  });

  it('keep at most twenty-four, the oldest going', () => {
    const full = Array.from({ length: MOST_RECENT_EMOJIS }, (_, i) =>
      String.fromCodePoint(0x1f300 + i),
    );
    const next = rememberEmoji(full, '😀');
    expect(next).toHaveLength(MOST_RECENT_EMOJIS);
    expect(next[0]).toBe('😀');
    expect(next).not.toContain(full[MOST_RECENT_EMOJIS - 1]);
    // One that is there already does not push another out.
    expect(rememberEmoji(full, full[5])).toHaveLength(MOST_RECENT_EMOJIS);
    expect(rememberEmoji(full, full[5])).toContain(full[MOST_RECENT_EMOJIS - 1]);
  });
});

describe('the arrows in the grid of emojis', () => {
  // Twenty emojis, eight to a row: rows of 8, 8 and 4 (places 16 to 19).
  const go = (key: string, at: number) => movedInGrid(key, at, 20, 8);

  it('move by one along a row, and by a row up and down', () => {
    expect(go('ArrowRight', 3)).toBe(4);
    expect(go('ArrowLeft', 3)).toBe(2);
    expect(go('ArrowDown', 3)).toBe(11);
    expect(go('ArrowUp', 11)).toBe(3);
  });

  it('stay where they are at the first and the last, and above the first row', () => {
    expect(go('ArrowLeft', 0)).toBe(0);
    expect(go('ArrowRight', 19)).toBe(19);
    expect(go('ArrowUp', 5)).toBe(5);
  });

  it('go down to the last emoji where the row below is short and has nothing under the place', () => {
    expect(go('ArrowDown', 12)).toBe(19);
    expect(go('ArrowDown', 19)).toBe(19);
    expect(movedInGrid('ArrowDown', 3, 6, 8)).toBe(3);
  });

  it('take Home and End to the ends of the row, the last row ending where the emojis end', () => {
    expect(go('Home', 13)).toBe(8);
    expect(go('End', 13)).toBe(15);
    expect(go('End', 17)).toBe(19);
    expect(go('Home', 19)).toBe(16);
  });

  it('leave other keys, and an empty grid, alone', () => {
    expect(go('a', 3)).toBeNull();
    expect(go('Enter', 3)).toBeNull();
    expect(movedInGrid('ArrowRight', 0, 0, 8)).toBeNull();
  });
});
