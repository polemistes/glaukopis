<script lang="ts">
  /**
   * A side of the window that shows a file (ADR 0069): a PDF of the library,
   * page by page, or an image of the library, as one page.
   * It belongs to no project; its bar holds what a file needs: the page, a
   * field to go to one, and the zoom. An image can be edited in it (ADR
   * 0071): a row of controls under the bar, the image showing the edit over
   * a lighter copy, kept as a new file of the library made from the one in
   * view, which the side then shows.
   */
  import { onDestroy, untrack } from 'svelte';
  import CircleAlert from '@lucide/svelte/icons/circle-alert';
  import FileX from '@lucide/svelte/icons/file-x';
  import Lock from '@lucide/svelte/icons/lock';
  import {
    fileEditFacts,
    fileEditKeep,
    fileEditPreview,
    fileSmallerCopy,
    type Crop,
    type Edit,
    type EditFacts,
  } from '$lib/api/files';
  import { attachmentOpen } from '$lib/api/library';
  import { files } from '$lib/files/store.svelte';
  import { t } from '$lib/i18n';
  import type { FileSide } from '$lib/project/sides.svelte';
  import { sides } from '$lib/project/sides.svelte';
  import Button from '$lib/ui/Button.svelte';
  import EmptyState from '$lib/ui/EmptyState.svelte';
  import Spinner from '$lib/ui/Spinner.svelte';
  import { testHook } from '$lib/shell/testing';
  import { confirm } from '$lib/ui/confirm.svelte';
  import { describeError, notifyError, notifyOk } from '$lib/ui/toast.svelte';
  import CropFrame from './CropFrame.svelte';
  import { isNothing, nothing } from './editing';
  import EditRow from './EditRow.svelte';
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

  // ---- editing an image (ADR 0071) ----

  interface Editing {
    /** The file being edited: the one in view when editing began. */
    file: string;
    facts: EditFacts;
    edit: Edit;
    /** The lighter copy shown while it is edited, as a URL of its own. */
    preview: string;
    cropping: boolean;
    keeping: boolean;
  }
  let editing = $state<Editing | null>(null);
  /** Whether a question is being asked: Escape is the question's then. */
  let asking = false;

  /** An image with pixels can be edited; a drawing cannot. */
  const editable = $derived(
    !!facts?.picture && !(files.get(spec.file)?.name ?? '').toLowerCase().endsWith('.svg'),
  );

  /** Begins to edit the image in view: a smaller copy first, where it is too large. */
  async function beginEditing() {
    if (editing) return;
    let hash = spec.file;
    let known: EditFacts;
    try {
      known = await fileEditFacts(hash);
    } catch (e) {
      notifyError(t('viewer-edit-not-opened'), e);
      return;
    }
    if (!known.editable) return;
    if (known.tooLarge) {
      asking = true;
      const smaller = await confirm({
        title: t('viewer-edit-too-large-title'),
        message: t('viewer-edit-too-large-message', { most: 50 }),
        confirm: t('viewer-edit-make-smaller'),
      }).finally(() => (asking = false));
      if (!smaller) return;
      try {
        const copy = await fileSmallerCopy(hash);
        await files.reload();
        sides.setFile(spec.key, copy.hash);
        hash = copy.hash;
        known = await fileEditFacts(hash);
      } catch (e) {
        notifyError(t('viewer-edit-not-kept'), e);
        return;
      }
    }
    let preview: string;
    try {
      const bytes = await fileEditPreview(hash);
      preview = URL.createObjectURL(new Blob([bytes as BlobPart]));
    } catch (e) {
      notifyError(t('viewer-edit-not-opened'), e);
      return;
    }
    // The side may have gone to another file while the copy was being made.
    if (spec.file !== hash) {
      URL.revokeObjectURL(preview);
      return;
    }
    editing = {
      file: hash,
      facts: known,
      edit: nothing(),
      preview,
      cropping: false,
      keeping: false,
    };
    sides.setFileZoom(spec.key, null);
  }

  /** Ends the editing, keeping nothing. */
  function endEditing() {
    if (editing) URL.revokeObjectURL(editing.preview);
    editing = null;
  }

  /** Leaves the editing: after asking, where something was changed. */
  async function cancelEditing() {
    if (!editing || editing.keeping) return;
    if (!isNothing(editing.edit)) {
      asking = true;
      const leave = await confirm({
        title: t('viewer-edit-leave-title'),
        message: t('viewer-edit-leave-message'),
        confirm: t('viewer-edit-leave'),
        danger: true,
      }).finally(() => (asking = false));
      if (!leave) return;
    }
    endEditing();
  }

  /** Keeps the edit as a new file of the library, which the side then shows. */
  async function keepEditing() {
    const now = editing;
    if (!now || now.keeping || isNothing(now.edit)) return;
    now.keeping = true;
    try {
      const made = await fileEditKeep(now.file, $state.snapshot(now.edit));
      await files.reload();
      endEditing();
      sides.setFile(spec.key, made.hash);
      notifyOk(t('viewer-edit-kept', { name: made.name }));
    } catch (e) {
      now.keeping = false;
      notifyError(t('viewer-edit-not-kept'), e);
    }
  }

  function changeEdit(edit: Edit) {
    if (editing && !editing.keeping) editing.edit = edit;
  }
  function changeCrop(crop: Crop) {
    if (editing && !editing.keeping) editing.edit = { ...editing.edit, crop };
  }

  // The side going to another file, or away, drops what was being edited.
  $effect(() => {
    if (editing && editing.file !== spec.file) untrack(endEditing);
  });
  onDestroy(endEditing);

  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !editing || asking || event.defaultPrevented) return;
    if (!active && count > 1) return;
    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();
    void cancelEditing();
  }

  // For the scripts: the edit of the active side set exactly, rather than by dragging.
  $effect(() => {
    if (!active && count > 1) return;
    testHook('__glaukopisImageEditing', {
      begin: () => beginEditing(),
      set: (part: Partial<Edit>) => editing && changeEdit({ ...editing.edit, ...part }),
      cropping: (on: boolean) => editing && (editing.cropping = on),
      keep: () => keepEditing(),
      cancel: () => cancelEditing(),
      edit: () => (editing ? $state.snapshot(editing.edit) : null),
    });
  });

  async function openElsewhere() {
    const path = files.get(spec.file)?.path;
    if (!path) return;
    await attachmentOpen(path).catch((e) => notifyError(t('library-file-open-failed'), e));
  }
