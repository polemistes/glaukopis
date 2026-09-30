/**
 * How far the writing of a map has come, from what is said of each element
 * (`Status`): so many done, so many drafts, so many ideas, and the words
 * written in the drafts and in what is done.
 */

import { languages, t } from '$lib/i18n';
import type { Project } from './model/project.svelte';
import type { Status } from './model/types';

export interface Progress {
  idea: number;
  draft: number;
  done: number;
  /** The words of the drafts and of what is done. */
  words: number;
}

/** How far a map has come; nothing where no element of it says. */
export function progressOf(project: Project, mapId: string): Progress | null {
  const out: Progress = { idea: 0, draft: 0, done: 0, words: 0 };
  let any = false;
  for (const n of project.nodes.values()) {
    if (n.map !== mapId || !n.status) continue;
    any = true;
    out[n.status]++;
    if (n.status !== 'idea') out.words += n.words;
  }
  return any ? out : null;
}

/** The counts of a map's progress, in words, the furthest first: "2 done", "3 drafts", "1 idea". */
export function progressWords(progress: Progress): string[] {
  const parts: string[] = [];
  for (const status of ['done', 'draft', 'idea'] as const) {
    if (progress[status]) parts.push(t(`status-count-${status}`, { count: progress[status] }));
  }
  return parts;
}

/** What is said of an element's status where it is shown: "Draft · 340 words". */
export function statusWords(status: Status, words: number): string {
  return t('status-of', { status: t(`status-${status}`), count: words });
}

/** A number as the language of the interface writes it. */
export function number(value: number): string {
  return value.toLocaleString(languages.current);
}
