/**
 * What is read of the messages of a chat (records 0092 and 0107), as plain
 * functions: which of them are unread, how they stand together under one
 * name, where a day begins, where each answer stands, who has read a
 * message, the reactions to it, what is new, and what of them is to be told
 * as they arrive. The panel, the tab, the dot on the Document button and the
 * toasts read them from here.
 */

import type { ChatMessage, ChatReaction, ChatReader } from '$lib/project/model/types';

/**
 * The message that was read last, as it is kept on this computer with the
 * project's view: by its id, and by when it was written, for where it has
 * been taken back since.
 */
export interface ReadMark {
  id: string;
  created: string;
}

/** Messages of one person within so many milliseconds of the one before stand together under one name. */
export const TOGETHER = 5 * 60 * 1000;

/** Whether a message is of the one who works here. Where they are not known, none is. */
export const isMine = (message: ChatMessage, me: string | null | undefined): boolean =>
  !!me && message.author.id === me;

/** The mark of the last message, which says that all of them have been read; none where there is none. */
export function markOf(messages: readonly ChatMessage[]): ReadMark | null {
  const last = messages[messages.length - 1];
  return last ? { id: last.id, created: last.created } : null;
}

/** Whether two marks are the same. */
export const sameMark = (a: ReadMark | null, b: ReadMark | null): boolean =>
  a === b || (!!a && !!b && a.id === b.id && a.created === b.created);

/** A mark as it was kept, read with care: what cannot be read is none. */
export function readMark(kept: unknown): ReadMark | null {
  if (!kept || typeof kept !== 'object') return null;
  const { id, created } = kept as Record<string, unknown>;
  return typeof id === 'string' && id && typeof created === 'string' ? { id, created } : null;
}

/**
 * The messages of others that are newer than the one read last: those after
 * it, where it is still there; else those written after it was. With no
 * mark, every message of another is unread.
 */
export function unread(
  messages: readonly ChatMessage[],
  read: ReadMark | null,
  me: string | null | undefined,
): ChatMessage[] {
  let after: readonly ChatMessage[] = messages;
  if (read) {
    const at = messages.findIndex((m) => m.id === read.id);
    after = at >= 0 ? messages.slice(at + 1) : messages.filter((m) => m.created > read.created);
  }
  return after.filter((m) => !isMine(m, me));
}

