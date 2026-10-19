<script lang="ts">
  /**
   * The bar of a pane, at its left: where one is in the project. Small, the
   * name of the parent of the element in view, which goes up; then the name
   * of the element in view, from which the elements beside it pull down to
   * be shown, or, for the project itself, the trees under it; and beside it
   * a button with what can be done with the element:
   * rename, the settings of its document, the citations that were found, its
   * language, a new element under it, a document into it, delete. At the
   * project itself, before all, the owl, which goes up to all the projects.
   * Where the two panes show two projects, the project's name stands first,
   * in full, with its badge.
   */
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileInput from '@lucide/svelte/icons/file-input';
  import FileText from '@lucide/svelte/icons/file-text';
  import Languages from '@lucide/svelte/icons/languages';
  import Pencil from '@lucide/svelte/icons/pencil';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import { tick } from 'svelte';
  import { goThrough } from '$lib/found/found.svelte';
  import ProjectBadge from '$lib/home/ProjectBadge.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import { router } from '$lib/state/router.svelte';
  import { countFound } from '$lib/found/gather';
  import { aboutDocumentUi } from '$lib/document/about-document.svelte';
  import { templateChooserUi } from '$lib/document/chooser.svelte';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { removeElements } from './elements';
  import type { Project } from './model/project.svelte';
  import { PROJECT } from './model/types';

  interface Props {
    project: Project;
    /** The element in view in the pane that has the focus. */
    at: string;
    /** The element in view in the other pane, if there is one. */
    beside?: string | null;
    /** Shows an element; with a mode, in that view. */
    onselect: (id: string, mode?: 'diagram' | 'text' | 'timeline') => void;
    /** Opens an element beside this one. */
    onbeside: (id: string) => void;
    /** A document is to be brought in, under the element in view. */
    ondocument?: () => void;
    /** The project named first, with its badge: where the two panes show two projects. */
    named?: { name: string; sharing?: { owner: boolean } | null } | null;
    /** Whether the owl at the project goes up to all the projects: in the first pane. */
    home?: boolean;
    /** Goes up from the project, to the map of the projects; where it is not given, to the owl. */
    onhome?: () => void;
  }

  let {
    project,
    at,
    beside = null,
    onselect,
    onbeside,
    ondocument,
    named = null,
    home = true,
    onhome,
  }: Props = $props();

  const tree = $derived(project.tree());
  /** The parent of the element in view; none for the project itself. */
  const parent = $derived(at === PROJECT ? null : (tree.parent.get(at) ?? null));
  /**
   * What pulls down from the name: the elements beside the one in view, it
   * among them; for the project itself, the trees under it.
   */
  const listed = $derived(tree.children.get(parent ?? PROJECT) ?? []);

  /** The element that is being named in the bar, and what is written. */
  let naming = $state<{ id: string; value: string } | null>(null);
  let input = $state<HTMLInputElement>();

  /** Up from the project: to all the projects, as the owl's map shows them. */
  function goHome() {
    if (onhome) onhome();
    else router.go({ view: 'owl' });
  }

  function nameOf(id: string): string {
    return project.node(id)?.title || t('project-untitled');
  }

  /** Names an element in the bar: the one in view, or one just made under it. */
  async function rename(id: string) {
    naming = { id, value: project.node(id)?.title ?? '' };
    await tick();
    input?.select();
  }

  function commit() {
    if (!naming) return;
    const { id, value } = naming;
    naming = null;
    if (!value.trim()) return;
    project.checkpoint();
    // The project's name is written beside its element as well.
    if (id === PROJECT) project.setName(value);
    else project.setTitle(id, value);
    project.checkpoint();
  }

  /** A new element under the one in view, named in the bar. */
  function addUnder() {
    project.checkpoint();
    const id = project.addChild(at);
    project.checkpoint();
    if (id) void rename(id);
  }

  /** Deletes the element in view, with all under it; the view goes up. */
  function remove() {
    const up = parent;
    if (!up) return;
    const gone = removeElements(project, [at]);
    if (gone) onselect(up);
  }

  /** The elements beside the one in view, or under the project, to show one. */
  function openListed(event: MouseEvent) {
    const items: MenuItem[] = listed.map((id): MenuItem => ({
      label: nameOf(id),
      checked: id === at,
      hint: id === beside && id !== at ? t('project-shown-beside') : undefined,
      action: () => onselect(id),
    }));
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }

  /** What can be done with the element in view. */
  function openActions(event: MouseEvent) {
    const found = countFound(project, at);
    const items: MenuItem[] = [
      { label: t('common-rename'), icon: Pencil, shortcut: 'F2', action: () => void rename(at) },
      {
        label: t('chooser-menu'),
        icon: BookOpenText,
        action: () => templateChooserUi.open({ project, at }),
      },
      {
        label: t('about-menu'),
        icon: FileText,
        shortcut: keysFor('document-settings'),
        action: () => aboutDocumentUi.open({ project, at }),
      },
      {
        label: t('project-found'),
        icon: TextSearch,
        hint: found ? t('project-found-hint', { count: found }) : t('project-found-none'),
        action: () => goThrough(at),
      },
      {
        label: t('languages-menu'),
        icon: Languages,
        action: () => aboutDocumentUi.open({ project, at, section: 'language' }),
      },
      { kind: 'separator' },
      { label: t('project-new-element-under'), icon: CornerDownRight, action: addUnder },
      ...(ondocument
        ? [
            {
              label: t('project-document-into'),
              icon: FileInput,
              action: () => ondocument?.(),
            } as MenuItem,
          ]
        : []),
      ...(parent
        ? ([
            { kind: 'separator' },
            { label: t('common-delete'), icon: Trash2, danger: true, action: remove },
          ] as MenuItem[])
        : []),
    ];
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }
</script>

