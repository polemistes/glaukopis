<script lang="ts">
  /**
   * The owl map, as the map above every project (ADR 0037): reached from
   * the top row of the pane of projects and of the list, and from the owl
   * in the bar of a project at its top. It stands where the view of a
   * project stands, with its bars, but has the diagram only: no text, no
   * preview, nothing side by side. A folder is entered as an element is:
   * it stands at the centre, the bar says what holds it, and up goes there.
   */
  import { onMount } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import ChevronRight from '@lucide/svelte/icons/chevron-right';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Network from '@lucide/svelte/icons/network';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Plus from '@lucide/svelte/icons/plus';
  import { t } from '$lib/i18n';
  import Mark from '$lib/shell/Mark.svelte';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { ancestors, parentOf } from './folders';
  import { listUi, toggleProjectsPane } from './list.svelte';
  import { centreOf, folderKey, keyed, OWL } from './owl';
  import OwlMap from './OwlMap.svelte';
  import { ProjectActions } from './project-actions.svelte';
  import ProjectActionsHost from './ProjectActionsHost.svelte';

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

  const actions = new ProjectActions({
    open: (p, mode?: MapMode) => router.go({ view: 'project', project: p.id, mode }),
  });

  /** Opens a project at its top, or enters a folder. */
  function open(key: string) {
    const k = keyed(key);
    if (k.kind === 'project') router.go({ view: 'project', project: k.id });
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
  <header>
    <IconButton label={t('home-title')} onclick={() => router.go({ view: 'projects' })}>
      <ArrowLeft size={16} />
    </IconButton>
    <span class="divider"></span>
    <!-- The map of the projects is a diagram only. -->
    <Segmented
      value="diagram"
      label={t('project-view')}
      options={[{ value: 'diagram', label: t('project-diagram'), icon: Network }]}
      onchange={() => {}}
    />
  </header>
  <div class="pane-bar">
    <IconButton
      label={t('home-pane-toggle')}
      shortcut="Ctrl+Shift+L"
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
    <IconButton
      label={t('home-new')}
      size="sm"
      onclick={() => actions.newProject(folder?.id ?? null)}
    >
      <Plus size={15} />
    </IconButton>
  </div>
  <div class="map">
    {#if projects.loaded}
      <OwlMap
        {actions}
        at={centre}
        onopen={open}
        onup={folder ? up : undefined}
        above={holder?.name ?? t('project-all-projects')}
      />
    {:else}
      <div class="centre"><Spinner size={22} /></div>
    {/if}
  </div>
</div>

<ProjectActionsHost {actions} />

<style>
  .owl-view {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: var(--paper);
  }
  /* As the bars of a project, so that it reads as the map above them. */
  header {
    display: flex;
    align-items: center;
    gap: 4px;
    height: var(--bar-h);
    flex: none;
    padding: 0 10px 0 8px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .divider {
    width: 1px;
    height: 20px;
    margin: 0 6px;
    background: var(--line);
  }
  .pane-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    flex: none;
    padding: 4px 8px 4px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
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
