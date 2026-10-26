<script lang="ts">
  /**
   * The bar of a file side (ADR 0069): the page in view, with the number it
   * has in print where that differs from its count; a field to go to a page
   * by either; and the zoom, as the typesetting pane has it. Nothing of a
   * map: no views, no writing tools.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import { t } from '$lib/i18n';
  import { ZOOMS } from '$lib/preview/zoom';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { pageAsked } from './pages';

  interface Props {
    page: number;
    count: number;
    labels: string[];
    zoom: number | null;
    /** The factor the pages are shown at now, in percent. */
    percent: number;
    onpage: (page: number) => void;
    onzoom: (zoom: number | null) => void;
  }

  let { page, count, labels, zoom, percent, onpage, onzoom }: Props = $props();

  const printed = $derived(labels[page - 1] ?? '');
  let said = $state('');

  function go(event: Event) {
    event.preventDefault();
    const n = pageAsked(said, labels);
    if (n) onpage(n);
    said = '';
  }

  function zoomMenu(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t('viewer-fit-width'),
          checked: zoom === null,
          shortcut: keysFor('preview-zoom-fit'),
          action: () => onzoom(null),
        },
        { kind: 'separator' },
        ...ZOOMS.map((z) => ({
          label: t('viewer-zoom-percent', { percent: String(Math.round(z * 100)) }),
          checked: zoom === z,
          action: () => onzoom(z),
        })),
      ],
      { side: 'bottom', align: 'start' },
    );
  }
</script>

<div class="bar" data-viewer-bar>
  <span class="page" data-viewer-page={page}>
    {t('viewer-page-of', { page, count })}
    {#if printed && printed !== String(page)}<span class="printed"
        >{t('viewer-printed', { label: printed })}</span
      >{/if}
  </span>
  <form class="go" onsubmit={go}>
    <input
      type="text"
      bind:value={said}
      placeholder={t('viewer-go-to-page')}
      aria-label={t('viewer-go-to-page')}
      data-viewer-go
      onkeydown={(e) => e.stopPropagation()}
    />
  </form>
  <span class="rule" role="separator"></span>
  <button
    type="button"
    class="zoom"
    aria-label={t('viewer-zoom')}
    aria-haspopup="menu"
    data-viewer-zoom
    use:tooltip={{ text: t('viewer-zoom') }}
    onclick={zoomMenu}
  >
    <span
      >{zoom === null
        ? t('viewer-fit-width')
        : t('viewer-zoom-percent', { percent: String(percent) })}</span
    >
    <ChevronDown size={12} />
  </button>
</div>

<style>
  .bar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: none;
    min-width: 0;
    min-height: 40px;
    padding: 4px 8px 4px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
    font-size: var(--text-sm);
    color: var(--ink-2);
  }
  .page {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }
  .printed {
    margin-left: 4px;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .go input {
    width: 104px;
    height: 26px;
    padding: 0 8px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
  }
  .rule {
    flex: none;
    width: 1px;
    height: 16px;
    margin: 0 2px;
    background: var(--line);
  }
  .zoom {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    height: 26px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
  }
  .zoom:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
</style>
