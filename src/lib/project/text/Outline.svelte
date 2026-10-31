<!--
  The outline of the element in view, beside any view of it: it and every
  element under it by its name, as deep as it stands, the one in view marked. A name is pressed to go there;
  what has something under it folds and opens by its chevron, or with the
  left and right arrows; the up and down arrows go through the names, and
  Alt with the arrows moves an element, as in the text and the diagram.
-->
<script lang="ts">
  import { tick } from 'svelte';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import { numbering } from '$lib/figures/numbering.svelte';
  import { keysFor } from '$lib/shell/keys.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { indent, outdent, shift } from '../elements';
  import { kindColour } from '../kinds';
  import { isDoubled, kindLabel } from '../parts';
  import type { Project } from '../model/project.svelte';
  import { listed, outlineFolds, type OutlineItem } from '../outline';

  interface Props {
    project: Project;
    /** The element in view, whose branch is listed. */
    at: string;
    items: OutlineItem[];
    /** The element in view: at the top of the text, or chosen. */
    current: string | null;
    ongo: (id: string) => void;
    onclose: () => void;
    /** How wide it stands, in pixels. */
    width?: number;
  }

  let { project, at, items: all, current, ongo, onclose, width = 240 }: Props = $props();

  const folded = $derived(outlineFolds(at));
  /** The items that are listed: not those under a folded one. */
  const items = $derived(listed(all, folded));
  /** The numbers of the headings as the document prints them (record 0079). */
  const printed = $derived(numbering.of(project, at));
  const numberOf = (id: string) => {
    const p = printed.byId.get(id);
    return p?.kind === 'part' ? p.number : null;
  };

  function fold(id: string, to?: boolean) {
    const now = folded.has(id);
    if (to === now) return;
    if (now) folded.delete(id);
    else folded.add(id);
  }

  let list = $state<HTMLOListElement>();

  // The one in view is kept in view here as well.
  $effect(() => {
    if (!current || !list) return;
    list
      .querySelector(`[data-outline="${CSS.escape(current)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  });

  function focusItem(id: string) {
    list?.querySelector<HTMLElement>(`[data-outline="${CSS.escape(id)}"]`)?.focus();
  }

  async function onkeydown(event: KeyboardEvent, i: number) {
    const id = items[i].id;
    // Alt+Shift and the arrows are the view's: in and out of an element.
    if (event.altKey && event.shiftKey) return;
    if (event.altKey && !event.shiftKey && event.key.startsWith('Arrow')) {
      event.preventDefault();
      event.stopPropagation();
      const tree = project.tree(at);
      const moved =
        event.key === 'ArrowUp'
          ? shift(project, tree, id, -1)
          : event.key === 'ArrowDown'
            ? shift(project, tree, id, 1)
            : event.key === 'ArrowRight'
              ? indent(project, tree, id)
              : outdent(project, tree, id);
      if (moved) {
        await tick();
        focusItem(id);
      }
      return;
    }
    // The left arrow folds, the right opens; on one that has nothing under it, they go up and down.
    const item = items[i];
    if (item.children > 0 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const wants = event.key === 'ArrowLeft';
      if (folded.has(item.id) !== wants) {
        event.preventDefault();
        fold(item.id, wants);
        return;
      }
    }
    const next =
      event.key === 'ArrowDown'
        ? items[i + 1]
        : event.key === 'ArrowUp'
          ? items[i - 1]
          : event.key === 'Home'
            ? items[0]
            : event.key === 'End'
              ? items[items.length - 1]
              : undefined;
    if (next) {
      event.preventDefault();
      focusItem(next.id);
    }
  }
</script>

<aside class="outline" aria-label={t('text-outline')} style:--outline-width="{width}px">
  <header>
    <h2>{t('text-outline')}</h2>
    <IconButton
      label={t('common-close')}
      shortcut={keysFor('text-outline')}
      size="sm"
      onclick={onclose}
    >
      <X size={14} />
    </IconButton>
  </header>
  <ol bind:this={list}>
    {#each items as item, i (item.id)}
      {@const node = project.nodes.get(item.id)}
      {@const number = numberOf(item.id)}
      <li>
        <button
          type="button"
          data-outline={item.id}
          class:chosen={item.id === current}
          class:away={item.away}
          class:excluded={item.excluded}
          style:padding-left="{4 + Math.min(item.level, 6) * 12}px"
          aria-current={item.id === current ? 'location' : undefined}
          tabindex={item.id === current || (!current && i === 0) ? 0 : -1}
          onclick={() => ongo(item.id)}
          onkeydown={(e) => onkeydown(e, i)}
        >
          {#if item.children > 0}
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <span
              class="chevron"
              role="button"
              tabindex="-1"
              aria-expanded={!folded.has(item.id)}
              aria-label={folded.has(item.id)
                ? t('text-outline-unfold')
                : t('text-outline-fold-sub')}
              onclick={(e) => {
                e.stopPropagation();
                fold(item.id);
              }}
            >
              {#if folded.has(item.id)}<ChevronRight size={12} />{:else}<ChevronDown
                  size={12}
                />{/if}
            </span>
          {:else}
            <span class="chevron none"></span>
          {/if}
          {#if node?.kind}
            {@const label = kindLabel(project, node.kind)}
            {#if label}
              <span
                class="dot"
                class:doubled={label.part && isDoubled(project, item.id)}
                style:background={kindColour(label.colour).ink}
                title={label.part && isDoubled(project, item.id)
                  ? `${label.name} — ${t('parts-doubled')}`
                  : label.name}
              ></span>
            {/if}
          {/if}
          {#if number}<span class="number">{number}</span>{/if}
          <span class="name truncate">{node?.title || t('project-untitled')}</span>
        </button>
      </li>
    {/each}
  </ol>
</aside>

<style>
  .outline {
    display: flex;
    flex-direction: column;
    width: var(--outline-width, 240px);
    flex: none;
    min-height: 0;
    border-right: 1px solid var(--line);
    background: var(--paper-sunken);
  }
  header {
    display: flex;
    align-items: center;
    height: 36px;
    flex: none;
    padding: 0 6px 0 14px;
  }
  h2 {
    flex: 1;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  ol {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 0 6px 24px;
    list-style: none;
  }
  button {
    display: flex;
    align-items: flex-start;
    width: 100%;
    padding-top: 4px;
    padding-bottom: 4px;
    padding-right: 8px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font-size: var(--text-sm);
    text-align: left;
    cursor: pointer;
  }
  button:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  button.chosen {
    background: var(--accent-soft);
    color: var(--accent-strong);
    font-weight: 550;
  }
  button.away {
    color: var(--ink-4);
  }
  button.excluded .name {
    text-decoration: line-through;
    text-decoration-color: var(--ink-4);
  }
  .name {
    min-width: 0;
  }
  .number {
    flex: none;
    margin-right: 0.35em;
    color: var(--ink-3);
    font-variant-numeric: tabular-nums;
  }
  .chevron {
    flex: none;
    display: inline-flex;
    width: 14px;
    height: 18px;
    margin-right: 2px;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    color: var(--ink-4);
  }
  .chevron:not(.none):hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .dot {
    flex: none;
    width: 8px;
    height: 8px;
    margin: 5px 6px 0 -2px;
    border-radius: 50%;
  }
  /* A second of a kind the document has one of: hollow, since it is not printed. */
  .dot.doubled {
    box-shadow: inset 0 0 0 2px var(--paper);
  }
</style>
