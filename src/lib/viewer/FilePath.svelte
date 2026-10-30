<script lang="ts">
  /**
   * The path over a file side (ADR 0069, 0072): the chevron of all projects,
   * as over a map side, a project chosen there opening in this side; the
   * menu of the files of the library, as over a map side, a file chosen
   * there shown in this side; then the name of the file shown, and nothing
   * else. The page is said by the bar of the side; the project whose tabs
   * these are, by the pointer over the name.
   */
  import ChevronDown from '@lucide/svelte/icons/chevron-down';
  import FileText from '@lucide/svelte/icons/file-text';
  import ImageIcon from '@lucide/svelte/icons/image';
  import { ProjectActions } from '$lib/home/project-actions.svelte';
  import ProjectList from '$lib/home/ProjectList.svelte';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import { viewing } from '$lib/project/ProjectView.svelte';
  import type { FileSide } from '$lib/project/sides.svelte';
  import { projects } from '$lib/state/projects.svelte';
  import Popover from '$lib/ui/Popover.svelte';
  import { tooltip } from '$lib/ui/tooltip';
  import { sides } from '$lib/project/sides.svelte';
  import FilesMenu from './FilesMenu.svelte';
  import { viewers } from './viewers.svelte';

  interface Props {
    spec: FileSide;
    /** Shows a project in this side, at its top or at an element of it. */
    onproject: (id: string, at?: string) => void;
    /** Shows a file of the library in this side. */
    onfile: (hash: string) => void;
  }

  let { spec, onproject, onfile }: Props = $props();

  $effect(() => {
    if (!files.loaded) void files.load();
    if (spec.project && !projects.loaded) void projects.load();
  });

  const file = $derived(sides.activeTab(spec.key)?.file ?? '');
  const viewed = $derived(viewers.get(spec.key));
  const record = $derived(files.get(file));
  const name = $derived(
    (viewed?.file === file ? viewed?.facts?.name : undefined) ?? record?.name ?? '',
  );
  /** The project whose tabs these are. */
  const project = $derived(
    spec.project ? projects.list.find((p) => p.id === spec.project) : undefined,
  );
  /** What the pointer over the name is told: the name whole, and whose tabs these are. */
  const hint = $derived(
    [name || t('viewer-file'), project ? t('viewer-sources-of', { name: project.name }) : '']
      .filter(Boolean)
      .join(' · '),
  );

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

  function chooseFile(hash: string) {
    onfile(hash);
  }
</script>

<nav
  class="path"
  aria-label={t('project-where')}
  data-path
  data-file={file}
  data-project={spec.project ?? ''}
  data-project-name={project?.name ?? ''}
>
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
  <FilesMenu current={file} onfile={chooseFile} />
  <span class="crumb last" data-crumb-last use:tooltip={{ text: hint, side: 'bottom' }}>
    {#if viewed?.facts?.picture}<ImageIcon size={14} />{:else}<FileText size={14} />{/if}
    <span class="name">{name || t('viewer-file')}</span>
  </span>
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
  .crumb .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .crumb.last {
    flex: 0 1 auto;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
  }
  .tree {
    max-height: min(480px, 70vh);
    overflow-y: auto;
    padding: 8px 6px 0;
  }
</style>
