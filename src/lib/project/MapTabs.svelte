<script lang="ts">
  import { tick } from 'svelte';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Copy from '@lucide/svelte/icons/copy';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { plural } from '$lib/library/format';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { drag, dropTarget, startDrag } from '$lib/ui/drag.svelte';
  import { openContextMenu } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { toasts } from '$lib/ui/toast.svelte';
  import type { ElementsPayload } from './elements';
  import type { Project } from './model/project.svelte';
  import type { MapRecord } from './model/types';

  interface Props {
    project: Project;
    /** The map shown in the pane that has the focus. */
    current: string;
    /** The map shown in the other pane, if there is one. */
    beside?: string | null;
    onselect: (id: string) => void;
    onbeside: (id: string) => void;
  }

  let { project, current, beside = null, onselect, onbeside }: Props = $props();

  let naming = $state<{ id: string; value: string } | null>(null);
  let input = $state<HTMLInputElement>();
  let spring: ReturnType<typeof setTimeout> | undefined;

  async function rename(m: MapRecord) {
    naming = { id: m.id, value: m.name };
    await tick();
    input?.select();
  }

  function commit() {
    if (!naming) return;
    project.renameMap(naming.id, naming.value);
    naming = null;
  }

  async function add() {
    project.checkpoint();
    const id = project.createMap('Untitled');
    project.checkpoint();
    onselect(id);
    const made = project.map(id);
    if (made) await rename(made);
  }

  async function remove(m: MapRecord) {
    const count = project.tree(m.id).sequence.length;
    const ok = await confirm({
      title: `Delete the map “${m.name}”?`,
      message: `${plural(count, 'element')} and the text in ${count === 1 ? 'it' : 'them'} will go. This can be undone while the project is open.`,
      confirm: 'Delete map',
      danger: true,
    });
    if (!ok) return;
    const index = project.maps.findIndex((x) => x.id === m.id);
    const next = project.maps[index + 1] ?? project.maps[index - 1];
    project.checkpoint();
    project.deleteMap(m.id);
    project.checkpoint();
    if (current === m.id && next) onselect(next.id);
  }

  function context(event: MouseEvent, m: MapRecord) {
    openContextMenu(event, [
      { label: 'Rename', icon: Pencil, action: () => rename(m) },
      {
        label: 'Duplicate',
        icon: Copy,
        hint: 'A copy to work on; this one stays as it is',
        action: () => {
          project.checkpoint();
          const id = project.duplicateMap(m.id);
          project.checkpoint();
          if (id) onselect(id);
        },
      },
      {
        label: 'Open beside',
        icon: Columns2,
        hint: 'Two maps side by side, to move elements between them',
        disabled: m.id === current && project.maps.length < 2,
        action: () => onbeside(m.id),
      },
      { kind: 'separator' },
      {
        label: 'Delete map',
        icon: Trash2,
        danger: true,
        disabled: project.maps.length <= 1,
        action: () => remove(m),
      },
    ]);
  }

  function dropElements(payload: ElementsPayload, m: MapRecord, copy: boolean) {
    if (payload.project !== project || payload.map === m.id) return;
    project.checkpoint();
    const made = copy ? project.copy(payload.ids, m.root) : project.move(payload.ids, m.root);
    project.checkpoint();
    if (made.length) {
      toasts.show({
        kind: 'ok',
        message: `${copy ? 'Copied' : 'Moved'} to “${m.name}”`,
        action: { label: 'Show', run: () => onselect(m.id) },
      });
    }
  }
</script>

<div class="tabs" role="tablist" aria-label="Maps">
  {#each project.maps as m (m.id)}
    {#if naming?.id === m.id}
      <div class="tab current naming">
        <input
          bind:this={input}
          bind:value={naming.value}
          aria-label="Name of the map"
          size={Math.max(8, naming.value.length + 1)}
          onblur={commit}
          onkeydown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') naming = null;
          }}
        />
      </div>
    {:else}
      <div
        class="tab"
        class:current={m.id === current}
        class:beside={m.id === beside && m.id !== current}
        role="tab"
        tabindex={m.id === current ? 0 : -1}
        aria-selected={m.id === current}
        use:dropTarget={{
          accepts: (p) =>
            (p.kind === 'elements' && (p.data as ElementsPayload).map !== m.id) ||
            (p.kind === 'map' && p.data !== m.id),
          ondrop: (e) => {
            clearTimeout(spring);
            if (e.payload.kind === 'map') project.moveMap(e.payload.data as string, m.id);
            else dropElements(e.payload.data as ElementsPayload, m, e.copy);
          },
          onover: (e) => {
            clearTimeout(spring);
            // Held over a tab, the map opens, so that the place can be chosen.
            if (e && e.payload.kind === 'elements') spring = setTimeout(() => onselect(m.id), 700);
          },
        }}
        onclick={() => onselect(m.id)}
        ondblclick={() => rename(m)}
        oncontextmenu={(e) => context(e, m)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onselect(m.id);
          else if (e.key === 'F2') rename(m);
        }}
        onpointerdown={(e) => startDrag(e, () => ({ kind: 'map', data: m.id, label: m.name }))}
      >
        <span class="name truncate">{m.name}</span>
      </div>
    {/if}
  {/each}
  <button
    type="button"
    class="add"
    aria-label="New map"
    use:tooltip={{ text: 'New map' }}
    use:dropTarget={{
      accepts: (p) => p.kind === 'map',
      ondrop: (e) => project.moveMap(e.payload.data as string, null),
    }}
    onclick={add}
  >
    <Plus size={15} />
  </button>
  {#if drag.payload?.kind === 'elements'}
    <span class="dropping">Drop on a map to move there · hold Ctrl to copy</span>
  {/if}
</div>

<style>
  .tabs {
    display: flex;
    align-items: stretch;
    gap: 2px;
    min-width: 0;
    height: 100%;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 220px;
    padding: 0 13px;
    color: var(--ink-3);
    cursor: pointer;
    white-space: nowrap;
    border-radius: var(--radius-s) var(--radius-s) 0 0;
    transition: color var(--fast) var(--ease);
  }
  .tab:hover {
    color: var(--ink);
  }
  .tab::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    bottom: 0;
    height: 2px;
    border-radius: 2px 2px 0 0;
    background: transparent;
    transition: background var(--fast) var(--ease);
  }
  .tab.current {
    color: var(--ink);
    font-weight: 550;
  }
  .tab.current::after {
    background: var(--accent);
  }
  .tab.beside::after {
    background: var(--line-strong);
  }
  .tab:global([data-drop-over]) {
    background: var(--accent-soft);
    color: var(--accent-strong);
  }
  .naming input {
    border: none;
    background: var(--paper-raised);
    outline: none;
    font-weight: 550;
    padding: 3px 6px;
    border-radius: var(--radius-s);
    box-shadow: 0 0 0 1.5px var(--accent);
  }
  .add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    align-self: center;
    width: 26px;
    height: 26px;
    margin-left: 2px;
    flex: none;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .add:hover,
  .add:global([data-drop-over]) {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .dropping {
    align-self: center;
    margin-left: 12px;
    font-size: var(--text-xs);
    color: var(--ink-3);
    white-space: nowrap;
  }
</style>
