<script lang="ts">
  /**
   * Who has read a message (record 0107): the small circles of those people,
   * with their initials on their colour, three at most and then how many
   * more; the tooltip names them all.
   */
  import { languages, t } from '$lib/i18n';
  import type { ChatReader } from '$lib/project/model/types';
  import { colourOf, initials } from '$lib/sharing/connection.svelte';
  import { tooltip } from '$lib/ui/tooltip';

  let { readers }: { readers: ChatReader[] } = $props();

  /** The most circles shown; the rest are counted. */
  const MOST = 3;

  const names = $derived(
    new Intl.ListFormat(languages.current, { type: 'conjunction' }).format(
      readers.map((r) => r.name || t('chat-someone')),
    ),
  );
  const more = $derived(readers.length - MOST);
</script>

<span
  class="read"
  data-chat-read
  role="img"
  aria-label={t('chat-read-by', { names })}
  use:tooltip={{ text: t('chat-read-by', { names }), side: 'left' }}
>
  {#each readers.slice(0, MOST) as reader (reader.id)}
    <span class="circle" style:background={colourOf(reader.id || reader.name)} data-chat-reader
      >{initials(reader.name)}</span
    >
  {/each}
  {#if more > 0}<span class="more">+{more}</span>{/if}
</span>

<style>
  .read {
    display: inline-flex;
    align-items: center;
    flex: none;
    align-self: flex-end;
    margin: 0 0 3px 4px;
  }
  .circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: -4px;
    border: 1px solid var(--paper-raised);
    border-radius: 50%;
    color: #fff;
    font-family: var(--font-ui);
    font-size: 7.5px;
    font-weight: 700;
    line-height: 1;
  }
  .circle:first-child {
    margin-left: 0;
  }
  .more {
    margin-left: 2px;
    font-size: 10px;
    color: var(--ink-4);
  }
</style>
