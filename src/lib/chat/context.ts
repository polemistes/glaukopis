/**
 * What a message of the chat drawn in the panel knows and can ask for
 * (record 0107): handed down by the panel to its groups and messages as one
 * object, whose parts are read where they are drawn, so that each follows
 * what it reads.
 */

import type { ChatMessage, ChatQuote, ChatReader } from '$lib/project/model/types';
import type { Chip } from './reading';

export interface MessageContext {
  /** The id of the one who works here. */
  readonly me: string;
  /** Whether the project is shared now: only then can anything be written. */
  readonly shared: boolean;
  /** Who has read a message, but its writer and oneself. */
  readersOf(id: string): ChatReader[];
  /** The reactions to a message, one chip for each emoji. */
  chipsOf(id: string): Chip[];
  /** Whether a message is new (record 0107): of another, unread when the chat came to be shown, or arrived since. */
  isNew(id: string): boolean;
  /** Whether a message is lit for a moment, having been gone to from a quote of it. */
  isLit(id: string): boolean;
  /** A message of the chat, by its id: nothing where it is not there (taken back). */
  messageOf(id: string): ChatMessage | null;
  /** Words of a message marked when the press going on began (`quoting.ts`): nothing at a key. */
  caught(): ChatQuote | null;
  /** Begins an answer to a message, with words marked to be quoted, where there are any. */
  answer(message: ChatMessage, quote?: ChatQuote | null): void;
  /** Brings a message into the middle of the list, and lights it for a moment. */
  goTo(id: string): void;
  /** Opens the choosing of an emoji for a message, at an element. */
  react(message: ChatMessage, at: HTMLElement): void;
  /** Gives one's own reaction of an emoji to a message, or takes it back. */
  toggle(message: ChatMessage, emoji: string): void;
  /** Begins to change one's own message. */
  edit(message: ChatMessage): void;
  /** Takes one's own message back. */
  remove(message: ChatMessage): void;
}
