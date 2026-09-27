<script lang="ts" module>
  /** The popovers that are open, the one that lies over the others last. */
  const opened: symbol[] = [];
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { place, type Align, type RectLike, type Side } from './floating';
  import { onTop } from './top';

  interface Props {
    open: boolean;
    anchor: HTMLElement | RectLike | null | undefined;
    side?: Side;
    align?: Align;
    gap?: number;
    width?: number;
    /** When false, clicks outside do not close the popover. */
    dismissable?: boolean;
    onclose: () => void;
    children: Snippet;
    label?: string;
  }

  let {
    open,
    anchor,
    side = 'bottom',
    align = 'start',
    gap = 6,
    width,
    dismissable = true,
    onclose,
    children,
    label,
  }: Props = $props();

  let el = $state<HTMLDivElement>();

  function reposition() {
    if (!el || !anchor) return;
    const rect = anchor instanceof HTMLElement ? anchor.getBoundingClientRect() : anchor;
    place(el, rect, { side, align, gap });
  }

  $effect(() => {
    if (!open || !el) return;
    reposition();
    const observer = new ResizeObserver(() => requestAnimationFrame(reposition));
    observer.observe(el);
    window.addEventListener('resize', reposition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reposition);
    };
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation();
      event.preventDefault();
      onclose();
    }
  }

  // Escape closes the popover also when nothing in it has the cursor, as
  // after a button in it was used; of several, the one that lies over the others.
  $effect(() => {
    if (!open) return;
    const me = Symbol('popover');
    opened.push(me);
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || opened[opened.length - 1] !== me) return;
      if (el?.contains(event.target as Node)) return;
      if ((event.target as HTMLElement | null)?.closest?.('.menu')) return;
      event.stopPropagation();
      event.preventDefault();
      onclose();
    };
    window.addEventListener('keydown', escape, true);
    return () => {
      window.removeEventListener('keydown', escape, true);
      const at = opened.indexOf(me);
      if (at >= 0) opened.splice(at, 1);
    };
  });
</script>

{#if open}
  <!-- What is within is moved to where it lies over everything; this stays. -->
  <div class="holder">
    {#if dismissable}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="backdrop" use:onTop onpointerdown={onclose}></div>
    {/if}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={el}
      class="popover"
      use:onTop
      role="dialog"
      tabindex="-1"
      aria-label={label}
      style:width={width ? `${width}px` : undefined}
      {onkeydown}
    >
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .holder {
    display: contents;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 799;
    width: 100vw;
    height: 100vh;
    padding: 0;
    border: none;
    background: transparent;
  }
  .popover {
    position: fixed;
    z-index: 800;
    left: 0;
    top: 0;
    max-width: calc(100vw - 16px);
    max-height: calc(100vh - 16px);
    padding: 0;
    overflow: auto;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow-3);
    animation: appear var(--fast) var(--ease);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }
</style>
