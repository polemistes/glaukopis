<script lang="ts">
  /**
   * A stand-in for the choosing of emojis, with the props of the picker
   * that replaces it (the plan of record 0107, part C): a dozen emojis in a
   * row. It is replaced when the parts are merged.
   */
  import type { Align, Side } from './floating';
  import Popover from './Popover.svelte';

  interface Props {
    open: boolean;
    /** What it is opened at. */
    anchor: HTMLElement | null | undefined;
    /** Called with each emoji chosen. */
    onpick: (emoji: string) => void;
    onclose: () => void;
    /** Whether it stays open after an emoji is chosen, for choosing several; it closes after one otherwise. */
    stay?: boolean;
    side?: Side;
    align?: Align;
  }

  let {
    open,
    anchor,
    onpick,
    onclose,
    stay = false,
    side = 'top',
    align = 'start',
  }: Props = $props();

  const EMOJIS = ['👍', '❤️', '😀', '😂', '🎉', '🙏', '👀', '🤔', '😢', '🔥', '✅', '👋'];

  function pick(emoji: string) {
    onpick(emoji);
    if (!stay) onclose();
  }
</script>

<Popover {open} {anchor} {side} {align} {onclose}>
  <div class="row" data-emoji-picker>
    {#each EMOJIS as emoji (emoji)}
      <button type="button" data-emoji={emoji} onclick={() => pick(emoji)}>{emoji}</button>
    {/each}
  </div>
</Popover>

<style>
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    max-width: 300px;
    padding: 6px;
  }
  button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    font-family: var(--font-emoji);
    font-size: 20px;
    cursor: pointer;
  }
  button:hover,
  button:focus-visible {
    background: var(--paper-hover);
  }
</style>
