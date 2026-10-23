<script lang="ts">
  /**
   * The map of all projects, the home (ADR 0062): the owl at the centre,
   * the folders as regions, the projects as the top elements of their maps.
   * Its one bar says where one is, makes a project or a folder, joins and
   * opens them, and has what was on the page of projects: the trash and the
   * project of all the projects. With no project at all it welcomes, and
   * offers the ways to begin. A document dropped on it becomes a project in
   * the folder in view. A folder is entered as an element is: it stands at
   * the centre, the bar says what holds it, and up goes there.
   */
  import { onMount } from 'svelte';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import FileInput from '@lucide/svelte/icons/file-input';
  import FilePlus from '@lucide/svelte/icons/file-plus';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import FolderPlus from '@lucide/svelte/icons/folder-plus';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Plus from '@lucide/svelte/icons/plus';
  import Scan from '@lucide/svelte/icons/scan';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Users from '@lucide/svelte/icons/users';
  import Waypoints from '@lucide/svelte/icons/waypoints';
  import { isDocumentPath, isPlainTextPath } from '$lib/api/imported';
  import { isReadPath } from '$lib/api/ocr';
  import { projectTrash, type ProjectInfo, type Trashed } from '$lib/api/projects';
  import { bringIn, chooseDocument } from '$lib/documents/bringing.svelte';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { goThroughWhenOpen } from '$lib/found/found.svelte';
  import { t } from '$lib/i18n';
  import JoinDialog from '$lib/sharing/JoinDialog.svelte';
  import Mark from '$lib/shell/Mark.svelte';
  import { keysFor, shortcuts } from '$lib/shell/keys.svelte';
  import { testHook } from '$lib/shell/testing';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import { openMenu, type MenuItem } from '$lib/ui/menu.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { ancestors, parentOf } from './folders';
  import { listUi, toggleProjectsPane } from './list.svelte';
  import { centreOf, folderKey, keyed, OWL } from './owl';
  import OwlMap from './OwlMap.svelte';
  import { ProjectActions } from './project-actions.svelte';
  import ProjectActionsHost from './ProjectActionsHost.svelte';
  import ProjectsMapDialog from './ProjectsMapDialog.svelte';
  import TrashDialog from './TrashDialog.svelte';

  interface Props {
    /** The folder entered, by its id: it stands at the centre. None for the owl. */
    at?: string;
  }

  let { at }: Props = $props();

  /** The key at the centre: the folder, where it is there; else the owl. */
  const centre = $derived(centreOf(projects.folders, at ? folderKey(at) : OWL));
  const folder = $derived(centre === OWL ? undefined : projects.folder(at));
  /** What holds the folder at the centre: a folder, or none for the top. */
  const holder = $derived(folder ? projects.folder(parentOf(projects.folders, folder)) : undefined);

  function openProject(p: ProjectInfo, mode?: MapMode) {
    router.go({ view: 'project', project: p.id, mode });
  }

  const actions = new ProjectActions({ open: openProject, deleted: () => void readTrash() });

  /** No project and no folder at all: the welcome, with the ways to begin. */
  const empty = $derived(projects.loaded && !projects.list.length && !projects.folders.length);

  /** The map itself, which makes a project or a folder in place, in the folder in view. */
  let map = $state<ReturnType<typeof OwlMap>>();
  /** Makes a project or a folder in the folder in view: named in place on the map, or by the dialog where there is no map. */
  function makeHere(kind: 'project' | 'folder') {
    if (map) map.makeHere(kind);
    else if (kind === 'project') actions.newProject(folder?.id ?? null);
    else actions.newFolder(folder?.id ?? null);
  }

  // ---- what was on the page of projects ----

  let joining = $state(false);
  /** The dialog that makes a project of all the projects. */
  let mapping = $state(false);
  let trash = $state.raw<Trashed[]>([]);
  let showTrash = $state(false);

  async function readTrash() {
    try {
      trash = await projectTrash();
    } catch (error) {
      console.error(error);
    }
  }

  // Read again whenever a project goes into the trash or comes out of it, here or by an undo.
  $effect(() => {
    void projects.trashed;
    void readTrash();
  });

  // For the tests of the running application, which cannot answer the dialog
  // that chooses a file; only when the harness asks for it.
  testHook('__glaukopisOrg', { open: (path: string) => actions.openOrgAt(path) });

  /** What becomes a project when it is chosen or dropped: a document, a PDF or a picture, whose text is read. */
  const written = (path: string) =>
    isDocumentPath(path) || isPlainTextPath(path) || isReadPath(path);

  /**
   * A project is made of a document, named after it, with the document as
   * a tree under it, in the folder in view: of the file that is chosen, or
   * of one that was dropped on the map.
   */
  async function fromDocument(dropped?: string) {
    const path = dropped ?? (await chooseDocument());
    const brought = path ? await bringIn(path, null) : null;
    const made = brought?.project;
    if (!made) return;
    if (folder) await projects.moveToFolder(made.id, folder.id).catch(() => {});
    // The citations that were found in it are gone through when the project is open.
    if (brought.goThrough) goThroughWhenOpen(made.id, brought.top);
    router.go({ view: 'project', project: made.id, at: brought.top, mode: 'text' });
  }

  /** The plus of the bar: what is made, and what is joined or opened. */
  function newMenu(anchor: HTMLElement) {
    openMenu(
      anchor,
      [
        // A project begun from here is named and opened, as Begin a project does; the map's keys make one in place.
        {
          label: t('home-new') + '…',
          icon: FilePlus,
          action: () => actions.newProject(folder?.id ?? null),
        },
        {
          label: t('home-new-folder'),
          icon: FolderPlus,
          shortcut: keysFor('tree-new-under'),
          action: () => makeHere('folder'),
        },
        { kind: 'separator' },
        { label: t('home-join') + '…', icon: Users, action: () => (joining = true) },
        { label: t('home-from-document'), icon: FileInput, action: () => void fromDocument() },
        {
          label: t('home-file-open'),
          icon: FolderOpen,
          disabled: actions.filing,
          action: () => void actions.openFile(),
        },
        {
          label: t('home-org-open'),
          icon: FileText,
          disabled: actions.filing,
          action: () => void actions.openOrg(),
        },
      ] satisfies MenuItem[],
      { align: 'end' },
    );
  }

  /** The menu of the bar: the trash, the project of all the projects, and the view. */
  function moreMenu(anchor: HTMLElement) {
    openMenu(
      anchor,
      [
        {
          label: t('home-deleted-projects', { count: trash.length }),
          icon: Trash2,
          disabled: !trash.length,
          action: () => (showTrash = true),
        },
        { label: t('home-map-menu'), icon: Waypoints, action: () => (mapping = true) },
        { kind: 'separator' },
        {
          label: t('home-owl-fit'),
          icon: Scan,
          shortcut: keysFor('owl-whole'),
          disabled: !map,
          action: () => map?.fitAll(),
        },
        {
          label: t('home-owl-tidy'),
          disabled: !map,
          action: () => map?.tidyAll(),
        },
      ] satisfies MenuItem[],
      { align: 'end' },
    );
  }

  /** Opens a project at its top or at an element of its map, in the view given or where it was left; or enters a folder. */
  function open(key: string, mode?: MapMode) {
    const k = keyed(key);
    if (k.kind === 'project') router.go({ view: 'project', project: k.id, mode });
    else if (k.kind === 'element')
      router.go({ view: 'project', project: k.project, at: k.id, mode });
    else if (k.kind === 'folder') router.go({ view: 'owl', at: k.id });
  }

  /** Up from the folder at the centre, to what holds it, with the folder selected there. */
  function up() {
    if (!folder) return;
    listUi.owlReveal = folderKey(folder.id);
    router.go(holder ? { view: 'owl', at: holder.id } : { view: 'owl' });
  }

  onMount(() => {
    if (!projects.loaded) void projects.load();
    return shortcuts.bind({ 'projects-pane': toggleProjectsPane });
  });

  // Alt+Shift+Up goes up from wherever the keys are in the view, as in a project.
  function onkeydown(event: KeyboardEvent) {
    if (event.altKey && event.shiftKey && event.key === 'ArrowUp' && folder) {
      event.preventDefault();
      up();
    }
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="owl-view" {onkeydown}>
  <div class="bar">
    <IconButton
      label={t('home-pane-toggle')}
      shortcut={keysFor('projects-pane')}
      size="sm"
      active={settings.value.projectsPane}
      data-projects-button
      onclick={toggleProjectsPane}
    >
      <PanelLeft size={15} />
    </IconButton>
    {#if folder}
      <!-- Where one is: the owl, what holds the folder, and the folder. -->
      <button
        type="button"
        class="up"
        data-owl-up="owl"
        aria-label={t('project-all-projects')}
        use:tooltip={{ text: t('project-all-projects'), side: 'bottom' }}
        onclick={() => {
          // The folder at the top that holds the one in view is shown, selected.
          const top = ancestors(projects.folders, folder.id).at(-1) ?? folder.id;
          listUi.owlReveal = folderKey(top);
          router.go({ view: 'owl' });
        }}
      >
        <Mark size={16} />
        {#if !holder}<span>{t('project-all-projects')}</span>{/if}
        <ChevronRight size={12} />
      </button>
      {#if holder}
        <button
          type="button"
          class="up"
          data-owl-up="folder"
          use:tooltip={{ text: t('home-owl-leave', { name: holder.name }), side: 'bottom' }}
          onclick={up}
        >
          <span class="truncate">{holder.name}</span>
          <ChevronRight size={12} />
        </button>
      {/if}
      <span class="here" data-owl-here>
        <FolderOpen size={17} strokeWidth={1.6} />
        <span class="name serif">{folder.name}</span>
      </span>
    {:else}
      <span class="here" data-owl-here>
        <Mark size={18} />
        <span class="name serif">{t('project-all-projects')}</span>
      </span>
    {/if}
    <span class="grow"></span>
    <IconButton
      label={t('home-new')}
      size="sm"
      data-owl-new
      onclick={(e) => newMenu(e.currentTarget)}
    >
      <Plus size={15} />
    </IconButton>
    <IconButton
      label={t('home-page-menu')}
      size="sm"
      data-owl-more
      onclick={(e) => moreMenu(e.currentTarget)}
    >
      <Ellipsis size={16} />
    </IconButton>
  </div>
  <div class="map">
    {#if !projects.loaded}
      <div class="centre"><Spinner size={22} /></div>
    {:else if empty}
      <div
        class="welcome"
        use:dropTarget={{
          accepts: (p) => p.kind === 'files' && (p.data as string[]).some(written),
          ondrop: (e) => void fromDocument((e.payload.data as string[]).find(written)),
        }}
      >
        <Mark size={120} />
        <h2>{t('home-welcome')}</h2>
        <p>{t('home-welcome-text')}</p>
        <div class="actions">
          <Button variant="secondary" size="md" onclick={() => actions.newProject(null)}>
            {#snippet icon()}<Plus size={15} />{/snippet}
            {t('home-begin')}
          </Button>
          <Button variant="secondary" size="md" onclick={() => (joining = true)}>
            {#snippet icon()}<Users size={15} />{/snippet}
            {t('home-join')}
          </Button>
          <Button variant="secondary" size="md" onclick={() => fromDocument()}>
            {#snippet icon()}<FileInput size={15} />{/snippet}
            {t('home-from-document')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={actions.filing}
            onclick={() => void actions.openFile()}
          >
            {#snippet icon()}<FolderOpen size={15} />{/snippet}
            {t('home-file-open')}
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={actions.filing}
            onclick={() => void actions.openOrg()}
          >
            {#snippet icon()}<FileText size={15} />{/snippet}
            {t('home-org-open')}
          </Button>
        </div>
      </div>
    {:else}
      <OwlMap
        bind:this={map}
        {actions}
        at={centre}
        onopen={open}
        onup={folder ? up : undefined}
        above={holder?.name ?? t('project-all-projects')}
        ondocument={(path) => void fromDocument(path)}
        accepts={written}
      />
    {/if}
  </div>
</div>

<ProjectActionsHost {actions} />

<DocumentHost />

{#if showTrash}
  <TrashDialog
    {trash}
    onchange={async () => {
      await readTrash();
      if (!trash.length) showTrash = false;
    }}
    onclose={() => (showTrash = false)}
  />
{/if}

{#if mapping}
  <ProjectsMapDialog
    onclose={() => (mapping = false)}
    onmade={({ project, at }) => {
      mapping = false;
      router.go({ view: 'project', project, at, mode: settings.value.newProjectView ?? 'diagram' });
    }}
  />
{/if}

{#if joining}
  <JoinDialog
    onclose={() => (joining = false)}
    onjoined={(p) => {
      joining = false;
      openProject(p);
    }}
  />
{/if}

<style>
  .owl-view {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--paper);
  }
  /* As high as the head of the list beside it, so that their lines meet. */
  .bar {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--bar-h);
    flex: none;
    padding: 0 8px 0 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .grow {
    flex: 1;
  }
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 70px 24px 40px;
    overflow-y: auto;
    text-align: center;
  }
  .welcome .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-top: 6px;
  }
  .welcome h2 {
    margin-top: 10px;
    font-family: var(--font-text);
    font-size: 28px;
    font-weight: 500;
    letter-spacing: -0.01em;
  }
  .welcome p {
    max-width: 46ch;
    margin-bottom: 10px;
    color: var(--ink-2);
    font-family: var(--font-text);
    font-size: 16px;
    line-height: 1.6;
  }
  .here {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 28px;
    padding: 0 6px;
  }
  .up {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 220px;
    height: 28px;
    padding: 0 6px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-3);
    font-size: var(--text-sm);
    cursor: pointer;
  }
  .up:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .name {
    color: var(--ink);
    font-size: 16px;
    font-weight: 500;
    white-space: nowrap;
  }
  .map {
    flex: 1;
    min-height: 0;
    display: flex;
  }
  .centre {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
</style>
