/**
 * Words of a message marked to be quoted (record 0107, added to): what is
 * selected, read at the press, before the press itself changes it. A right
 * click selects the word under it on macOS, and a press in the field takes
 * the selection away, so the panel reads it at `pointerdown`, in the capture
 * phase, and what the press begins uses what was caught then.
 */

import { chatQuoteOf } from '$lib/project/model/changing/chat';
import type { ChatQuote } from '$lib/project/model/types';

/** The words of the message a node of the panel is within: its `.text`; nothing elsewhere. */
function wordsAround(node: Node | null, panel: Element): HTMLElement | null {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  const words = el?.closest<HTMLElement>('[data-chat-message] .text') ?? null;
  return words && panel.contains(words) ? words : null;
}

/**
 * The words selected, as a quote, where both ends of the selection are
 * within the words of one message of the panel, an answer too: the id of
 * the message and the words, trimmed, cut where they are long. Nothing for
 * a selection that is empty, runs over more than one message, or lies
 * anywhere else, such as in the quote at the top of a message.
 */
export function caughtOf(selection: Selection | null, panel: Element): ChatQuote | null {
  if (!selection || !selection.rangeCount || selection.isCollapsed) return null;
  const words = wordsAround(selection.anchorNode, panel);
  if (!words || words !== wordsAround(selection.focusNode, panel)) return null;
  const id = words.closest<HTMLElement>('[data-chat-message]')?.dataset.chatMessage;
  if (!id) return null;
  return chatQuoteOf({ id, text: selection.toString() });
}
