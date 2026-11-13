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

import { me } from '$lib/history/me.svelte';
import type { OpenProject } from '$lib/project/open-projects.svelte';
import { panes } from '$lib/project/panes.svelte';
import { sides, type DocumentTab } from '$lib/project/sides.svelte';
import { unread } from './reading';

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

  /** Asks for the chat of a project to be shown. */
  show(project: string) {
    this.project = project;
    this.asked++;
  }
}

export const chatUi = new ChatUi();

/**
 * Whether a project has a chat to show: while it is shared, or while it
 * holds messages, as when the sharing has ended or it came as a file.
 */
export function hasChat(open: OpenProject | null | undefined): boolean {
  return !!open?.project && (!!open.sharing?.shared || open.project.chat.length > 0);
}

/** The unread messages of a project's chat, by others: see `unread`. */
export function unreadOf(open: OpenProject | null | undefined) {
  const p = open?.project;
  if (!p || !p.chat.length) return [];
  return unread(p.chat, open.chatRead, me()?.id ?? p.me?.id);
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
