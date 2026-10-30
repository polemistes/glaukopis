<script lang="ts">
  /**
   * A file read in the files view (ADR 0073): a PDF page by page, or an
   * image, large, with the viewer of the window (its bar, its pages, its
   * zoom, the text over the pages to be selected and copied), in the place of
   * the list, the pane of the file staying beside it so that a reference is
   * made or given while the title page is in view. Nothing of the window's
   * sides or of any project's tabs is touched, and where it was read to is
   * not kept. Back to the files, or Escape, returns to the list.
   */
  import { onDestroy, onMount, untrack } from 'svelte';
  import ArrowLeft from '@lucide/svelte/icons/arrow-left';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import FileX from '@lucide/svelte/icons/file-x';
  import Lock from '@lucide/svelte/icons/lock';
  import { attachmentOpen } from '$lib/api/library';
  import { t } from '$lib/i18n';
  import { printFile, printable, type Printed } from '$lib/print/file';
  import { testHook } from '$lib/shell/testing';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import { newId } from '$lib/util/id';
  import ImageView from '$lib/viewer/ImageView.svelte';
  import PdfView from '$lib/viewer/PdfView.svelte';
  import PrintRangeDialog from '$lib/viewer/PrintRangeDialog.svelte';
  import ViewerBar from '$lib/viewer/ViewerBar.svelte';
  import { START } from '$lib/viewer/sources';
  import { viewers } from '$lib/viewer/viewers.svelte';
  import { files } from './store.svelte';

  interface Props {
    /** The hash of the file. */
    hash: string;
    onback: () => void;
  }

  let { hash, onback }: Props = $props();

  /** The reader's own name with what is known of the files shown: it is no side. */
  const key = `reader-${newId()}`;

  // The facts of the file, once for each file read. It depends on the file alone.
  $effect(() => {
    const file = hash;
    untrack(() => void viewers.fetch(key, file));
  });
  onDestroy(() => viewers.forget(key));

  const viewed = $derived(viewers.get(key));
  const facts = $derived(viewed?.file === hash ? viewed.facts : null);
  const name = $derived(facts?.name ?? files.get(hash)?.name ?? '');

  let view = $state<PdfView | ImageView>();
  let zoom = $state<number | null>(null);
  let middle = $state(1);
  const percent = $derived.by(() => {
    void zoom;
    void middle;
    return view?.percent() ?? 100;
  });

  function zoomTo(next: number | null) {
    if (view && 'zoomed' in view) view.zoomed(next);
    else zoom = next;
  }

  function goToPage(page: number) {
    if (view && 'goToPlace' in view) view.goToPlace({ page, at: 0 });
  }

  async function openElsewhere() {
    const path = files.get(hash)?.path;
    if (path)
      await attachmentOpen(path).catch((e) => notifyError(t('library-file-open-failed'), e));
  }

  // ---- printing (record 0075): the file read prints as a file in a view does ----

  let printing = $state(false);
  let askingRange = $state(false);

  /** Prints the file read: a PDF once the pages to print are chosen, a picture as it is. */
  function print() {
    if (printing || !printable(facts)) return;
    if (facts.picture) void printRead(1, 1);
    else askingRange = true;
  }

  async function printRead(from: number, to: number, toFile?: string): Promise<Printed | null> {
    const shown = facts;
    if (printing || !shown) return null;
    printing = true;
    try {
      return await printFile(hash, shown, from, to, toFile);
    } finally {
      printing = false;
    }
  }

  let root = $state<HTMLElement>();
  onMount(() => {
    root?.querySelector<HTMLElement>('[data-viewer-pages]')?.focus();
    // The e2e scripts print to a file, where the dialog cannot be pressed.
    testHook('__glaukopisFilePrint', {
      toFile: (path: string, from: number, to: number) => printRead(from, to, path),
    });
    return () => testHook('__glaukopisFilePrint', undefined);
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (document.querySelector('dialog[open], .menu')) return;
    event.preventDefault();
    event.stopPropagation();
    onback();
  }
</script>

<!-- Escape anywhere in it goes back to the files. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="reader" bind:this={root} aria-label={name} data-reader={hash} {onkeydown}>
  <header>
    <Button variant="ghost" size="sm" onclick={onback} data-reader-back>
      {#snippet icon()}<ArrowLeft size={14} />{/snippet}
      {t('viewer-back-to-files')}
    </Button>
    <span class="name truncate" title={name}>{name}</span>
  </header>
  {#if facts && !facts.locked && facts.pages > 0}
    <ViewerBar
      page={middle}
      count={facts.pages}
      labels={facts.labels}
      picture={facts.picture}
      {zoom}
      {percent}
      onpage={goToPage}
      onzoom={zoomTo}
      onprint={print}
      {printing}
    />
  {/if}
  {#if viewed?.gone}
    <EmptyState icon={FileX} title={t('viewer-not-found')}>
      <Button onclick={onback}>{t('viewer-back-to-files')}</Button>
    </EmptyState>
  {:else if facts?.locked}
    <EmptyState icon={Lock} title={t('viewer-locked')}>
      <Button onclick={onback}>{t('viewer-back-to-files')}</Button>
    </EmptyState>
  {:else if viewed?.failure}
    <EmptyState
      icon={CircleAlert}
      title={t('viewer-not-shown')}
      text={describeError(viewed.failure)}
    >
      <Button onclick={openElsewhere}>{t('files-open-elsewhere')}</Button>
      <Button onclick={onback}>{t('viewer-back-to-files')}</Button>
    </EmptyState>
  {:else if !facts}
    <div class="centre"><Spinner size={20} /> <span>{t('viewer-loading')}</span></div>
  {:else if facts.picture && viewed?.image}
    <ImageView
      bind:this={view}
      source={viewed.image}
      size={facts.sizes[0]}
      name={facts.name}
      {zoom}
      onzoom={(z) => (zoom = z)}
    />
  {:else}
    {#key hash}
      <PdfView
        bind:this={view}
        file={hash}
        {facts}
        tab={key}
        place={START}
        {zoom}
        onplace={() => {}}
        onmiddle={(n) => (middle = n)}
        onzoom={(z) => (zoom = z)}
      />
    {/key}
  {/if}
</section>

{#if askingRange && facts}
  <PrintRangeDialog
    count={facts.pages}
    page={middle}
    onprint={(from, to) => {
      askingRange = false;
      void printRead(from, to);
    }}
    onclose={() => (askingRange = false)}
  />
{/if}

<style>
  .reader {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    background: var(--canvas);
  }
  header {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: none;
    min-width: 0;
    height: 36px;
    padding: 0 10px 0 6px;
    border-bottom: 1px solid var(--line);
    background: var(--paper);
  }
  .name {
    min-width: 0;
    color: var(--ink);
    font-family: var(--font-text);
    font-size: 15px;
    font-weight: 600;
  }
  .centre {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--ink-3);
    font-size: var(--text-sm);
  }
</style>
