import { describe, expect, it } from 'vitest';
import { defaultSettings } from '$lib/api/system';
import { settings } from '$lib/state/settings.svelte';
// The two lists as the core writes them, read as text.
import source from '/crates/core/src/sync/settings.rs?raw';

/**
 * The settings that follow the writer from computer to computer, and those
 * that stay on each, are listed by name in the core (record 0119). A
 * setting in neither list is sent nowhere, without anyone having decided
 * so: this holds every setting of the interface to be in one of them.
 */

const RUST = 'crates/core/src/sync/settings.rs';

/** The names in one of the two lists of the core, comments left out. */
function listed(name: 'FOLLOW' | 'STAY'): string[] {
  const list = new RegExp(`pub const ${name}: &\\[&str\\] = &\\[([\\s\\S]*?)\\];`).exec(source);
  if (!list) throw new Error(`${name} is not found in ${RUST}`);
  const body = list[1]
    .split('\n')
    .map((line) => line.replace(/\/\/.*$/, ''))
    .join('\n');
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Every setting of the interface: those `api/system.ts` declares, and those
 * the state of the settings keeps beyond them, as the window has them
 * before the file is read (every key it keeps is there, with what it is
 * where nothing is chosen).
 */
const ofTheInterface = [
  ...new Set([...Object.keys(defaultSettings), ...Object.keys(settings.value)]),
];

/**
 * Settings the interface no longer writes, but reads from the file where an
 * earlier version wrote them, in place of those that came after them
 * (`state/settings.svelte.ts`): they are not among the keys of the window's
 * settings, so they are named here by hand.
 */
const readFromEarlier = ['headingNumbers', 'notebookListWidth'];

describe('the settings that follow the writer and those that stay on each computer', () => {
  const follow = listed('FOLLOW');
  const stay = listed('STAY');

  it('are read from the core, and the settings of the interface from the interface', () => {
    expect(follow).toContain('person');
    expect(stay).toContain('window');
    // Declared in `api/system.ts`, and kept beyond it by the state of the settings.
    expect(ofTheInterface).toContain('theme');
    expect(ofTheInterface).toContain('enterBreaks');
  });

  it('take in every setting of the interface, each in one of the two lists', () => {
    const neither = [...ofTheInterface, ...readFromEarlier].filter(
      (name) => !follow.includes(name) && !stay.includes(name),
    );
    expect(
      neither,
      `A setting is in neither list of crates/core/src/sync/settings.rs. Put each in FOLLOW, ` +
        `where it is the writer's own, or in STAY, where it belongs to the screen, to what is ` +
        `installed, or to where things were left: ${neither.join(', ')}`,
    ).toEqual([]);
  });

  it('have no setting in both', () => {
    const both = follow.filter((name) => stay.includes(name));
    expect(
      both,
      `A setting is in both lists of crates/core/src/sync/settings.rs; take it out of one: ${both.join(', ')}`,
    ).toEqual([]);
  });
});
