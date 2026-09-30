<!--
  The outline of a map beside its text: every element by its name, as deep as
  it stands, the one in view marked. A name is pressed to go there; the
  arrows go through them, and Alt+Shift with the arrows moves an element, as
  in the text and the diagram.
-->
<script lang="ts">
  import { tick } from 'svelte';
  import X from '@lucide/svelte/icons/x';
  import { t } from '$lib/i18n';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { indent, outdent, shift } from '../elements';
  import type { Project } from '../model/project.svelte';

  interface Item {
    id: string;
    level: number;
    /** Folded away in the text, under another. */
    away: boolean;
    loose: boolean;
    excluded: boolean;
  }

  interface Props {
    project: Project;
    mapId: string;
    items: Item[];
    /** The element at the top of the text in view. */
    current: string | null;
    ongo: (id: string) => void;
    onclose: () => void;
  }

  let { project, mapId, items, current, ongo, onclose }: Props = $props();

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
    if (event.altKey && event.shiftKey && event.key.startsWith('Arrow')) {
      event.preventDefault();
      event.stopPropagation();
      const tree = project.tree(mapId);
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

<aside class="outline" aria-label={t('text-outline')}>
  <header>
    <h2>{t('text-outline')}</h2>
    <IconButton label={t('common-close')} shortcut="Ctrl+Shift+O" size="sm" onclick={onclose}>
      <X size={14} />
    </IconButton>
  </header>
  <ol bind:this={list}>
    {#each items as item, i (item.id)}
      {@const node = project.nodes.get(item.id)}
      {#if item.loose && !items[i - 1]?.loose}
        <li class="loose-heading">{t('text-loose')}</li>
      {/if}
      <li>
        <button
          type="button"
          data-outline={item.id}
          class:chosen={item.id === current}
          class:away={item.away}
          class:excluded={item.excluded}
          style:padding-left="{10 + Math.min(item.level, 6) * 12}px"
          aria-current={item.id === current ? 'location' : undefined}
          tabindex={item.id === current || (!current && i === 0) ? 0 : -1}
          onclick={() => ongo(item.id)}
          onkeydown={(e) => onkeydown(e, i)}
        >
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
    width: 240px;
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
  .loose-heading {
    margin: 12px 0 4px 10px;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
</style>