</script>

<svelte:window onkeydown={onEscape} />

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
      picture={facts.picture}
      zoom={spec.zoom}
      {percent}
      onpage={(n) => sides.setPage(spec.key, n)}
      onzoom={zoomTo}
      {editable}
      editing={!!editing}
      onedit={() => void beginEditing()}
    />
    {#if editing}
      <EditRow
        edit={editing.edit}
        facts={editing.facts}
        cropping={editing.cropping}
        keeping={editing.keeping}
        onchange={changeEdit}
        oncropping={(on) => editing && (editing.cropping = on)}
        onkeep={() => void keepEditing()}
        oncancel={() => void cancelEditing()}
      />
    {/if}
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
      size={editing ? [editing.facts.width, editing.facts.height] : facts.sizes[0]}
      name={facts.name}
      zoom={spec.zoom}
      onzoom={(z) => sides.setFileZoom(spec.key, z)}
      edit={editing?.edit ?? null}
      previewUrl={editing?.preview ?? null}
    >
      {#if editing && (editing.cropping || editing.edit.crop)}
        <CropFrame
          crop={editing.edit.crop ?? { x: 0, y: 0, width: 1, height: 1 }}
          active={editing.cropping && !editing.keeping}
          onchange={changeCrop}
        />
      {/if}
    </ImageView>
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
