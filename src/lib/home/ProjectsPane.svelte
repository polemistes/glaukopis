<script lang="ts">
  /**
   * The list of projects at the left (ADR 0033, 0063): the one place where
   * the folders, the projects and the elements are shown as a tree. One
   * click opens a project; the project of each side of the window is marked,
   * with its tree under it down to the element in view there. Its head
   * begins, joins and opens projects, and shows the deleted ones and the
   * project of all the projects. It stands outside the view of a project, so
   * that it stays as it was when another is opened; whether it is shown, and
   * how wide, the settings remember.
   */
  import { onMount } from 'svelte';
  import Ellipsis from '@lucide/svelte/icons/ellipsis';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import type { ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import type { ShownSide } from '$lib/project/ProjectView.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Divider from '$lib/ui/Divider.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { PANE_WIDTH, paneWidth, toggleProjectsPane } from './list.svelte';
  import { ProjectActions } from './project-actions.svelte';
  import ProjectActionsHost from './ProjectActionsHost.svelte';
  import ProjectList from './ProjectList.svelte';

  interface Props {
    /** The sides of the window and the projects they show; none on the start screen. */
    sides?: readonly ShownSide[];
    /** Enters an element of a project shown in a side. */
    onenter?: (project: string, id: string) => void;
  }

  let { sides = [], onenter }: Props = $props();

  const width = $derived(paneWidth(settings.value.projectsPaneWidth, 0));

  function open(p: ProjectInfo, mode?: MapMode) {
    if (!mode && sides.some((s) => s.id === p.id)) {
      // The row of a project that is shown is the top of its tree.
      onenter?.(p.id, PROJECT);
      return;
    }
    router.go({ view: 'project', project: p.id, mode });
  }

  const actions = new ProjectActions({ open });

  onMount(() => {
    if (!projects.loaded) void projects.load();
  });
</script>

<aside class="projects-pane" data-projects-pane aria-label={t('home-pane')} style:width="{width}px">
  <header>
    <h2>{t('home-title')}</h2>
    <IconButton
      label={t('home-new-menu')}
      size="sm"
      data-projects-new
      onclick={(e) => actions.newMenu(e.currentTarget)}
    >
      <Plus size={15} />
    </IconButton>
    <IconButton
      label={t('home-page-menu')}
      size="sm"
      data-projects-more
      onclick={(e) => actions.moreMenu(e.currentTarget)}
    >
      <Ellipsis size={15} />
    </IconButton>
    <IconButton
      label={t('home-pane-close')}
      shortcut={keysFor('projects-pane')}
      size="sm"
      onclick={toggleProjectsPane}
    >
      <X size={14} />
    </IconButton>
  </header>
  <div class="body">
    {#if projects.loaded}
      <ProjectList {actions} {sides} {onenter} />
    {:else}
      <div class="centre"><Spinner size={18} /></div>
    {/if}
  </div>
</aside>
<Divider
  label={t('home-pane-between')}
  onmove={(dx) => settings.set('projectsPaneWidth', paneWidth(width, dx))}
  onreset={() => settings.set('projectsPaneWidth', PANE_WIDTH)}
/>

<ProjectActionsHost {actions} />

<style>
  .projects-pane {
    display: flex;
    flex-direction: column;
    flex: none;
    min-height: 0;
    background: var(--paper-sunken);
  }
  /* As high as the bar of the project beside it, so that their lines meet. */
  header {
    display: flex;
    align-items: center;
    gap: 2px;
    height: var(--bar-h);
    flex: none;
    padding: 0 6px 0 14px;
    border-bottom: 1px solid var(--line);
  }
  h2 {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 6px 0;
  }
  .centre {
    display: flex;
    justify-content: center;
    padding: 30px 0;
  }
</style>
