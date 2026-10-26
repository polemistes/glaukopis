<script lang="ts">
  /**
   * A side of the window that shows a file (ADR 0069): a PDF of the library,
   * page by page, or an image of the library or of the store, as one page.
   * It belongs to no project; its bar holds what a file needs: the page, a
   * field to go to one, and the zoom.
   */
  import { onDestroy, untrack } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import FileX from '@lucide/svelte/icons/file-x';
  import Lock from '@lucide/svelte/icons/lock';
  import { attachmentOpen } from '$lib/api/library';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import type { FileSide } from '$lib/project/sides.svelte';
  import { sides } from '$lib/project/sides.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { describeError, notifyError } from '$lib/ui/toast.svelte';
  import ImageView from './ImageView.svelte';
  import PdfView from './PdfView.svelte';
  import ViewerBar from './ViewerBar.svelte';
  import { viewers } from './viewers.svelte';

  interface Props {
    spec: FileSide;
    /** How many sides there are. */
    count: number;
    /** Whether it has the focus. */
    active: boolean;
    /** How much of the width it takes, of two. */
    grow: number;
    onclose: () => void;
  }

  let { spec, count, active, grow, onclose }: Props = $props();

  // The facts of the file, once for each file the side shows. It depends on the file alone.
  $effect(() => {
    const key = spec.key;
    const file = spec.file;
    // What the fetching reads and writes of what is known is not what this depends on.
    untrack(() => void viewers.fetch(key, file));
  });
  // The side's key lasts while it is shown.
  // svelte-ignore state_referenced_locally
  const key = spec.key;
  onDestroy(() => viewers.forget(key));

  const viewed = $derived(viewers.get(spec.key));
  const facts = $derived(viewed?.file === spec.file ? viewed.facts : null);

  let view = $state<PdfView | ImageView>();
  /** The zoom as the bar shows it, in percent: what the view says it shows at. */
  const percent = $derived.by(() => {
    void spec.zoom;
    void spec.page;
    return view?.percent() ?? 100;
  });

  function zoomTo(zoom: number | null) {
    if (view && 'zoomed' in view) view.zoomed(zoom);
    else sides.setFileZoom(spec.key, zoom);
  }

  async function openElsewhere() {
    const path = files.get(spec.file)?.path;
    if (!path) return;
    await attachmentOpen(path).catch((e) => notifyError(t('library-file-open-failed'), e));
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="pane file-side"
  data-side-key={spec.key}
  data-file-side={spec.file}
  style:flex-grow={grow}
  class:focused={count > 1 && active}
  onpointerdowncapture={() => sides.focus(spec.key)}
  onfocusin={() => sides.focus(spec.key)}
>
  {#if facts && !facts.locked && facts.pages > 0}
    <ViewerBar
      page={spec.page}
      count={facts.pages}
      labels={facts.labels}
      zoom={spec.zoom}
      {percent}
      onpage={(n) => sides.setPage(spec.key, n)}
      onzoom={zoomTo}
    />
  {/if}
  {#if viewed?.gone}
    <EmptyState icon={FileX} title={t('viewer-not-found')}>
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if facts?.locked}
    <EmptyState icon={Lock} title={t('viewer-locked')}>
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if viewed?.failure}
    <EmptyState
      icon={CircleAlert}
      title={t('viewer-not-shown')}
      text={describeError(viewed.failure)}
    >
      {#if files.get(spec.file)}
        <Button onclick={openElsewhere}>{t('files-open-elsewhere')}</Button>
      {/if}
      <Button onclick={onclose}>{t('project-close-side')}</Button>
    </EmptyState>
  {:else if !facts}
    <div class="centre"><Spinner size={20} /> <span>{t('viewer-loading')}</span></div>
  {:else if facts.picture && viewed?.image}
    <ImageView
      bind:this={view}
      source={viewed.image}
      size={facts.sizes[0]}
      name={facts.name}
      zoom={spec.zoom}
      onzoom={(z) => sides.setFileZoom(spec.key, z)}
    />
  {:else}
    {#key spec.file}
      <PdfView
        bind:this={view}
        file={spec.file}
        {facts}
        page={spec.page}
        zoom={spec.zoom}
        onpage={(n) => sides.setPage(spec.key, n)}
        onzoom={(z) => sides.setFileZoom(spec.key, z)}
      />
    {/key}
  {/if}
</div>

<style>
  .pane {
    display: flex;
    flex-direction: column;
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    background: var(--canvas);
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
