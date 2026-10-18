<script lang="ts">
  /**
   * The files of the folder in view, one line each: the kind, the name, the
   * reference it belongs to, the size. Several are selected as references
   * are in their list, and dragged onto a folder together. Only the lines
   * that are seen are made, so that a store of thousands scrolls freely.
   */
  import type { FileView } from '$lib/api/files';
  import { t } from '$lib/i18n';
  import { fileSize } from '$lib/library/format';
  import { startDrag } from '$lib/ui/drag.svelte';
  import { FILES_DRAGGED, KIND_ICONS, kindWords, referenceWords } from './store.svelte';
  import { keyOf } from '$lib/shell/keys.svelte';

  interface Props {
    files: FileView[];
    /** Hashes of the selected files, in the order they were selected. */
    selection: string[];
    onopen?: (file: FileView) => void;
    oncontext?: (event: MouseEvent, chosen: FileView[]) => void;
    ondelete?: (chosen: FileView[]) => void;
    label?: string;
  }

  let { files, selection = $bindable(), onopen, oncontext, ondelete, label }: Props = $props();

  const ROW = 38;
  const OVERSCAN = 8;

  let viewport = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let height = $state(600);
  /** Where a range selected with Shift begins. */
  let anchor = $state<string | null>(null);

  const selected = $derived(new Set(selection));
  const first = $derived(Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN));
  const last = $derived(Math.min(files.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN));
  const visible = $derived(files.slice(first, last));
  const focused = $derived(selection.length ? selection[selection.length - 1] : null);

  $effect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(() => (height = viewport!.clientHeight));
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  function indexOf(hash: string | null): number {
    return hash ? files.findIndex((f) => f.hash === hash) : -1;
  }

  function reveal(index: number) {
    if (!viewport) return;
    const top = index * ROW;
    if (top < viewport.scrollTop) viewport.scrollTop = top;
    else if (top + ROW > viewport.scrollTop + viewport.clientHeight) {
      viewport.scrollTop = top + ROW - viewport.clientHeight;
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
    const page = Math.max(1, Math.floor(height / ROW) - 1);
    // Ctrl+A by its letter, which is found on a Greek or a Russian keyboard too.
    if ((event.ctrlKey || event.metaKey) && keyOf(event) === 'a') {
      selection = files.map((f) => f.hash);
      event.preventDefault();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(files.length - 1, current + 1);
        break;
      case 'ArrowUp':
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
  role="listbox"
  aria-label={label ?? t('files-all')}
  aria-multiselectable="true"
  tabindex="0"
  data-file-list
  onscroll={() => (scrollTop = viewport!.scrollTop)}
  {onkeydown}
>
  <div class="sizer" style:height="{files.length * ROW}px">
    <div class="window" style:transform="translateY({first * ROW}px)">
      {#each visible as file (file.hash)}
        {@const Icon = KIND_ICONS[file.kind]}
        {@const reference = file.references[0]}
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
          style:height="{ROW}px"
          onpointerdown={(e) => onpointerdown(e, file)}
          ondblclick={() => onopen?.(file)}
          oncontextmenu={(e) => oncontextmenu(e, file)}
        >
          <span class="icon" title={kindWords(file.kind)}><Icon size={16} strokeWidth={1.6} /></span
          >
          <span class="name truncate">{file.name}</span>
          <span class="reference truncate" class:none={!reference}>
            {#if reference}
              {referenceWords(reference)}{#if file.references.length > 1}<span class="more"
                  >+{file.references.length - 1}</span
                >{/if}
            {:else}
              {t('files-no-reference')}
            {/if}
          </span>
          <span class="size">{file.exists ? fileSize(file.size) : t('files-missing')}</span>
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
  .more {
    margin-left: 4px;
    color: var(--ink-3);
    font-size: var(--text-xs);
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
</style>
