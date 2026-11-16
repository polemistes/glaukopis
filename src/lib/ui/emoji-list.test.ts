import { describe, expect, it } from 'vitest';
import { EMOJI_GROUP_IDS, EMOJI_VERSION, EMOJIS } from './emoji-list.generated';

const all = EMOJI_GROUP_IDS.flatMap((id) => EMOJIS[id]);
const codePoints = (emoji: string) => Array.from(emoji, (c) => c.codePointAt(0)!);

describe('the list of emojis', () => {
  it('has Unicode’s eight groups, in Unicode’s order, and each holds emojis', () => {
    expect([...EMOJI_GROUP_IDS]).toEqual([
      'smileys',
      'people',
      'nature',
      'food',
      'travel',
      'activities',
      'objects',
      'symbols',
    ]);
    for (const id of EMOJI_GROUP_IDS) expect(EMOJIS[id].length, id).toBeGreaterThan(50);
  });

  it('says which version of Unicode’s file it was made from', () => {
    expect(EMOJI_VERSION).toMatch(/^\d+\.\d+$/);
  });

  it('holds no emoji twice, in one group or in two', () => {
    expect(new Set(all).size).toBe(all.length);
  });

  it('holds no emoji with a skin tone', () => {
    const toned = all.filter((emoji) =>
      codePoints(emoji).some((c) => c >= 0x1f3fb && c <= 0x1f3ff),
    );
    expect(toned).toEqual([]);
  });

  it('holds no flag of a country or a region', () => {
    const flags = all.filter((emoji) =>
      codePoints(emoji).some(
        (c) => (c >= 0x1f1e6 && c <= 0x1f1ff) || (c >= 0xe0020 && c <= 0xe007f),
      ),
    );
    expect(flags).toEqual([]);
  });

  it('ends the symbols with the other flags', () => {
    expect(EMOJIS.symbols.slice(-8)).toEqual(['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️']);
  });

  it('holds each emoji as one letter of its own, in the form that is drawn as a picture', () => {
    const segmenter = new Intl.Segmenter();
    const several = all.filter((emoji) => Array.from(segmenter.segment(emoji)).length !== 1);
    expect(several).toEqual([]);
    // The heart is the sign with the selector of presentation after it, not the bare sign.
    expect(EMOJIS.smileys).toContain('❤️');
    expect(all).not.toContain('❤');
  });

  it('holds the emojis of Emoji 14.0 and none of a later version', () => {
    expect(EMOJIS.smileys).toContain('🫠'); // melting face, Emoji 14.0
    expect(all).not.toContain('🫨'); // shaking face, Emoji 15.0
    expect(all).not.toContain('🪿'); // goose, Emoji 15.0
  });

  it('sets the emojis in the groups Unicode does', () => {
    expect(EMOJIS.smileys[0]).toBe('😀');
    expect(EMOJIS.people).toContain('👍');
    expect(EMOJIS.nature).toContain('🐈');
    expect(EMOJIS.food).toContain('🍕');
    expect(EMOJIS.travel).toContain('🚲');
    expect(EMOJIS.activities).toContain('🎉');
    expect(EMOJIS.objects).toContain('📖');
    expect(EMOJIS.symbols).toContain('✅');
  });
});
