<script lang="ts">
  /**
   * Messages of one person written close together, under one name (records
   * 0092 and 0107): the initials of who wrote them on their colour, their
   * name and the time of the first; an answer written on another day than
   * the day line it stands under shows its date as well. The time of each
   * message after the first is in its tooltip.
   */
  import { languages, t } from '$lib/i18n';
  import { colourOf, initials } from '$lib/sharing/connection.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import ChatMessageRow from './ChatMessageRow.svelte';
  import type { MessageContext } from './context';
  import type { Group } from './reading';

  let { group, ctx }: { group: Group; ctx: MessageContext } = $props();

  /** The time of day a message was written, with its date where its group is of another day than its line. */
  const headFormat = $derived(
    new Intl.DateTimeFormat(
      languages.current,
      group.dated ? { dateStyle: 'short', timeStyle: 'short' } : { timeStyle: 'short' },
    ),
  );
  /** When a message was written, in full. */
  const fullFormat = $derived(
    new Intl.DateTimeFormat(languages.current, { dateStyle: 'long', timeStyle: 'short' }),
  );

  function format(how: Intl.DateTimeFormat, iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : how.format(date);
  }
</script>

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
        >{format(headFormat, group.messages[0].created)}</span
      >
    </div>
    <!-- Keyed by place: a message written by another copy may lack an id, or share one. -->
    {#each group.messages as message, i (i)}
      <ChatMessageRow
        {message}
        {ctx}
        tip={i > 0 ? format(fullFormat, message.created) : null}
      />
    {/each}
  </div>
</article>

<style>
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
</style>
