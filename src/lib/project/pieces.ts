/**
 * Words with markup among them: keys to press, or the name of a map in
 * bold. The words are one message, so that a translation puts the keys and
 * the name where its language has them; what the message says is cut where
 * they stand, and each is shown in markup of its own.
 *
 *     pieces((marks) => `Click it · ${marks.esc} to leave it`, { esc: 'Esc' })
 *     // [{ text: 'Click it · ' }, { text: 'Esc', name: 'esc' }, { text: ' to leave it' }]
 *
 * The message is looked up by the function given, which calls `t` with the
 * name written out, so that the tests find the name and see that it is in
 * every language.
 */

import type { Args } from '$lib/i18n';

/** A piece of what a message says: words, or what a variable stands for. */
export interface Piece {
  text: string;
  /** The name of the variable, where the piece is one. */
  name?: string;
}

/** Marks from the Private Use Area of Unicode, which no message holds. */
const FIRST = 0xe000;
const MARK = /([-])/;

/**
 * What a message says, in pieces. `say` looks the message up with the
 * variables it is given; `marked` are those that stand in markup, by name,
 * each with what it stands for.
 */
export function pieces(say: (marks: Args) => string, marked: Record<string, string>): Piece[] {
  const names = Object.keys(marked);
  const marks: Args = {};
  names.forEach((name, i) => (marks[name] = String.fromCharCode(FIRST + i)));
  const out: Piece[] = [];
  for (const part of say(marks).split(MARK)) {
    if (!part) continue;
    const name = MARK.test(part) ? names[part.charCodeAt(0) - FIRST] : undefined;
    out.push(name === undefined ? { text: part } : { text: marked[name], name });
  }
  return out;
}
