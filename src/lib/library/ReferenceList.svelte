<script lang="ts">
  import type { Summary } from '$lib/api/library';
  import { startDrag } from '$lib/ui/drag.svelte';
  import { plural, shortLabel } from './format';
  import ReferenceRow from './ReferenceRow.svelte';

  interface Props {
    entries: Summary[];
    /** Ids of the selected entries, in the order they were selected. */
    selection: string[];
    compact?: boolean;
    onopen?: (entry: Summary) => void;
    oncontext?: (event: MouseEvent, entries: Summary[]) => void;
    ondelete?: (entries: Summary[]) => void;
    label?: string;
  }

  let {
    entries,
    selection = $bindable(),
    compact = false,
    onopen,
    oncontext,
    ondelete,
    label = 'References',
  }: Props = $props();

  const ROW = 56;
  const OVERSCAN = 6;

  let viewport = $state<HTMLDivElement>();
  let scrollTop = $state(0);
  let height = $state(600);
  /** Where a range selected with Shift begins. */
  let anchor = $state<string | null>(null);

  const selected = $derived(new Set(selection));
  const first = $derived(Math.max(0, Math.floor(scrollTop / ROW) - OVERSCAN));
  const last = $derived(Math.min(entries.length, Math.ceil((scrollTop + height) / ROW) + OVERSCAN));
  const visible = $derived(entries.slice(first, last));
  const focused = $derived(selection.length ? selection[selection.length - 1] : null);

  $effect(() => {
    if (!viewport) return;
    const observer = new ResizeObserver(() => (height = viewport!.clientHeight));
    observer.observe(viewport);
    return () => observer.disconnect();
  });

  function indexOf(id: string | null): number {
    return id ? entries.findIndex((e) => e.id === id) : -1;
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
    const ids = entries.slice(lo, hi + 1).map((e) => e.id);
    return a < b ? ids : ids.reverse();
  }

  function select(
    entry: Summary,
    event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) {
    if (event.shiftKey && anchor) {
      const a = indexOf(anchor);
      const b = indexOf(entry.id);
      if (a >= 0 && b >= 0) {
        selection = range(a, b);
        return;
      }
    }
    if (event.ctrlKey || event.metaKey) {
      selection = selected.has(entry.id)
        ? selection.filter((id) => id !== entry.id)
        : [...selection, entry.id];
      anchor = entry.id;
      return;
    }
    selection = [entry.id];
    anchor = entry.id;
  }

  function onpointerdown(event: PointerEvent, entry: Summary) {
    if (event.button !== 0) return;
    viewport?.focus({ preventScroll: true });
    // Pressing on something selected may begin a drag of the whole selection,
    // so the selection is narrowed only when the button is released.
    const wasSelected =
      selected.has(entry.id) && !event.shiftKey && !event.ctrlKey && !event.metaKey;
    if (!wasSelected) select(entry, event);
    let dragged = false;
    startDrag(
      event,
      () => {
        dragged = true;
        const ids = selection.filter((id) => entries.some((e) => e.id === id));
        if (!ids.length) return null;
        return {
          kind: 'references',
          data: ids,
          label: ids.length === 1 ? shortLabel(entry) : plural(ids.length, 'reference'),
        };
      },
      () => {},
    );
    if (wasSelected) {
      const up = () => {
        if (!dragged) select(entry, event);
      };
      window.addEventListener('pointerup', up, { once: true });
    }
  }

  function oncontextmenu(event: MouseEvent, entry: Summary) {
    if (!oncontext) return;
    event.preventDefault();
    if (!selected.has(entry.id)) {
      selection = [entry.id];
      anchor = entry.id;
    }
    const chosen = entries.filter((e) => selection.includes(e.id) || e.id === entry.id);
    oncontext(event, chosen);
  }

  function onkeydown(event: KeyboardEvent) {
    if (!entries.length) return;
    const current = indexOf(focused);
    let next = current;
    const page = Math.max(1, Math.floor(height / ROW) - 1);
    switch (event.key) {
      case 'ArrowDown':
        next = Math.min(entries.length - 1, current + 1);
        break;
      case 'ArrowUp':
        next = current < 0 ? 0 : Math.max(0, current - 1);
        break;
      case 'PageDown':
        next = Math.min(entries.length - 1, Math.max(0, current) + page);
        break;
      case 'PageUp':
        next = Math.max(0, current - page);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = entries.length - 1;
        break;
      case 'Enter':
        if (current >= 0) onopen?.(entries[current]);
        event.preventDefault();
        return;
      case 'Delete':
        if (selection.length) ondelete?.(entries.filter((e) => selected.has(e.id)));
        event.preventDefault();
        return;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          selection = entries.map((e) => e.id);
          event.preventDefault();
        }
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
      selection = [entries[next].id];
      anchor = entries[next].id;
    }
    reveal(next);
  }

  /** Brings an entry into view; used when a new entry has been added. */
  export function scrollTo(id: string) {
    const i = indexOf(id);
    if (i >= 0) reveal(i);
  }
</script>

<div
  bind:this={viewport}
  class="list"
  role="listbox"
  aria-label={label}
  aria-multiselectable="true"
  tabindex="0"
  onscroll={() => (scrollTop = viewport!.scrollTop)}
  {onkeydown}
>
  <div class="sizer" style:height="{entries.length * ROW}px">
    <div class="window" style:transform="translateY({first * ROW}px)">
      {#each visible as entry (entry.id)}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          class="item"
          role="option"
          tabindex="-1"
          aria-selected={selected.has(entry.id)}
          data-id={entry.id}
          style:height="{ROW}px"
          onpointerdown={(e) => onpointerdown(e, entry)}
          ondblclick={() => onopen?.(entry)}
          oncontextmenu={(e) => oncontextmenu(e, entry)}
        >
          <ReferenceRow {entry} selected={selected.has(entry.id)} {compact} />
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
  .item:hover :global(.row:not(.selected)) {
    background: var(--paper-hover);
  }
  .list:focus-visible .item[aria-selected='true'] :global(.row) {
    box-shadow: inset 2px 0 0 var(--accent);
  }
</style>
