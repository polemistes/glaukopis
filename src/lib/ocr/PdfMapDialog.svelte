<script lang="ts">
  /**
   * A PDF of the library read into a project (ADR 0018): the file is read
   * where it is stored, as a file brought in is (`ReadStep.svelte`), and
   * what is read becomes a tree of elements in a project that is chosen:
   * under the element in view of the one the pane stands in, or at the top
   * of another, or of a new one named after the PDF. The title is the one
   * the PDF gives itself, or the file's name.
   */
  import { onDestroy, onMount } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import type { Imported } from '$lib/api/imported';
  import type { StoredFile } from '$lib/api/library';
  import { ocrForget, type Making } from '$lib/api/ocr';
  import { t } from '$lib/i18n';
  import { SvelteMap } from 'svelte/reactivity';
  import { makeImported, titleOf, type StyleChoice } from '$lib/project/model/import';
  import type { Project } from '$lib/project/model/project.svelte';
  import { PROJECT } from '$lib/project/model/types';
  import { openProject, projects } from '$lib/state/projects.svelte';
  import { router } from '$lib/state/router.svelte';
  import Button from '$lib/ui/Button.svelte';
  import Dialog from '$lib/ui/Dialog.svelte';
  import Select from '$lib/ui/Select.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError } from '$lib/ui/toast.svelte';
  import MadeOf from './MadeOf.svelte';
  import ReadStep from './ReadStep.svelte';
  import Outline from './Outline.svelte';
  import StylesFound from './StylesFound.svelte';

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
  /** Whether the reading step shows the workbench of a reading: the dialog is wide and tall for it. */
  let showing = $state(false);
  /** Whether its pages are open, to be looked at and tried. */
  let pagesOpen = $state(false);
  /** What the main button does while the workbench is shown. */
  let action = $state<{ label: string; enabled: boolean; run: () => void } | null>(null);

  /** A new project, named after the PDF. Ids of projects are not words. */
  const NEW = 'new';

  // svelte-ignore state_referenced_locally
  let into = $state<string>(project && projectId ? projectId : NEW);
  let making = $state(false);
  let failure = $state<string | null>(null);
  /** What was read, where styles were found in it for the writer to name before the elements are made. */
  let read = $state.raw<Imported | null>(null);
  /** What each style found was said to be, by its number; text where nothing is said. */
  const styles = new SvelteMap<number, StyleChoice>();
  /** Whether the workbench takes the dialog's room. */
  const bench = $derived(showing && !making && !read);

  /** The reading kept, so that what is made of it can be made anew, and how many pages it has. */
  let kept = $state<string | null>(null);
  let pages = $state(0);
  let madeOf = $state<Making>({ shape: true, structure: 'headings', pageMarks: true });

  onMount(() => {
    if (!projects.loaded) void projects.load();
  });
  onDestroy(() => {
    if (kept)
      ocrForget(kept).catch((error) =>
        console.error('the reading kept could not be let go', error),
      );
  });

  const options = $derived([
    { value: NEW, label: t('ocr-map-new-project') },
    ...projects.list.map((p) => ({ value: p.id, label: p.name })),
  ]);

  /**
   * What was read is made into elements at once, or once what is made of it
   * is chosen and the styles found in it are named.
   */
  function readDone(imported: Imported, token?: string | null, count?: number) {
    kept = token ?? null;
    pages = count ?? 0;
    // Where there is something to see or choose first: what is made of it, the outline, or the styles found.
    if ((kept && pages > 1) || imported.styles.length || imported.structured) read = imported;
    else void made(imported);
  }

  async function made(imported: Imported) {
    if (making) return;
    making = true;
    failure = null;
    const title = titleOf(imported) || file.name.replace(/\.pdf$/i, '');
    try {
      if (project && into === projectId) {
        const made = makeImported(project, at ?? PROJECT, imported, title, styles);
        if (!made) throw new Error(t('ocr-map-failed'));
        onclose();
        onenter?.(made.top);
        return;
      }
      const fresh = into === NEW;
      const id = fresh ? (await projects.create(title)).id : into;
      let made: ReturnType<typeof makeImported> = null;
      try {
        const opened = await openProject(id);
        try {
          made = makeImported(opened.project, PROJECT, imported, title, styles);
        } finally {
          // Closed whether or not the elements were made: an instance left
          // open would go on following and saving the project.
          await opened.project.close();
        }
      } finally {
        // A project made for the elements is not left empty in the list
        // when they could not be made: it goes into the trash.
        if (!made && fresh)
          await projects
            .remove(id)
            .catch((error) =>
              console.error('the project made for the elements could not be taken away', error),
            );
      }
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
  width={bench ? (pagesOpen ? 1240 : 640) : 520}
  tall={bench && pagesOpen}
  inline={bench && pagesOpen}
  padded={!bench}
  dismissable={!making}
  {onclose}
>
  <div class="body" class:bench>
    <div data-ocr-into>
      <Select bind:value={into} label={t('ocr-map-into')} {options} disabled={making} />
    </div>
    {#if making}
      <div class="working" aria-live="polite">
        <Spinner size={18} />
        <div class="doing">{t('ocr-map-making')}</div>
      </div>
    {:else if read}
      {#if kept && pages > 1}
        <MadeOf
          {kept}
          {pages}
          imported={read}
          bind:making={madeOf}
          onmade={(next) => (read = next)}
        />
      {/if}
      {#if read.structured}
        <Outline imported={read} title={titleOf(read) || file.name.replace(/\.pdf$/i, '')} />
      {/if}
      {#if read.styles.length}
        <StylesFound styles={read.styles} choices={styles} />
      {/if}
    {:else}
      <div class="step">
        <ReadStep
          path={file.path}
          stored
          name={file.name}
          onread={readDone}
          bind:showing
          bind:pages={pagesOpen}
          bind:action
        />
      </div>
    {/if}
    {#if failure}
      <p class="failure selectable" role="alert">
        <CircleAlert size={15} /> <span>{failure}</span>
      </p>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" disabled={making} onclick={onclose}>{t('common-cancel')}</Button>
    {#if read}
      <Button variant="primary" disabled={making} onclick={() => read && made(read)}>
        {t('ocr-map-make')}
      </Button>
    {:else if action && !making}
      <Button variant="primary" disabled={!action.enabled} onclick={action.run} data-ocr-read>
        {action.label}
      </Button>
    {/if}
  {/snippet}
</Dialog>

<style>
  .body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }
  /* The workbench takes the room under the choice of project. */
  .body.bench {
    height: 100%;
    min-height: 0;
    gap: 0;
  }
  .body.bench [data-ocr-into] {
    padding: var(--space-2) var(--space-5) 0;
    max-width: 440px;
  }
  .step {
    flex: 1 1 auto;
    min-height: 0;
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
