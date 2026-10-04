<script lang="ts">
  /**
   * The bar of a pane, at its left: the name of the map in view, from which
   * the maps of the project pull down to be opened; and beside it a button
   * with what can be done with this map, and with the maps: rename,
   * duplicate, the citations that were found, the languages, delete; a new
   * map, a map from a document.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Copy from '@lucide/svelte/icons/copy';
  import FileInput from '@lucide/svelte/icons/file-input';
  import Languages from '@lucide/svelte/icons/languages';
  import Pencil from '@lucide/svelte/icons/pencil';
  import Plus from '@lucide/svelte/icons/plus';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { tick } from 'svelte';
  import { goThrough } from '$lib/found/found.svelte';
  import { countFound } from '$lib/found/gather';
  import { t } from '$lib/i18n';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import LanguagesDialog from './LanguagesDialog.svelte';
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

  const map = $derived(project.map(current));

  let naming = $state<{ id: string; value: string } | null>(null);
  /** A map that was just made, whose centre is named with it. */
  let newMap: string | null = null;
  let input = $state<HTMLInputElement>();
  /** The map whose languages are open in the dialog, if any. */
  let languagesOf = $state<string | null>(null);

  async function rename(m: MapRecord) {
    naming = { id: m.id, value: m.name };
    await tick();
    input?.select();
  }

  function commit() {
    if (!naming) return;
    project.renameMap(naming.id, naming.value);
    // The centre of a map just made has the name it was made with, until the map is named.
    const root = newMap === naming.id ? project.map(naming.id)?.root : null;
    if (root && project.node(root)?.title === t('project-untitled') && naming.value.trim()) {
      project.setTitle(root, naming.value);
    }
    newMap = null;
    naming = null;
  }

  async function add() {
    project.checkpoint();
    const id = project.createMap(t('project-untitled'));
    project.checkpoint();
    newMap = id;
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

  /** The maps, to open one. */
  function openMaps(event: MouseEvent) {
    const items: MenuItem[] = project.maps.map((x): MenuItem => ({
      label: x.name,
      checked: x.id === current,
      hint: x.id === beside && x.id !== current ? t('project-map-beside') : undefined,
      action: () => onselect(x.id),
    }));
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }

  /** What can be done with this map, and with the maps. */
  function openActions(event: MouseEvent) {
    const m = map;
    if (!m) return;
    const found = countFound(project, m.id);
    const items: MenuItem[] = [
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => void rename(m) },
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
        label: t('project-found'),
        icon: TextSearch,
        hint: found ? t('project-found-hint', { count: found }) : t('project-found-none'),
        action: () => goThrough(m.id),
      },
      { label: t('languages-menu'), icon: Languages, action: () => (languagesOf = m.id) },
      {
        label: t('project-delete-map'),
        icon: Trash2,
        danger: true,
        disabled: project.maps.length <= 1,
        action: () => void remove(m),
      },
      { kind: 'separator' },
      { label: t('project-new-map'), icon: Plus, action: () => void add() },
      ...(ondocument
        ? [
            {
              label: t('project-map-from-document'),
              icon: FileInput,
              action: () => ondocument?.(),
            } as MenuItem,
          ]
        : []),
    ];
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }
</script>

<div
  class="maps"
  role="group"
  aria-label={t('project-maps')}
  data-maps={JSON.stringify(project.maps.map((m) => m.name))}
>
  {#if naming}
    <input
      bind:this={input}
      bind:value={naming.value}
      class="naming"
      aria-label={t('project-map-name')}
      size={Math.max(8, naming.value.length + 1)}
      onblur={commit}
      onkeydown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') naming = null;
      }}
    />
  {:else}
    <button
      type="button"
      class="map"
      aria-haspopup="menu"
      use:tooltip={{ text: t('project-maps-hint'), side: 'bottom' }}
      onclick={openMaps}
      onkeydown={(e) => {
        if (e.key === 'F2' && map) {
          e.preventDefault();
          void rename(map);
        }
      }}
    >
      <span class="name truncate">{map?.name ?? ''}</span>
      {#if project.maps.length > 1}<span class="count">{project.maps.length}</span>{/if}
      <ChevronDown size={13} />
    </button>
    <button
      type="button"
      class="this-map"
      aria-haspopup="menu"
      aria-label={t('project-this-map-actions')}
      use:tooltip={{ text: t('project-this-map-actions'), side: 'bottom' }}
      onclick={openActions}
    >
      <Ellipsis size={15} />
    </button>
  {/if}
</div>

{#if languagesOf}
  <LanguagesDialog {project} mapId={languagesOf} onclose={() => (languagesOf = null)} />
{/if}

<style>
  .maps {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    flex: none;
  }
  .this-map {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .this-map:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .map {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 300px;
    min-width: 0;
    height: 28px;
    padding: 0 8px 0 10px;
    border: 1px solid transparent;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  .map:hover {
    background: var(--paper-hover);
    border-color: var(--line);
  }
  .name {
    min-width: 0;
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
  }
  .count {
    padding: 0 5px;
    border-radius: 9px;
    background: var(--paper-hover);
    font-size: var(--text-xs);
    color: var(--ink-3);
  }
  .naming {
    height: 28px;
    padding: 0 8px;
    border: none;
    border-radius: var(--radius-s);
    background: var(--paper-raised);
    box-shadow: 0 0 0 1.5px var(--accent);
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
    color: var(--ink);
    outline: none;
  }
</style>
