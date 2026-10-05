<script lang="ts">
  /**
   * A map from a PDF of the library (ADR 0018): the file is read where it is
   * stored, as a file brought in is (`ReadStep.svelte`), and what is read
   * becomes a map in a project that is chosen: the one the pane stands in,
   * another, or a new one named after the PDF. The title is the one the PDF
   * gives itself, or the file's name.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { Imported } from '$lib/api/imported';
  import type { StoredFile } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { makeMap, titleOf } from '$lib/project/model/import';
  import type { Project } from '$lib/project/model/project.svelte';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import ReadStep from './ReadStep.svelte';

  interface Props {
    file: StoredFile;
    /** The project the pane stands in, where it does, with its id. */
    project?: Project | null;
    projectId?: string | null;
    /** Asks for a map made in that project to be shown. */
    onopenmap?: (map: string) => void;
    onclose: () => void;
  }

  let { file, project = null, projectId = null, onopenmap, onclose }: Props = $props();

  /** A new project, named after the PDF. Ids of projects are not words. */
  const NEW = 'new';

  // svelte-ignore state_referenced_locally
  let into = $state<string>(project && projectId ? projectId : NEW);
  let making = $state(false);
  let failure = $state<string | null>(null);

  onMount(() => {
    if (!projects.loaded) void projects.load();
  });

  const options = $derived([
    { value: NEW, label: t('ocr-map-new-project') },
    ...projects.list.map((p) => ({ value: p.id, label: p.name })),
  ]);

  async function made(imported: Imported) {
    making = true;
    failure = null;
    const title = titleOf(imported) || file.name.replace(/\.pdf$/i, '');
    try {
      if (project && into === projectId) {
        const map = makeMap(project, imported, title).map;
        onclose();
        onopenmap?.(map);
        return;
      }
      const id = into === NEW ? (await projects.create(title)).id : into;
      const opened = await openProject(id);
      // The map a new project begins with gives way to that of the PDF.
      const first = into === NEW ? opened.project.maps.map((m) => m.id) : [];
      const map = makeMap(opened.project, imported, title).map;
      for (const old of first) opened.project.deleteMap(old);
      await opened.project.close();
      onclose();
      router.go({ view: 'project', project: id, map, mode: 'text' });
    } catch (error) {
      failure = describeError(error) ?? t('ocr-map-failed');
      making = false;
    }
  }
</script>

<Dialog
  open
  title={t('ocr-map-title')}
  subtitle={file.name}
  width={520}
  dismissable={!making}
  {onclose}
>
  <div class="body">
    <div data-ocr-into>
      <Select bind:value={into} label={t('ocr-map-into')} {options} disabled={making} />
    </div>
    {#if making}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">{t('ocr-map-making')}</div>
      </div>
    {:else}
      <ReadStep path={file.path} stored name={file.name} onread={made} />
    {/if}
    {#if failure}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{failure}</span>
      </p>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" disabled={making} onclick={onclose}>{t('common-cancel')}</Button>
  {/snippet}
</Dialog>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  .working {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 40px;
  }
  .doing {
    font-weight: 550;
  }
  .failure {
    display: flex;
    gap: 8px;
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-m);
    background: var(--danger-soft);
    color: var(--danger);
    line-height: 1.45;
  }
  .failure :global(svg) {
    flex: none;
    margin-top: 2px;
  }
  .failure span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
</style>
