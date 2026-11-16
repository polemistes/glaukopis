<script lang="ts">
  /**
   * The chat of a project, a tab of the document pane (records 0092 and
   * 0107): its messages from the oldest to the newest, each answer under the
   * message it answers, those of one person written close together under
   * one name, a line with the date where the day changes; under them the
   * field (`ChatField`), where Enter sends and Shift+Enter makes a new line,
   * and over it the lines that say what is quoted, answered or changed.
   * Words marked in a message when *Answer* or the field is pressed are
   * quoted at the top of what is sent; pressed there, the quote goes to the
   * message it is from. What is written and not yet sent is its holder's to
   * keep (`draft`), with what it answers, quotes or changes, so that it is
   * there again when the panel is (record 0094). New messages are marked,
   * and a button over the foot of the list leads to those not yet seen.
   * While the project is not shared, the messages are shown without the
   * field, nothing can be written, and the whole conversation can be
   * deleted.
   */
  import type { Snippet } from 'svelte';
  import { untrack } from 'svelte';
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Quote from '@lucide/svelte/icons/quote';
  import Reply from '@lucide/svelte/icons/reply';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { languages, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { ChatMessage, ChatQuote, ChatWords } from '$lib/project/model/types';
  import { confirm } from '$lib/ui/confirm.svelte';
  import EmojiPicker from '$lib/ui/EmojiPicker.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import ChatField from './ChatField.svelte';
  import ChatGroup from './ChatGroup.svelte';
  import type { MessageContext } from './context';
  import { ListPlace } from './list-place.svelte';
  import { caughtOf } from './quoting';
  import { chipsOf, firstWords, placed, readersOf } from './reading';
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
  /** The words quoted in what is written; none while a message is changed, which keeps its own. */
  const quoting = $derived(written.editing ? null : (written.quote ?? null));
  /** Rises each time the field is to take the focus. */
  let focus = $state(0);

  const write = (to: Written) => (draft = keptOf(to));
  /** What was being written before a change, which comes back when the change is kept or given up. */
  const before = (w: Written): Written => (w.before ? { ...w.before } : NOTHING);

  /** What is written, with what it answers and quotes as asked. */
  const writing = (words: ChatWords, to?: string, quote?: ChatQuote | null): Written => ({
    words,
    ...(to ? { to } : {}),
    ...(quote ? { quote } : {}),
  });

  // A change whose message is gone is given up; an answer whose message is
  // gone answers none, and keeps what it quotes, whose words are its own.
  // It depends on what is written and on the messages.
  $effect(() => {
    const w = written;
    const there = byId;
    untrack(() => {
      if (w.editing && !there.has(w.editing)) write(before(w));
      else if (w.to && !there.has(w.to)) write(writing(w.words, undefined, w.quote));
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
    const id = project.say(w.words, w.to, w.quote);
    if (!id) return;
    write(NOTHING);
    // An answer is brought into view where it stands; anything else is at the foot.
    if (w.to) place.bringNext(id);
    else place.toFootNext();
  }

  /** Escape gives up a change; else the answering and the quote, both where both are there, keeping what is written. */
  function escape(): boolean {
    const w = written;
    if (w.editing) write(before(w));
    else if (w.to || w.quote) write(writing(w.words));
    else return false;
    return true;
  }

  /** The × of the line of what is answered: the quote stays. */
  const unanswer = () => write(writing(written.words, undefined, written.quote));
  /** The × of the line of the quote: the answering stays. */
  const unquote = () => write(writing(written.words, written.to));

  /** What is written, without a change that was being made. */
  const unchanged = (w: Written): Written => (w.editing ? before(w) : w);

  // ---- words quoted ----
  let panel = $state<HTMLDivElement>();
  /**
   * Words of a message marked when the press going on began: read at its
   * `pointerdown`, in the capture phase, before the press changes what is
   * selected (`quoting.ts`), for what the press begins. A key forgets them,
   * so that *Answer* pressed by a key quotes nothing of an earlier press.
   */
  let caught: ChatQuote | null = null;

  function pressed(event: PointerEvent) {
    caught = panel ? caughtOf(document.getSelection(), panel) : null;
    // A press within the field begins a new message, or goes on with what is
    // written: the words marked take the place of what was quoted. Nothing
    // is quoted while a message is being changed.
    const target = event.target instanceof Element ? event.target : null;
    if (caught && !written.editing && target?.closest('[data-chat-field]'))
      write({ ...written, quote: caught });
  }

  /** A message lit for a moment, having been gone to from a quote of it. */
  let lit = $state<string | null>(null);
  let unlight: ReturnType<typeof setTimeout> | undefined;
  /** How long a message stays lit: the light fades within it. */
  const LIT = 1500;

  function goTo(id: string) {
    if (!id || !place.goTo(id)) return;
    clearTimeout(unlight);
    lit = id;
    unlight = setTimeout(() => (lit = null), LIT);
  }

  $effect(() => () => clearTimeout(unlight));

  // ---- what is done with a message ----
  let reacting = $state<{ message: ChatMessage; at: HTMLElement } | null>(null);
  /** Where the list stands, and what of the new has been seen. */
  const place = new ListPlace();

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
    isNew: (id) => fresh.has(id) && place.marks(id),
    isLit: (id) => !!id && lit === id,
    messageOf: (id) => (id ? (byId.get(id) ?? null) : null),
    caught: () => caught,
    answer(message, quote = null) {
      // Words marked take the place of what was quoted; with none, it stays.
      const was = unchanged(written);
      write(writing(was.words, message.id, quote ?? was.quote));
      focus++;
    },
    goTo,
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
      write({ words, editing: message.id, before: writing(was.words, was.to, was.quote) });
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

  // ---- where the list stands, and what of the new is not yet seen ----

  // Where the list was at its foot when the messages changed, it goes to
  // the foot again once they are drawn; where the reader had gone up, it
  // stays where it is. It depends on the messages alone.
  $effect.pre(() => {
    void project.chat;
    untrack(() => place.beforeDraw());
  });

  // What is new changes as messages arrive and when one's own is sent.
  $effect(() => {
    const now = fresh;
    untrack(() => place.freshChanged(now));
  });
</script>

<div
  class="panel"
  data-chat
  bind:this={panel}
  onpointerdowncapture={pressed}
  onkeydowncapture={() => (caught = null)}
>
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
    <div class="body" bind:this={place.list} onscroll={place.onscroll}>
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
    {#if place.unseen && place.toNearest}
      <button type="button" class="new" data-chat-new-button onclick={place.goToNew}>
        {#if place.toNearest.up}<ArrowUp size={13} />{:else}<ArrowDown size={13} />{/if}
        {t('chat-new', { count: place.unseen })}
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
      {:else}
        {#if quoting}
          <div class="over" data-chat-quoting>
            <Quote size={13} />
            <span class="first">{quoting.text}</span>
            <IconButton label={t('common-cancel')} size="sm" onclick={unquote}
              ><X size={13} /></IconButton
            >
          </div>
        {/if}
        {#if answering}
          <div class="over" data-chat-answering>
            <Reply size={13} />
            <span class="what"
              >{t('chat-answering', { name: answering.author.name || t('chat-someone') })}</span
            >
            <span class="first">{firstWords(answering.text)}</span>
            <IconButton label={t('common-cancel')} size="sm" onclick={unanswer}
              ><X size={13} /></IconButton
            >
          </div>
        {/if}
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
