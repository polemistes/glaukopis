/**
 * Changing the chat of a project (record 0092): saying something, taking
 * one's own message back, and deleting the whole conversation. These are
 * methods of `Project`, which takes them in (see there).
 *
 * The messages are an array of plain objects in the project's document,
 * `chat`, which reaches the others as every other change does, and is there
 * for whoever opens the project later. What is done here is outside undo:
 * by its own origin (`CHAT`), and since the array is not in the scope of the
 * undo manager at all. A message is its author's: only they take it back.
 */

import { newId } from '$lib/util/id';
import { CHAT, nowIso, str } from '../origins';
import type { Project } from '../project.svelte';
import type { ChatMessage } from '../types';

/** The most characters a message holds: what is longer is cut. */
export const MESSAGE_LENGTH = 4000;

/** Who writes here, as a message names them. */
function author(p: Project): ChatMessage['author'] {
  return { id: p.me?.id ?? '', name: p.me?.name ?? '' };
}

/** A message as it is to be kept: trimmed, and cut where it is too long. */
export function cleanMessage(text: string): string {
  const clean = text.trim();
  const signs = [...clean];
  return signs.length > MESSAGE_LENGTH ? signs.slice(0, MESSAGE_LENGTH).join('').trimEnd() : clean;
}

export const chatChanges = {
  /** Says something in the chat. Returns the id of the message; nothing for an empty one. */
  say(this: Project, text: string): string | null {
    const clean = cleanMessage(text);
    if (!clean) return null;
    const id = newId();
    const message: ChatMessage = { id, author: author(this), created: nowIso(), text: clean };
    this.doc.transact(() => this.yChat.push([message]), CHAT);
    return id;
  },

  /**
   * Takes a message back: one's own alone. Returns where it stood and what
   * it was, so that it can be put back; nothing where nothing was taken.
   */
  unsay(this: Project, id: string): { index: number; message: ChatMessage } | null {
    const me = this.me?.id;
    if (!me) return null;
    const index = this.yChat.toArray().findIndex((m) => chatMessageOf(m)?.id === id);
    if (index < 0) return null;
    const message = chatMessageOf(this.yChat.get(index));
    if (!message || message.author.id !== me) return null;
    this.doc.transact(() => this.yChat.delete(index, 1), CHAT);
    return { index, message };
  },

  /** Puts a message that was taken back where it stood, or at the end where the chat has grown shorter since. */
  resay(this: Project, taken: { index: number; message: ChatMessage }) {
    if (this.yChat.toArray().some((m) => chatMessageOf(m)?.id === taken.message.id)) return;
    this.doc.transact(
      () => this.yChat.insert(Math.min(taken.index, this.yChat.length), [taken.message]),
      CHAT,
    );
  },

  /** Deletes the whole conversation. */
  clearChat(this: Project) {
    if (!this.yChat.length) return;
    this.doc.transact(() => this.yChat.delete(0, this.yChat.length), CHAT);
  },
};

/**
 * A message of the chat, from what may be one. What another copy of the
 * program wrote, a later one or one gone wrong, may lack what a message has:
 * a message is its text, and of the rest each part is taken where it is of
 * its type and is else empty.
 */
export function chatMessageOf(value: unknown): ChatMessage | null {
  if (!value || typeof value !== 'object') return null;
  const held = value as Record<string, unknown>;
  if (typeof held.text !== 'string') return null;
  const by =
    held.author && typeof held.author === 'object' ? (held.author as Record<string, unknown>) : {};
  return {
    id: str(held.id),
    author: { id: str(by.id), name: str(by.name) },
    created: str(held.created),
    text: held.text,
  };
}
