<script lang="ts">
  /**
   * The pane of projects (ADR 0033): at the left of a project, beside the
   * rail, the list of projects as the home page has it, in a narrow column.
   * One click opens a project; the one that is open is marked, and under
   * its row stands its tree, down to the element in view (ADR 0037). It
   * stands outside the view of a project, so that it stays as it was when
   * another is opened; whether it is open, and how wide, the settings
   * remember.
   */
  import { onMount } from 'svelte';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Plus from '@lucide/svelte/icons/plus';
  import X from '@lucide/svelte/icons/x';
  import type { ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import { keysFor } from '$lib/shell/keys.svelte';
  import type { Project } from '$lib/project/model/project.svelte';
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
    /** The project that is open; none where the owl map is in view. */
    current?: string | null;
    /** The open project itself, where the view gives it: its tree is shown under its row. */
    project?: Project | null;
    /** The element in view in it, marked in the tree. */
    at?: string | null;
    /** Enters an element of the open project. */
    onenter?: (id: string) => void;
    /** Whether the owl map is in view. */
    /** Where the owl map is in view: null at the owl, a folder's id where one is entered. */
    owlAt?: string | null;
  }

  let { current = null, project = null, at = null, onenter, owlAt = undefined }: Props = $props();

  const width = $derived(paneWidth(settings.value.projectsPaneWidth, 0));

  function open(p: ProjectInfo, mode?: MapMode) {
    if (p.id === current && !mode) {
      // The row of the open project is the top of its tree.
      onenter?.(PROJECT);
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
    <IconButton label={t('home-new')} size="sm" onclick={() => actions.newProject()}>
      <Plus size={15} />
    </IconButton>
    <IconButton
      label={t('home-file-open')}
      size="sm"
      disabled={actions.filing}
      onclick={() => void actions.openFile()}
    >
      <FolderOpen size={14} />
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
      <ProjectList {actions} {current} {project} {at} {onenter} {owlAt} />
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
