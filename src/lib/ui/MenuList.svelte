<script lang="ts">
  import { tick } from 'svelte';
  import Check from '@lucide/svelte/icons/check';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import { place, type Align, type RectLike, type Side } from './floating';
  import { onTop } from './top';
  import type { MenuItem } from './menu.svelte';
  import Self from './MenuList.svelte';

  interface Props {
    items: MenuItem[];
    anchor: RectLike;
    side: Side;
    align: Align;
    minWidth?: number;
    /** Called when an item was chosen: the whole menu closes. */
    onchoose: () => void;
    /** Called when this list should close but its parent stay (Left, Escape in a submenu). */
    onback?: () => void;
    autofocus?: boolean;
  }

  let {
    items,
    anchor,
    side,
    align,
    minWidth,
    onchoose,
    onback,
    autofocus = true,
  }: Props = $props();

  let el = $state<HTMLDivElement>();
  let active = $state(-1);
  let sub = $state<{ index: number; anchor: RectLike } | null>(null);
  let subTimer: ReturnType<typeof setTimeout> | undefined;

  const hasChecks = $derived(
    items.some((i) => (i.kind ?? 'item') === 'item' && 'checked' in i && i.checked !== undefined),
  );
  const hasIcons = $derived(items.some((i) => 'icon' in i && i.icon));

  function selectable(i: number) {
    const item = items[i];
    if (!item) return false;
    const kind = item.kind ?? 'item';
    return (kind === 'item' || kind === 'submenu') && !('disabled' in item && item.disabled);
  }

  function move(delta: number) {
    if (!items.length) return;
    let i = active;
    for (let n = 0; n < items.length; n++) {
      i = (i + delta + items.length) % items.length;
      if (selectable(i)) {
        active = i;
        return;
      }
    }
  }

  function rowRect(i: number): RectLike {
    const row = el?.querySelector<HTMLElement>(`[data-index="${i}"]`);
    return (row ?? el!).getBoundingClientRect();
  }

  function openSub(i: number) {
    clearTimeout(subTimer);
    sub = { index: i, anchor: rowRect(i) };
  }

  function choose(i: number) {
    const item = items[i];
    if (!item || !selectable(i)) return;
    if (item.kind === 'submenu') {
      openSub(i);
      return;
    }
    if ((item.kind ?? 'item') === 'item' && 'action' in item) {
      onchoose();
      item.action();
    }
  }

  function onkeydown(event: KeyboardEvent) {
    if (sub) return; // the submenu has the keyboard
    switch (event.key) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'Home':
        active = -1;
        move(1);
        break;
      case 'End':
        active = items.length;
        move(-1);
        break;
      case 'ArrowRight':
        if (items[active]?.kind === 'submenu') openSub(active);
        else return;
        break;
      case 'ArrowLeft':
        if (onback) onback();
        else return;
        break;
      case 'Enter':
      case ' ':
        choose(active);
        break;
      case 'Escape':
        if (onback) onback();
        else onchoose();
        break;
      case 'Tab':
        onchoose();
        return;
      default: {
        // Type a letter to jump to the next item beginning with it.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const letter = event.key.toLocaleLowerCase();
          for (let n = 1; n <= items.length; n++) {
            const i = (Math.max(active, 0) + n) % items.length;
            const item = items[i];
            if (
              selectable(i) &&
              'label' in item &&
              item.label.toLocaleLowerCase().startsWith(letter)
            ) {
              active = i;
              break;
            }
          }
          break;
        }
        return;
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }

  function hover(i: number) {
    active = i;
    clearTimeout(subTimer);
    const item = items[i];
    if (item?.kind === 'submenu' && selectable(i)) {
      subTimer = setTimeout(() => openSub(i), 140);
    } else if (sub) {
      subTimer = setTimeout(() => (sub = null), 200);
    }
  }

  $effect(() => {
    if (!el) return;
    void items;
    place(el, anchor, { side, align, gap: onback ? 2 : 5 });
    if (autofocus) el.focus({ preventScroll: true });
  });

  async function backFromSub() {
    sub = null;
    await tick();
    el?.focus({ preventScroll: true });
  }
</script>

<div
  bind:this={el}
  class="menu"
  use:onTop
  role="menu"
  tabindex="-1"
  style:min-width={minWidth ? `${minWidth}px` : undefined}
  {onkeydown}
  oncontextmenu={(e) => e.preventDefault()}
>
  {#each items as item, i (i)}
    {#if item.kind === 'separator'}
      <div class="separator" role="separator"></div>
    {:else if item.kind === 'heading'}
      <div class="heading">{item.label}</div>
    {:else}
      {@const Icon = item.icon}
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div
        class="item"
        class:active={active === i}
        class:disabled={item.disabled}
        class:danger={item.kind !== 'submenu' && item.danger}
        class:open={sub?.index === i}
        role="menuitem"
        tabindex="-1"
        aria-disabled={item.disabled}
        data-index={i}
        onpointerenter={() => hover(i)}
        onclick={() => choose(i)}
      >
        {#if hasChecks}
          <span class="check">
            {#if item.kind !== 'submenu' && item.checked}<Check size={14} />{/if}
          </span>
        {/if}
        {#if hasIcons}
          <span class="icon"
            >{#if Icon}<Icon size={15} />{/if}</span
          >
        {/if}
        <span class="label">
          <span class="truncate">{item.label}</span>
          {#if item.kind !== 'submenu' && item.hint}<span class="hint truncate">{item.hint}</span
            >{/if}
        </span>
        {#if item.kind === 'submenu'}
          <span class="chevron"><ChevronRight size={14} /></span>
        {:else if item.shortcut}
          <span class="shortcut">{item.shortcut}</span>
        {/if}
      </div>
    {/if}
  {/each}
</div>

{#if sub}
  {@const parent = items[sub.index]}
  {#if parent?.kind === 'submenu'}
    <Self
      items={parent.items}
      anchor={sub.anchor}
      side="right"
      align="start"
      {onchoose}
      onback={backFromSub}
    />
  {/if}
{/if}

<style>
  .menu {
    position: fixed;
    z-index: 900;
    left: 0;
    top: 0;
    min-width: 180px;
    max-width: 380px;
    max-height: calc(100vh - 16px);
    overflow-y: auto;
    padding: 4px;
    background: var(--paper-raised);
    border: 1px solid var(--line);
    border-radius: var(--radius-m);
    box-shadow: var(--shadow-3);
    animation: appear var(--fast) var(--ease);
  }
  @keyframes appear {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
  }
  .item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    padding: 3px 8px;
    border-radius: var(--radius-s);
    color: var(--ink);
    cursor: pointer;
  }
  .item.active,
  .item.open {
    background: var(--accent-soft);
  }
  .item.disabled {
    color: var(--ink-4);
    cursor: default;
  }
  .item.disabled.active {
    background: transparent;
  }
  .item.danger {
    color: var(--danger);
  }
  .item.danger.active {
    background: var(--danger-soft);
  }
  .check,
  .icon {
    display: inline-flex;
    width: 16px;
    flex: none;
    color: var(--ink-3);
  }
  .item.danger .icon {
    color: inherit;
  }
  .label {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .hint {
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .shortcut {
    margin-left: 16px;
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .chevron {
    display: inline-flex;
    color: var(--ink-3);
    margin-right: -4px;
  }
  .separator {
    height: 1px;
    margin: 4px 6px;
    background: var(--line);
  }
  .heading {
    padding: 6px 8px 2px;
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-3);
  }
</style>