<div
  class="maps"
  role="group"
  aria-label={t('project-where')}
  data-maps={JSON.stringify(listed.map((id) => nameOf(id)))}
>
  {#if naming}
    <input
      bind:this={input}
      bind:value={naming.value}
      class="naming"
      aria-label={t('project-element-name')}
      placeholder={t('project-name-placeholder')}
      size={Math.max(8, naming.value.length + 1)}
      onblur={commit}
      onkeydown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') commit();
        else if (e.key === 'Escape') naming = null;
      }}
    />
  {:else}
    {#if at === PROJECT && home}
      <button
        type="button"
        class="up home"
        aria-label={t('project-all-projects')}
        use:tooltip={{ text: t('project-up-home-hint'), side: 'bottom' }}
        onclick={goHome}
      >
        <Mark size={16} />
        <span>{t('project-all-projects')}</span>
        <ChevronRight size={12} />
      </button>
    {/if}
    {#if named}
      {#if at === PROJECT}
        <ProjectBadge name={named.name} sharing={named.sharing} />
      {:else}
        <button
          type="button"
          class="project"
          use:tooltip={{ text: t('project-up-hint', { name: named.name }), side: 'bottom' }}
          onclick={() => onselect(PROJECT)}
        >
          <ProjectBadge name={named.name} sharing={named.sharing} />
          <span class="project-name">{named.name}</span>
          <ChevronRight size={12} />
        </button>
      {/if}
    {/if}
    {#if parent && !(named && parent === PROJECT)}
      <button
        type="button"
        class="up"
        aria-label={t('project-up')}
        use:tooltip={{ text: t('project-up-hint', { name: nameOf(parent) }), side: 'bottom' }}
        onclick={() => onselect(parent)}
      >
        <span class="truncate">{nameOf(parent)}</span>
        <ChevronRight size={12} />
      </button>
    {/if}
    <button
      type="button"
      class="map"
      class:full={!!named && at === PROJECT}
      aria-haspopup="menu"
      use:tooltip={{
        text: parent ? t('project-siblings-hint') : t('project-trees-hint'),
        side: 'bottom',
      }}
      onclick={openListed}
      onkeydown={(e) => {
        if (e.key === 'F2') {
          e.preventDefault();
          void rename(at);
        }
      }}
    >
      <span class="name truncate">{nameOf(at)}</span>
      {#if listed.length > 1}<span class="count">{listed.length}</span>{/if}
      <ChevronDown size={13} />
    </button>
    <button
      type="button"
      class="this-map"
      aria-haspopup="menu"
      aria-label={t('project-this-element-actions')}
      use:tooltip={{ text: t('project-this-element-actions'), side: 'bottom' }}
      onclick={openActions}
    >
      <Ellipsis size={15} />
    </button>
  {/if}
</div>

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
  /* The parent, small, before the name: the way up. */
  .up {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    max-width: 160px;
    min-width: 0;
    height: 24px;
    padding: 0 2px 0 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font: inherit;
    font-size: var(--text-xs);
    cursor: pointer;
  }
  .up:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .up.home {
    gap: 5px;
    max-width: none;
    padding-left: 4px;
    white-space: nowrap;
  }
  /* The project, named first where two are side by side: its name whole, never cut. */
  .project {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex: none;
    height: 26px;
    padding: 0 4px 0 4px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: 600;
    white-space: nowrap;
    cursor: pointer;
  }
  .project:hover {
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
  /* The project's own name, where two projects are side by side, stands whole. */
  .map.full {
    max-width: none;
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
