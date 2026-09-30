<script lang="ts">
  import { tick } from 'svelte';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Copy from '@lucide/svelte/icons/copy';
  import FileInput from '@lucide/svelte/icons/file-input';
  import Pencil from '@lucide/svelte/icons/pencil';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import Plus from '@lucide/svelte/icons/plus';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { goThrough } from '$lib/found/found.svelte';
  import { countFound } from '$lib/found/gather';
  import { t } from '$lib/i18n';
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
    /** A map is to be made of a document. */
    ondocument?: () => void;
  }

  let { project, current, beside = null, onselect, onbeside, ondocument }: Props = $props();

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
    const id = project.createMap(t('project-untitled'));
    project.checkpoint();
    onselect(id);
    const made = project.map(id);
    if (made) await rename(made);
  }

  async function remove(m: MapRecord) {
    const count = project.tree(m.id).sequence.length;
    const ok = await confirm({
      title: t('project-delete-map-title', { name: m.name }),
      message: t('project-delete-map-message', { count }),
      confirm: t('project-delete-map'),
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
    const found = countFound(project, m.id);
    openContextMenu(event, [
      { label: t('common-rename'), icon: Pencil, action: () => rename(m) },
      {
        label: t('project-duplicate'),
        icon: Copy,
        hint: t('project-duplicate-hint'),
        action: () => {
          project.checkpoint();
          const id = project.duplicateMap(m.id);
          project.checkpoint();
          if (id) onselect(id);
        },
      },
      {
        label: t('project-open-beside'),
        icon: Columns2,
        hint: t('project-open-beside-hint'),
        disabled: m.id === current && project.maps.length < 2,
        action: () => onbeside(m.id),
      },
      { kind: 'separator' },
      {
        label: t('project-found'),
        icon: TextSearch,
        hint: found ? t('project-found-hint', { count: found }) : t('project-found-none'),
        action: () => goThrough(m.id),
      },
      { kind: 'separator' },
      {
        label: t('project-delete-map'),
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
        message: copy
          ? t('project-copied-to', { name: m.name })
          : t('project-moved-to', { name: m.name }),
        action: { label: t('common-show'), run: () => onselect(m.id) },
      });
    }
  }
</script>

<div class="tabs" role="tablist" aria-label={t('project-maps')}>
  {#each project.maps as m (m.id)}
    {#if naming?.id === m.id}
      <div class="tab current naming">
        <input
          bind:this={input}
          bind:value={naming.value}
          aria-label={t('project-map-name')}
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
        onclick={(e) => {
          // With Ctrl, beside the map in view, as a link opens in a tab of its own.
          if ((e.ctrlKey || e.metaKey) && !(m.id === current && project.maps.length < 2))
            onbeside(m.id);
          else onselect(m.id);
        }}
        onauxclick={(e) => {
          if (e.button === 1 && !(m.id === current && project.maps.length < 2)) {
            e.preventDefault();
            onbeside(m.id);
          }
        }}
        use:tooltip={{ text: t('project-tab-hint') }}
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
    aria-label={t('project-new-map')}
    use:tooltip={{ text: t('project-new-map') }}
    use:dropTarget={{
      accepts: (p) => p.kind === 'map',
      ondrop: (e) => project.moveMap(e.payload.data as string, null),
    }}
    onclick={add}
  >
    <Plus size={15} />
  </button>
  {#if ondocument}
    <button
      type="button"
      class="add"
      aria-label={t('project-map-from-document')}
      use:tooltip={{ text: t('project-map-from-document') }}
      onclick={ondocument}
    >
      <FileInput size={15} />
    </button>
  {/if}
  {#if drag.payload?.kind === 'elements'}
    <span class="dropping">{t('project-drop-on-map')}</span>
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
