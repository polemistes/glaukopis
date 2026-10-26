<script lang="ts">
  /**
   * The path over a file side (ADR 0069): the chevron of all projects, as
   * over a map side, a project chosen there opening in this side; then the
   * file's folder in the library, small, which opens the files at that
   * folder; then the file's name, with its page.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileText from '@lucide/svelte/icons/file-text';
  import FolderIcon from '@lucide/svelte/icons/folder';
  import ImageIcon from '@lucide/svelte/icons/image';
  import { ProjectActions } from '$lib/home/project-actions.svelte';
  import ProjectList from '$lib/home/ProjectList.svelte';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import { viewing } from '$lib/project/ProjectView.svelte';
  import type { FileSide } from '$lib/project/sides.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { viewers } from './viewers.svelte';

  interface Props {
    spec: FileSide;
    /** Shows a project in this side, at its top or at an element of it. */
    onproject: (id: string, at?: string) => void;
  }

  let { spec, onproject }: Props = $props();

  $effect(() => {
    if (!files.loaded) void files.load();
  });

  const viewed = $derived(viewers.get(spec.key));
  const record = $derived(files.get(spec.file));
  const name = $derived(viewed?.facts?.name ?? record?.name ?? '');
  const folder = $derived(record ? files.folder(files.folderOf(record)) : undefined);
  const count = $derived(viewed?.facts?.pages ?? 0);

  let treeAt = $state<HTMLElement | null>(null);
  const listActions = new ProjectActions({ open: () => {} });

  function allProjects(anchor: HTMLElement) {
    if (!projects.loaded) void projects.load();
    treeAt = anchor;
  }

  function choose(id: string, element?: string) {
    treeAt = null;
    onproject(id, element);
  }
</script>

<nav class="path" aria-label={t('project-where')} data-path data-file={spec.file}>
  <button
    type="button"
    class="all"
    data-path-all
    aria-haspopup="dialog"
    aria-expanded={!!treeAt}
    aria-label={t('project-all-projects-menu')}
    use:tooltip={{ text: t('project-all-projects-menu'), side: 'bottom' }}
    onclick={(e) => allProjects(e.currentTarget)}
  >
    <ChevronDown size={14} />
  </button>
  {#if folder}
    <button
      type="button"
      class="crumb folder"
      data-crumb="folder"
      onclick={() => router.go({ view: 'files', folder: folder.id })}
    >
      <FolderIcon size={12} />
      <span class="name">{folder.name}</span>
    </button>
    <span class="sep" aria-hidden="true">›</span>
  {/if}
  <span class="crumb last" data-crumb-last>
    {#if viewed?.facts?.picture}<ImageIcon size={14} />{:else}<FileText size={14} />{/if}
    <span class="name">{name || t('viewer-file')}</span>
  </span>
  {#if count > 1}
    <span class="count">{t('viewer-page-of', { page: spec.page, count })}</span>
  {/if}
  <Popover
    open={!!treeAt}
    anchor={treeAt ?? undefined}
    width={340}
    label={t('project-all-projects-menu')}
    onclose={() => (treeAt = null)}
  >
    <div class="tree" data-path-tree>
      {#if projects.loaded}
        <ProjectList actions={listActions} sides={viewing.sides} {choose} focusField />
      {/if}
    </div>
  </Popover>
</nav>

<style>
  .path {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    width: 100%;
    height: 100%;
  }
  .all {
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
  .all:hover {
    background: var(--paper-hover);
    color: var(--ink);
  }
  .crumb {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    height: 26px;
    padding: 0 5px;
    border: none;
    border-radius: var(--radius-s);
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    font-size: var(--text-sm);
    white-space: nowrap;
  }
  button.crumb {
    flex: none;
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
  .crumb.last {
    flex: 0 1 auto;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
  }
  .sep {
    flex: none;
    padding: 0 3px;
    color: var(--ink-4);
    font-size: var(--text-sm);
  }
  .count {
    flex: none;
    margin-left: 6px;
    color: var(--ink-3);
    font-size: var(--text-xs);
    white-space: nowrap;
  }
  .tree {
    max-height: min(480px, 70vh);
    overflow-y: auto;
    padding: 8px 6px 0;
  }
</style>
