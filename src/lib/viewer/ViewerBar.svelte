<script lang="ts">
  /**
   * The bar of a file side (ADR 0069): the page in view, with the number it
   * has in print where that differs from its count; a field to go to a page
   * by either; and the zoom, in a field that takes any percent and a menu
   * of steps. Nothing of a map: no views, no writing tools. An image that
   * has pixels has *Edit* after the zoom (ADR 0071).
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Pencil from '@lucide/svelte/icons/pencil';
  import { t } from '$lib/i18n';
  import { FILE, FILE_ZOOMS, zoomAsked } from '$lib/preview/zoom';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { pageAsked } from './pages';

  interface Props {
    page: number;
    count: number;
    labels: string[];
    /** Whether the file is a picture: fitted whole, not to the width. */
    picture: boolean;
    zoom: number | null;
    /** The factor the pages are shown at now, in percent. */
    percent: number;
    onpage: (page: number) => void;
    onzoom: (zoom: number | null) => void;
    /** Whether the file is an image that can be edited: one with pixels, not a drawing. */
    editable?: boolean;
    /** Whether it is being edited. */
    editing?: boolean;
    onedit?: () => void;
  }

  let {
    page,
    count,
    labels,
    picture,
    zoom,
    percent,
    onpage,
    onzoom,
    editable = false,
    editing = false,
    onedit,
  }: Props = $props();

  const printed = $derived(labels[page - 1] ?? '');
  let said = $state('');

  function go(event: Event) {
    event.preventDefault();
    const n = pageAsked(said, labels);
    if (n) onpage(n);
    said = '';
  }

  // ---- the zoom: a field, and a menu ----

  /** What the field of the zoom holds: the percent shown, until it is written in. */
  let zoomSaid = $state('');
  let writing = $state(false);
  $effect(() => {
    if (!writing) zoomSaid = String(percent);
  });

  function zoomGo(event: Event) {
    event.preventDefault();
    const z = zoomAsked(zoomSaid, FILE);
    if (z !== null) onzoom(z);
    (event.currentTarget as HTMLFormElement).querySelector('input')?.blur();
  }

  /** A press that gives the field the cursor leaves all of it chosen: the mouseup is not let take that away. */
  let justFocused = false;
  function zoomFocus(event: FocusEvent) {
    writing = true;
    justFocused = true;
    (event.currentTarget as HTMLInputElement).select();
  }
  function zoomMouseUp(event: MouseEvent) {
    if (justFocused) event.preventDefault();
    justFocused = false;
  }

  function zoomKey(event: KeyboardEvent) {
    event.stopPropagation();
    if (event.key === 'Escape') (event.currentTarget as HTMLInputElement).blur();
  }

  function zoomMenu(event: MouseEvent) {
    openMenu(
      event.currentTarget as HTMLElement,
      [
        {
          label: t(picture ? 'viewer-fit-image' : 'viewer-fit-width'),
          checked: zoom === null,
          shortcut: keysFor('preview-zoom-fit'),
          action: () => onzoom(null),
        },
        { kind: 'separator' },
        ...FILE_ZOOMS.map((z) => ({
          label: t('viewer-zoom-percent', { percent: z * 100 }),
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
  <form class="zoom-field" onsubmit={zoomGo}>
    <input
      type="text"
      inputmode="decimal"
      bind:value={zoomSaid}
      aria-label={t('viewer-zoom-field')}
      data-viewer-zoom-field
      onfocus={zoomFocus}
      onmouseup={zoomMouseUp}
      onblur={() => (writing = false)}
      onkeydown={zoomKey}
    />
    <span class="unit">%</span>
  </form>
  <button
    type="button"
    class="zoom"
    aria-label={t('viewer-zoom-choose')}
    aria-haspopup="menu"
    data-viewer-zoom
    use:tooltip={{ text: t('viewer-zoom-choose') }}
    onclick={zoomMenu}
  >
    {#if zoom === null}<span>{t(picture ? 'viewer-fit-image' : 'viewer-fit-width')}</span>{/if}
    <ChevronDown size={12} />
  </button>
  {#if editable && onedit}
    <span class="rule" role="separator"></span>
    <button
      type="button"
      class="zoom edit"
      class:on={editing}
      aria-pressed={editing}
      disabled={editing}
      data-viewer-edit
      onclick={onedit}
    >
      <Pencil size={13} />
      <span>{t('viewer-edit')}</span>
    </button>
  {/if}
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
  .zoom-field {
    display: inline-flex;
    align-items: center;
    gap: 3px;
  }
  .zoom-field input {
    width: 52px;
    height: 26px;
    padding: 0 6px;
    border: 1px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    color: var(--ink);
    font: inherit;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }
  .unit {
    color: var(--ink-3);
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
    padding: 0 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
  }
  .zoom:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .edit.on,
  .edit.on:hover {
    background: var(--paper-hover);
    color: var(--ink);
    cursor: default;
  }
</style>
