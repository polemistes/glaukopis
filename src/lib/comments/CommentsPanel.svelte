<script lang="ts">
  /**
   * The comments at the side of a project: the threads of the map in view,
   * in the order of the text, each with its notes, and a place to answer.
   * A thread is begun here too, on an element or on a passage, when asked
   * from the text or the diagram. A note is its author's alone to change.
   */
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import Pencil from '@lucide/svelte/icons/pencil';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { Note, Thread } from '$lib/project/model/types';
  import { colourOf, initials } from '$lib/sharing/connection.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { ago } from '$lib/util/time';
  import { commentsUi } from './ui.svelte';

  interface Props {
    project: Project;
    /** The map in view: its threads are shown. */
    mapId: string;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the panel at the side. */
    head?: Snippet;
    /** Goes to an element, in its map. */
    ongo: (map: string, element: string) => void;
    /** Opens an element for writing: its box in the diagram, or its text. */
    onopen?: (map: string, element: string) => void;
  }

  let { project, mapId, onclose, head, ongo, onopen }: Props = $props();

  type Which = 'open' | 'settled' | 'all';
  let which = $state<Which>('open');
  let list = $state<HTMLDivElement>();

  /** The threads of the map, in the order of the text, and of their beginning within an element. */
  const threads = $derived.by(() => {
    const order = new Map(project.tree(mapId).sequence.map((id, i) => [id, i]));
    const out: Thread[] = [];
    for (const thread of project.comments.values()) {
      if (order.has(thread.element)) out.push(thread);
    }
    return out.sort(
      (a, b) =>
        order.get(a.element)! - order.get(b.element)! ||
        (a.notes[0]?.created ?? '').localeCompare(b.notes[0]?.created ?? ''),
    );
  });
  const shown = $derived(
    threads.filter((th) =>
      which === 'all' ? true : which === 'settled' ? th.resolved : !th.resolved,
    ),
  );
  const open = $derived(threads.filter((th) => !th.resolved).length);

  const me = $derived(project.me?.id ?? '');
  const mine = (note: Note) => !!me && note.author.id === me;

  // ---- a thread being begun ----
  let begun = $state('');
  let beginning = $state<HTMLTextAreaElement>();
  const composing = $derived(commentsUi.composing);
  const composingOn = $derived(composing ? project.node(composing.element) : undefined);

  $effect(() => {
    if (composing && beginning) beginning.focus();
  });

  function begin() {
    if (!composing) return;
    const id = project.comment(composing.element, composing.passage, begun);
    begun = '';
    commentsUi.done();
    if (id && project.comments.get(id)?.resolved === false && which === 'settled') which = 'open';
  }

  function cancelBeginning() {
    begun = '';
    commentsUi.done();
  }

  // ---- what was asked to be shown ----
  /** The thread that was last asked for: marked, until another is. */
  let current = $state<string | null>(null);
  $effect(() => {
    const id = commentsUi.shown;
    if (!id) return;
    current = id;
    const thread = project.comments.get(id);
    if (thread?.resolved && which === 'open') which = 'settled';
    void tick().then(() => {
      list
        ?.querySelector<HTMLElement>(`[data-thread="${id}"]`)
        ?.scrollIntoView({ block: 'nearest' });
      commentsUi.done();
    });
  });

  // ---- answering, changing, taking back ----
  let answers = $state<Record<string, string>>({});
  let editing = $state<{ thread: string; note: string; text: string } | null>(null);

  function reply(thread: Thread) {
    const text = answers[thread.id] ?? '';
    if (!text.trim()) return;
    project.reply(thread.id, text);
    answers[thread.id] = '';
  }

  function edit(thread: Thread, note: Note) {
    editing = { thread: thread.id, note: note.id, text: note.text };
  }

  function keepEdit() {
    if (!editing) return;
    project.editNote(editing.thread, editing.note, editing.text);
    editing = null;
  }

  function remove(thread: Thread, note: Note) {
    const taken = project.deleteNote(thread.id, note.id);
    if (!taken) return;
    const was = thread;
    toasts.show(
      {
        kind: 'info',
        message: t('comments-note-deleted'),
        action: { label: t('common-undo'), run: () => project.restoreNote(was.id, taken, was) },
      },
      7000,
    );
  }

  /** Enter sends; Shift+Enter is a new line. */
  function sending(event: KeyboardEvent, send: () => void) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send();
    } else if (event.key === 'Escape') {
      (event.currentTarget as HTMLElement).blur();
    }
  }

  function nameOf(element: string): string {
    return project.node(element)?.title || t('project-untitled');
  }

  function go(thread: Thread) {
    const node = project.node(thread.element);
    if (node) ongo(node.map, node.id);
  }

  function write(thread: Thread) {
    const node = project.node(thread.element);
    if (node) (onopen ?? ongo)(node.map, node.id);
  }

  /** The pointer rests on a thread: its passage and its element are shown where they are. */
  function hover(thread: Thread | null) {
    commentsUi.hovered = thread ? { thread: thread.id, element: thread.element } : null;
  }

  // The passage of the hovered thread is tinted in every editor, by a rule
  // for its thread alone: the editors need not be told.
  $effect(() => {
    const id = commentsUi.hovered?.thread;
    const rule = document.getElementById('comment-hot') ?? document.createElement('style');
    rule.id = 'comment-hot';
    rule.textContent = id
      ? `.prose .comment-mark[data-thread="${id}"] { background-color: color-mix(in srgb, var(--gold) 24%, transparent); }`
      : '';
    if (!rule.parentNode) document.head.append(rule);
    return () => {
      rule.textContent = '';
    };
  });
