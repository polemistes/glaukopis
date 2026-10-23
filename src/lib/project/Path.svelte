<script lang="ts">
  /**
   * The path over a side (ADR 0063): where one is, from the top down. First
   * a chevron, which opens the menu of all projects; then the crumbs: the
   * folders the project lies in, small; the project, in bold with its badge;
   * the elements from the top of the project down to the element in view,
   * the last in the strongest type. A folder opens the menu of all projects
   * at that folder, the project shows the project at its top, an element
   * enters it. After the last crumb, ⋯ with what can be done with the
   * element in view: rename, what the document is, about it, the citations
   * that were found, its language, a new element under it, a document into
   * it, delete.
   *
   * Where the path does not fit, the crumbs in the middle hide behind one,
   * …, whose menu has them (`fitCrumbs`). The crumbs are measured when the
   * room changes, or the crumbs or their names do; never on a keystroke in
   * the text, which changes neither.
   */
  import BookOpenText from '@lucide/svelte/icons/book-open-text';
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import CornerDownRight from '@lucide/svelte/icons/corner-down-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileInput from '@lucide/svelte/icons/file-input';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import Languages from '@lucide/svelte/icons/languages';
  import Pencil from '@lucide/svelte/icons/pencil';
  import TextSearch from '@lucide/svelte/icons/text-search';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Book from '@lucide/svelte/icons/book';
  import { tick } from 'svelte';
  import type { ProjectInfo } from '$lib/api/projects';
  import { aboutDocumentUi } from '$lib/document/about-document.svelte';
  import { templateChooserUi } from '$lib/document/chooser.svelte';
  import { goThrough } from '$lib/found/found.svelte';
  import { countFound } from '$lib/found/gather';
  import ProjectBadge from '$lib/home/ProjectBadge.svelte';
  import { projectsMenu } from '$lib/home/projects-menu';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { removeElements } from './elements';
  import type { Project } from './model/project.svelte';
  import { PROJECT } from './model/types';
  import { crumbsOf, fitCrumbs, type Crumb } from './path';

  interface Props {
    project: Project;
    /** The project as the list has it: its id, its name and the folder it lies in. */
    info: ProjectInfo;
    /** The element in view in this side. */
    at: string;
    /** The projects shown in the sides, by id: marked in the menu of all projects. */
    shown: readonly string[];
    /** How the project is shared, for its badge. */
    sharing?: { owner: boolean } | null;
    /** Enters an element of this project, or its top (`PROJECT`). */
    onselect: (id: string) => void;
    /** Shows another project in this side, at its top. */
    onproject: (id: string) => void;
    /** A document is to be brought in, under the element in view. */
    ondocument?: () => void;
  }

  let {
    project,
    info,
    at,
    shown,
    sharing = null,
    onselect,
    onproject,
    ondocument,
  }: Props = $props();

  // The crumbs as a string first, so that what follows them, the drawing and
  // the measuring, runs only when one of them is another or is named anew,
  // and not when the record of an element on the way changes otherwise.
  const said = $derived(JSON.stringify(crumbsOf(projects.folders, info, project, at)));
  const crumbs = $derived(JSON.parse(said) as Crumb[]);
  const tree = $derived(project.tree());
  /** The parent of the element in view; none for the project itself. */
  const parent = $derived(at === PROJECT ? null : (tree.parent.get(at) ?? null));
  /** The names of the elements beside the one in view, for the scripts that test the application. */
  const siblings = $derived(
    JSON.stringify((tree.children.get(parent ?? PROJECT) ?? []).map((id) => nameOf(id))),
  );

  function nameOf(id: string): string {
    return project.node(id)?.title || t('project-untitled');
  }

  const labelOf = (c: Crumb) => c.name || (c.kind === 'element' ? t('project-untitled') : '');

  // ---- fitting the crumbs into the room ----

  let room = $state<HTMLDivElement>();
  let measuring = $state<HTMLDivElement>();
  let more = $state<HTMLButtonElement>();
  /** The width the crumbs have, beside ⋯. */
  let roomWidth = $state(0);
  /** The widths of the crumbs drawn whole, with their separators; and of the crumb … */
  let widths = $state.raw<number[]>([]);
  let ellipsisWidth = $state(0);

  // The room is measured when the cell changes width. It depends on the element alone.
  $effect(() => {
    const el = room;
    if (!el) return;
    // A frame later, so that the crumbs drawn anew are not a change within the observing.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => (roomWidth = el.clientWidth));
    });
    observer.observe(el);
    roomWidth = el.clientWidth;
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  });

  // The crumbs are measured, drawn whole out of sight, when they or their
  // names change. It depends on what they say.
  $effect(() => {
    void said;
    const el = measuring;
    if (!el) return;
    const measure = () => {
      const steps = Array.from(el.querySelectorAll<HTMLElement>(':scope > .step'));
      ellipsisWidth = steps.pop()?.offsetWidth ?? 0;
      widths = steps.map((s) => s.offsetWidth);
    };
    void tick().then(measure);
    // Again once the fonts are there, where they were not yet when the path was first drawn.
    void document.fonts?.ready.then(measure);
  });

  const fitted = $derived.by(() => {
    const all = crumbs.map((_, i) => i);
    // Until the crumbs are measured, all are drawn: the room cuts what does not fit.
    if (widths.length !== crumbs.length || !roomWidth) return { shown: all, hidden: [] };
    const beside = (more?.offsetWidth ?? 26) + 4;
    // The project always shows, so that each path says which project it is in.
    const project = crumbs.findIndex((c) => c.kind === 'project');
    return fitCrumbs(widths, roomWidth - beside, ellipsisWidth, [project]);
  });

  // ---- what the crumbs do ----

  function allProjects(anchor: HTMLElement, folder: string | null = null) {
    openMenu(
      anchor,
      projectsMenu(projects.folders, projects.list, { shown, choose: onproject, at: folder }),
      {
        align: 'start',
      },
    );
  }

  function go(c: Crumb, anchor: HTMLElement) {
    if (c.kind === 'folder') allProjects(anchor, c.id);
    else if (c.kind === 'project') onselect(PROJECT);
    else onselect(c.id);
  }

  /** The menu of the crumbs hidden behind …, each doing what it does. */
  function openHidden(event: MouseEvent, hidden: number[]) {
    const items: MenuItem[] = hidden.map((i): MenuItem => {
      const c = crumbs[i];
      if (c.kind === 'folder')
        return {
          kind: 'submenu',
          label: c.name,
          icon: FolderIcon,
          items: projectsMenu(projects.folders, projects.list, {
            shown,
            choose: onproject,
            at: c.id,
          }),
        };
      return {
        label: labelOf(c),
        icon: c.kind === 'project' ? Book : undefined,
        action: () => onselect(c.kind === 'project' ? PROJECT : c.id),
      };
    });
    openMenu(event.currentTarget as HTMLElement, items, { align: 'start' });
  }

  // ---- what can be done with the element in view ----

  /** The element that is being named in the path, and what is written. */
  let naming = $state<{ id: string; value: string } | null>(null);
  let input = $state<HTMLInputElement>();

  /** Names an element in the path: the one in view, or one just made under it. */
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

  /** A new element under the one in view, named in the path. */
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

