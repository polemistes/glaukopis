<script lang="ts">
  /**
   * The row of tabs over a file side (ADR 0072): each tab a file of the
   * library at a place of its own, the one shown marked; a close mark on the
   * one shown and the one under the pointer, the middle button closing too;
   * a plus at the end that adds a file. Tabs are moved by dragging; a tab's
   * menu, on the right button or on the chevron of the one shown, closes it
   * or the others, opens its file again in a new tab, shows it in the
   * library, or opens it in another program. The row scrolls sideways under
   * the wheel where it is wider than the side.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Copy from '@lucide/svelte/icons/copy';
  import ExternalLink from '@lucide/svelte/icons/external-link';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import { attachmentOpen } from '$lib/api/library';
  import { files, KIND_ICONS } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import { router } from '$lib/state/router.svelte';
  import { openMenu } from '$lib/ui/menu.svelte';
  import { notifyError } from '$lib/ui/toast.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import type { Sources } from './sources';

  interface Props {
    sources: Sources;
    /** Shows a tab. */
    onactivate: (id: string) => void;
    onclose: (id: string) => void;
    oncloseothers: (id: string) => void;
    onagain: (id: string) => void;
    onmove: (id: string, to: number) => void;
    onadd: () => void;
  }

  let { sources, onactivate, onclose, oncloseothers, onagain, onmove, onadd }: Props = $props();

  $effect(() => {
    if (!files.loaded) void files.load();
  });

  let row = $state<HTMLDivElement>();

  const nameOf = (hash: string) => files.get(hash)?.name ?? '';
  const gone = (hash: string) => files.loaded && !files.get(hash);

  // ---- dragging a tab to another place in the row ----

  let dragging: { id: string; x: number; moved: boolean } | null = null;
  /** A tab let go after it was dragged: the click that follows does not show it. */
  let dragged = false;

  function down(event: PointerEvent, id: string) {
    if (event.button !== 0) return;
    dragging = { id, x: event.clientX, moved: false };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (!dragging || !row) return;
    if (!dragging.moved && Math.abs(event.clientX - dragging.x) < 5) return;
    dragging.moved = true;
    const tabs = Array.from(row.querySelectorAll<HTMLElement>('[data-tab-cell]'));
    const at = sources.tabs.findIndex((t) => t.id === dragging?.id);
    const next = tabs[at + 1]?.getBoundingClientRect();
    const before = tabs[at - 1]?.getBoundingClientRect();
    if (next && event.clientX > next.left + next.width / 2) onmove(dragging.id, at + 1);
    else if (before && event.clientX < before.left + before.width / 2) onmove(dragging.id, at - 1);
  }

  function up() {
    dragged = !!dragging?.moved;
    dragging = null;
  }

  function click(id: string) {
    if (dragged) {
      dragged = false;
      return;
    }
    onactivate(id);
  }

  function auxclick(event: MouseEvent, id: string) {
    if (event.button !== 1) return;
    event.preventDefault();
    onclose(id);
  }

  function wheel(event: WheelEvent) {
    if (!row || !event.deltaY || row.scrollWidth <= row.clientWidth) return;
    event.preventDefault();
    row.scrollLeft += event.deltaY;
  }

  // ---- the menu of a tab ----

  function menu(anchor: HTMLElement, id: string) {
    const tab = sources.tabs.find((t) => t.id === id);
    if (!tab) return;
    const record = files.get(tab.file);
    openMenu(
      anchor,
      [
        { label: t('viewer-tab-close'), icon: X, action: () => onclose(id) },
        {
          label: t('viewer-tab-close-others'),
          disabled: sources.tabs.length < 2,
          action: () => oncloseothers(id),
        },
        { label: t('viewer-tab-again'), icon: Copy, disabled: !record, action: () => onagain(id) },
        { kind: 'separator' },
        {
          label: t('viewer-tab-in-library'),
          icon: FolderOpen,
          disabled: !record,
          action: () =>
            record &&
            router.go({
              view: 'files',
              folder: files.folderOf(record) ?? undefined,
              file: record.hash,
            }),
        },
        {
          label: t('files-open-elsewhere'),
          icon: ExternalLink,
          disabled: !record,
          action: () =>
            record &&
            void attachmentOpen(record.path).catch((e) =>
              notifyError(t('library-file-open-failed'), e),
            ),
        },
      ],
      { side: 'bottom', align: 'start' },
    );
  }

  function contextmenu(event: MouseEvent, id: string) {
    event.preventDefault();
    menu(event.currentTarget as HTMLElement, id);
  }

  // The tab shown is kept in sight.
  $effect(() => {
    const id = sources.active;
    const el = id ? row?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(id)}"]`) : null;
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  });
</script>

