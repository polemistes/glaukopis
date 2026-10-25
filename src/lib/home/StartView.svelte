<script lang="ts">
  /**
   * The start screen (ADR 0063), shown beside the list while no project is
   * open: the owl, a button for a new project, and the projects last opened,
   * newest first, each opened with a click. With no project at all, the
   * welcome and the ways to begin. A document or a mind map of another
   * program dropped on it becomes a project of its own.
   */
  import { onMount } from 'svelte';
  import FileInput from '@lucide/svelte/icons/file-input';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderOpen from '@lucide/svelte/icons/folder-open';
  import Network from '@lucide/svelte/icons/network';
  import Plus from '@lucide/svelte/icons/plus';
  import Users from '@lucide/svelte/icons/users';
  import type { ProjectInfo } from '$lib/api/projects';
  import DocumentHost from '$lib/documents/DocumentHost.svelte';
  import { t } from '$lib/i18n';
  import Mark from '$lib/shell/Mark.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router, type MapMode } from '$lib/state/router.svelte';
  import { settings } from '$lib/state/settings.svelte';
  import Button from '$lib/ui/Button.svelte';
  import { dropTarget } from '$lib/ui/drag.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { ago } from '$lib/util/time';
  import ProjectBadge from './ProjectBadge.svelte';
  import { droppedAsProject, ProjectActions } from './project-actions.svelte';
  import ProjectActionsHost from './ProjectActionsHost.svelte';

  /** How many of the projects last opened are shown. */
  const RECENT = 10;

  function open(p: ProjectInfo, mode?: MapMode) {
    router.go({ view: 'project', project: p.id, mode });
  }

  const actions = new ProjectActions({ open });

  /** No project and no folder at all: the welcome, with the ways to begin. */
  const empty = $derived(projects.loaded && !projects.list.length && !projects.folders.length);

  /** The projects last opened that are still there, newest first. */
  const recent = $derived.by(() => {
    const byId = new Map(projects.list.map((p) => [p.id, p]));
    return (settings.value.recentProjects ?? [])
      .map((id) => byId.get(id))
      .filter((p): p is ProjectInfo => !!p)
      .slice(0, RECENT);
  });

  const folderName = (p: ProjectInfo) => (p.folder ? projects.folder(p.folder)?.name : undefined);

  onMount(() => {
    if (!projects.loaded) void projects.load();
  });
</script>

<div
  class="start"
  data-start
  use:dropTarget={{
    accepts: (p) => p.kind === 'files' && (p.data as string[]).some(droppedAsProject),
    ondrop: (e) => void actions.fromDocument((e.payload.data as string[]).find(droppedAsProject)),
  }}
>
  {#if !projects.loaded}
    <div class="centre"><Spinner size={22} /></div>
  {:else if empty}
    <div class="welcome">
      <Mark size={120} />
      <h2>{t('home-welcome')}</h2>
      <p>{t('home-welcome-text')}</p>
      <div class="actions">
        <Button variant="secondary" size="md" onclick={() => actions.newProject(null)}>
          {#snippet icon()}<Plus size={15} />{/snippet}
          {t('home-begin')}
        </Button>
        <Button variant="secondary" size="md" onclick={() => (actions.joining = true)}>
          {#snippet icon()}<Users size={15} />{/snippet}
          {t('home-join')}
        </Button>
        <Button variant="secondary" size="md" onclick={() => void actions.fromDocument()}>
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
        <Button
          variant="secondary"
          size="md"
          disabled={actions.filing}
          onclick={() => void actions.openMindMap()}
        >
          {#snippet icon()}<Network size={15} />{/snippet}
          {t('home-mindmap-open')}
        </Button>
      </div>
    </div>
  {:else}
    <div class="welcome">
      <Mark size={120} />
      <div class="actions">
        <Button variant="primary" size="md" data-start-new onclick={() => actions.newProject(null)}>
          {#snippet icon()}<Plus size={15} />{/snippet}
          {t('home-new')}
        </Button>
      </div>
      {#if recent.length}
        <section class="recent" data-start-recent aria-labelledby="start-recent">
          <h3 id="start-recent">{t('home-start-recent')}</h3>
          <ul>
            {#each recent as p (p.id)}
              {@const folder = folderName(p)}
              <li>
                <button type="button" data-start-project={p.id} onclick={() => open(p)}>
                  <ProjectBadge
                    name={p.name}
                    sharing={p.sharing ? { owner: p.sharing.owner } : null}
                    size={15}
                  />
                  <span class="name serif truncate">{p.name}</span>
                  {#if folder}<span class="folder truncate">{folder}</span>{/if}
                  <span class="when">{ago(p.modified)}</span>
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  {/if}
</div>

<ProjectActionsHost {actions} />
<DocumentHost />

<style>
  .start {
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: var(--paper);
  }
  .start:global([data-drop-over]) {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    width: 100%;
    padding: 70px 24px 40px;
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
  .recent {
    width: 100%;
    max-width: 480px;
    margin-top: 22px;
    text-align: left;
  }
  .recent h3 {
    margin: 0 0 6px 10px;
    color: var(--ink-3);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .recent ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .recent button {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-height: 36px;
    padding: 0 10px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .recent button:hover {
    background: var(--paper-hover);
  }
  .recent button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .name {
    flex: 1;
    min-width: 0;
    font-size: var(--text-md);
  }
  .folder {
    flex: none;
    max-width: 30%;
    color: var(--ink-3);
    font-size: var(--text-xs);
  }
  .when {
    flex: none;
    color: var(--ink-4);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
  }
  .centre {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
  }
</style>
