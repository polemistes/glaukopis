/**
 * What the window knows of the chats of the projects open (record 0092):
 * whether a project has one to show, how many of its messages are unread,
 * whether its chat is shown, and what is asked of the window from a toast
 * (that the chat of a project be shown). Read by the document pane's tabs,
 * the Document button of a side's bar, the keys and `ChatHost`.
 *
 * All of it depends on the messages of a project (`project.chat`, made anew
 * only when the chat changes), on the mark of what was read and on the
 * panes: never on what is written in the text.
 */

import { SvelteMap } from 'svelte/reactivity';
import { me } from '$lib/history/me.svelte';
import type { OpenProject } from '$lib/project/open-projects.svelte';
import { panes } from '$lib/project/panes.svelte';
import { sides, type DocumentTab } from '$lib/project/sides.svelte';
import { arrivals, unread } from './reading';

class ChatUi {
  /** The project whose chat is asked to be shown. */
  project = $state<string | null>(null);
  /** Rises each time the chat of a project is asked to be shown: the document pane follows it. */
  asked = $state(0);
  /**
   * Whether the window is in front: false once it has lost the focus, true
   * again when it has it or is pressed or written in. Kept by `ChatHost`.
   */
  inFront = $state(true);
  /**
   * The new messages of each project whose chat is shown (record 0107): of
   * others, unread when the chat came to be shown, or arrived since. Kept
   * by `ChatHost`; none once the chat is not shown, or one's own message is
   * sent.
   */
  readonly fresh = new SvelteMap<string, ReadonlySet<string>>();

  /** Asks for the chat of a project to be shown. */
  show(project: string) {
    this.project = project;
    this.asked++;
  }
}

export const chatUi = new ChatUi();

/**
 * The field of the chat, among those of a project in which something is
 * written and not yet sent (`OpenProject.drafts`, record 0094).
 */
export const CHAT_FIELD = 'chat';

/**
 * Whether a project has a chat to show: while it is shared, or while it
 * holds messages, as when the sharing has ended or it came as a file.
 */
export function hasChat(open: OpenProject | null | undefined): boolean {
  return !!open?.project && (!!open.sharing?.shared || open.project.chat.length > 0);
}

/** Who works in a project, as its chat knows them: by their id. */
export function meIn(open: OpenProject | null | undefined): string | undefined {
  return me()?.id ?? open?.project?.me?.id;
}

/** The unread messages of a project's chat, by others: see `unread`. */
export function unreadOf(open: OpenProject | null | undefined) {
  const p = open?.project;
  if (!p || !p.chat.length) return [];
  return unread(p.chat, open.chatRead, meIn(open));
}

/** The ids of the messages of each project whose chat is shown, as they were when last looked at. */
const known = new Map<string, Set<string>>();

/**
 * Keeps what is new in a project's chat (record 0107), in `chatUi.fresh`:
 * when the chat comes to be shown, the unread messages of others; while it
 * is shown, those of others that arrive; nothing once one's own is sent,
 * or the chat is not shown. Called by `ChatHost` whenever the messages or
 * the panes change, before the messages are counted as read.
 */
export function keepFresh(open: OpenProject, shown: boolean) {
  const messages = open.project?.chat ?? [];
  if (!shown) {
    known.delete(open.id);
    if (chatUi.fresh.has(open.id)) chatUi.fresh.delete(open.id);
    return;
  }
  const was = known.get(open.id);
  known.set(open.id, new Set(messages.map((m) => m.id).filter(Boolean)));
  if (!was) {
    chatUi.fresh.set(open.id, new Set(unreadOf(open).map((m) => m.id)));
    return;
  }
  const { theirs, mine } = arrivals(messages, was, meIn(open));
  if (mine) chatUi.fresh.set(open.id, new Set());
  else if (theirs.length)
    chatUi.fresh.set(open.id, new Set([...(chatUi.fresh.get(open.id) ?? []), ...theirs]));
}

/** How many messages of a project's chat are unread. */
export function unreadCount(open: OpenProject | null | undefined): number {
  return unreadOf(open).length;
}

/** What the document pane shows of a project: the references in place of a chat it has not. */
export function tabShown(tab: DocumentTab, open: OpenProject | null | undefined): DocumentTab {
  return tab === 'chat' && !hasChat(open) ? 'references' : tab;
}

/** Whether the chat of a project is shown: the document pane is open at it, for the side of that project. */
export function chatShown(open: OpenProject | null | undefined): boolean {
  return (
    !!open &&
    panes.document &&
    panes.tab === 'chat' &&
    sides.map?.project === open.id &&
    hasChat(open)
  );
}
