<!--
  The buttons of zoom of a view that pans and zooms (`pan-zoom.svelte.ts`),
  in its corner: farther, the scale (which goes back to the actual size),
  closer, and showing all. Buttons of the view's own go before showing all,
  after a rule (`children`), and take the looks of these.
-->
<script lang="ts">
  import Maximize from '@lucide/svelte/icons/maximize';
  import Minus from '@lucide/svelte/icons/minus';
  import Plus from '@lucide/svelte/icons/plus';
  import type { Snippet } from 'svelte';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import type { PanZoom } from './pan-zoom.svelte';
  import { tooltip } from './tooltip';

  interface Props {
    view: PanZoom;
    /** Shows all there is: the view knows what that is. */
    onfit: () => void;
    /** What showing all is called in this view: the whole map, where none is given. */
    fitLabel?: string;
    /** Buttons of the view's own, before showing all; each group after a `span.rule`. */
    children?: Snippet;
  }

  let { view, onfit, fitLabel, children }: Props = $props();

  const fitWords = $derived(fitLabel ?? t('diagram-show-all'));
</script>

<div class="controls" role="group" aria-label={t('diagram-view')}>
  <button
    type="button"
    aria-label={t('diagram-zoom-out')}
    use:tooltip={{
      text: t('diagram-zoom-out'),
      shortcut: keysFor('diagram-farther'),
      side: 'top',
    }}
    onclick={() => view.zoomBy(1 / 1.25)}
  >
    <Minus size={14} />
  </button>
  <button
    type="button"
    class="level"
    aria-label={t('diagram-actual-size')}
    use:tooltip={{ text: t('diagram-actual-size'), side: 'top' }}
    onclick={() => view.zoomTo(1)}
  >
    {t('diagram-zoom', { percent: Math.round(view.view.k * 100) })}
  </button>
  <button
    type="button"
    aria-label={t('diagram-zoom-in')}
    use:tooltip={{ text: t('diagram-zoom-in'), shortcut: keysFor('diagram-closer'), side: 'top' }}
    onclick={() => view.zoomBy(1.25)}
  >
    <Plus size={14} />
  </button>
  {@render children?.()}
  <span class="rule"></span>
  <button
    type="button"
    aria-label={fitWords}
    use:tooltip={{ text: fitWords, shortcut: keysFor('diagram-whole'), side: 'top' }}
    onclick={onfit}
  >
    <Maximize size={14} />
  </button>
</div>

<style>
  .controls {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    align-items: center;
    padding: 2px;
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    background: var(--paper-raised);
    box-shadow: var(--shadow-1);
    cursor: default;
  }
  /* The view's own buttons are drawn here too, with these looks. */
  .controls :global(button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .controls :global(button.active) {
    color: var(--gold);
  }
  .controls :global(button:hover) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .controls .level {
    min-width: 46px;
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .controls :global(.rule) {
    width: 1px;
    height: 14px;
    margin: 0 2px;
    background: var(--line);
  }
</style>
