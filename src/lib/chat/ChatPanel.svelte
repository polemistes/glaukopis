<script lang="ts">
  /**
   * The chat of a project, a tab of the document pane (records 0092 and
   * 0107): its messages from the oldest to the newest, each answer under the
   * message it answers, those of one person written close together under
   * one name, a line with the date where the day changes; under them the
   * field (`ChatField`), where Enter sends and Shift+Enter makes a new line,
   * and over it a line that says what is answered or changed. What is
   * written there and not yet sent is its holder's to keep (`draft`), with
   * what it answers or changes, so that it is there again when the panel is
   * (record 0094). New messages are marked, and a button over the foot of
   * the list leads to those not yet seen. While the project is not shared,
   * the messages are shown without the field, nothing can be written, and
   * the whole conversation can be deleted.
   */
  import type { Snippet } from 'svelte';
  import { tick, untrack } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Reply from '@lucide/svelte/icons/reply';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { languages, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { ChatMessage, ChatWords } from '$lib/project/model/types';
  import { confirm } from '$lib/ui/confirm.svelte';
  import EmojiPicker from '$lib/ui/EmojiPicker.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import ChatField from './ChatField.svelte';
  import ChatGroup from './ChatGroup.svelte';
  import type { MessageContext } from './context';
  import {
    chipsOf,
    firstWords,
    nearest,
    placed,
    readersOf,
    within,
    type Standing,
  } from './reading';
  import { NOTHING, keptOf, writtenOf, type Written } from './written';

  interface Props {
    project: Project;
    /** Whether the project is shared now: only then can anything be written. */
    shared: boolean;
    /** What is written in the field and not yet sent, as `keptOf` writes it. */
    draft?: string;
    /** The messages that are new: see `chatUi.fresh`. */
    fresh?: ReadonlySet<string>;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the document pane. */
    head?: Snippet;
  }

  const NONE: never[] = [];
  const NO_IDS: ReadonlySet<string> = new Set();

  let { project, shared, draft = $bindable(''), fresh = NO_IDS, onclose, head }: Props = $props();

  const me = $derived(project.me?.id ?? '');
  const entries = $derived(placed(project.chat, me));
  const byId = $derived(new Map(project.chat.map((m) => [m.id, m])));
  const readers = $derived(readersOf(project.chat, project.chatReaders, me));
  const chips = $derived(chipsOf(project.chatReactions, me));

  /** The day an entry begins, in full, in the language of the interface. */
  const dayFormat = $derived(new Intl.DateTimeFormat(languages.current, { dateStyle: 'full' }));

  function format(how: Intl.DateTimeFormat, iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : how.format(date);
  }

  // ---- what is written ----
  const written = $derived(writtenOf(draft));
  const answering = $derived(written.to ? (byId.get(written.to) ?? null) : null);
  const editing = $derived(written.editing ? (byId.get(written.editing) ?? null) : null);
  /** Rises each time the field is to take the focus. */
  let focus = $state(0);

  const write = (to: Written) => (draft = keptOf(to));
  /** What was being written before a change, which comes back when the change is kept or given up. */
  const before = (w: Written): Written => (w.before ? { ...w.before } : NOTHING);

  // A change whose message is gone is given up; an answer whose message is
  // gone answers none. It depends on what is written and on the messages.
  $effect(() => {
    const w = written;
    const there = byId;
    untrack(() => {
      if (w.editing && !there.has(w.editing)) write(before(w));
      else if (w.to && !there.has(w.to)) write({ words: w.words });
    });
  });

  function send() {
    const w = written;
    if (w.editing) {
      if (!w.words.text.trim()) return;
      project.reword(w.editing, w.words);
      write(before(w));
      return;
    }
    const id = project.say(w.words, w.to);
    if (!id) return;
    write(NOTHING);
    // An answer is brought into view where it stands; anything else is at the foot.
    if (w.to) bring = id;
    else footNext = true;
  }

  /** Escape gives up a change, or an answering, keeping what is written. */
  function escape(): boolean {
    const w = written;
    if (w.editing) write(before(w));
    else if (w.to) write({ words: w.words });
    else return false;
    return true;
  }

  /** What is written, without a change that was being made. */
  const unchanged = (w: Written): Written => (w.editing ? before(w) : w);

  // ---- what is done with a message ----
  let reacting = $state<{ message: ChatMessage; at: HTMLElement } | null>(null);

  function remove(message: ChatMessage) {
    const taken = project.unsay(message.id);
    if (!taken) return;
    toasts.show(
      {
        kind: 'info',
        message: t('chat-deleted'),
        action: { label: t('common-undo'), run: () => project.resay(taken) },
      },
      7000,
    );
  }

  const ctx: MessageContext = {
    get me() {
      return me;
    },
    get shared() {
      return shared;
    },
    readersOf: (id) => readers.get(id) ?? NONE,
    chipsOf: (id) => chips.get(id) ?? NONE,
    isNew: (id) => fresh.has(id),
    answer(message) {
      write({ words: unchanged(written).words, to: message.id });
      focus++;
    },
    react(message, at) {
      if (shared) reacting = { message, at };
    },
    toggle(message, emoji) {
      if (shared) project.react(message.id, emoji);
    },
    edit(message) {
      if (!shared || written.editing === message.id) return;
      const was = unchanged(written);
      const words: ChatWords = message.marks
        ? { text: message.text, marks: message.marks }
        : { text: message.text };
      write({ words, editing: message.id, before: { words: was.words, to: was.to } });
      focus++;
    },
    remove,
  };

  async function deleteAll() {
    const sure = await confirm({
      title: t('chat-delete-all-title'),
      message: t('chat-delete-all-message'),
      confirm: t('common-delete'),
      cancel: t('common-cancel'),
      danger: true,
    });
    if (sure) project.clearChat();
  }

  // ---- where the list stands ----
  let list = $state<HTMLDivElement>();
  /** Whether the list was at its foot before the messages last changed. */
  let atFoot = true;
  /** Whether the list is to go to its foot when the messages are drawn: one's own message was sent. */
  let footNext = false;
  /** A message to bring into view when the messages are drawn: one's own answer, sent. */
  let bring: string | null = null;
  /** Whether the list has been placed since the chat came to be shown. */
  let placedYet = false;

  const footOf = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 24;

  function toFoot() {
    if (list) list.scrollTop = list.scrollHeight;
  }

  /** The element of a message in the list. */
  const elementOf = (id: string) =>
    [...(list?.querySelectorAll<HTMLElement>('[data-chat-message]') ?? [])].find(
      (el) => el.dataset.chatMessage === id,
    );

  /** Brings a message into view near the top of the list. */
  function nearTop(el: HTMLElement) {
    if (!list) return;
    list.scrollTop += el.getBoundingClientRect().top - list.getBoundingClientRect().top - 32;
  }

  /**
   * Once the messages are drawn: when the chat has come to be shown, the
   * first new message near the top, or else the foot; one's own answer
   * sent, into view; else the foot where the list was at its foot.
   */
  function afterDraw() {
    if (!list) return;
    if (!placedYet) {
      placedYet = true;
      const first = list.querySelector<HTMLElement>('[data-chat-new]');
      if (first) nearTop(first);
      else toFoot();
    } else if (bring) elementOf(bring)?.scrollIntoView?.({ block: 'nearest' });
    else if (atFoot) toFoot();
    bring = null;
    look();
  }

  // Where the list was at its foot when the messages changed, it goes to
  // the foot again once they are drawn; where the reader had gone up, it
  // stays where it is. It depends on the messages alone.
  $effect.pre(() => {
    void project.chat;
    untrack(() => {
      if (list) atFoot = footNext || footOf(list);
      footNext = false;
      void tick().then(afterDraw);
    });
  });

  // ---- what is new and not yet seen ----
  /** The new messages that have been within what is shown of the list. */
  const seen = new Set<string>();
  let unseen = $state(0);
  let toNearest = $state<{ id: string; up: boolean } | null>(null);

  /** Counts as seen the new messages within what is shown, and finds the nearest of those that are not. */
  function look() {
    if (!list) return;
    const view = list.getBoundingClientRect();
    const out: Standing[] = [];
    for (const el of list.querySelectorAll<HTMLElement>('[data-chat-new]')) {
      const id = el.dataset.chatMessage ?? '';
      if (!id || seen.has(id)) continue;
      const at = el.getBoundingClientRect();
      if (within(at, view)) seen.add(id);
      else out.push({ id, top: at.top, bottom: at.bottom });
    }
    unseen = out.length;
    toNearest = nearest(out, view);
  }

  // What is new changes as messages arrive and when one's own is sent.
  $effect(() => {
    const now = fresh;
    untrack(() => {
      if (!now.size) seen.clear();
      void tick().then(look);
    });
  });

  let looking = 0;
  function onscroll() {
    if (looking) return;
    looking = requestAnimationFrame(() => {
      looking = 0;
      look();
    });
  }

  function goToNew() {
    const el = toNearest && elementOf(toNearest.id);
    if (!el) return;
    el.scrollIntoView?.({ block: 'center' });
    look();
  }
</script>

<div class="panel" data-chat>
  <header>
    {#if head}{@render head()}{:else}<h2>{t('chat-title')}</h2>{/if}
    {#if !shared && project.chat.length}
      <IconButton label={t('chat-delete-all')} size="sm" data-chat-delete-all onclick={deleteAll}
        ><Trash2 size={14} /></IconButton
      >
    {/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  <div class="list">
    <div class="body" bind:this={list} {onscroll}>
      {#if !entries.length}
        <EmptyState
          icon={MessagesSquare}
          title={t('chat-none')}
          text={t('chat-none-detail')}
          compact
        />
      {:else}
        {#each entries as entry (entry.key)}
          {#if entry.day}
            <div class="day" role="separator">
              <span>{format(dayFormat, entry.day)}</span>
            </div>
          {/if}
          {#if entry.group}
            <ChatGroup group={entry.group} {ctx} />
          {:else}
            <p class="gone" data-chat-gone>{t('chat-gone')}</p>
          {/if}
          {#if entry.answers.length}
            <div class="answers" data-chat-answers={entry.answered}>
              {#each entry.answers as group (group.key)}
                <ChatGroup {group} {ctx} />
              {/each}
            </div>
          {/if}
        {/each}
      {/if}
    </div>
    {#if unseen && toNearest}
      <button type="button" class="new" data-chat-new-button onclick={goToNew}>
        {#if toNearest.up}<ArrowUp size={13} />{:else}<ArrowDown size={13} />{/if}
        {t('chat-new', { count: unseen })}
      </button>
    {/if}
  </div>

  <footer>
    {#if shared}
      {#if editing}
        <div class="over" data-chat-editing>
          <Pencil size={13} />
          <span class="what">{t('chat-editing')}</span>
          <IconButton label={t('common-cancel')} size="sm" onclick={escape}
            ><X size={13} /></IconButton
          >
        </div>
      {:else if answering}
        <div class="over" data-chat-answering>
          <Reply size={13} />
          <span class="what"
            >{t('chat-answering', { name: answering.author.name || t('chat-someone') })}</span
          >
          <span class="first">{firstWords(answering.text)}</span>
          <IconButton label={t('common-cancel')} size="sm" onclick={escape}
            ><X size={13} /></IconButton
          >
        </div>
      {/if}
      <ChatField
        words={written.words}
        onwords={(words) => write({ ...written, words })}
        onsend={send}
        onescape={escape}
        cansend={!!written.words.text.trim()}
        {focus}
      />
    {:else}
      <p class="quiet">{t('chat-not-shared')}</p>
    {/if}
  </footer>
</div>

<EmojiPicker
  open={!!reacting}
  anchor={reacting?.at}
  side="bottom"
  align="end"
  onpick={(emoji) => reacting && project.react(reacting.message.id, emoji)}
  onclose={() => (reacting = null)}
/>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--paper-raised);
  }
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 40px;
    flex: none;
    padding: 0 8px 0 16px;
  }
  h2 {
    flex: 1;
    font-size: var(--text-md);
    font-weight: 600;
  }
  .list {
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    border-top: 1px solid var(--line);
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 0 10px;
  }
  .day {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 16px 4px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .day::before,
  .day::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--line);
  }
  /* Answers are set in, with a thin line at their left. */
  .answers {
    margin: 0 12px 4px 46px;
    border-left: 2px solid var(--line);
  }
  .answers :global(.group) {
    padding-left: 10px;
    padding-right: 0;
  }
  .gone {
    margin: 8px 16px 2px 46px;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--ink-4);
  }
  .new {
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 10px;
    border: 1px solid var(--accent);
    border-radius: 12px;
    background: var(--paper-raised);
    color: var(--accent-strong);
    font-size: var(--text-xs);
    box-shadow: var(--shadow-2);
    cursor: pointer;
    white-space: nowrap;
  }
  footer {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: none;
    padding: 8px 12px 8px;
    border-top: 1px solid var(--line);
  }
  .over {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding-left: 2px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .what {
    flex: none;
    font-weight: 600;
    color: var(--ink-2);
  }
  .first {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .over > :global(.icon-button) {
    margin-left: auto;
  }
  .quiet {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
