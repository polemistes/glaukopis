/**
 * Who else has a project open, and where, as the awareness of Yjs tells it;
 * and what this user tells them. It is there for every project, shared or
 * not, so that the editors need not be made anew when a project is shared;
 * it says nothing of this user until `present` has been called.
 */

import type * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';

/** Someone else who has the project open. */
export interface Other {
  /** One for each window a person has the project open in. */
  client: number;
  name: string;
  color: string;
  /** The collaborator, or nothing for the owner. */
  member: string | null;
  /** The element the person is at, if any. */
  node: string | null;
}

const NONE: Other[] = [];

export class Presence {
  /** The others who have the project open, while it is shared. */
  others = $state.raw<Other[]>([]);
  readonly #doc: Y.Doc;
  #awareness: Awareness | null = null;

  constructor(doc: Y.Doc) {
    this.#doc = doc;
  }

  get awareness(): Awareness {
    if (!this.#awareness) {
      this.#awareness = new Awareness(this.#doc);
      this.#awareness.setLocalState(null);
      this.#awareness.on('change', () => this.#readOthers());
    }
    return this.#awareness;
  }

  #readOthers() {
    const others: Other[] = [];
    for (const [client, state] of this.awareness.getStates()) {
      if (client === this.#doc.clientID) continue;
      const told = state as { user?: Partial<Other>; at?: unknown };
      if (!told.user?.name) continue;
      others.push({
        client,
        name: String(told.user.name),
        color: typeof told.user.color === 'string' ? told.user.color : '#6b7280',
        member: typeof told.user.member === 'string' ? told.user.member : null,
        node: typeof told.at === 'string' ? told.at : null,
      });
    }
    others.sort((a, b) => a.name.localeCompare(b.name) || a.client - b.client);
    this.others = others;
  }

  /** Those of the others who are at an element. */
  othersAt(node: string): Other[] {
    return this.others.length ? this.others.filter((o) => o.node === node) : NONE;
  }

  /** Tells the others who this is; or, with nothing, no longer tells them. */
  present(user: { name: string; color: string; member: string | null } | null) {
    this.awareness.setLocalState(user ? { user } : null);
  }

  /** Tells the others which element this user is at. */
  at(node: string | null) {
    const awareness = this.#awareness;
    const state = awareness?.getLocalState() as { at?: string | null } | null | undefined;
    if (!awareness || !state || (state.at ?? null) === node) return;
    awareness.setLocalStateField('at', node);
  }

  destroy() {
    this.#awareness?.destroy();
  }
}
