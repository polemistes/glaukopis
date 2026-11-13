<script lang="ts">
  /**
   * The chat of a project, a tab of the document pane (record 0092): its
   * messages from the oldest to the newest, the newest at the foot, those of
   * one person written close together under one name, a line with the date
   * where the day changes; under them a field that grows with what is
   * written, where Enter sends and Shift+Enter makes a new line. One's own
   * message can be deleted from its menu. While the project is not shared,
   * the messages are shown without the field, and the whole conversation can
   * be deleted.
   */
  import type { Snippet } from 'svelte';
  import { tick, untrack } from 'svelte';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import SendHorizontal from '@lucide/svelte/icons/send-horizontal';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import X from '@lucide/svelte/icons/x';
  import { languages, t } from '$lib/i18n';
  import type { Project } from '$lib/project/model/project.svelte';
  import type { ChatMessage } from '$lib/project/model/types';
  import { colourOf, initials } from '$lib/sharing/connection.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { confirm } from '$lib/ui/confirm.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { toasts } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { groups, isMine } from './reading';

  interface Props {
    project: Project;
    /** Whether the project is shared now: only then can anything be written. */
    shared: boolean;
    onclose: () => void;
    /** What stands at the head in place of the title: the tabs of the document pane. */
    head?: Snippet;
  }

  let { project, shared, onclose, head }: Props = $props();

  const me = $derived(project.me?.id ?? '');
  const shown = $derived(groups(project.chat, me));

  /** The day a group begins, in full, in the language of the interface. */
  const dayFormat = $derived(new Intl.DateTimeFormat(languages.current, { dateStyle: 'full' }));
  /** The time of day a message was written. */
  const timeFormat = $derived(new Intl.DateTimeFormat(languages.current, { timeStyle: 'short' }));
  /** When a message was written, in full. */
  const fullFormat = $derived(
    new Intl.DateTimeFormat(languages.current, { dateStyle: 'long', timeStyle: 'short' }),
  );

  function format(how: Intl.DateTimeFormat, iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : how.format(date);
  }

  // ---- staying at the foot ----
  let list = $state<HTMLDivElement>();
  /** Whether the list was at its foot before the messages last changed. */
  let atFoot = true;

  const footOf = (el: HTMLElement) => el.scrollHeight - el.scrollTop - el.clientHeight < 24;

  function toFoot() {
    if (list) list.scrollTop = list.scrollHeight;
  }

  // Where the list was at its foot when the messages changed, it goes to
  // the foot again once they are drawn; where the reader had gone up, it
  // stays where it is. It depends on the messages alone.
  $effect.pre(() => {
    void project.chat;
    untrack(() => {
      if (list) atFoot = footOf(list);
      void tick().then(() => {
        if (atFoot) toFoot();
      });
    });
  });

  // ---- writing ----
  let text = $state('');
  let field = $state<HTMLTextAreaElement>();

  /** The field grows with what is written, up to some lines, and then scrolls. */
  function grow() {
    if (!field) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
  }

  function send() {
    if (!project.say(text)) return;
    text = '';
    atFoot = true;
    void tick().then(() => {
      grow();
      toFoot();
    });
  }

  /** Enter sends; Shift+Enter is a new line, as everywhere in the application. */
  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      send();
    }
  }

  // ---- deleting ----
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

  const menuOf = (message: ChatMessage): MenuItem[] => [
    { label: t('common-delete'), icon: Trash2, danger: true, action: () => remove(message) },
  ];

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

  <div class="body" bind:this={list}>
    {#if !shown.length}
      <EmptyState
        icon={MessagesSquare}
        title={t('chat-none')}
        text={t('chat-none-detail')}
        compact
      />
    {:else}
      {#each shown as group (group.key)}
        {#if group.day}
          <div class="day" role="separator">
            <span>{format(dayFormat, group.day)}</span>
          </div>
        {/if}
        <article class="group" class:mine={group.mine} data-chat-group>
          <span
            class="who"
            style:background={colourOf(group.author.id || group.author.name)}
            aria-hidden="true">{initials(group.author.name)}</span
          >
          <div class="said">
            <div class="by">
              <span class="name" data-chat-name>{group.author.name || t('chat-someone')}</span>
              <span class="when" use:tooltip={format(fullFormat, group.messages[0].created)}
                >{format(timeFormat, group.messages[0].created)}</span
              >
            </div>
            <!-- Keyed by place: a message written by another copy may lack an id, or share one. -->
            {#each group.messages as message, i (i)}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div
                class="message"
                data-chat-message={message.id}
                oncontextmenu={isMine(message, me)
                  ? (event) => openContextMenu(event, menuOf(message))
                  : undefined}
              >
                <p
                  class="text selectable"
                  use:tooltip={i > 0
                    ? { text: format(fullFormat, message.created), side: 'left' }
                    : null}
                >
                  {message.text}
                </p>
                {#if isMine(message, me)}
                  <span class="own">
                    <IconButton
                      label={t('chat-message-menu')}
                      size="sm"
                      data-chat-message-menu
                      onclick={(event: MouseEvent) =>
                        openMenu(event.currentTarget as HTMLElement, menuOf(message), {
                          align: 'end',
                        })}><Ellipsis size={13} /></IconButton
                    >
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        </article>
      {/each}
    {/if}
  </div>

  <footer>
    {#if shared}
      <textarea
        bind:this={field}
        bind:value={text}
        rows="1"
        placeholder={t('chat-write')}
        aria-label={t('chat-write')}
        data-chat-field
        oninput={grow}
        {onkeydown}></textarea>
      <Button size="sm" variant="primary" disabled={!text.trim()} data-chat-send onclick={send}>
        <SendHorizontal size={14} />
        {t('chat-send')}
      </Button>
    {:else}
      <p class="quiet">{t('chat-not-shared')}</p>
    {/if}
  </footer>
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
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 4px 0 10px;
    border-top: 1px solid var(--line);
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
  .group {
    display: flex;
    gap: 8px;
    padding: 6px 12px 2px 16px;
  }
  .who {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 22px;
    height: 22px;
    margin-top: 1px;
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
    align-items: baseline;
    gap: 6px;
    min-height: 22px;
    font-size: var(--text-xs);
  }
  .name {
    font-weight: 600;
    color: var(--ink);
  }
  .when {
    color: var(--ink-4);
  }
  .message {
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }
  .text {
    flex: 1;
    min-width: 0;
    margin: 0 0 3px;
    font-size: var(--text-md);
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  /* One's own messages are told apart as one's own notes of a comment are: by the tools on hover. */
  .own {
    visibility: hidden;
    flex: none;
    margin-top: -2px;
  }
  .message:hover .own,
  .message:focus-within .own {
    visibility: visible;
  }
  footer {
    display: flex;
    align-items: flex-end;
    gap: 6px;
    flex: none;
    padding: 8px 12px 10px;
    border-top: 1px solid var(--line);
  }
  textarea {
    flex: 1;
    min-width: 0;
    max-height: 160px;
    padding: 6px 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: var(--text-md);
    line-height: 1.4;
    resize: none;
  }
  textarea:focus {
    outline: none;
    border-color: var(--accent);
  }
  .quiet {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-3);
  }
</style>