/** The day a moment falls on, where the reader is: what tells where a day changes. */
export function dayOf(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Messages that stand together: of one person, one after another, within a few minutes. */
export interface Group {
  /** The id of its first message: what the group is known by. */
  key: string;
  author: ChatMessage['author'];
  mine: boolean;
  /** Where the group begins a day that the one before it is not of: that day's first moment; else nothing. */
  day: string | null;
  messages: ChatMessage[];
  /** Of answers: whether the group was written on another day than the day line it stands under. */
  dated?: boolean;
}

/** Who wrote a message, as messages are told apart by it: by their id, else by their name. */
const whoOf = (m: ChatMessage) => m.author.id || `name:${m.author.name}`;

/**
 * Whether a message joins the group before it: of the same person, of the
 * same day (`sameDay`, as the caller knows the day), and written within
 * `together` of the group's last message.
 */
function joins(group: Group, message: ChatMessage, sameDay: boolean, together: number): boolean {
  const before = group.messages[group.messages.length - 1];
  if (!before || !sameDay || whoOf(before) !== whoOf(message)) return false;
  const gap = new Date(message.created).getTime() - new Date(before.created).getTime();
  return gap >= 0 && gap <= together;
}

/**
 * What stands in the list of the chat, one after another (record 0107): a
 * group of messages that answer none, under one name, with the answers to
 * its last message under it; or, where a message that has answers was taken
 * back, its place, with its answers under it.
 */
export interface Entry {
  key: string;
  /** Where the entry begins a day that the one before it is not of: that day's first moment; else nothing. */
  day: string | null;
  /** The messages that answer none, under one name; none in the place of a message taken back. */
  group: Group | null;
  /** The id of the message the answers answer: the group's last, or the one taken back. */
  answered: string;
  /** The answers to it, in the order they were written, those of one person written together under one name. */
  answers: Group[];
}

/**
 * The id of the message a message answers, as it is placed: one that
 * answers none, or one that is not there (taken back); nothing for a
 * message that answers none. A copy gone wrong may have made an answer to
 * an answer, or a ring of them: what is answered is followed up to a
 * message that answers none, and a message in a ring answers none.
 */
function answeredOf(message: ChatMessage, byId: ReadonlyMap<string, ChatMessage>): string | null {
  const seen = new Set<string>([message.id]);
  let at = message;
  while (at.to && at.to !== at.id) {
    const next = byId.get(at.to);
    if (!next) return at.to;
    if (seen.has(next.id)) return null;
    if (!next.to || next.to === next.id) return next.id;
    seen.add(next.id);
    at = next;
  }
  return null;
}

/**
 * The messages as they stand in the list: those that answer none in the
 * order they were written, in groups under one name as `groups` has them,
 * a message with answers ending its group; under each group the answers to
 * its last message, in groups of their own; and the answers to a message
 * that was taken back together, where the first of them stood. Nothing ever
 * moves: an answer is placed under its message however old that is.
 */
export function placed(
  messages: readonly ChatMessage[],
  me: string | null | undefined,
  together = TOGETHER,
): Entry[] {
  const byId = new Map<string, ChatMessage>();
  for (const m of messages) if (m.id && !byId.has(m.id)) byId.set(m.id, m);
  const answers = new Map<string, ChatMessage[]>();
  const order: ({ message: ChatMessage } | { gone: string })[] = [];
  for (const message of messages) {
    const answered = answeredOf(message, byId);
    if (answered === null) {
      order.push({ message });
      continue;
    }
    let list = answers.get(answered);
    if (!list) {
      answers.set(answered, (list = []));
      if (!byId.has(answered)) order.push({ gone: answered });
    }
    list.push(message);
  }

  /** The answers to a message in groups, each told whether it is of another day than the line above. */
  const answerGroups = (answered: string, lineDay: string | null): Group[] => {
    const out: Group[] = [];
    for (const message of answers.get(answered) ?? []) {
      const day = dayOf(message.created);
      const last = out[out.length - 1];
      if (last && joins(last, message, dayOf(last.messages[0].created) === day, together)) {
        last.messages.push(message);
        continue;
      }
      out.push({
        key: message.id || `#${answered}:${out.length}`,
        author: message.author,
        mine: isMine(message, me),
        day: null,
        messages: [message],
        dated: !!day && day !== lineDay,
      });
    }
    return out;
  };

  const out: Entry[] = [];
  let lastDay: string | null = null;
  for (const item of order) {
    if ('gone' in item) {
      const first = answers.get(item.gone)![0];
      const day = dayOf(first.created);
      const begins = !!day && day !== lastDay;
      lastDay = day || lastDay;
      out.push({
        key: `#gone:${item.gone}`,
        day: begins ? first.created : null,
        group: null,
        answered: item.gone,
        answers: answerGroups(item.gone, lastDay),
      });
      continue;
    }
    const { message } = item;
    const day = dayOf(message.created);
    const last = out[out.length - 1];
    // A message that has answers ends its group: what follows it begins a new one.
    if (
      last?.group &&
      !last.answers.length &&
      joins(last.group, message, day === lastDay, together)
    ) {
      last.group.messages.push(message);
      last.answered = message.id;
      last.answers = message.id ? answerGroups(message.id, lastDay) : [];
      continue;
    }
    const begins = !!day && day !== lastDay;
    lastDay = day || lastDay;
    // A message without an id is known by its place, in a way no id is written.
    const key = message.id || `#${out.length}`;
    out.push({
      key,
      day: begins ? message.created : null,
      group: {
        key,
        author: message.author,
        mine: isMine(message, me),
        day: begins ? message.created : null,
        messages: [message],
      },
      answered: message.id,
      answers: message.id ? answerGroups(message.id, lastDay) : [],
    });
  }
  return out;
}

/**
 * Who has read each message, by its id: everyone whose mark is that
 * message or one after it, or, where the message of their mark has been
 * taken back since, whose mark was written when the message was or after;
 * never its writer, nor the one who works here (`me`).
 */
export function readersOf(
  messages: readonly ChatMessage[],
  readers: readonly ChatReader[],
  me: string | null | undefined,
): Map<string, ChatReader[]> {
  const out = new Map<string, ChatReader[]>();
  if (!readers.length) return out;
  const at = new Map<string, number>();
  messages.forEach((m, i) => {
    if (m.id && !at.has(m.id)) at.set(m.id, i);
  });
  for (const reader of readers) {
    if (reader.id === me) continue;
    const upTo = at.get(reader.read.id);
    messages.forEach((message, i) => {
      if (!message.id || message.author.id === reader.id) return;
      const read = upTo !== undefined ? i <= upTo : message.created <= reader.read.created;
      if (!read) return;
      let list = out.get(message.id);
      if (!list) out.set(message.id, (list = []));
      list.push(reader);
    });
  }
  return out;
}

/** The reactions to a message with one emoji: how many gave it, who, and whether oneself is among them. */
export interface Chip {
  emoji: string;
  count: number;
  names: string[];
  mine: boolean;
}

/** The reactions to each message, by its id, as chips: one for each emoji, in the order each was first given. */
export function chipsOf(
  reactions: readonly ChatReaction[],
  me: string | null | undefined,
): Map<string, Chip[]> {
  const out = new Map<string, Chip[]>();
  for (const r of reactions) {
    let chips = out.get(r.message);
    if (!chips) out.set(r.message, (chips = []));
    let chip = chips.find((c) => c.emoji === r.emoji);
    if (!chip) chips.push((chip = { emoji: r.emoji, count: 0, names: [], mine: false }));
    chip.count++;
    chip.names.push(r.person.name);
    if (!!me && r.person.id === me) chip.mine = true;
  }
  return out;
}

/**
 * What has arrived since the messages known before (`known`, their ids):
 * the ids of those of others, and whether one of one's own is among them.
 */
export function arrivals(
  messages: readonly ChatMessage[],
  known: ReadonlySet<string>,
  me: string | null | undefined,
): { theirs: string[]; mine: boolean } {
  const theirs: string[] = [];
  let mine = false;
  for (const m of messages) {
    if (!m.id || known.has(m.id)) continue;
    if (isMine(m, me)) mine = true;
    else theirs.push(m.id);
  }
  return { theirs, mine };
}

/** Where a message stands, against the part of the list that is shown. */
export interface Standing {
  id: string;
  top: number;
  bottom: number;
}

/** Whether a message is within what is shown of the list, wholly or in part. */
export const within = (s: { top: number; bottom: number }, view: { top: number; bottom: number }) =>
  s.bottom > view.top && s.top < view.bottom;

/**
 * Of the new messages not yet seen, the one nearest to what is shown of the
 * list, and whether it is above it; nothing where there is none.
 */
export function nearest(
  unseen: readonly Standing[],
  view: { top: number; bottom: number },
): { id: string; up: boolean } | null {
  let best: { id: string; up: boolean; far: number } | null = null;
  for (const s of unseen) {
    const up = s.bottom <= view.top;
    const far = up ? view.top - s.bottom : s.top - view.bottom;
    if (!best || far < best.far) best = { id: s.id, up, far };
  }
  return best && { id: best.id, up: best.up };
}

/**
 * The messages in groups, in their order: a message joins the group before
 * it where it is of the same person, of the same day, and written within
 * `TOGETHER` of the message before it.
 */
export function groups(
  messages: readonly ChatMessage[],
  me: string | null | undefined,
  together = TOGETHER,
): Group[] {
  const out: Group[] = [];
  let lastDay: string | null = null;
  for (const message of messages) {
    const day = dayOf(message.created);
    const last = out[out.length - 1];
    if (last && joins(last, message, day === lastDay, together)) {
      last.messages.push(message);
      continue;
    }
    out.push({
      key: message.id || `${out.length}`,
      author: message.author,
      mine: isMine(message, me),
      day: day && day !== lastDay ? message.created : null,
      messages: [message],
    });
    lastDay = day || lastDay;
  }
  return out;
}

/** The first words of a message, on one line, cut with an ellipsis where they go on. */
export function firstWords(text: string, most = 60): string {
  const line = text.replace(/\s+/g, ' ').trim();
  const signs = [...line];
  if (signs.length <= most) return line;
  const cut = signs.slice(0, most).join('');
  const space = cut.lastIndexOf(' ');
  return `${(space > most / 2 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/**
 * Of the messages, those to be told as they arrive: the unread ones of
 * others that have not been told yet. Those returned are counted as told.
 */
export function toTell(
  messages: readonly ChatMessage[],
  read: ReadMark | null,
  me: string | null | undefined,
  told: Set<string>,
): ChatMessage[] {
  const out = unread(messages, read, me).filter((m) => !told.has(m.id));
  for (const m of out) told.add(m.id);
  return out;
}
