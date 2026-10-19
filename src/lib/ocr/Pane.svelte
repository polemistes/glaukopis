<script lang="ts">
  /**
   * The frame of a pane of the workbench of a reading (`PagePanes.svelte`):
   * a header that stays put, with the pane's title and the button that acts
   * on it, and under them a line of switches or a verdict where there is
   * one; then the body, which fills the height left and scrolls on its own;
   * and under it what stays below the body, as the trials of a page.
   */
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  type Props = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
    title: string;
    /** At the end of the title's line: the pane's button. */
    actions?: Snippet;
    /** Under the title's line, in the header. */
    bar?: Snippet;
    /** Under the body, not scrolled with it. */
    foot?: Snippet;
    children: Snippet;
    /** Whether the body has room around what it holds, as text has; the picture has none. */
    padded?: boolean;
  };

  let { title, actions, bar, foot, children, padded = false, ...rest }: Props = $props();
</script>

<section class="pane" {...rest}>
  <header class="head">
    <div class="line">
      <h3>{title}</h3>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </div>
    {#if bar}{@render bar()}{/if}
  </header>
  <div class="body" class:pad={padded}>
    {@render children()}
  </div>
  {#if foot}<div class="foot">{@render foot()}</div>{/if}
</section>

<style>
  .pane {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper);
  }
  .head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: none;
    padding: 8px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-raised);
  }
  /* Where the title and the button do not fit side by side, the button goes under the title. */
  .line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 6px 8px;
    min-height: 26px;
  }
  h3 {
    margin: 0;
    min-width: 0;
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--ink-2);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
  }
  .actions :global(.button) {
    max-width: 100%;
  }
  .actions :global(.button .text) {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .body {
    position: relative;
    flex: 1;
    min-height: 0;
    overflow: auto;
  }
  .body.pad {
    padding: 10px 14px;
  }
  /* At most so much of the pane, that the body keeps room; past it, what is below scrolls on its own. */
  .foot {
    flex: none;
    min-height: 0;
    max-height: 45%;
    overflow-y: auto;
    overscroll-behavior: contain;
    border-top: 1px solid var(--line);
  }
</style>
