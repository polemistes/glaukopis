<script lang="ts">
  /**
   * A PDF of the library read into a project (ADR 0018): the file is read
   * where it is stored, as a file brought in is (`ReadStep.svelte`), and
   * what is read becomes a tree of elements in a project that is chosen:
   * under the element in view of the one the pane stands in, or at the top
   * of another, or of a new one named after the PDF. The title is the one
   * the PDF gives itself, or the file's name.
   */
  import { onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { Imported } from '$lib/api/imported';
  import type { StoredFile } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { makeImported, titleOf } from '$lib/project/model/import';
  import type { Project } from '$lib/project/model/project.svelte';
  import { PROJECT } from '$lib/project/model/types';
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
    /** The project the pane stands in, where it does, with its id, and the element in view in it. */
    project?: Project | null;
    projectId?: string | null;
    at?: string | null;
    /** Asks for the element made in that project to be entered. */
    onenter?: (id: string) => void;
    onclose: () => void;
  }

  let { file, project = null, projectId = null, at = null, onenter, onclose }: Props = $props();
  /** Whether the reading step shows the text the PDF has beside its choices: the dialog widens. */
  let wide = $state(false);

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
        const made = makeImported(project, at ?? PROJECT, imported, title);
        if (!made) throw new Error(t('ocr-map-failed'));
        onclose();
        onenter?.(made.top);
        return;
      }
      const id = into === NEW ? (await projects.create(title)).id : into;
      const opened = await openProject(id);
      const made = makeImported(opened.project, PROJECT, imported, title);
      await opened.project.close();
      if (!made) throw new Error(t('ocr-map-failed'));
      onclose();
      router.go({ view: 'project', project: id, at: made.top, mode: 'text' });
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
  width={wide && !making ? 960 : 520}
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
      <ReadStep path={file.path} stored name={file.name} onread={made} bind:wide />
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
