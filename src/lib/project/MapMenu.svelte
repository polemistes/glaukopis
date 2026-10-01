<script lang="ts">
  /**
   * The maps of a project, as a menu that pulls down from the name of the
   * map in view: the maps to open, one beside the other with Ctrl, new maps
   * to make, and what can be done with the map in view. Files dropped on
   * it become maps.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import Columns2 from '@lucide/svelte/icons/columns-2';
  import Copy from '@lucide/svelte/icons/copy';
  import FileInput from '@lucide/svelte/icons/file-input';
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

  function open(event: MouseEvent) {
    const m = map;
    if (!m) return;
    const found = countFound(project, m.id);
    const index = project.maps.findIndex((x) => x.id === m.id);
    const items: MenuItem[] = [
      { kind: 'heading', label: t('project-maps') },
      ...project.maps.map((x): MenuItem => ({
        label: x.name,
        checked: x.id === current,
        hint: x.id === beside && x.id !== current ? t('project-map-beside') : undefined,
        action: () => onselect(x.id),
      })),
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
      { kind: 'separator' },
      {
        kind: 'submenu',
        label: t('project-map-menu', { name: m.name }),
        items: [
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
            label: t('project-open-beside'),
            icon: Columns2,
            hint: t('project-open-beside-hint'),
            disabled: project.maps.length < 2,
            action: () => onbeside(m.id),
          },
          { kind: 'separator' },
          {
            label: t('project-map-earlier'),
            disabled: index <= 0,
            action: () => project.moveMap(m.id, project.maps[index - 1]?.id ?? null),
          },
          {
            label: t('project-map-later'),
            disabled: index < 0 || index >= project.maps.length - 1,
            action: () => project.moveMap(m.id, project.maps[index + 2]?.id ?? null),
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
            action: () => void remove(m),
          },
        ],
      },
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
      onclick={open}
      onkeydown={(e) => {
        if (e.key === 'F2' && map) {
          e.preventDefault();
          void rename(map);
        }
      }}
    >
      <span class="which">{t('project-map-label')}</span>
      <span class="name truncate">{map?.name ?? ''}</span>
      {#if project.maps.length > 1}<span class="count">{project.maps.length}</span>{/if}
      <ChevronDown size={13} />
    </button>
  {/if}
</div>

<style>
  .maps {
    display: flex;
    align-items: center;
    min-width: 0;
    flex: 1;
  }
  .map {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 360px;
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
  .which {
    font-size: var(--text-xs);
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.04em;
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