<div class="tabs" data-viewer-tabs>
  <div class="row" role="tablist" aria-label={t('viewer-tabs')} bind:this={row} onwheel={wheel}>
    {#each sources.tabs as tab (tab.id)}
      {@const record = files.get(tab.file)}
      {@const Icon = KIND_ICONS[record?.kind ?? 'pdf']}
      {@const shown = tab.id === sources.active}
      <div class="cell" class:shown class:gone={gone(tab.file)} data-tab-cell>
        <button
          type="button"
          class="tab"
          role="tab"
          aria-selected={shown}
          data-tab={tab.id}
          data-tab-file={tab.file}
          title={gone(tab.file) ? t('viewer-tab-gone') : nameOf(tab.file)}
          onpointerdown={(e) => down(e, tab.id)}
          onpointermove={move}
          onpointerup={up}
          onclick={() => click(tab.id)}
          onauxclick={(e) => auxclick(e, tab.id)}
          oncontextmenu={(e) => contextmenu(e, tab.id)}
        >
          <Icon size={13} />
          <span class="name">{nameOf(tab.file) || t('viewer-file')}</span>
        </button>
        {#if shown}
          <button
            type="button"
            class="mark"
            aria-label={t('viewer-tab-menu')}
            data-tab-menu
            use:tooltip={{ text: t('viewer-tab-menu') }}
            onclick={(e) => menu(e.currentTarget, tab.id)}
          >
            <ChevronDown size={12} />
          </button>
        {/if}
        <button
          type="button"
          class="mark close"
          aria-label={t('viewer-tab-close')}
          data-tab-close
          use:tooltip={{ text: t('viewer-tab-close') }}
          onclick={() => onclose(tab.id)}
        >
          <X size={12} />
        </button>
      </div>
    {/each}
  </div>
  <button
    type="button"
    class="add"
    aria-label={t('viewer-tab-add')}
    data-tab-add
    use:tooltip={{ text: t('viewer-tab-add') }}
    onclick={onadd}
  >
    <Plus size={14} />
  </button>
</div>

<style>
  .tabs {
    display: flex;
    align-items: stretch;
    flex: none;
    min-width: 0;
    height: 32px;
    border-bottom: 1px solid var(--line);
    background: var(--paper-sunken);
  }
  .row {
    display: flex;
    align-items: stretch;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .row::-webkit-scrollbar {
    display: none;
  }
  .cell {
    display: flex;
    align-items: center;
    flex: none;
    max-width: 220px;
    padding-right: 4px;
    border-right: 1px solid var(--line);
    color: var(--ink-3);
  }
  .cell.shown {
    background: var(--paper);
    color: var(--ink);
    box-shadow: inset 0 -2px 0 var(--accent);
  }
  .cell.gone .name {
    font-style: italic;
    text-decoration: line-through;
  }
  .tab {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    height: 100%;
    padding: 0 6px 0 10px;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: var(--text-sm);
    cursor: default;
    touch-action: none;
  }
  .tab:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 20px;
    height: 20px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .mark:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  /* The close mark of a tab not shown comes under the pointer only. */
  .cell:not(.shown) .close {
    visibility: hidden;
  }
  .cell:hover .close,
  .close:focus-visible {
    visibility: visible;
  }
  .add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 32px;
    border: none;
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .add:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
</style>
