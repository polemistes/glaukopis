<script lang="ts">
  /**
   * The reactions to a message (record 0107): small chips under its words,
   * an emoji and how many gave it, one's own told apart by the accent; the
   * tooltip names who. Pressed, a chip gives or takes back one's own of that
   * emoji, while the project is shared.
   */
  import { languages, t } from '$lib/i18n';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Chip } from './reading';

  interface Props {
    chips: Chip[];
    /** Whether a chip can be pressed: while the project is shared. */
    pressable: boolean;
    ontoggle: (emoji: string) => void;
  }

  let { chips, pressable, ontoggle }: Props = $props();

  const list = $derived(new Intl.ListFormat(languages.current, { type: 'conjunction' }));
</script>

<div class="chips">
  {#each chips as chip (chip.emoji)}
    <button
      type="button"
      class="chip"
      class:mine={chip.mine}
      disabled={!pressable}
      aria-pressed={chip.mine}
      data-chat-reaction={chip.emoji}
      use:tooltip={list.format(chip.names.map((n) => n || t('chat-someone')))}
      onclick={() => ontoggle(chip.emoji)}
      ><span class="emoji">{chip.emoji}</span><span class="count">{chip.count}</span></button
    >
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 1px 0 4px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    height: 20px;
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--paper);
    color: var(--ink-2);
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .chip:disabled {
    cursor: default;
  }
  .chip:not(:disabled):hover {
    background: var(--paper-hover);
  }
  .chip.mine {
    border-color: var(--accent);
    background: var(--accent-softer);
    color: var(--accent-strong);
  }
  .emoji {
    font-family: var(--font-emoji);
    font-size: 13px;
    line-height: 1;
  }
  .count {
    font-variant-numeric: tabular-nums;
  }
</style>