{#snippet crumb(c: Crumb, i: number, measured: boolean)}
  {@const last = i === crumbs.length - 1}
  {@const up =
    (c.kind === 'element' && c.id === parent) || (c.kind === 'project' && parent === PROJECT)}
  <span class="step" class:last>
    {#if i > 0}<span class="sep" aria-hidden="true">›</span>{/if}
    {#if measured}
      <span class="crumb {c.kind}" class:last>
        {#if c.kind === 'project'}<ProjectBadge name={c.name} {sharing} size={15} />{/if}
        <span class="name">{labelOf(c)}</span>
      </span>
    {:else}
      <button
        type="button"
        class="crumb {c.kind}"
        class:last
        data-crumb={c.kind}
        data-crumb-last={last ? '' : undefined}
        data-up={up ? '' : undefined}
        aria-haspopup={c.kind === 'folder' ? 'menu' : undefined}
        aria-current={last ? 'location' : undefined}
        use:tooltip={{
          text: up ? t('project-up-hint', { name: labelOf(c) }) : labelOf(c),
          side: 'bottom',
        }}
        onclick={(e) => go(c, e.currentTarget)}
        onkeydown={(e) => {
          if (last && e.key === 'F2') {
            e.preventDefault();
            void rename(at);
          }
        }}
      >
        {#if c.kind === 'project'}<ProjectBadge name={c.name} {sharing} size={15} />{/if}
        <span class="name">{labelOf(c)}</span>
      </button>
    {/if}
  </span>
{/snippet}

<nav
  class="path"
  aria-label={t('project-where')}
  data-path
  data-project={info.id}
  data-siblings={siblings}
>
  <button
    type="button"
    class="all"
    data-path-all
    aria-haspopup="menu"
    aria-label={t('project-all-projects-menu')}
    use:tooltip={{ text: t('project-all-projects-menu'), side: 'bottom' }}
    onclick={(e) => allProjects(e.currentTarget)}
  >
    <ChevronDown size={14} />
  </button>
  <div class="room" bind:this={room}>
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
      {#each fitted.shown as i, k (crumbs[i].kind + crumbs[i].id)}
        {@const before = k > 0 ? fitted.shown[k - 1] : i - 1}
        {#if i - before > 1}
          {@const hidden = crumbs.map((_, j) => j).filter((j) => j > before && j < i)}
          <span class="step">
            <span class="sep" aria-hidden="true">›</span>
            <button
              type="button"
              class="crumb more"
              data-crumb="more"
              aria-haspopup="menu"
              aria-label={t('project-path-hidden')}
              use:tooltip={{ text: t('project-path-hidden'), side: 'bottom' }}
              onclick={(e) => openHidden(e, hidden)}>…</button
            >
          </span>
        {/if}
        {@render crumb(crumbs[i], i, false)}
      {/each}
    {/if}
    <button
      type="button"
      class="this-element"
      bind:this={more}
      data-this-element
      aria-haspopup="menu"
      aria-label={t('project-this-element-actions')}
      use:tooltip={{ text: t('project-this-element-actions'), side: 'bottom' }}
      onclick={openActions}
    >
      <Ellipsis size={15} />
    </button>
  </div>
  <!-- Every crumb drawn whole, out of sight, to be measured; and the crumb … last. -->
  <div class="measuring" bind:this={measuring} aria-hidden="true">
    {#each crumbs as c, i (c.kind + c.id)}
      {@render crumb(c, i, true)}
    {/each}
    <span class="step"><span class="sep">›</span><span class="crumb more">…</span></span>
  </div>
</nav>

<style>
  .path {
    position: relative;
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    width: 100%;
    height: 100%;
  }
  .room {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }
  .measuring {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    visibility: hidden;
    pointer-events: none;
    white-space: nowrap;
  }
  .step {
    display: inline-flex;
    align-items: center;
    flex: none;
    min-width: 0;
  }
  /* The last crumb gives way last: it is cut where the first and it alone do not fit. */
  .room > .step.last {
    flex: 0 1 auto;
  }
  .sep {
    flex: none;
    padding: 0 3px;
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
  .all,
  .this-element {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    cursor: pointer;
  }
  .all:hover,
  .this-element:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    white-space: nowrap;
    cursor: pointer;
  }
  button.crumb:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .crumb .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .crumb.folder {
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .crumb.project {
    font-weight: 600;
  }
  .crumb.more {
    color: var(--ink-3);
  }
  .crumb.last {
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
  }
  .naming {
    height: 28px;
    min-width: 0;
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
