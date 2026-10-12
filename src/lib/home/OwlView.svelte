<script lang="ts">
  /**
   * The owl map, as the map above every project (ADR 0037): reached from
   * the top row of the pane of projects and of the list, and from the owl
   * in the bar of a project at its top. It stands where the view of a
   * project stands, with its bars, but has the diagram only: no text, no
   * preview, nothing side by side.
   */
  import { onMount } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import Network from '@lucide/svelte/icons/network';
  import PanelLeft from '@lucide/svelte/icons/panel-left';
  import Plus from '@lucide/svelte/icons/plus';
  import type { ProjectInfo } from '$lib/api/projects';
  import { t } from '$lib/i18n';
  import Mark from '$lib/shell/Mark.svelte';
  import { shortcuts } from '$lib/shell/keys.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import IconButton from '$lib/ui/IconButton.svelte';
  import Segmented from '$lib/ui/Segmented.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { toggleProjectsPane } from './list.svelte';
  import OwlMap from './OwlMap.svelte';
  import { ProjectActions } from './project-actions.svelte';
  import ProjectActionsHost from './ProjectActionsHost.svelte';

  function open(p: ProjectInfo, mode?: MapMode) {
    router.go({ view: 'project', project: p.id, mode });
  }

  const actions = new ProjectActions({ open });

  onMount(() => {
    if (!projects.loaded) void projects.load();
    return shortcuts.bind({ 'projects-pane': toggleProjectsPane });
  });
</script>

<div class="owl-view">
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
    <span class="here">
      <Mark size={18} />
      <span class="name serif">{t('project-all-projects')}</span>
    </span>
    <IconButton label={t('home-new')} size="sm" onclick={() => actions.newProject()}>
      <Plus size={15} />
    </IconButton>
  </div>
  <div class="map">
    {#if projects.loaded}
      <OwlMap {actions} open={(p) => open(p)} />
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