</script>

<div class="panel">
  <header>
    {#if head}{@render head()}{:else}<h2>{t('comments-title')}</h2>{/if}
    <IconButton label={t('common-close')} size="sm" onclick={onclose}><X size={15} /></IconButton>
  </header>

  {#if composing && composingOn}
    <div class="beginning">
      <div class="on">
        {t('comments-on', { name: nameOf(composing.element) })}
      </div>
      {#if composing.passage}
        <blockquote class="passage">{composing.passage.text}</blockquote>
      {/if}
      <textarea
        bind:this={beginning}
        bind:value={begun}
        rows="3"
        placeholder={t('comments-write')}
        aria-label={t('comments-write')}
        onkeydown={(e) => sending(e, begin)}></textarea>
      <div class="buttons">
        <Button size="sm" variant="ghost" onclick={cancelBeginning}>{t('common-cancel')}</Button>
        <Button size="sm" variant="primary" disabled={!begun.trim()} onclick={begin}>
          {t('comments-comment')}
        </Button>
      </div>
    </div>
  {/if}

  {#if threads.length}
    <div class="tools">
      <Segmented
        bind:value={which}
        label={t('comments-which')}
        size="sm"
        options={[
          { value: 'open', label: t('comments-open', { count: open }) },
          { value: 'settled', label: t('comments-settled', { count: threads.length - open }) },
          { value: 'all', label: t('comments-all') },
        ]}
      />
    </div>
  {/if}

  <div class="body" bind:this={list}>
    {#if !threads.length && !composing}
      <EmptyState title={t('comments-none')} text={t('comments-none-detail')} compact />
    {:else if !shown.length}
      <p class="nothing">{t('comments-none-of-these')}</p>
    {:else}
      {#each shown as thread, i (thread.id)}
        {@const sameElement = i > 0 && shown[i - 1].element === thread.element}
        <article
          class="thread"
          class:settled={thread.resolved}
          class:current={current === thread.id}
          class:continued={sameElement}
          data-thread={thread.id}
          onmouseenter={() => hover(thread)}
          onmouseleave={() => hover(null)}
        >
          <div class="where">
            {#if !sameElement}
              <button
                type="button"
                class="element truncate"
                use:tooltip={{ text: t('comments-element-hint'), side: 'top' }}
                onclick={() => go(thread)}
                ondblclick={() => write(thread)}
              >
                {nameOf(thread.element)}
              </button>
            {:else}
              <span class="spring"></span>
            {/if}
            <IconButton
              label={thread.resolved ? t('comments-reopen') : t('comments-settle')}
              size="sm"
              onclick={() => project.setResolved(thread.id, !thread.resolved)}
            >
              {#if thread.resolved}<RotateCcw size={13} />{:else}<Check size={14} />{/if}
            </IconButton>
          </div>
          {#if thread.passage}
            <blockquote class="passage">{thread.passage.text}</blockquote>
          {/if}
          {#each thread.notes as note, i (note.id)}
            <div class="note" class:answer={i > 0}>
              <span
                class="who"
                style:background={colourOf(note.author.id || note.author.name)}
                use:tooltip={note.author.name}>{initials(note.author.name)}</span
              >
              <div class="said">
                <div class="by">
                  <span class="name">{note.author.name || t('comments-someone')}</span>
                  <span class="when" use:tooltip={new Date(note.created).toLocaleString()}
                    >{ago(note.created)}{note.edited ? ` · ${t('comments-edited')}` : ''}</span
                  >
                  {#if mine(note) && !(editing?.note === note.id)}
                    <span class="own">
                      <IconButton
                        label={t('comments-edit')}
                        size="sm"
                        onclick={() => edit(thread, note)}><Pencil size={12} /></IconButton
                      >
                      <IconButton
                        label={t('common-delete')}
                        size="sm"
                        onclick={() => remove(thread, note)}><Trash2 size={12} /></IconButton
                      >
                    </span>
                  {/if}
                </div>
                {#if editing?.note === note.id}
                  <!-- svelte-ignore a11y_autofocus -->
                  <textarea
                    bind:value={editing.text}
                    rows="3"
                    autofocus
                    aria-label={t('comments-edit')}
                    onkeydown={(e) => sending(e, keepEdit)}></textarea>
                  <div class="buttons">
                    <Button size="sm" variant="ghost" onclick={() => (editing = null)}
                      >{t('common-cancel')}</Button
                    >
                    <Button size="sm" variant="primary" onclick={keepEdit}
                      >{t('common-save')}</Button
                    >
                  </div>
                {:else}
                  <p class="text selectable">{note.text}</p>
                {/if}
              </div>
            </div>
          {/each}
          <div class="answering">
            <textarea
              bind:value={answers[thread.id]}
              rows="1"
              placeholder={t('comments-answer')}
              aria-label={t('comments-answer')}
              onkeydown={(e) => sending(e, () => reply(thread))}></textarea>
          </div>
        </article>
      {/each}
    {/if}
  </div>
</div>

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
  .tools {
    flex: none;
    padding: 2px 12px 10px;
    border-bottom: 1px solid var(--line);
  }
  .beginning {
    flex: none;
    margin: 0 12px 10px;
    padding: 10px 12px;
    border: 1px solid var(--accent);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .on {
    font-size: var(--text-sm);
    color: var(--ink-2);
    margin-bottom: 6px;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .nothing {
    padding: 16px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
  .thread {
    padding: 10px 12px 8px 16px;
    border-bottom: 1px solid var(--line);
  }
  .thread.settled {
    color: var(--ink-3);
  }
  .thread.current {
    background: var(--accent-soft);
  }
  /* Another thread on the same element: the name is not said again. */
  .thread.continued {
    border-top: none;
    padding-top: 2px;
  }
  .spring {
    flex: 1;
  }
  .where {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .element {
    flex: 1;
    min-width: 0;
    text-align: left;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
    cursor: pointer;
  }
  .element:hover {
    color: var(--accent);
  }
  .passage {
    margin: 4px 0 8px;
    padding: 2px 0 2px 10px;
    border-left: 3px solid var(--gold);
    font-family: var(--font-text);
    font-size: 14px;
    line-height: 1.4;
    color: var(--ink-2);
  }
  .settled .passage {
    border-left-color: var(--line);
  }
  .note {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .note.answer {
    margin-left: 12px;
  }
  .who {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    color: #fff;
    font-family: var(--font-ui);
    font-size: 9px;
    font-weight: 700;
  }
  .said {
    flex: 1;
    min-width: 0;
  }
  .by {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 22px;
    font-size: var(--text-xs);
  }
  .name {
    font-weight: 600;
    color: var(--ink);
  }
  .settled .name {
    color: var(--ink-2);
  }
  .when {
    flex: 1;
    min-width: 0;
    color: var(--ink-4);
  }
  .own {
    display: none;
    flex: none;
  }
  .note:hover .own,
  .note:focus-within .own {
    display: inline-flex;
  }
  .text {
    margin: 0;
    font-size: var(--text-md);
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  textarea {
    display: block;
    width: 100%;
    margin-top: 4px;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-md);
    line-height: 1.4;
    resize: vertical;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .answering textarea {
    margin-top: 8px;
    resize: none;
    background: transparent;
    border-color: transparent;
  }
  .answering textarea:hover,
  .answering textarea:focus {
    border-color: var(--line);
    background: var(--paper);
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    margin-top: 6px;
  }
</style>
