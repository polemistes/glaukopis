<script lang="ts">
  /**
   * One message of the chat (records 0092 and 0107): its words as they are
   * set, *changed* after them where it was changed, the circles of who has
   * read it at the end of its last line, the reactions under it, and its
   * tools, which come over its top right corner when the pointer is on it
   * or the focus within it: *React*, *Answer*, and on one's own the menu
   * with *Change* and *Delete*. The right-click menu has the same. While the
   * project is not shared nothing can be written, and one's own message can
   * only be deleted.
   */
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Reply from '@lucide/svelte/icons/reply';
  import SmilePlus from '@lucide/svelte/icons/smile-plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { languages, t } from '$lib/i18n';
  import type { ChatMessage } from '$lib/project/model/types';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openContextMenu, openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { MessageContext } from './context';
  import MessageWords from './MessageWords.svelte';
  import ReactionChips from './ReactionChips.svelte';
  import ReadCircles from './ReadCircles.svelte';
  import { isMine } from './reading';
  import { onlyEmojis } from './written';

  interface Props {
    message: ChatMessage;
    ctx: MessageContext;
    /** What the words say in their tooltip: when the message was written, where the head of its group does not say it. */
    tip?: string | null;
  }

  let { message, ctx, tip = null }: Props = $props();

  const mine = $derived(isMine(message, ctx.me));
  const big = $derived(onlyEmojis(message.text));
  const readers = $derived(ctx.readersOf(message.id));
  const chips = $derived(ctx.chipsOf(message.id));
  const fresh = $derived(ctx.isNew(message.id));
  const edited = $derived(
    message.edited ? format(new Date(message.edited), languages.current) : '',
  );

  function format(date: Date, language: string): string {
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeStyle: 'short' }).format(
      date,
    );
  }

  /** The menu of the three dots, on one's own message. */
  const ownMenu = (): MenuItem[] => [
    ...(ctx.shared
      ? [{ label: t('chat-edit'), icon: Pencil, action: () => ctx.edit(message) }]
      : []),
    { label: t('common-delete'), icon: Trash2, danger: true, action: () => ctx.remove(message) },
  ];

  /** The right-click menu: what can be done with the message here. */
  function contextMenu(at: HTMLElement): MenuItem[] {
    return [
      ...(ctx.shared
        ? [
            { label: t('chat-answer'), icon: Reply, action: () => ctx.answer(message) },
            {
              label: t('chat-react-choose'),
              icon: SmilePlus,
              action: () => ctx.react(message, at),
            },
          ]
        : []),
      ...(mine ? [{ kind: 'separator' as const }, ...ownMenu()] : []),
    ];
  }

  let row = $state<HTMLDivElement>();
  let reactButton = $state<HTMLButtonElement>();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={row}
  class="message"
  class:fresh
  data-chat-message={message.id}
  data-chat-new={fresh || undefined}
  oncontextmenu={ctx.shared || mine
    ? (event) => openContextMenu(event, contextMenu(row!))
    : undefined}
>
  <div class="line">
    <p class="words selectable" class:big use:tooltip={tip ? { text: tip, side: 'left' } : null}>
      <span class="text"><MessageWords words={message} /></span>{#if message.edited}<span
          class="edited"
          data-chat-edited
          use:tooltip={edited}>{t('chat-edited')}</span
        >{/if}
    </p>
    {#if readers.length}<ReadCircles {readers} />{/if}
  </div>
  {#if chips.length}
    <ReactionChips
      {chips}
      pressable={ctx.shared}
      ontoggle={(emoji) => ctx.toggle(message, emoji)}
    />
  {/if}
  {#if ctx.shared || mine}
    <span class="tools">
      {#if ctx.shared}
        <IconButton
          label={t('chat-react')}
          size="sm"
          bind:el={reactButton}
          data-chat-react
          onclick={() => ctx.react(message, reactButton!)}><SmilePlus size={13} /></IconButton
        >
        <IconButton
          label={t('chat-answer')}
          size="sm"
          data-chat-answer
          onclick={() => ctx.answer(message)}><Reply size={13} /></IconButton
        >
      {/if}
      {#if mine}
        <IconButton
          label={t('chat-message-menu')}
          size="sm"
          data-chat-message-menu
          onclick={(event: MouseEvent) =>
            openMenu(event.currentTarget as HTMLElement, ownMenu(), { align: 'end' })}
          ><Ellipsis size={13} /></IconButton
        >
      {/if}
    </span>
  {/if}
</div>

<style>
  .message {
    position: relative;
    margin-left: -6px;
    padding-left: 6px;
    border-radius: 2px;
  }
  /* A new message has a thin bar of the accent at its left. */
  .fresh {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .line {
    display: flex;
    align-items: flex-end;
    gap: 4px;
  }
  .words {
    flex: 1;
    min-width: 0;
    margin: 0 0 3px;
    font-family: var(--font-ui), var(--font-emoji);
    font-size: var(--text-md);
    line-height: 1.45;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  /* A message of one to three emojis and nothing else. */
  .big {
    font-size: 26px;
    line-height: 1.25;
  }
  .edited {
    margin-left: 6px;
    font-family: var(--font-ui);
    font-size: var(--text-xs);
    color: var(--ink-4);
    white-space: nowrap;
  }
  /* The tools lie over the message, at its top right, and take no room. */
  .tools {
    position: absolute;
    top: -12px;
    right: 0;
    display: none;
    gap: 1px;
    padding: 1px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    z-index: 1;
  }
  .message:hover .tools,
  .message:focus-within .tools {
    display: inline-flex;
  }
</style>
