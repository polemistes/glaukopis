/**
 * What is written in the fields of a project and not yet sent (record 0094):
 * the message of the chat that is being written, an answer to a comment, a
 * comment that is being begun, a note that is being changed. It is there
 * until it is sent or given up, whatever the window shows meanwhile and
 * whether the project stays open or not: a panel that is taken away and
 * shown again finds it as it was.
 *
 * It is about the one who writes, and not about the project: it is kept
 * with the view of the project on this computer, and not in the project, so
 * that nobody a project is shared with sees what was not sent.
 */

import { SvelteMap } from 'svelte/reactivity';

export class Drafts {
  /** What is written, by the field: a field that is being written in is here, though it be empty. */
  readonly #fields = new SvelteMap<string, string>();

  constructor(kept: Record<string, string> = {}) {
    this.load(kept);
  }

  /** Takes what was kept, in place of what there is. */
  load(kept: Record<string, string>) {
    this.#fields.clear();
    for (const [field, text] of Object.entries(kept)) this.#fields.set(field, text);
  }

  /** What is written in a field; nothing where nothing is. */
  of(field: string): string {
    return this.#fields.get(field) ?? '';
  }

  /** Whether a field is being written in: begun, and neither sent nor given up, though it be empty. */
  has(field: string): boolean {
    return this.#fields.has(field);
  }

  /** Keeps what is written in a field. */
  write(field: string, text: string) {
    if (this.#fields.get(field) !== text) this.#fields.set(field, text);
  }

  /** A field is sent, or given up: what was written in it is kept no more. */
  drop(field: string) {
    this.#fields.delete(field);
  }

  /** The fields that are being written in. */
  fields(): string[] {
    return [...this.#fields.keys()];
  }

  /**
   * What is kept from one opening to the next: the fields that hold words,
   * and that still have their place (the thread of an answer may be gone).
   */
  kept(there: (field: string) => boolean = () => true): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [field, text] of this.#fields) if (text && there(field)) out[field] = text;
    return out;
  }
}
