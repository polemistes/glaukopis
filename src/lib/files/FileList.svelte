<script lang="ts">
  /**
   * The files of the folder in view (ADR 0043, 0070, 0073): one line each,
   * with the kind; where the file belongs to a reference, the reference's
   * people with their roles, its year, title and publisher, and the file's
   * name small after them; else the name and where the file is used; when it
   * was taken in and its size, and its folder where those under the folder
   * are shown too. A narrow list says the reference by its short form, and
   * leaves out when the file was taken in. Or a grid
   * of thumbnails, an image as it is and a PDF by its first page, in three
   * sizes. Several are selected as references are in their list, and
   * dragged onto a folder together. Only the lines or rows of tiles that are
   * seen are made, so that a library of thousands scrolls freely and only the
   * thumbnails in sight are asked for.
   */
  import type { FileView } from '$lib/api/files';
  import { languages, t } from '$lib/i18n';
  import { fileSize } from '$lib/library/format';
  import { startDrag } from '$lib/ui/drag.svelte';
  import { fileEnding } from '$lib/util/file-name';
  import { filesUi } from './store.svelte';
  import {
    FILES_DRAGGED,
    KIND_ICONS,
    kindWords,
    peopleWords,
    referenceWords,
    files as store,
  } from './store.svelte';
  import { keyOf } from '$lib/shell/keys.svelte';
  import Thumb from './Thumb.svelte';

  interface Props {
    files: FileView[];
    /** Hashes of the selected files, in the order they were selected. */
    selection: string[];
    onopen?: (file: FileView) => void;
    oncontext?: (event: MouseEvent, chosen: FileView[]) => void;
    ondelete?: (chosen: FileView[]) => void;
    label?: string;
    /** One line each, or their thumbnails. */
    mode?: 'list' | 'grid';
    /** How large the thumbnails are. */
    size?: 'small' | 'medium' | 'large';
    /** Whether each says the folder it stands in: where those under the folder in view are shown too. */
    folders?: boolean;
    /** The projects in which a file is a figure, by name, where it is one. */
    figuresIn?: (hash: string) => string[];
  }

  let {
    files,
    selection = $bindable(),
    onopen,
    oncontext,
    ondelete,
    label,
    mode = 'list',
    size = 'medium',
    folders = false,
    figuresIn = () => [],
  }: Props = $props();

  const ROW = 38;
  const OVERSCAN = 8;
  /** The side of a thumbnail, and the room around a tile and between tiles, in pixels. */
  const SIDES = { small: 96, medium: 160, large: 240 } as const;
  const GAP = 12;
  const PAD = 16;

  let viewport = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let height = $state(600);
  let width = $state(800);
  /** Where a range selected with Shift begins. */
  let anchor = $state<string | null>(null);

  const grid = $derived(mode === 'grid');
  /** Whether the list is wide enough for the columns of a reference: else its short form. */
  const wide = $derived(width >= 560);
  /** Whether it is wide enough for when each file was taken in too: that is in the pane and the order. */
  const roomy = $derived(width >= 900);
  const side = $derived(SIDES[size]);
  /** A tile: the thumbnail, and its name under it, with its folder where that is said. */
  const tileHeight = $derived(side + (folders ? 52 : 34));
  /** How many tiles stand in a row, and how high a row is with the room under it. */
  const across = $derived(
    grid ? Math.max(1, Math.floor((width - 2 * PAD + GAP) / (side + GAP))) : 1,
  );
  const rowHeight = $derived(grid ? tileHeight + GAP : ROW);
  const rows = $derived(Math.ceil(files.length / across));
  const firstRow = $derived(Math.max(0, Math.floor(scrollTop / rowHeight) - (grid ? 2 : OVERSCAN)));
  const lastRow = $derived(
    Math.min(rows, Math.ceil((scrollTop + height) / rowHeight) + (grid ? 2 : OVERSCAN)),
  );
  const visible = $derived(files.slice(firstRow * across, lastRow * across));
  const selected = $derived(new Set(selection));
  const focused = $derived(selection.length ? selection[selection.length - 1] : null);

  // The list is scrolled as it was left when it is made again.
  $effect(() => {
    if (!viewport) return;
    if (filesUi.scrollTop) {
      viewport.scrollTop = filesUi.scrollTop;
      scrollTop = viewport.scrollTop; // as far as the list reaches
    }
    const observer = new ResizeObserver(() => {
      height = viewport!.clientHeight;
      width = viewport!.clientWidth;
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  /** Where a file is used: the references it belongs to, else the projects in which it is a figure. */
  function used(file: FileView): { words: string; none: boolean } {
    const reference = file.references[0];
    if (reference) {
      const more = file.references.length > 1 ? ` +${file.references.length - 1}` : '';
      return { words: referenceWords(reference) + more, none: false };
    }
    const projects = figuresIn(file.hash);
    if (projects.length === 1)
      return { words: t('files-used-figure', { project: projects[0] }), none: false };
    if (projects.length > 1)
      return { words: t('files-used-figures', { count: projects.length }), none: false };
    return { words: t('files-no-reference'), none: true };
  }

  const dateFormat = $derived(
    new Intl.DateTimeFormat(languages.current, { year: 'numeric', month: 'short', day: 'numeric' }),
  );
  function added(file: FileView): string {
    const d = new Date(file.added);
    return Number.isNaN(d.getTime()) ? '' : dateFormat.format(d);
  }

  function folderName(file: FileView): string {
    return store.folder(store.folderOf(file))?.name ?? '';
  }

  function indexOf(hash: string | null): number {
    return hash ? files.findIndex((f) => f.hash === hash) : -1;
  }

  function reveal(index: number) {
    if (!viewport) return;
    const top = Math.floor(index / across) * rowHeight + (grid ? PAD : 0);
    if (top < viewport.scrollTop) viewport.scrollTop = Math.max(0, top - (grid ? PAD : 0));
    else if (top + rowHeight > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = top + rowHeight - viewport.clientHeight;
    }
  }

  function range(a: number, b: number): string[] {
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const hashes = files.slice(lo, hi + 1).map((f) => f.hash);
    return a < b ? hashes : hashes.reverse();
  }

  function select(
    file: FileView,
    event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) {
    if (event.shiftKey && anchor) {
      const a = indexOf(anchor);
      const b = indexOf(file.hash);
      if (a >= 0 && b >= 0) {
        selection = range(a, b);
        return;
      }
    }
    if (event.ctrlKey || event.metaKey) {
      selection = selected.has(file.hash)
        ? selection.filter((h) => h !== file.hash)
        : [...selection, file.hash];
      anchor = file.hash;
      return;
    }
    selection = [file.hash];
    anchor = file.hash;
  }

  function onpointerdown(event: PointerEvent, file: FileView) {
    if (event.button !== 0) return;
    viewport?.focus({ preventScroll: true });
    // Pressing on something selected may begin a drag of the whole selection,
    // so the selection is narrowed only when the button is released.
    const wasSelected =
      selected.has(file.hash) && !event.shiftKey && !event.ctrlKey && !event.metaKey;
    if (!wasSelected) select(file, event);
    let dragged = false;
    startDrag(event, () => {
      dragged = true;
      const hashes = selection.filter((h) => files.some((f) => f.hash === h));
      if (!hashes.length) return null;
      return {
        kind: FILES_DRAGGED,
        data: hashes,
        label: hashes.length === 1 ? file.name : t('files-count', { count: hashes.length }),
      };
    });
    if (wasSelected) {
      const up = () => {
        if (!dragged) select(file, event);
      };
      window.addEventListener('pointerup', up, { once: true });
    }
  }

  function oncontextmenu(event: MouseEvent, file: FileView) {
    if (!oncontext) return;
    event.preventDefault();
    if (!selected.has(file.hash)) {
      selection = [file.hash];
      anchor = file.hash;
    }
    oncontext(
      event,
      files.filter((f) => selection.includes(f.hash) || f.hash === file.hash),
    );
  }

  function onkeydown(event: KeyboardEvent) {
    if (!files.length) return;
    const current = indexOf(focused);
    let next = current;
    const page = Math.max(1, Math.floor(height / rowHeight) - 1) * across;
    // Ctrl+A by its letter, which is found on a Greek or a Russian keyboard too.
    if ((event.ctrlKey || event.metaKey) && keyOf(event) === 'a') {
      selection = files.map((f) => f.hash);
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(files.length - 1, current + across);
        break;
      case 'ArrowUp':
        next = current < 0 ? 0 : Math.max(0, current - across);
        break;
      // In the grid, along a row; in the list, nothing.
      case 'ArrowRight':
        if (!grid) return;
        next = Math.min(files.length - 1, current + 1);
        break;
      case 'ArrowLeft':
        if (!grid) return;
        next = current < 0 ? 0 : Math.max(0, current - 1);
        break;
      case 'PageDown':
        next = Math.min(files.length - 1, Math.max(0, current) + page);
        break;
      case 'PageUp':
        next = Math.max(0, current - page);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = files.length - 1;
        break;
      case 'Enter':
        if (current >= 0) onopen?.(files[current]);
        event.preventDefault();
        return;
      case 'Delete':
        if (selection.length) ondelete?.(files.filter((f) => selected.has(f.hash)));
        event.preventDefault();
        return;
      case 'Escape':
        if (selection.length > 1 && focused) {
          selection = [focused];
          event.preventDefault();
        }
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next < 0) return;
    if (event.shiftKey && anchor) {
      const a = indexOf(anchor);
      selection = range(a >= 0 ? a : next, next);
    } else {
      selection = [files[next].hash];
      anchor = files[next].hash;
    }
    reveal(next);
  }

  /** Brings a file into view. */
  export function scrollTo(hash: string) {
    const i = indexOf(hash);
    if (i >= 0) reveal(i);
  }
</script>

<div
  bind:this={viewport}
  class="list"
  class:grid
  role="listbox"
  aria-label={label ?? t('files-all')}
  aria-multiselectable="true"
  tabindex="0"
  data-file-list
  data-mode={mode}
  style:--side="{side}px"
  style:--tile="{tileHeight}px"
  style:--gap="{GAP}px"
  style:--pad="{PAD}px"
  onscroll={() => (scrollTop = filesUi.scrollTop = viewport!.scrollTop)}
  {onkeydown}
>
  <div class="sizer" style:height="{rows * rowHeight + (grid ? 2 * PAD : 0)}px">
    <div
      class="window"
      style:transform="translateY({firstRow * rowHeight}px)"
      style:grid-template-columns={grid ? `repeat(${across}, var(--side))` : undefined}
    >
      {#each visible as file (file.hash)}
        {@const Icon = KIND_ICONS[file.kind]}
        {@const where = used(file)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="item"
          class:selected={selected.has(file.hash)}
          class:missing={!file.exists}
          role="option"
          tabindex="-1"
          aria-selected={selected.has(file.hash)}
          data-hash={file.hash}
          data-kind={file.kind}
          style:height={grid ? undefined : `${ROW}px`}
          title={grid ? file.name : undefined}
          onpointerdown={(e) => onpointerdown(e, file)}
          ondblclick={() => onopen?.(file)}
          oncontextmenu={(e) => oncontextmenu(e, file)}
        >
          {#if grid}
            <span class="frame">
              {#if file.exists && (file.kind === 'picture' || file.kind === 'pdf')}
                <Thumb hash={file.hash} extension={fileEnding(file.name)} small alt="" />
              {:else}
                <span class="kind" title={kindWords(file.kind)}
                  ><Icon size={Math.round(side / 3)} strokeWidth={1.2} /></span
                >
              {/if}
              {#if !where.none}<span class="used-mark" title={where.words}></span>{/if}
            </span>
            <span class="name truncate">{file.name}</span>
            {#if folders}<span class="folder truncate">{folderName(file)}</span>{/if}
          {:else}
            {@const ref = file.references[0]}
            <span class="icon" title={kindWords(file.kind)}
              ><Icon size={16} strokeWidth={1.6} /></span
            >
            {#if ref && wide}
              {@const more = file.references.length > 1 ? ` +${file.references.length - 1}` : ''}
              <span class="people truncate" data-cell="people">{peopleWords(ref) + more}</span>
              <span class="year" data-cell="year">{ref.year}</span>
              <span class="title truncate" data-cell="title">{ref.title}</span>
              <span class="publisher truncate" data-cell="publisher">{ref.publisher}</span>
              <span class="file-name truncate" data-cell="name" title={file.name}>{file.name}</span>
            {:else if ref}
              <span class="short truncate" data-cell="people">{where.words}</span>
              <span class="file-name truncate" data-cell="name" title={file.name}>{file.name}</span>
            {:else}
              <span class="name truncate" data-cell="name">{file.name}</span>
              <span class="reference truncate" class:none={where.none}>{where.words}</span>
            {/if}
            {#if folders}<span class="folder truncate">{folderName(file)}</span>{/if}
            {#if roomy}<span class="added">{added(file)}</span>{/if}
            <span class="size">{file.exists ? fileSize(file.size) : t('files-missing')}</span>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .list {
    height: 100%;
    overflow-y: auto;
    outline: none;
  }
  .sizer {
    position: relative;
  }
  .window {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px 0 16px;
    border-bottom: 1px solid color-mix(in srgb, var(--line) 60%, transparent);
    color: var(--ink);
    cursor: default;
  }
  .item:hover:not(.selected) {
    background: var(--paper-hover);
  }
  .item.selected {
    background: var(--accent-soft);
  }
  .list:focus-visible .item.selected {
    box-shadow: inset 2px 0 0 var(--accent);
  }
  .icon {
    display: inline-flex;
    flex: none;
    color: var(--ink-3);
  }
  .selected .icon {
    color: var(--accent);
  }
  .name {
    flex: 1 1 50%;
    min-width: 0;
  }
  .reference {
    flex: 0 1 34%;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .reference.none {
    color: var(--ink-4);
    font-style: italic;
  }
  /* The columns of a reference (ADR 0073). */
  .people {
    flex: 0 1 18%;
    min-width: 0;
  }
  .year {
    flex: none;
    width: 44px;
    color: var(--ink-2);
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }
  .title {
    flex: 1 1 34%;
    min-width: 0;
    font-family: var(--font-text);
  }
  .publisher {
    flex: 0 1 14%;
    min-width: 0;
    color: var(--ink-2);
    font-size: var(--text-sm);
  }
  .short {
    flex: 1 1 50%;
    min-width: 0;
  }
  .file-name {
    flex: 0 1 14%;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .missing .file-name {
    text-decoration: line-through;
  }
  .size {
    flex: none;
    width: 64px;
    text-align: right;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .missing .name {
    color: var(--ink-3);
    text-decoration: line-through;
  }
  .folder {
    flex: 0 1 18%;
    min-width: 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .added {
    flex: none;
    width: 92px;
    text-align: right;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }

  /* The grid: tiles of the thumbnail and its name, a row at a time. */
  .grid .window {
    display: grid;
    gap: var(--gap);
    padding: var(--pad);
    justify-content: start;
  }
  .grid .item {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    width: var(--side);
    height: var(--tile);
    padding: 0;
    border: none;
    border-radius: var(--radius-m);
  }
  .grid .item.selected {
    background: none;
  }
  .grid .item:hover:not(.selected) {
    background: none;
  }
  .frame {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--side);
    height: var(--side);
    flex: none;
    border-radius: var(--radius-m);
    background: var(--paper-sunken);
    overflow: hidden;
  }
  .grid .item:hover .frame {
    box-shadow: 0 0 0 1px var(--line-strong);
  }
  .grid .item.selected .frame {
    box-shadow: 0 0 0 2px var(--accent);
  }
  .kind {
    display: inline-flex;
    color: var(--ink-4);
  }
  /* A file that is used, by a reference or as a figure. */
  .used-mark {
    position: absolute;
    right: 6px;
    bottom: 6px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 0 2px var(--paper);
  }
  .grid .name {
    flex: none;
    padding: 0 2px;
    font-size: var(--text-sm);
    text-align: center;
  }
  .grid .item.selected .name {
    color: var(--accent-strong);
    font-weight: 550;
  }
  .grid .folder {
    flex: none;
    padding: 0 2px;
    text-align: center;
  }
</style>
