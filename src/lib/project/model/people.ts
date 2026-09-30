/**
 * The people of a project whose full history is on (ADR 0021), as Yjs's
 * `PermanentUserData` keeps them in the document, so that every copy knows
 * who wrote what: each person, the copies that are theirs (`ids`), what
 * they deleted (`ds`), and their name.
 */

import * as Y from 'yjs';
import { HISTORY } from './origins';

/** The person who works here, as the history knows them. */
export interface Me {
  id: string;
  name: string;
}

type DeleteSet = ReturnType<typeof Y.createDeleteSet>;

/** How many records of what a person deleted are kept before they are merged into one. */
const DELETIONS_MERGED_AFTER = 20;

export class People {
  readonly #doc: Y.Doc;
  readonly #users: Y.Map<Y.Map<unknown>>;
  /** Whether the history is on. */
  readonly #on: () => boolean;
  #me: Me | null = null;
  /** What was deleted here since the last batch, while the history is on. */
  #deleted: DeleteSet[] = [];

  constructor(doc: Y.Doc, users: Y.Map<Y.Map<unknown>>, on: () => boolean) {
    this.#doc = doc;
    this.#users = users;
    this.#on = on;
  }

  get me(): Me | null {
    return this.#me;
  }

  /**
   * Says who works here. While the history is on, the project keeps them
   * among its people, with their name as it is now.
   */
  setMe(me: Me | null) {
    this.#me = me;
    this.introduce();
  }

  /** The project comes to know who works here, if it does not. */
  introduce() {
    const me = this.#me;
    if (!me || !this.#on()) return;
    const user = this.#users.get(me.id);
    const known =
      user instanceof Y.Map &&
      (user.get('ids') as Y.Array<number> | undefined)?.toArray().includes(this.#doc.clientID) &&
      (!me.name || user.get('name') === me.name);
    if (!known) this.#doc.transact(() => this.#register(me), HISTORY);
  }

  /** Makes sure the project knows this person, this copy as theirs, and their name. */
  #register(me: Me): Y.Map<unknown> {
    let user = this.#users.get(me.id);
    if (!(user instanceof Y.Map)) {
      user = new Y.Map<unknown>();
      user.set('ids', new Y.Array<number>());
      user.set('ds', new Y.Array<Uint8Array>());
      this.#users.set(me.id, user);
    }
    const ids = user.get('ids') as Y.Array<number>;
    if (!ids.toArray().includes(this.#doc.clientID)) ids.push([this.#doc.clientID]);
    if (me.name && user.get('name') !== me.name) user.set('name', me.name);
    return user;
  }

  /** Something was deleted here: Yjs does not say by whom. */
  deleted(deleteSet: DeleteSet) {
    this.#deleted.push(deleteSet);
  }

  /**
   * What was deleted here since the last batch is written into the
   * document, as `PermanentUserData` keeps it, so that every copy knows who
   * deleted it. Once for each batch rather than for each change.
   */
  noteDeleted() {
    if (!this.#deleted.length) return;
    const deleted = Y.mergeDeleteSets(this.#deleted);
    this.#deleted = [];
    const me = this.#me;
    if (!me || !this.#on()) return;
    this.#doc.transact(() => {
      const user = this.#register(me);
      // A snapshot without a state vector is the delete set as `PermanentUserData` reads it.
      (user.get('ds') as Y.Array<Uint8Array>).push([
        Y.encodeSnapshot(Y.createSnapshot(deleted, new Map())),
      ]);
    }, HISTORY);
  }

  /**
   * What each person deleted is kept as one record for each batch of
   * changes: merged into one record for each person, now and then, so that
   * the project does not grow with the records. Everyone reads them as
   * one set, so a copy that merges while another adds loses nothing. Where
   * the history is off, the records are let go. The people stay, with their
   * names: `PermanentUserData`, which the history reads them with, cannot
   * be told of a person who is taken away.
   */
  tidy() {
    const on = this.#on();
    const records = [...this.#users.values()]
      .map((user) => (user instanceof Y.Map ? user.get('ds') : null))
      .filter((ds): ds is Y.Array<unknown> => ds instanceof Y.Array)
      .filter((ds) => ds.length > (on ? DELETIONS_MERGED_AFTER : 0));
    if (!records.length) return;
    this.#doc.transact(() => {
      for (const ds of records) {
        if (!on) {
          ds.delete(0, ds.length);
          continue;
        }
        const sets = (ds.toArray() as unknown[])
          .filter((bytes): bytes is Uint8Array => bytes instanceof Uint8Array)
          .map((bytes) => Y.decodeSnapshot(bytes).ds);
        const merged = Y.encodeSnapshot(Y.createSnapshot(Y.mergeDeleteSets(sets), new Map()));
        ds.delete(0, ds.length);
        ds.push([merged]);
      }
    }, HISTORY);
  }
}
